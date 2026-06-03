import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { MediaItem, GalleryConfig, UploadProgress } from "@/types";

const MEDIA_COLLECTION = "media";

// ─── Gallery Config ───────────────────────────────────────────────────────────

export async function getGalleryConfig(): Promise<GalleryConfig | null> {
  const docRef = doc(db, "gallery", "config");
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as GalleryConfig;
}

export async function upsertGalleryConfig(
  data: Partial<GalleryConfig>
): Promise<void> {
  const docRef = doc(db, "gallery", "config");
  const existing = await getDoc(docRef);
  if (existing.exists()) {
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  } else {
    await setDoc(docRef, {
      pin: "1234",
      title: "Private Gallery",
      isActive: true,
      slideshowInterval: 5000,
      allowDownload: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...data,
    });
  }
}

// ─── Media Items ──────────────────────────────────────────────────────────────

export async function getMediaItems(): Promise<MediaItem[]> {
  const q = query(collection(db, MEDIA_COLLECTION), orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    uploadedAt: d.data().uploadedAt?.toDate?.() ?? d.data().uploadedAt,
  })) as MediaItem[];
}

export async function addMediaItem(item: Omit<MediaItem, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, MEDIA_COLLECTION), {
    ...item,
    uploadedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateMediaItem(
  id: string,
  data: Partial<MediaItem>
): Promise<void> {
  await updateDoc(doc(db, MEDIA_COLLECTION, id), data);
}

export async function deleteMediaItem(item: MediaItem): Promise<void> {
  // Delete from Cloudinary via API route (keeps secret server-side)
  if (item.storagePath) {
    try {
      await fetch("/api/delete-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: item.storagePath }),
      });
    } catch (e) {
      console.error("Cloudinary delete error:", e);
    }
  }
  // Delete Firestore document
  await deleteDoc(doc(db, MEDIA_COLLECTION, item.id));
}

export async function reorderMediaItems(items: MediaItem[]): Promise<void> {
  const updates = items.map((item, index) =>
    updateDoc(doc(db, MEDIA_COLLECTION, item.id), { order: index })
  );
  await Promise.all(updates);
}

// ─── Upload via Cloudinary (through Next.js API route) ───────────────────────

export function uploadMedia(
  file: File,
  onProgress: (progress: UploadProgress) => void
): Promise<{ url: string; storagePath: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = (e.loaded / e.total) * 100;
        onProgress({ filename: file.name, progress: pct, status: "uploading" });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          onProgress({ filename: file.name, progress: 100, status: "complete" });
          resolve({ url: data.url, storagePath: data.publicId });
        } catch {
          reject(new Error("Invalid server response"));
        }
      } else {
        let msg = "Upload failed";
        try { msg = JSON.parse(xhr.responseText).error ?? msg; } catch {}
        onProgress({ filename: file.name, progress: 0, status: "error", error: msg });
        reject(new Error(msg));
      }
    });

    xhr.addEventListener("error", () => {
      const msg = "Network error during upload";
      onProgress({ filename: file.name, progress: 0, status: "error", error: msg });
      reject(new Error(msg));
    });

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  });
}
