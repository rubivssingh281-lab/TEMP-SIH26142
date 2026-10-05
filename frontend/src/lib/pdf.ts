/**
 * Minimal dependency-free PDF writer.
 *
 * Produces valid PDF 1.4 bytes with text (Helvetica / Helvetica-Bold, WinAnsi),
 * filled rectangles and lines — enough to render report pages and small
 * procedural "map" thumbnails without any third-party library. Runs in the
 * Next.js route handlers (Node runtime) and is unit-tested in tests/.
 *
 * Coordinates in the drawing API are TOP-LEFT based (y grows downward), which
 * is flipped to PDF's bottom-left origin internally.
 */

const PAGE_W = 595.28; // A4 portrait, points
const PAGE_H = 841.89;

type Op = string;

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function n(v: number): string {
  return (Math.round(v * 100) / 100).toString();
}

export class PdfDoc {
  readonly w = PAGE_W;
  readonly h = PAGE_H;
  private pages: Op[][] = [];
  private cur: Op[] = [];

  constructor() {
    this.pages.push(this.cur);
  }

  addPage(): void {
    this.cur = [];
    this.pages.push(this.cur);
  }

  /** Set fill colour (0..1 rgb). */
  fill(r: number, g: number, b: number): this {
    this.cur.push(`${n(r)} ${n(g)} ${n(b)} rg`);
    return this;
  }

  private stroke(r: number, g: number, b: number): void {
    this.cur.push(`${n(r)} ${n(g)} ${n(b)} RG`);
  }

  rect(x: number, y: number, w: number, h: number, color: [number, number, number]): this {
    this.fill(color[0], color[1], color[2]);
    this.cur.push(`${n(x)} ${n(this.h - y - h)} ${n(w)} ${n(h)} re f`);
    return this;
  }

  line(x1: number, y1: number, x2: number, y2: number, color: [number, number, number], width = 0.7): this {
    this.stroke(color[0], color[1], color[2]);
    this.cur.push(`${n(width)} w ${n(x1)} ${n(this.h - y1)} m ${n(x2)} ${n(this.h - y2)} l S`);
    return this;
  }

  /** Draw text. `bold` selects Helvetica-Bold (font F2). */
  text(x: number, y: number, s: string, opts: { size?: number; bold?: boolean; color?: [number, number, number] } = {}): this {
    const size = opts.size ?? 11;
    const c = opts.color ?? [0.13, 0.12, 0.1];
    const font = opts.bold ? "F2" : "F1";
    this.cur.push(
      `BT ${n(c[0])} ${n(c[1])} ${n(c[2])} rg /${font} ${n(size)} Tf 1 0 0 1 ${n(x)} ${n(this.h - y - size)} Tm (${esc(s)}) Tj ET`
    );
    return this;
  }

  /** Serialize to PDF bytes (latin1). */
  build(): Uint8Array {
    const objects: string[] = [];
    const objOffsets: number[] = [];
    const chunks: string[] = [];
    let offset = 0;
    const push = (s: string) => {
      chunks.push(s);
      offset += Buffer.byteLength(s, "latin1");
    };
    const startObj = (body: string) => {
      objOffsets.push(offset);
      const id = objOffsets.length;
      push(`${id} 0 obj\n${body}\nendobj\n`);
      return id;
    };

    push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

    // Reserve ids: 1 Catalog, 2 Pages, 3 F1, 4 F2, then page + content pairs.
    const pageIds: number[] = [];
    const contentIds: number[] = [];
    const nPages = this.pages.length;
    // Predict object ids
    const catalogId = 1, pagesId = 2, f1Id = 3, f2Id = 4;
    for (let i = 0; i < nPages; i++) {
      pageIds.push(5 + i * 2);
      contentIds.push(6 + i * 2);
    }

    // Emit in id order to keep offsets aligned.
    startObj(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`); // 1
    startObj(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${nPages} >>`); // 2
    startObj(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`); // 3
    startObj(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`); // 4

    for (let i = 0; i < nPages; i++) {
      const stream = this.pages[i].join("\n");
      const len = Buffer.byteLength(stream, "latin1");
      startObj(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${n(PAGE_W)} ${n(PAGE_H)}] ` +
          `/Resources << /Font << /F1 ${f1Id} 0 R /F2 ${f2Id} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`
      ); // page
      startObj(`<< /Length ${len} >>\nstream\n${stream}\nendstream`); // content
    }

    const xrefStart = offset;
    const count = objOffsets.length + 1;
    let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
    for (const o of objOffsets) xref += `${String(o).padStart(10, "0")} 00000 n \n`;
    push(xref);
    push(`trailer\n<< /Size ${count} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

    void objects;
    const bytes = new Uint8Array(offset);
    let p = 0;
    for (const s of chunks) {
      for (let i = 0; i < s.length; i++) bytes[p++] = s.charCodeAt(i) & 0xff;
    }
    return bytes;
  }
}
