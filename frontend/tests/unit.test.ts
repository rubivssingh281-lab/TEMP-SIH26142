/**
 * Pure unit tests — no server required. Run with Node's native TS support:
 *   node --test tests/unit.test.ts
 * (included in `npm test`).
 *
 * These cover the zero-dependency primitives (PDF writer, seeded RNG). The
 * higher-level report builders and every route are exercised end-to-end by
 * tests/api.test.mjs against a running server.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { PdfDoc } from "../src/lib/pdf.ts";
import { seededRandom, hashInt } from "../src/lib/utils.ts";

test("seededRandom is deterministic for a seed and varies across seeds", () => {
  const a = seededRandom("ladakh-urban");
  const b = seededRandom("ladakh-urban");
  assert.equal(a(), b());
  assert.equal(a(), b());
  const x = seededRandom("s")();
  assert.ok(x >= 0 && x < 1);
  assert.notEqual(seededRandom("ladakh-urban")(), seededRandom("punjab-fields")());
});

test("hashInt is stable and in range [0,1000)", () => {
  assert.equal(hashInt("abc"), hashInt("abc"));
  assert.ok(hashInt("xyz") >= 0 && hashInt("xyz") < 1000);
  assert.notEqual(hashInt("a"), hashInt("b"));
});

test("PdfDoc emits a well-formed single-page PDF", () => {
  const doc = new PdfDoc();
  doc.text(50, 50, "Hello (world)").rect(10, 10, 20, 20, [1, 0, 0]).line(0, 0, 10, 10, [0, 0, 0]);
  const s = Buffer.from(doc.build()).toString("latin1");
  assert.equal(s.slice(0, 5), "%PDF-");
  assert.ok(s.includes("/Type /Catalog"));
  assert.ok(s.includes("/Count 1"));
  assert.ok(s.trimEnd().endsWith("%%EOF"));
  assert.ok(s.includes("(Hello \\(world\\))"), "text parens are escaped");
});

test("PdfDoc supports multiple pages and keeps xref consistent", () => {
  const doc = new PdfDoc();
  doc.text(40, 40, "page one");
  doc.addPage();
  doc.text(40, 40, "page two");
  const s = Buffer.from(doc.build()).toString("latin1");
  assert.ok(s.includes("/Count 2"));
  // one xref entry per object + the free entry; 4 base objs + 2 pages*2 = 8 objs
  assert.ok(/\/Size 9\b/.test(s), "trailer Size reflects all objects");
});
