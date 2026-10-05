import { NextRequest, NextResponse } from "next/server";
import { PROJECTS } from "@/lib/mock-data";
import type { ProjectsResponse } from "@/lib/types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get("category");
  const q = (sp.get("q") ?? "").toLowerCase();
  const sort = sp.get("sort") ?? "recent";

  let projects = [...PROJECTS];
  if (category && category !== "All") {
    if (category === "Active") projects = projects.filter((p) => p.status === "active");
    else if (category === "Archived") projects = projects.filter((p) => p.status === "archived");
    else projects = projects.filter((p) => p.category === category);
  }
  if (q) projects = projects.filter((p) => p.name.toLowerCase().includes(q));
  if (sort === "name") projects.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "area") projects.sort((a, b) => b.total_area_km2 - a.total_area_km2);

  const body: ProjectsResponse = { projects, total: 58, page: 1 };
  return NextResponse.json(body);
}
