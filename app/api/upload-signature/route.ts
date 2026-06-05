import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Returns a short-lived signed upload signature so the browser can upload
// DIRECTLY to Cloudinary — bypassing Vercel entirely.
// This means NO file size limit and NO server timeout for videos.
export async function POST(req: NextRequest) {
  try {
    const { resourceType } = await req.json();
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "private-gallery";

    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      resourceType: resourceType ?? "auto",
    });
  } catch (err: unknown) {
    console.error("Signature error:", err);
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
  }
}
