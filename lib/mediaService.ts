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
  await deleteDoc(doc(db, MEDIA_COLLECTION, item.id));
}

export async function reorderMediaItems(items: MediaItem[]): Promise<void> {
  await Promise.all(
    items.map((item, index) =>
      updateDoc(doc(db, MEDIA_COLLECTION, item.id), { order: index })
    )
  );
}

// ─── Upload ───────────────────────────────────────────────────────────────────
//
// Strategy:
//   • Images  ≤ 9 MB  → POST /api/upload  (Next.js route → Cloudinary)
//   • Videos  any size → direct XHR to Cloudinary using a signed URL
//     from /api/upload-signature  (bypasses Vercel body limit / timeout)
//
// Cloudinary free tier limits:
//   • Images: up to 10 MB per file
//   • Videos: up to 100 MB per file (free), 2 GB (paid)
//   • Total storage: 25 GB
//   • Bandwidth: 25 GB / month

const IMAGE_SERVER_LIMIT = 9 * 1024 * 1024; // 9 MB

export function uploadMedia(
  file: File,
  onProgress: (p: UploadProgress) => void
): Promise<{ url: string; storagePath: string }> {
  const isVideo = file.type.startsWith("video/");

  // Always use direct upload for videos; use server route for small images
  if (isVideo || file.size > IMAGE_SERVER_LIMIT) {
    return uploadDirect(file, onProgress);
  }
  return uploadViaServer(file, onProgress);
}

/** Upload through Next.js API route (images only, ≤ 9 MB) */
function uploadViaServer(
  file: File,
  onProgress: (p: UploadProgress) => void
): Promise<{ url: string; storagePath: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress({ filename: file.name, progress: (e.loaded / e.total) * 100, status: "uploading" });
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
      const msg = "Network error";
      onProgress({ filename: file.name, progress: 0, status: "error", error: msg });
      reject(new Error(msg));
    });

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  });
}

/** Upload DIRECTLY from browser to Cloudinary (videos, large files) */
async function uploadDirect(
  file: File,
  onProgress: (p: UploadProgress) => void
): Promise<{ url: string; storagePath: string }> {
  // 1. Get a signed upload params from our server
  const sigRes = await fetch("/api/upload-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resourceType: file.type.startsWith("video/") ? "video" : "image" }),
  });

  if (!sigRes.ok) throw new Error("Could not get upload signature");

  const { signature, timestamp, folder, cloudName, apiKey, resourceType } =
    await sigRes.json();

  // 2. POST directly to Cloudinary upload endpoint
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("signature", signature);
    formData.append("timestamp", String(timestamp));
    formData.append("folder", folder);
    formData.append("api_key", apiKey);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress({
          filename: file.name,
          progress: (e.loaded / e.total) * 100,
          status: "uploading",
        });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          onProgress({ filename: file.name, progress: 100, status: "complete" });
          resolve({ url: data.secure_url, storagePath: data.public_id });
        } catch {
          reject(new Error("Invalid Cloudinary response"));
        }
      } else {
        let msg = "Upload failed";
        try {
          const err = JSON.parse(xhr.responseText);
          msg = err?.error?.message ?? msg;
        } catch {}
        onProgress({ filename: file.name, progress: 0, status: "error", error: msg });
        reject(new Error(msg));
      }
    });

    xhr.addEventListener("error", () => {
      const msg = "Network error during upload";
      onProgress({ filename: file.name, progress: 0, status: "error", error: msg });
      reject(new Error(msg));
    });

    xhr.open("POST", uploadUrl);
    xhr.send(formData);
  });
}
