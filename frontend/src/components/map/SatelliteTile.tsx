"use client";

import { useMemo } from "react";
import { seededRandom, hashInt, cn } from "@/lib/utils";
import { imageFor, heatImageFor } from "@/lib/imagery";

/**
 * Procedural satellite / map imagery rendered as pure SVG from a string seed.
 *
 * Instead of random colour blocks, each tile is built like a real satellite
 * scene: a biome-tinted terrain gradient, fractal-noise ground texture
 * (feTurbulence), and vector features — road networks, meandering rivers,
 * agricultural parcels, urban blocks and mountain contours.
 *
 *   variant "lr" = coarse / blurred  (low resolution, Sentinel-2 look)
 *   variant "sr" = crisp + fine detail + structure (super-resolved look)
 *
 * Output is deterministic for a given seed, so LR/SR pairs stay registered and
 * the demo is fully offline (no tiles or image hosting).
 */

type Biome = "urban" | "terrain" | "snow" | "fields" | "water";

type BiomeSpec = {
  /** vertical gradient stops (top → bottom) */
  grad: string[];
  /** base fractal-noise frequency */
  freq: number;
  /** dark + light mottle tints */
  dark: string;
  light: string;
};

const BIOMES: Record<Biome, BiomeSpec> = {
  urban: { grad: ["#8d8577", "#7c7568", "#6d675b", "#5a5449"], freq: 0.9, dark: "#3d3a33", light: "#cfc9bb" },
  terrain: { grad: ["#7c7b53", "#6a6a44", "#585835", "#43462d"], freq: 0.75, dark: "#2f321f", light: "#a7a675" },
  snow: { grad: ["#e7eaee", "#d2d7dd", "#b6bcc6", "#9aa1ac"], freq: 0.85, dark: "#7c8490", light: "#ffffff" },
  fields: { grad: ["#8a9550", "#75863f", "#5f7334", "#4c5f2c"], freq: 0.8, dark: "#3a4a23", light: "#c3cd83" },
  water: { grad: ["#456f72", "#39605f", "#2d4d4c", "#243f3e"], freq: 0.7, dark: "#16302f", light: "#7fb0b2" },
};

function biomeFor(seed: string): Biome {
  const s = seed.toLowerCase();
  if (s.includes("urban") || s.includes("building") || s.includes("mumbai") || s.includes("road")) return "urban";
  if (s.includes("snow") || s.includes("siachen") || s.includes("glacier")) return "snow";
  if (s.includes("field") || s.includes("punjab") || s.includes("crop")) return "fields";
  if (s.includes("water") || s.includes("flood") || s.includes("kerala")) return "water";
  return "terrain";
}

/** Smooth meandering polyline path across the tile. */
function meander(rand: () => number, horizontal: boolean, spread: number): string {
  const pts: [number, number][] = [];
  const base = 15 + rand() * 70;
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 100;
    const off = base + Math.sin(i * 1.3 + rand() * 6) * spread + (rand() - 0.5) * spread;
    pts.push(horizontal ? [t, off] : [off, t]);
  }
  return pts
    .map((p, i) => {
      if (i === 0) return `M${p[0].toFixed(1)},${p[1].toFixed(1)}`;
      const prev = pts[i - 1];
      const cx = (prev[0] + p[0]) / 2;
      const cy = (prev[1] + p[1]) / 2;
      return `Q${prev[0].toFixed(1)},${prev[1].toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)}`;
    })
    .join(" ");
}

