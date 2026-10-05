import { NextRequest } from "next/server";
import { invoicePdf } from "@/lib/reports";
import { pdfResponse } from "@/lib/pdf-response";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const amount = Number(url.searchParams.get("amount") ?? 320);
  const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const bytes = invoicePdf(params.id, Number.isFinite(amount) ? amount : 320, date);
  return pdfResponse(bytes, `invoice-${params.id}.pdf`);
}
