"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import {
  Lock,
  Unlock,
  Crosshair,
  Layers,
  Square,
  Pentagon,
  RotateCcw,
  Navigation,
  Check,
  MapPin,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Ensure Leaflet default icons work in Next.js bundle
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface AoiData {
  coordinates: [number, number][]; // [[lat, lng], ...]
  centroid: { lat: number; lng: number };
  formattedLocation: string; // "34.2345° N, 77.5612° E"
  areaKm2: number;
  isLocked: boolean;
  bounds?: [[number, number], [number, number]];
  regionName?: string;
  snapshotBase64?: string;
}

/**
 * Capture high-resolution raster snapshot of the specified AOI.
 * Strictly captures and crops ONLY within the orange boundary polygon.
 * Queries ArcGIS World Imagery export REST endpoint for precise georeferenced bbox,
 * falling back to local satellite imagery if offline, and clips strictly to the polygon path.
 */
export async function captureAoiMapSnapshot(
  coords: [number, number][],
  map?: L.Map | null,
  regionName?: string
): Promise<string> {
  if (!coords || coords.length === 0) {
    coords = [
      [34.246, 77.545],
      [34.251, 77.575],
      [34.238, 77.592],
      [34.221, 77.578],
      [34.217, 77.548],
    ];
  }

  const minLat = Math.min(...coords.map((c) => c[0]));
  const maxLat = Math.max(...coords.map((c) => c[0]));
  const minLng = Math.min(...coords.map((c) => c[1]));
  const maxLng = Math.max(...coords.map((c) => c[1]));

  // Exact bounding box of the orange boundary (no artificial margin)
  const bbox = `${minLng.toFixed(6)},${minLat.toFixed(6)},${maxLng.toFixed(6)},${maxLat.toFixed(6)}`;
  const arcgisUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=512,512&f=image`;

  // Function to render clipped image strictly inside the orange polygon boundary
  const renderClippedToCanvas = (sourceImg: HTMLImageElement): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const latSpan = maxLat - minLat || 0.0001;
    const lngSpan = maxLng - minLng || 0.0001;
    const points = coords.map(([lat, lng]) => ({
      x: ((lng - minLng) / lngSpan) * 512,
      y: ((maxLat - lat) / latSpan) * 512,
    }));

    // 1. Dark terrain backdrop
    ctx.fillStyle = "#141814";
    ctx.fillRect(0, 0, 512, 512);

    // 2. Clip strictly inside the orange boundary polygon
    ctx.save();
    ctx.beginPath();
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.clip(); // Canvas drawing restricted ONLY to inside the orange boundary!

    // 3. Draw satellite imagery within clipped boundary
    ctx.drawImage(sourceImg, 0, 0, 512, 512);
    ctx.restore();

    // 4. Draw high-visibility orange boundary stroke around the clipped AOI
    ctx.save();
    ctx.beginPath();
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.strokeStyle = "#D6532B";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    return canvas.toDataURL("image/png");
  };

  // 1. Try ArcGIS World Imagery Export REST service
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const loaded = await new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), 2400);
      img.onload = () => {
        clearTimeout(timer);
        resolve(true);
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(false);
      };
      img.src = arcgisUrl;
    });

    if (loaded && img.naturalWidth > 0) {
      const dataUrl = renderClippedToCanvas(img);
      if (dataUrl) return dataUrl;
    }
  } catch (err) {
    console.warn("ArcGIS export capture error:", err);
  }

  // 2. Fallback: Local real high-resolution satellite imagery from /imagery/ clipped to boundary
  try {
    const reg = (regionName || "").toLowerCase();
    let localSrc = "/imagery/urban-dense.jpg";
    if (reg.includes("ladakh")) localSrc = "/imagery/urban-suburb.jpg";
    else if (reg.includes("siachen") || reg.includes("snow")) localSrc = "/imagery/fields-road.jpg";
    else if (reg.includes("arunachal")) localSrc = "/imagery/forest-lake.jpg";
    else if (reg.includes("thar")) localSrc = "/imagery/fields-1.jpg";
    else if (reg.includes("pangong") || reg.includes("water")) localSrc = "/imagery/forest-lake.jpg";

    const localImg = new Image();
    const loaded = await new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), 1500);
      localImg.onload = () => resolve(true);
      localImg.onerror = () => resolve(false);
      localImg.src = localSrc;
    });

    if (loaded && localImg.naturalWidth > 0) {
      const dataUrl = renderClippedToCanvas(localImg);
      if (dataUrl) return dataUrl;
    }
  } catch (err) {
    console.warn("Local satellite image fallback error:", err);
  }

  // 3. Fallback: Procedural terrain canvas clipped to boundary
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const latSpan = maxLat - minLat || 0.0001;
    const lngSpan = maxLng - minLng || 0.0001;
    const points = coords.map(([lat, lng]) => ({
      x: ((lng - minLng) / lngSpan) * 512,
      y: ((maxLat - lat) / latSpan) * 512,
    }));
    ctx.fillStyle = "#141814";
    ctx.fillRect(0, 0, 512, 512);

    ctx.save();
    ctx.beginPath();
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.clip();

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, "#4a5335");
    grad.addColorStop(0.5, "#6a7350");
    grad.addColorStop(1, "#3f462c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.strokeStyle = "#D6532B";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
  return canvas.toDataURL("image/png");
}

export interface PresetLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  defaultPolygon: [number, number][];
}

/**
 * Asian Geographic Training Domain Bounding Box:
 * Supported operational domain for the Asian-trained GeoSRNet model:
 * Latitude: -12.0° to 82.0°
 * Longitude: 25.0° to 180.0°
 */
export const ASIA_BOUNDS: [[number, number], [number, number]] = [
  [-12.0, 25.0], // South-West (Indian Ocean / Anatolia-Suez corridor)
  [82.0, 180.0], // North-East (Arctic Siberia / Bering Strait / Japan)
];

export function isWithinAsiaDomain(lat: number, lng: number): boolean {
  return lat >= -12.0 && lat <= 82.0 && lng >= 25.0 && lng <= 180.0;
}

export const PRESET_REGIONS: PresetLocation[] = [
  {
    id: "ladakh",
    name: "Ladakh Ridge",
    lat: 34.2345,
    lng: 77.5612,
    zoom: 13,
    defaultPolygon: [
      [34.246, 77.545],
      [34.251, 77.575],
      [34.238, 77.592],
      [34.221, 77.578],
      [34.217, 77.548],
    ],
  },
  {
    id: "siachen",
    name: "Siachen Glacier",
    lat: 35.4211,
    lng: 77.1089,
    zoom: 12,
    defaultPolygon: [
      [35.45, 77.08],
      [35.445, 77.14],
      [35.395, 77.135],
      [35.4, 77.075],
    ],
  },
  {
    id: "arunachal",
    name: "Arunachal Tawang",
    lat: 27.5861,
    lng: 91.8594,
    zoom: 13,
    defaultPolygon: [
      [27.598, 91.842],
      [27.602, 91.875],
      [27.574, 91.88],
      [27.57, 91.848],
    ],
  },
  {
    id: "pangong",
    name: "Pangong Tso",
    lat: 33.7595,
    lng: 78.6674,
    zoom: 12,
    defaultPolygon: [
      [33.78, 78.63],
      [33.785, 78.71],
      [33.735, 78.705],
      [33.738, 78.625],
    ],
  },
  {
    id: "thar",
    name: "Thar Desert",
    lat: 27.0238,
    lng: 71.7533,
    zoom: 13,
    defaultPolygon: [
      [27.045, 71.73],
      [27.048, 71.775],
      [27.008, 71.78],
      [27.005, 71.735],
    ],
  },
];

export function formatCoordinateString(lat: number, lng: number): string {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}`;
  const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? "E" : "W"}`;
  return `${latStr}, ${lngStr}`;
}

export function calculatePolygonAreaKm2(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const R = 6371; // Earth radius in km
  const avgLat = (coords.reduce((sum, c) => sum + c[0], 0) / coords.length) * (Math.PI / 180);
  const cosAvgLat = Math.cos(avgLat);

  const points = coords.map(([lat, lng]) => ({
    x: lng * (Math.PI / 180) * R * cosAvgLat,
    y: lat * (Math.PI / 180) * R,
  }));

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export function getCentroid(coords: [number, number][]): { lat: number; lng: number } {
  if (coords.length === 0) return { lat: 34.2345, lng: 77.5612 };
  const lat = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
  const lng = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
  return { lat, lng };
}

interface LeafletAoiMapProps {
  className?: string;
  onAoiChange?: (aoi: AoiData) => void;
  initialPreset?: string;
}

export function LeafletAoiMap({
  className,
  onAoiChange,
  initialPreset = "ladakh",
}: LeafletAoiMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const vertexMarkersRef = useRef<L.Marker[]>([]);
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const coordsRef = useRef<[number, number][]>([]);
  const baseLayersRef = useRef<{ [key: string]: L.TileLayer }>({});

  const [activePreset, setActivePreset] = useState(initialPreset);
  const [mapType, setMapType] = useState<"satellite" | "hybrid" | "street">("satellite");
  const [isLocked, setIsLocked] = useState(true);
  const [activeTool, setActiveTool] = useState<"lock-center" | "polygon" | "box">("lock-center");
  const [mouseCoord, setMouseCoord] = useState<string>("34.2345° N, 77.5612° E");
  const [customPoints, setCustomPoints] = useState<[number, number][]>([]);
  const [currentAoi, setCurrentAoi] = useState<AoiData>(() => {
    const p = PRESET_REGIONS.find((r) => r.id === initialPreset) || PRESET_REGIONS[0];
    const area = calculatePolygonAreaKm2(p.defaultPolygon);
    const centroid = getCentroid(p.defaultPolygon);
    coordsRef.current = [...p.defaultPolygon];
    return {
      coordinates: p.defaultPolygon,
      centroid,
      formattedLocation: formatCoordinateString(centroid.lat, centroid.lng),
      areaKm2: Number(area.toFixed(2)),
      isLocked: true,
      regionName: p.name,
    };
  });

  // Render or update locked polygon & interactive draggable handles on the Leaflet map
  const renderPolygonOnMap = useCallback((coords: [number, number][], locked: boolean, regionName?: string) => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    coordsRef.current = [...coords];

    // Remove existing layers and markers
    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
      polygonLayerRef.current = null;
    }
    vertexMarkersRef.current.forEach((m) => m.remove());
    vertexMarkersRef.current = [];
    if (centerMarkerRef.current) {
      centerMarkerRef.current.remove();
      centerMarkerRef.current = null;
    }

    if (coords.length < 3) return;

    // Draw styled GeoSR polygon with prominent orange boundary
    const poly = L.polygon(coords, {
      color: "#D6532B", // Brand terracotta orange
      weight: 3,
      opacity: 0.98,
      fillColor: "#D6532B",
      fillOpacity: 0.28,
    }).addTo(map);

    polygonLayerRef.current = poly;

    // Create interactive draggable corner handles for custom boundary selection
    const handleHtml = `
      <div style="
        width: 18px;
        height: 18px;
        background: #ffffff;
        border: 3.5px solid #D6532B;
        border-radius: 50%;
        box-shadow: 0 0 0 2px rgba(214,83,43,0.35), 0 2px 6px rgba(0,0,0,0.5);
        cursor: grab;
        transition: transform 0.15s ease;
      "></div>
    `;

    coords.forEach(([lat, lng], idx) => {
      const handleIcon = L.divIcon({
        className: "aoi-vertex-handle-icon",
        html: handleHtml,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([lat, lng], {
        draggable: true,
        icon: handleIcon,
        title: `Drag corner handle #${idx + 1} to customize AOI boundary`,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.on("dragstart", () => {
        map.dragging.disable();
      });

      marker.on("drag", (e: L.LeafletEvent) => {
        const target = e.target as L.Marker;
        const pos = target.getLatLng();
        // Strictly clamp within Asian training domain
        const clampedLat = Math.min(82.0, Math.max(-12.0, pos.lat));
        const clampedLng = Math.min(180.0, Math.max(25.0, pos.lng));
        const nextCoords = [...coordsRef.current];
        nextCoords[idx] = [clampedLat, clampedLng];
        coordsRef.current = nextCoords;

        if (polygonLayerRef.current) {
          polygonLayerRef.current.setLatLngs(nextCoords);
        }

        const newCentroid = getCentroid(nextCoords);
        if (centerMarkerRef.current) {
          centerMarkerRef.current.setLatLng([newCentroid.lat, newCentroid.lng]);
        }

        const newArea = calculatePolygonAreaKm2(nextCoords);
        setCurrentAoi((prev) => ({
          ...prev,
          coordinates: nextCoords,
          areaKm2: Number(newArea.toFixed(2)),
          centroid: newCentroid,
          formattedLocation: formatCoordinateString(newCentroid.lat, newCentroid.lng),
        }));
      });

      marker.on("dragend", () => {
        map.dragging.enable();
        commitAoi(coordsRef.current, true, regionName || currentAoi.regionName || "Custom Area");
      });

      vertexMarkersRef.current.push(marker);
    });

    // Add draggable center handle to allow repositioning the entire AOI box
    const centroid = getCentroid(coords);
    const centerHtml = `
      <div style="
        width: 24px;
        height: 24px;
        background: #D6532B;
        border: 2px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.45);
        cursor: move;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
          <polyline points="5 9 2 12 5 15"/>
          <polyline points="9 5 12 2 15 5"/>
          <polyline points="15 19 12 22 9 19"/>
          <polyline points="19 9 22 12 19 15"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <line x1="12" y1="2" x2="12" y2="22"/>
        </svg>
      </div>
    `;

    const centerIcon = L.divIcon({
      className: "aoi-center-move-icon",
      html: centerHtml,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const centerMarker = L.marker([centroid.lat, centroid.lng], {
      draggable: true,
      icon: centerIcon,
      title: "Drag center to move entire AOI box",
      zIndexOffset: 999,
    }).addTo(map);

    let dragOriginCentroid = { lat: centroid.lat, lng: centroid.lng };
    let dragOriginCoords: [number, number][] = [];

    centerMarker.on("dragstart", () => {
      map.dragging.disable();
      dragOriginCentroid = getCentroid(coordsRef.current);
      dragOriginCoords = [...coordsRef.current];
    });

    centerMarker.on("drag", (e: L.LeafletEvent) => {
      const pos = (e.target as L.Marker).getLatLng();
      const dLat = pos.lat - dragOriginCentroid.lat;
      const dLng = pos.lng - dragOriginCentroid.lng;
      const movedCoords = dragOriginCoords.map(([lt, lg]) => {
        const nLat = Math.min(82.0, Math.max(-12.0, lt + dLat));
        const nLng = Math.min(180.0, Math.max(25.0, lg + dLng));
        return [nLat, nLng] as [number, number];
      });
      coordsRef.current = movedCoords;

      if (polygonLayerRef.current) {
        polygonLayerRef.current.setLatLngs(movedCoords);
      }

      vertexMarkersRef.current.forEach((vm, i) => {
        if (movedCoords[i]) vm.setLatLng(movedCoords[i]);
      });

      const newCentroid = getCentroid(movedCoords);
      setCurrentAoi((prev) => ({
        ...prev,
        coordinates: movedCoords,
        centroid: newCentroid,
        formattedLocation: formatCoordinateString(newCentroid.lat, newCentroid.lng),
      }));
    });

    centerMarker.on("dragend", () => {
      map.dragging.enable();
      commitAoi(coordsRef.current, true, regionName || currentAoi.regionName || "Custom Area");
    });

    centerMarkerRef.current = centerMarker;
  }, []);

  // Update AOI and trigger callback
  const commitAoi = useCallback((coords: [number, number][], locked: boolean, regionName?: string) => {
    coordsRef.current = [...coords];
    const area = calculatePolygonAreaKm2(coords);
    const centroid = getCentroid(coords);
    const formatted = formatCoordinateString(centroid.lat, centroid.lng);
    const minLat = Math.min(...coords.map((c) => c[0]));
    const maxLat = Math.max(...coords.map((c) => c[0]));
    const minLng = Math.min(...coords.map((c) => c[1]));
    const maxLng = Math.max(...coords.map((c) => c[1]));
    const bounds: [[number, number], [number, number]] = [[minLat, minLng], [maxLat, maxLng]];

    const data: AoiData = {
      coordinates: coords,
      centroid,
      formattedLocation: formatted,
      areaKm2: Number(area.toFixed(2)),
      isLocked: locked,
      bounds,
      regionName,
    };
    setCurrentAoi(data);
    setIsLocked(locked);
    renderPolygonOnMap(coords, locked, regionName);
    if (onAoiChange) {
      onAoiChange(data);
    }

    // Capture snapshot strictly clipped within the orange boundary polygon
    captureAoiMapSnapshot(coords, mapRef.current, regionName).then((b64) => {
      const withSnapshot: AoiData = { ...data, snapshotBase64: b64 };
      setCurrentAoi(withSnapshot);
      if (onAoiChange) {
        onAoiChange(withSnapshot);
      }
    });
  }, [onAoiChange, renderPolygonOnMap]);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const preset = PRESET_REGIONS.find((p) => p.id === initialPreset) || PRESET_REGIONS[0];

    // Create Leaflet map instance constrained to Asian Geographic Dataset Domain
    const map = L.map(containerRef.current, {
      center: [preset.lat, preset.lng],
      zoom: preset.zoom,
      minZoom: 4,
      maxZoom: 18,
      maxBounds: ASIA_BOUNDS,
      maxBoundsViscosity: 1.0, // Strictly enforce Asian continent boundary
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
      tapHold: false,
      bounceAtZoomLimits: true,
    });

    mapRef.current = map;

    // Isolate map from parent scroll containers
    const container = containerRef.current;
    L.DomEvent.disableScrollPropagation(container);
    L.DomEvent.disableClickPropagation(container);

    // Prevent mobile page viewport scrolling while moving / dragging map
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("button") || target?.closest("input") || target?.closest("select")) {
        return;
      }
      e.stopPropagation();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("button") || target?.closest("input") || target?.closest("select")) {
        return;
      }
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();
    };

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("wheel", handleWheel, { passive: true });

    // Satellite layer (Esri World Imagery)
    const satLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Esri World Imagery",
        crossOrigin: "anonymous",
      }
    );

    // Hybrid labels layer
    const labelLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, crossOrigin: "anonymous" }
    );

    // Street layer (CartoDB Positron)
    const streetLayer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
        attribution: "CartoDB Voyager",
        crossOrigin: "anonymous",
      }
    );

    baseLayersRef.current = {
      satellite: satLayer,
      hybrid: L.layerGroup([satLayer, labelLayer]) as any,
      street: streetLayer,
    };

    satLayer.addTo(map);

    // Track mouse coordinates
    map.on("mousemove", (e) => {
      setMouseCoord(formatCoordinateString(e.latlng.lat, e.latlng.lng));
    });

    // Render initial polygon and take initial snapshot
    renderPolygonOnMap(preset.defaultPolygon, true);
    captureAoiMapSnapshot(preset.defaultPolygon, map, preset.name).then((b64) => {
      setCurrentAoi((prev) => {
        const next = { ...prev, snapshotBase64: b64 };
        if (onAoiChange) onAoiChange(next);
        return next;
      });
    });

    // Cleanup on unmount
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("wheel", handleWheel);
      map.remove();
      mapRef.current = null;
    };
  }, [initialPreset, renderPolygonOnMap]);

  // Handle map type switch
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    Object.values(baseLayersRef.current).forEach((l) => {
      if (map.hasLayer(l)) map.removeLayer(l);
    });

    const active = baseLayersRef.current[mapType];
    if (active) {
      active.addTo(map);
    }
  }, [mapType]);

  // Lock visible display center viewport as AOI
  const lockCurrentDisplay = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const bounds = map.getBounds();

    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();

    // Take the central 60% of the screen as the focused AOI bounding box
    const latSpan = north - south;
    const lngSpan = east - west;
    const padLat = latSpan * 0.2;
    const padLng = lngSpan * 0.2;

    const n = Math.min(82.0, Math.max(-12.0, north - padLat));
    const s = Math.min(82.0, Math.max(-12.0, south + padLat));
    const e = Math.min(180.0, Math.max(25.0, east - padLng));
    const w = Math.min(180.0, Math.max(25.0, west + padLng));

    const boxPolygon: [number, number][] = [
      [n, w],
      [n, e],
      [s, e],
      [s, w],
    ];

    commitAoi(boxPolygon, true, "Display Focused Area");
  }, [commitAoi]);

  // Select Preset Region
  const handleSelectPreset = (presetId: string) => {
    const p = PRESET_REGIONS.find((r) => r.id === presetId);
    if (!p || !mapRef.current) return;
    setActivePreset(presetId);
    mapRef.current.flyTo([p.lat, p.lng], p.zoom, { duration: 1.2 });
    commitAoi(p.defaultPolygon, true, p.name);
  };

  // Geolocate user position
  const handleGeolocate = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!isWithinAsiaDomain(latitude, longitude)) {
          alert("Your detected location is outside the Asian satellite training domain (25°E–180°E, 12°S–82°N). The GeoSRNet CNN model was trained exclusively on Asian satellite datasets.");
          return;
        }
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 14, { duration: 1.5 });
          // create a ~2x2km AOI around user
          const span = 0.012;
          const poly: [number, number][] = [
            [latitude + span, longitude - span],
            [latitude + span, longitude + span],
            [latitude - span, longitude + span],
            [latitude - span, longitude - span],
          ];
          commitAoi(poly, true, "Local Geolocation AOI");
        }
      },
      () => {
        // Fallback or permission denied
      }
    );
  };

  // Click on map to add vertices if in polygon drawing mode
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isLocked) return;
      if (activeTool === "polygon") {
        const lat = Math.min(82.0, Math.max(-12.0, e.latlng.lat));
        const lng = Math.min(180.0, Math.max(25.0, e.latlng.lng));
        const newPt: [number, number] = [lat, lng];
        const next = [...customPoints, newPt];
        setCustomPoints(next);
        renderPolygonOnMap(next, false);
      }
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [isLocked, activeTool, customPoints, renderPolygonOnMap]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-line bg-[#1c221d] touch-none select-none aoi-map-viewport",
        className
      )}
    >
      {/* Real Leaflet Map Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full z-0 cursor-grab active:cursor-grabbing touch-none select-none"
      />

      {/* Reticle guide when unlocked in lock-center mode */}
      {!isLocked && activeTool === "lock-center" && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="w-[60%] h-[60%] border-2 border-dashed border-primary/80 rounded-lg bg-primary/10 flex items-center justify-center relative">
            <Crosshair className="text-primary size-6 animate-pulse" />
            <span className="absolute bottom-2 text-[10px] font-semibold tracking-wider uppercase text-white bg-black/70 px-2 py-0.5 rounded shadow">
              AOI Target Frame
            </span>
          </div>
        </div>
      )}

      {/* Top Bar: Strategic Preset Pills (Horizontally scrollable for mobile) */}
      <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pointer-events-auto bg-surface/90 backdrop-blur-md p-1 rounded-lg border border-line-strong shadow-sm max-w-[calc(100%-80px)]">
          <span className="text-[10px] font-bold text-muted px-1.5 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <MapPin size={11} className="text-primary" /> AOI:
          </span>
          {PRESET_REGIONS.map((preset) => {
            const active = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-all",
                  active
                    ? "bg-primary text-white shadow-xs"
                    : "text-ink-soft hover:bg-canvas hover:text-ink"
                )}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* Right Tools: Map Layer & Geolocation */}
        <div className="flex items-center gap-1 pointer-events-auto bg-surface/90 backdrop-blur-md p-1 rounded-lg border border-line-strong shadow-sm shrink-0">
          <button
            type="button"
            title="Toggle Satellite / Hybrid / Street"
            onClick={() => {
              setMapType((curr) => (curr === "satellite" ? "hybrid" : curr === "hybrid" ? "street" : "satellite"));
            }}
            className="p-1 rounded hover:bg-canvas text-ink-soft hover:text-ink transition flex items-center gap-1 text-[11px] font-medium px-1.5"
          >
            <Layers size={13} className="text-teal" />
            <span className="hidden sm:inline capitalize">{mapType}</span>
          </button>
          <button
            type="button"
            title="Locate my position"
            onClick={handleGeolocate}
            className="p-1 rounded hover:bg-canvas text-ink-soft hover:text-ink transition"
          >
            <Navigation size={13} />
          </button>
        </div>
      </div>

      {/* Visual Instruction Badge */}
      <div className="absolute top-11 left-2 pointer-events-none z-20 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[10.5px] border border-white/10 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-[#D6532B] animate-ping" />
        <span className="font-medium text-white/90">
          <strong className="text-[#D6532B]">Interactive AOI:</strong> Drag corner handles to customize boundary · Drag center to move
        </span>
      </div>

      {/* Asian Training Domain Badge */}
      <div className="hidden sm:flex absolute top-11 right-2 pointer-events-none z-20 items-center gap-1.5 bg-emerald-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-emerald-300 text-[10.5px] border border-emerald-500/30 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold">Model Domain: Asia (25°E–180°E)</span>
      </div>

      {/* Floating Bottom Left: Zoom and Draw Controls */}
      <div className="absolute bottom-10 left-2 z-20 flex flex-col gap-1 pointer-events-auto bg-surface/90 backdrop-blur-md p-1 rounded-lg border border-line-strong shadow-sm">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          className="h-6 w-6 rounded hover:bg-canvas grid place-items-center text-ink text-xs font-bold"
          title="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          className="h-6 w-6 rounded hover:bg-canvas grid place-items-center text-ink text-xs font-bold"
          title="Zoom Out"
        >
          -
        </button>
        <div className="h-px bg-line my-0.5" />
        <button
          type="button"
          onClick={() => {
            if (isLocked) {
              setIsLocked(false);
              setActiveTool("lock-center");
            } else {
              lockCurrentDisplay();
            }
          }}
          className={cn(
            "h-6 w-6 rounded grid place-items-center transition",
            isLocked ? "text-primary hover:bg-canvas" : "bg-primary text-white"
          )}
          title={isLocked ? "Unlock to re-center AOI" : "Lock Center Viewport as AOI"}
        >
          {isLocked ? <Unlock size={12} /> : <Lock size={12} />}
        </button>
      </div>

      {/* Bottom Center / Right: Lock status badge & Primary Lock button */}
      <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between gap-1 pointer-events-none">
        {/* Lock Status Badge */}
        <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[11px] font-medium border border-white/10 pointer-events-auto shadow-md">
          {isLocked ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-semibold text-emerald-300">AOI READY</span>
              <span className="text-white/40">|</span>
              <span className="font-semibold">{currentAoi.areaKm2} km²</span>
              <span className="hidden sm:inline text-white/70 font-mono text-[10px]">
                ({currentAoi.formattedLocation})
              </span>
              <span className="text-amber-300 font-semibold text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-400/30">
                Boundary Draggable
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span className="text-amber-300 font-semibold">ADJUSTING</span>
              <span className="text-white/70 text-[10.5px]">Pan/Zoom or drag handles</span>
            </>
          )}
        </div>

        {/* Action Button: Lock Visible or Unlock */}
        <div className="pointer-events-auto flex items-center gap-1">
          {!isLocked ? (
            <button
              type="button"
              onClick={lockCurrentDisplay}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[11.5px] font-semibold shadow-md transition"
            >
              <Lock size={12} /> Lock Display AOI
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsLocked(false);
                setActiveTool("lock-center");
              }}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-surface/90 hover:bg-canvas text-ink text-[11.5px] font-medium border border-line-strong shadow-md transition"
            >
              <Unlock size={12} /> Re-center
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
