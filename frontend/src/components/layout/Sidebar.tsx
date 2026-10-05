"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  PlusSquare,
  SlidersHorizontal,
  Images,
  ClipboardList,
  History,
  Settings,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { CURRENT_USER } from "@/lib/mock-data";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/new-job", label: "New Enhancement Job", icon: PlusSquare },
  { href: "/queue", label: "Processing Queue", icon: SlidersHorizontal },
  { href: "/comparison", label: "Comparison Viewer", icon: Images },
  { href: "/validation", label: "Validation Reports", icon: ClipboardList },
  { href: "/projects", label: "Project History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="shrink-0 h-screen sticky top-0 w-[248px] bg-surface border-r border-line flex flex-col">
      <div className="h-[76px] flex items-center border-b border-line px-5">
        <Logo showText />
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 h-11 text-[14px] transition-colors",
                active
                  ? "bg-primary-50 text-primary font-semibold"
                  : "text-ink-soft hover:bg-canvas hover:text-ink"
              )}
            >
              {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-primary" />}
              <Icon size={19} strokeWidth={2} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <Link href="/settings" className="flex items-center gap-3 px-1 py-2 rounded-lg hover:bg-canvas transition-colors">
          <Avatar />
          <div className="min-w-0 leading-tight">
            <div className="text-[13.5px] font-semibold text-ink truncate">{CURRENT_USER.name}</div>
            <div className="text-[12px] text-muted truncate">{CURRENT_USER.role}</div>
          </div>
          <span className="ml-auto h-2.5 w-2.5 rounded-full bg-success-soft ring-2 ring-success-bg" />
        </Link>
      </div>
    </aside>
  );
}

function Avatar() {
  return (
    <div className="h-9 w-9 shrink-0 rounded-full bg-primary text-white grid place-items-center text-[13px] font-semibold">
      {CURRENT_USER.initials}
    </div>
  );
}
