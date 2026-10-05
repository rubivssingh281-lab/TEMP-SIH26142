"use client";

/**
 * Fetch a file (e.g. a generated PDF) and trigger a browser "Save as" using a
 * blob URL. Throws on non-2xx so callers can surface an error toast.
 */
export async function downloadFile(href: string, filename: string): Promise<void> {
  const res = await fetch(href, { cache: "no-store" });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
}
