import { NextRequest, NextResponse } from "next/server";

// This route is a lightweight PIN-check relay.
// All real validation happens client-side via Firestore,
// but this endpoint can be used for server-side checks if needed.
export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin || typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "Invalid PIN format" }, { status: 400 });
    }
    // Real validation is done client-side with Firestore
    // This endpoint exists for future server-side integration
    return NextResponse.json({ message: "Use client-side Firestore validation" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
