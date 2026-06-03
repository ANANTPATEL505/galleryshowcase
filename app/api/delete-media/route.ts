import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { publicId } = await req.json();

    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json({ error: "publicId required" }, { status: 400 });
    }

    // Try image first, then video
    let destroyed = false;
    for (const resourceType of ["image", "video"] as const) {
      try {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
        });
        if (result.result === "ok") { destroyed = true; break; }
      } catch {
        // try next type
      }
    }

    return NextResponse.json({ success: destroyed });
  } catch (err: unknown) {
    console.error("Delete error:", err);
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
