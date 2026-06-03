export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: "image" | "video";
  filename: string;
  size: number;
  order: number;
  uploadedAt: Date | string;
  caption?: string;
  storagePath: string;
}

export interface GalleryConfig {
  id: string;
  pin: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  slideshowInterval: number;
  allowDownload: boolean;
}

export interface UploadProgress {
  filename: string;
  progress: number;
  status: "uploading" | "complete" | "error";
  error?: string;
}
