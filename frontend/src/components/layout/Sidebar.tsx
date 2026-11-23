"use client";

import { useState, useEffect } from "react";
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
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useCurrentUser, type CurrentUserProfile } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/new-job", label: "New Enhancement Job", icon: PlusSquare },
  { href: "/queue", label: "Processing Queue", icon: SlidersHorizontal },
  { href: "/comparison", label: "Comparison Viewer", icon: Images },
  { href: "/validation", label: "Validation Reports", icon: ClipboardList },
  { href: "/projects", label: "Project History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  mobileOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const user = useCurrentUser();
  const pathname = usePathname();

  const renderNavLinks = (closeOnSelect = false) => {
    const isCollapsedNav = collapsed && !closeOnSelect;
    return (
      <nav className={cn("flex-1 overflow-y-auto py-4 space-y-1.5", isCollapsedNav ? "px-2.5" : "px-3")}>
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeOnSelect ? onClose : undefined}
              title={isCollapsedNav ? item.label : undefined}
              className={cn(
                "relative flex items-center rounded-lg transition-colors group select-none",
                isCollapsedNav
                  ? "justify-center h-11 w-11 mx-auto"
                  : "gap-3 px-3 h-11 text-[14px]",
                active
                  ? "bg-primary-50 text-primary font-semibold shadow-xs"
                  : "text-ink-soft hover:bg-canvas hover:text-ink"
              )}
            >
              {active && (
                <span
                  className={cn(
                    "absolute left-0 bg-primary rounded-r",
                    isCollapsedNav ? "top-2.5 bottom-2.5 w-[3px]" : "top-2 bottom-2 w-[3px]"
                  )}
                />
              )}
              <Icon size={19} strokeWidth={2} className="shrink-0" />
              {!isCollapsedNav && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    );
  };

  const renderUserFooter = (closeOnSelect = false) => {
    const isCollapsedFooter = collapsed && !closeOnSelect;
    return (
      <div className={cn("border-t border-line shrink-0", isCollapsedFooter ? "p-3 flex justify-center" : "p-3")}>
        <Link
          href="/settings"
          onClick={closeOnSelect ? onClose : undefined}
          title={isCollapsedFooter ? `${user.name} (${user.role})` : undefined}
          className={cn(
            "flex items-center rounded-lg hover:bg-canvas transition-colors",
            isCollapsedFooter ? "p-1 justify-center relative" : "gap-3 px-1 py-2"
          )}
        >
          <div className="relative">
            <Avatar user={user} />
            {isCollapsedFooter && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success-soft ring-2 ring-white" />
            )}
          </div>
          {!isCollapsedFooter && (
            <>
              <div className="min-w-0 leading-tight">
                <div className="text-[13.5px] font-semibold text-ink truncate">{user.name}</div>
                <div className="text-[12px] text-muted truncate">{user.role}</div>
              </div>
              <span className="ml-auto h-2.5 w-2.5 rounded-full bg-success-soft ring-2 ring-success-bg" />
            </>
          )}
        </Link>
      </div>
    );
  };

  return (
    <>
      {/* 1. Desktop Persistent Collapsible Sidebar (>= 1024px) */}
      <aside
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 h-screen bg-surface border-r border-line flex-col z-30 transition-[width] duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-[248px]"
        )}
      >
        <div
          className={cn(
            "h-16 sm:h-[76px] flex items-center border-b border-line shrink-0 transition-all duration-300",
            collapsed ? "justify-center px-2" : "justify-between px-4 sm:px-5"
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Logo showText={!collapsed} />
          </div>
          {onToggleCollapse && !collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="hidden lg:grid h-8 w-8 place-items-center rounded-lg border border-line bg-surface hover:bg-canvas text-ink-soft hover:text-ink transition shrink-0 shadow-2xs cursor-pointer"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>
        {renderNavLinks(false)}
        {renderUserFooter(false)}
      </aside>

      {/* 2. Mobile Slide-Over Drawer (< 1024px) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <aside className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-surface border-r border-line flex flex-col shadow-2xl z-50 animate-in slide-in-from-left duration-250">
            <div className="h-16 flex items-center justify-between border-b border-line px-5">
              <Logo showText />
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-ink-soft hover:bg-canvas hover:text-ink transition cursor-pointer"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            {renderNavLinks(true)}
            {renderUserFooter(true)}
          </aside>
        </div>
      )}
    </>
  );
}

function Avatar({ user }: { user: CurrentUserProfile }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="h-9 w-9 shrink-0 rounded-full bg-primary text-white grid place-items-center text-[13px] font-semibold overflow-hidden ring-1 ring-primary/20">
      {mounted && user.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        <span>{user.initials}</span>
      )}
    </div>
  );
}
