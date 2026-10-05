/** Build a downloadable-PDF HTTP Response from raw bytes. */
export function pdfResponse(bytes: Uint8Array, filename: string): Response {
  const body = new Uint8Array(bytes); // fresh ArrayBuffer-backed copy for the Response
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
