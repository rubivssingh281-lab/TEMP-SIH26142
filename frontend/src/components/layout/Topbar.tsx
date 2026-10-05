"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronDown, Home } from "lucide-react";
import { CURRENT_USER } from "@/lib/mock-data";

const CRUMBS: Record<string, string[]> = {
  "/dashboard": ["Projects", "Ladakh Border Infrastructure", "SR_v2", "Dashboard"],
  "/new-job": ["Projects", "Ladakh Border Infrastructure", "New Job"],
  "/queue": ["Projects", "Ladakh Border Infrastructure", "Processing Queue"],
  "/comparison": ["Projects", "Ladakh Border Infrastructure", "SR_v2", "Comparison Viewer"],
  "/validation": ["Projects", "Ladakh Border Infrastructure", "SR_v2", "Validation Reports"],
  "/projects": ["Projects", "Project History"],
  "/settings": ["Settings", "Account"],
};

export function Topbar() {
  const pathname = usePathname();
  const key = Object.keys(CRUMBS).find((k) => pathname.startsWith(k)) ?? "/dashboard";
  const crumbs = CRUMBS[key];
  const showProjectSelector = key === "/dashboard";

  return (
    <header className="h-[76px] shrink-0 sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-line flex items-center px-6 gap-4">
      <nav className="flex items-center gap-2 text-[14px] min-w-0">
        <Home size={17} className="text-muted shrink-0" />
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-2 min-w-0">
              {i > 0 && <span className="text-line-strong">/</span>}
              <span className={last ? "text-primary font-semibold truncate" : "text-ink-soft truncate"}>{c}</span>
            </span>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {showProjectSelector && (
          <button className="hidden lg:flex items-center gap-2 h-10 px-3.5 rounded-lg border border-line-strong text-[13.5px] text-ink-soft hover:bg-canvas transition">
            <span className="text-muted">Project:</span>
            <span className="text-ink font-medium">Ladakh Border Infrastructure</span>
            <ChevronDown size={16} className="text-muted" />
          </button>
        )}

        <button className="relative h-10 w-10 grid place-items-center rounded-lg hover:bg-canvas transition">
          <Bell size={19} className="text-ink-soft" />
          <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary text-white text-[10px] font-semibold grid place-items-center">
            3
          </span>
        </button>

        <Link href="/settings" className="flex items-center gap-2.5 pl-1 pr-1 rounded-lg hover:bg-canvas transition py-1">
          <div className="h-9 w-9 rounded-full bg-primary text-white grid place-items-center text-[13px] font-semibold">
            {CURRENT_USER.initials}
          </div>
          <div className="hidden md:block leading-tight text-right">
            <div className="text-[13.5px] font-semibold text-ink">{CURRENT_USER.name}</div>
            <div className="text-[12px] text-muted">{CURRENT_USER.role}</div>
          </div>
          <ChevronDown size={16} className="text-muted hidden md:block" />
        </Link>
      </div>
    </header>
  );
}
