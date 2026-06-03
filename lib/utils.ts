import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function isVideoFile(filename: string): boolean {
  return /\.(mp4|mov|avi|webm|mkv|m4v)$/i.test(filename);
}

export function isImageFile(filename: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|heic|heif|avif)$/i.test(filename);
}
