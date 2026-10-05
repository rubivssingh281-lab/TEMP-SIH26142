import { NextResponse } from "next/server";
import { DASHBOARD } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(DASHBOARD);
}
