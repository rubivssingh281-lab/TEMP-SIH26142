import { NextRequest, NextResponse } from "next/server";
import { SETTINGS } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(SETTINGS);
}

export async function PUT(req: NextRequest) {
  const patch = await req.json().catch(() => ({}));
  // Mock: echo the merged settings back (a real backend would persist these).
  return NextResponse.json({ ...SETTINGS, ...patch });
}
