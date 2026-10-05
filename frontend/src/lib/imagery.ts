/**
 * Maps a procedural seed string to a real satellite image in /public/imagery.
 * When a seed matches, SatelliteTile / HeatmapTile render the photo instead of
 * the procedural SVG; unmatched seeds fall back to the procedural renderer.
 */
import { hashInt } from "./utils";

const FIELDS = ["/imagery/fields-1.jpg", "/imagery/fields-2.jpg", "/imagery/fields-road.jpg"];
const URBAN = ["/imagery/urban-suburb.jpg", "/imagery/urban-dense.jpg", "/imagery/urban-industrial.jpg"];

/** Real RGB satellite image for a seed, or null to use the procedural tile. */
export function imageFor(seed: string): string | null {
  const s = seed.toLowerCase();
  // pick deterministically within a category so repeated seeds stay stable
  const pick = (arr: string[]) => arr[hashInt(seed) % arr.length];

  // Snow / glacier scenes keep the procedural (grey/white) tile — no photo fits.
  if (/snow|siachen|glacier/.test(s)) return null;

  if (/water|flood|kerala|lake/.test(s)) return "/imagery/forest-lake.jpg";
  if (/field|crop|punjab/.test(s)) return pick(FIELDS);
  if (/mumbai|dense/.test(s)) return "/imagery/urban-dense.jpg";
  if (/industrial|western/.test(s)) return "/imagery/urban-industrial.jpg";
  if (/road/.test(s)) return "/imagery/fields-road.jpg";
  if (/arunachal|forest|ridge|terrain/.test(s)) return "/imagery/forest-lake.jpg";
  if (/ladakh|urban|building|mtn/.test(s)) return pick(URBAN);
  return null;
}

/** False-colour thermal image for uncertainty / heatmap tiles. */
export function heatImageFor(seed: string): string {
  return hashInt(seed) % 2 === 0 ? "/imagery/thermal-chicago.jpg" : "/imagery/thermal-cushing.jpg";
}