export function SatelliteTile({
  seed,
  variant = "sr",
  className,
  showStructure,
}: {
  seed: string;
  variant?: "lr" | "sr";
  className?: string;
  showStructure?: boolean;
}) {
  const model = useMemo(() => {
    const rand = seededRandom(seed);
    const biome = biomeFor(seed);
    const spec = BIOMES[biome];
    const structure = showStructure ?? true;
    const detailed = variant === "sr";

    // ---- Vector features -----------------------------------------------
    const rivers: string[] = [];
    const roads: { d: string; w: number }[] = [];
    const fields: { x: number; y: number; w: number; h: number; c: string; rot: number }[] = [];
    const buildings: { x: number; y: number; w: number; h: number; c: string }[] = [];
    const contours: string[] = [];

    if (biome === "water" || biome === "terrain") {
      rivers.push(meander(rand, rand() > 0.5, 8));
      if (detailed && rand() > 0.4) rivers.push(meander(rand, rand() > 0.5, 5));
    }

    if (biome === "urban") {
      // street grid
      const gx = 4 + Math.floor(rand() * 3);
      const gy = 4 + Math.floor(rand() * 3);
      for (let i = 1; i < gx; i++) {
        const x = (i / gx) * 100 + (rand() - 0.5) * 4;
        roads.push({ d: `M${x.toFixed(1)},0 L${(x + (rand() - 0.5) * 6).toFixed(1)},100`, w: detailed ? 1.6 : 2.4 });
      }
      for (let i = 1; i < gy; i++) {
        const y = (i / gy) * 100 + (rand() - 0.5) * 4;
        roads.push({ d: `M0,${y.toFixed(1)} L100,${(y + (rand() - 0.5) * 6).toFixed(1)}`, w: detailed ? 1.6 : 2.4 });
      }
      // building blocks inside grid cells
      if (detailed) {
        for (let i = 0; i < gx; i++) {
          for (let j = 0; j < gy; j++) {
            if (rand() > 0.28) {
              const cw = 100 / gx, ch = 100 / gy;
              const pad = cw * 0.18;
              const roofs = ["#b7b1a3", "#a49c8c", "#8f8878", "#cbc5b6", "#7c7566"];
              buildings.push({
                x: i * cw + pad + rand() * pad,
                y: j * ch + pad + rand() * pad,
                w: cw - pad * 2 - rand() * pad,
                h: ch - pad * 2 - rand() * pad,
                c: roofs[Math.floor(rand() * roofs.length)],
              });
            }
          }
        }
      }
    } else if (biome === "fields") {
      // agricultural parcels
      const cols = detailed ? 5 : 3;
      const rows = detailed ? 5 : 3;
      const greens = ["#8a9550", "#9caf57", "#748a3c", "#b6c06f", "#5f7334", "#c9b06a", "#a88f4e"];
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const cw = 100 / cols, ch = 100 / rows;
          const pad = 0.8;
          fields.push({
            x: i * cw + pad, y: j * ch + pad, w: cw - pad * 2, h: ch - pad * 2,
            c: greens[Math.floor(rand() * greens.length)], rot: 0,
          });
        }
      }
      // farm track
      roads.push({ d: meander(rand, true, 4), w: detailed ? 1.2 : 2 });
    } else {
      // terrain / snow contour ridgelines
      if (structure) {
        const n = detailed ? 5 : 3;
        for (let i = 0; i < n; i++) contours.push(meander(rand, rand() > 0.5, 6 + rand() * 6));
      }
      if (biome !== "snow" && detailed && rand() > 0.5) {
        roads.push({ d: meander(rand, rand() > 0.5, 10), w: 1.1 });
      }
    }

    return { biome, spec, detailed, rivers, roads, fields, buildings, contours };
  }, [seed, variant, showStructure]);

  // Prefer a real satellite photo when the seed maps to one.
  const realImg = imageFor(seed);
  if (realImg) {
    return (
      <img
        src={realImg}
        alt=""
        draggable={false}
        className={cn(className, "object-cover select-none")}
        style={variant === "lr" ? { filter: "blur(2.4px) saturate(0.9) brightness(1.02)" } : undefined}
      />
    );
  }

  const { spec, detailed, rivers, roads, fields, buildings, contours, biome } = model;
  const uid = `${seed.replace(/\W/g, "")}-${variant}`;
  const nseed = hashInt(seed + variant);
  const blur = detailed ? 0 : 1.1;
  const roadColor = biome === "urban" ? "#d9d3c4" : "#c9bfa6";

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className={className} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="0.3" y2="1">
          {spec.grad.map((c, i) => (
            <stop key={i} offset={`${(i / (spec.grad.length - 1)) * 100}%`} stopColor={c} />
          ))}
        </linearGradient>
        {/* dark ground mottle: alpha follows noise luminance */}
        <filter id={`d-${uid}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={spec.freq} numOctaves={detailed ? 4 : 2} seed={nseed} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0.9 0.9 0 -0.35`} />
        </filter>
        {/* light ground mottle (finer) */}
        <filter id={`l-${uid}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={spec.freq * 2.3} numOctaves={detailed ? 3 : 2} seed={nseed + 7} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.7 0.7 0.7 0 -0.4`} />
        </filter>
        {blur > 0 && (
          <filter id={`b-${uid}`}>
            <feGaussianBlur stdDeviation={blur} />
          </filter>
        )}
      </defs>

      <g filter={blur > 0 ? `url(#b-${uid})` : undefined}>
        {/* base terrain */}
        <rect x="-1" y="-1" width="102" height="102" fill={`url(#g-${uid})`} />
        <rect x="-1" y="-1" width="102" height="102" filter={`url(#d-${uid})`} style={{ mixBlendMode: "multiply" }} opacity={0.6} />
        <rect x="-1" y="-1" width="102" height="102" filter={`url(#l-${uid})`} style={{ mixBlendMode: "soft-light" }} opacity={0.65} />

        {/* agricultural parcels */}
        {fields.map((f, i) => (
          <g key={`f${i}`}>
            <rect x={f.x} y={f.y} width={f.w} height={f.h} fill={f.c} fillOpacity={0.82} stroke="#4a5227" strokeWidth={0.35} />
            <rect x={f.x} y={f.y} width={f.w} height={f.h} filter={`url(#l-${uid})`} style={{ mixBlendMode: "soft-light" }} opacity={0.5} />
          </g>
        ))}

        {/* mountain contour lines */}
        {contours.map((d, i) => (
          <path key={`c${i}`} d={d} fill="none" stroke={biome === "snow" ? "#8a92a0" : "#5c5d3c"} strokeWidth={0.5} opacity={0.5} />
        ))}

        {/* rivers */}
        {rivers.map((d, i) => (
          <g key={`r${i}`}>
            <path d={d} fill="none" stroke="#37585a" strokeWidth={detailed ? 2.6 : 3.4} strokeLinecap="round" opacity={0.9} />
            <path d={d} fill="none" stroke="#6fa3a5" strokeWidth={detailed ? 1.1 : 1.6} strokeLinecap="round" opacity={0.7} />
          </g>
        ))}

        {/* roads / tracks */}
        {roads.map((r, i) => (
          <path key={`rd${i}`} d={r.d} fill="none" stroke={roadColor} strokeWidth={r.w} strokeLinecap="round" opacity={0.75} />
        ))}

        {/* urban building footprints */}
        {buildings.map((b, i) => (
          <g key={`b${i}`}>
            <rect x={b.x + 0.3} y={b.y + 0.3} width={b.w} height={b.h} fill="#2c2820" opacity={0.28} />
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.c} stroke="#5a5449" strokeWidth={0.2} />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Uncertainty heatmap tile — real thermal false-colour imagery. */
export function HeatmapTile({ seed, className }: { seed: string; className?: string }) {
  const heat = heatImageFor(seed);
  if (heat) {
    return <img src={heat} alt="" draggable={false} className={cn(className, "object-cover select-none")} />;
  }
  return <ProceduralHeatmap seed={seed} className={className} />;
}

/** Magma-style procedural fallback heatmap. */
function ProceduralHeatmap({ seed, className }: { seed: string; className?: string }) {
  const cells = useMemo(() => {
    const rand = seededRandom(seed + "heat");
    const grid = 26;
    const cell = 100 / grid;
    const magma = ["#000004", "#1b0c41", "#4a0c6b", "#781c6d", "#a52c60", "#cf4446", "#ed6925", "#fb9b06", "#f7d13d", "#fcffa4"];
    const out: { x: number; y: number; c: string }[] = [];
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        // create diagonal "hot" ridges
        const ridge = Math.sin((x + y) / 3) * 0.5 + 0.5;
        const v = Math.min(0.99, Math.max(0, ridge * 0.7 + rand() * 0.5));
        out.push({ x: x * cell, y: y * cell, c: magma[Math.floor(v * (magma.length - 1))] });
      }
    }
    return { out, cell };
  }, [seed]);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className={className} style={{ display: "block" }}>
      {cells.out.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={cells.cell + 0.3} height={cells.cell + 0.3} fill={c.c} />
      ))}
    </svg>
  );
}
