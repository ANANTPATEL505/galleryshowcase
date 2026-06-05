import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// This route now only handles IMAGES (< 10 MB) through the server.
// Videos are uploaded directly from the browser to Cloudinary using a
// signed upload URL returned by /api/upload-signature.
// This avoids Vercel's 4.5 MB body limit and 10s timeout entirely.

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Only images and videos allowed" }, { status: 400 });
    }

    // Hard cap: reject files over 9 MB through this route
    // (Videos should use the direct upload path via /api/upload-signature)
    const MAX_BYTES = 9 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large for server upload (${(file.size / 1024 / 1024).toFixed(1)} MB). Videos are uploaded directly to Cloudinary automatically.` },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "private-gallery",
            resource_type: isVideo ? "video" : "image",
            ...(isImage && {
              transformation: [{ quality: "auto", fetch_format: "auto" }],
            }),
          },
          (err, res) => {
            if (err || !res) return reject(err ?? new Error("Upload failed"));
            resolve(res as { secure_url: string; public_id: string });
          }
        );
        stream.end(buffer);
      }
    );

    return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err: unknown) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
