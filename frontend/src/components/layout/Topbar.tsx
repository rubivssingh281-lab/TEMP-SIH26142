"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Home,
  Check,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Boxes,
  Search,
  LogOut,
  User,
  Shield,
  Settings,
  CreditCard,
  Briefcase,
  FolderPlus,
  X,
  Mail,
  Send,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { PROJECTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { logoutUser, useCurrentUser } from "@/lib/auth";

const CRUMBS: Record<string, string[]> = {
  "/dashboard": ["Projects", "Ladakh Border Infrastructure", "SR_v2", "Dashboard"],
  "/new-job": ["Projects", "Ladakh Border Infrastructure", "New Job"],
  "/queue": ["Projects", "Ladakh Border Infrastructure", "Processing Queue"],
  "/comparison": ["Projects", "Ladakh Border Infrastructure", "SR_v2", "Comparison Viewer"],
  "/validation": ["Projects", "Ladakh Border Infrastructure", "SR_v2", "Validation Reports"],
  "/projects": ["Projects", "Project History"],
  "/settings": ["Settings", "Account"],
};

export interface NotificationItem {
  id: string;
  type: "success" | "info" | "warning" | "alert";
  title: string;
  message: string;
  time: string;
  read: boolean;
  href: string;
  tag?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "success",
    title: "Job SR_v2_20240521 Completed",
    message: "Super-resolution ×4 completed (2.5 m/pixel) for Ladakh Border Infrastructure.",
    time: "5m ago",
    read: false,
    href: "/comparison?job=SR_v2_20240520_1030",
    tag: "Processing",
  },
  {
    id: "notif-2",
    type: "info",
    title: "GPU Worker Cluster Allocation",
    message: "High-priority queue active. 4x A100 GPUs assigned to regional satellite batch.",
    time: "24m ago",
    read: false,
    href: "/queue",
    tag: "Compute",
  },
  {
    id: "notif-3",
    type: "warning",
    title: "Cloud Cover Threshold Alert",
    message: "Scene B02/B04 detected 18% cloud cover. Auto-masking applied successfully.",
    time: "1h ago",
    read: false,
    href: "/validation?job=SR_v2_20240520_1030",
    tag: "Preprocessing",
  },
  {
    id: "notif-4",
    type: "success",
    title: "Validation Report Ready",
    message: "Quality validation report exported (PSNR: 34.2 dB, SSIM: 0.892).",
    time: "3h ago",
    read: true,
    href: "/validation?job=SR_v2_20240520_1030",
    tag: "Reports",
  },
  {
    id: "notif-5",
    type: "alert",
    title: "Storage Usage Warning",
    message: "2.41 TB of 10.0 TB consumed. 48 satellite jobs currently archived.",
    time: "1d ago",
    read: true,
    href: "/settings",
    tag: "System",
  },
];

type MenuType = "project" | "notifications" | "user" | null;

interface TopbarProps {
  onOpenMobileMenu?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function Topbar({ onOpenMobileMenu, sidebarCollapsed = false, onToggleSidebar }: TopbarProps) {
  const user = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const topbarRef = useRef<HTMLDivElement>(null);

  const [openMenu, setOpenMenu] = useState<MenuType>(null);
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0].name);
  const [projectSearch, setProjectSearch] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [notifTab, setNotifTab] = useState<"all" | "unread">("all");
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load live notifications from backend API
  const refreshNotifications = async () => {
    try {
      const data = await api.notifications.list();
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data);
      }
    } catch {
      // Keep existing local notifications
    }
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Load saved project preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("bhudristi_selected_project");
    if (saved) {
      const match = PROJECTS.find((p) => p.name === saved || p.id === saved);
      if (match) setSelectedProject(match.name);
    }
  }, []);

  // Close menus on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (topbarRef.current && !topbarRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  const key = Object.keys(CRUMBS).find((k) => pathname.startsWith(k)) ?? "/dashboard";
  const rawCrumbs = CRUMBS[key] ?? ["Projects", "Dashboard"];
  const crumbs = rawCrumbs.map((c) =>
    c === "Ladakh Border Infrastructure" ? selectedProject : c
  );

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return PROJECTS;
    const q = projectSearch.toLowerCase();
    return PROJECTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [projectSearch]);

  const filteredNotifications = useMemo(() => {
    if (notifTab === "unread") return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, notifTab]);

  const toggleMenu = (menu: MenuType) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
    if (menu === "notifications") {
      refreshNotifications();
    }
  };

  const handleSelectProject = (projectName: string) => {
    setSelectedProject(projectName);
    localStorage.setItem("bhudristi_selected_project", projectName);
    setOpenMenu(null);
    toast(`Active project switched to "${projectName}"`, "info");
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.notifications.markAllRead();
    } catch {}
    toast("All notifications marked as read", "success");
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    try {
      await api.notifications.markRead(item.id);
    } catch {}
    setOpenMenu(null);
    router.push(item.href);
  };

  const dismissNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.notifications.dismiss(id);
    } catch {}
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    setOpenMenu(null);
    try {
      await api.notifications.markAllRead();
    } catch {}
    toast("All notifications cleared", "info");
  };

  const handleTestSmtp = async () => {
    if (testingSmtp) return;
    setTestingSmtp(true);
    try {
      const res = await api.notifications.sendTest();
      toast(res.message || "Live SMTP test notification delivered!", "success");
      await refreshNotifications();
    } catch (e: any) {
      toast(e?.message || "Failed to dispatch test notification", "error");
    } finally {
      setTestingSmtp(false);
    }
  };


  return (
    <header
      ref={topbarRef}
      className="h-16 sm:h-[76px] shrink-0 sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-line flex items-center px-2.5 sm:px-3 gap-2 sm:gap-3"
    >
      {/* Mobile Hamburger button */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="lg:hidden p-2 -ml-1.5 rounded-lg text-ink-soft hover:bg-canvas hover:text-ink transition shrink-0 cursor-pointer"
        aria-label="Open navigation menu"
      >
        <Menu size={21} />
      </button>

      {/* Desktop Square Sidebar Collapse Toggle Button (Top-Left of Interface) */}
      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface hover:bg-canvas text-ink-soft hover:text-ink transition shrink-0 shadow-2xs cursor-pointer mr-1"
        >
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      )}

      {/* Mobile Current Page Title */}
      <div className="sm:hidden font-semibold text-[15px] text-ink truncate min-w-0 flex items-center gap-1.5">
        <Home size={15} className="text-muted shrink-0" />
        <span className="truncate">{crumbs[crumbs.length - 1]}</span>
      </div>

      {/* Desktop Breadcrumbs */}
      <nav className="hidden sm:flex items-center gap-2 text-[14px] min-w-0">
        <Home size={17} className="text-muted shrink-0" />
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-2 min-w-0">
              {i > 0 && <span className="text-line-strong">/</span>}
              <span className={last ? "text-primary font-semibold truncate" : "text-ink-soft truncate"}>
                {c}
              </span>
            </span>
          );
        })}
      </nav>

      {/* Right Action Controls */}
      <div className="ml-auto flex items-center gap-3">
        {/* 1. Project Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("project")}
            aria-expanded={openMenu === "project"}
            className={cn(
              "hidden sm:flex items-center gap-2 h-10 px-3.5 rounded-lg border text-[13.5px] transition select-none",
              openMenu === "project"
                ? "border-primary bg-primary-50/40 text-primary shadow-sm"
                : "border-line-strong text-ink-soft hover:bg-canvas hover:text-ink"
            )}
          >
            <span className="text-muted">Project:</span>
            <span className="text-ink font-medium max-w-[210px] truncate">{selectedProject}</span>
            <ChevronDown
              size={16}
              className={cn("text-muted transition-transform duration-200", openMenu === "project" && "rotate-180 text-primary")}
            />
          </button>

          {openMenu === "project" && (
            <div className="fixed inset-x-3 top-[68px] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full mt-1 sm:mt-2 w-auto sm:w-[380px] max-w-[calc(100vw-24px)] rounded-xl border border-line bg-surface shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-primary" />
                  <span className="text-[13.5px] font-semibold text-ink">Observation Projects</span>
                </div>
                <span className="text-[11px] text-muted">{PROJECTS.length} available</span>
              </div>

              {/* Search input */}
              <div className="relative mb-2.5">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="h-8 w-full rounded-md border border-line bg-canvas/60 pl-8 pr-2 text-[12px] text-ink outline-none focus:border-primary focus:bg-white transition"
                  autoFocus
                />
              </div>

              {/* Project list */}
              <div className="max-h-[250px] overflow-y-auto space-y-1 pr-1">
                {filteredProjects.map((p) => {
                  const isSelected = p.name === selectedProject;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProject(p.name)}
                      className={cn(
                        "w-full flex items-start gap-3 rounded-lg p-2.5 text-left transition group",
                        isSelected ? "bg-primary-50 text-primary font-medium shadow-xs" : "hover:bg-canvas text-ink-soft"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("text-[13px] font-medium truncate", isSelected ? "text-primary font-semibold" : "text-ink")}>
                            {p.name}
                          </span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider shrink-0",
                              p.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {p.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted truncate">
                          <span>{p.category}</span>
                          <span>•</span>
                          <span>{p.jobs} jobs</span>
                          <span>•</span>
                          <span>{p.total_area_km2} km²</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
                {filteredProjects.length === 0 && (
                  <div className="py-6 text-center text-[12px] text-muted">
                    No projects match &ldquo;{projectSearch}&rdquo;
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-2.5 pt-2.5 border-t border-line flex items-center justify-between text-[12px]">
                <Link
                  href="/projects"
                  onClick={() => setOpenMenu(null)}
                  className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
                >
                  <FolderPlus size={14} /> Create or Browse Projects
                </Link>
                <span className="text-[11px] text-muted">NTRO Space DB</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Notification Bell Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("notifications")}
            aria-expanded={openMenu === "notifications"}
            className={cn(
              "relative h-10 w-10 grid place-items-center rounded-lg transition select-none",
              openMenu === "notifications"
                ? "bg-primary-50 text-primary shadow-sm"
                : "hover:bg-canvas text-ink-soft"
            )}
            title="Notifications"
          >
            <Bell size={19} className={cn(openMenu === "notifications" ? "text-primary" : "text-ink-soft")} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-primary text-white text-[10px] font-semibold grid place-items-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {openMenu === "notifications" && (
            <div className="fixed inset-x-3 top-[68px] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full mt-1 sm:mt-2 w-auto sm:w-[420px] max-w-[calc(100vw-24px)] rounded-xl border border-line bg-surface shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-3.5 border-b border-line bg-canvas/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14.5px] font-semibold text-ink">Notifications</h3>
                    {unreadCount > 0 ? (
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {unreadCount} unread
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        All caught up
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestSmtp}
                      disabled={testingSmtp}
                      className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
                      title="Dispatch live SMTP test email via backend relay"
                    >
                      <Mail size={12} /> {testingSmtp ? "Sending…" : "Test SMTP"}
                    </button>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="inline-flex items-center gap-1 text-[11.5px] font-medium text-primary hover:underline"
                      >
                        <CheckCheck size={14} /> Mark all read
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setNotifTab("all")}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11.5px] font-medium transition",
                      notifTab === "all" ? "bg-white text-ink shadow-xs border border-line" : "text-muted hover:text-ink"
                    )}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifTab("unread")}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11.5px] font-medium transition",
                      notifTab === "unread" ? "bg-white text-ink shadow-xs border border-line" : "text-muted hover:text-ink"
                    )}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-[350px] overflow-y-auto divide-y divide-line">
                {filteredNotifications.map((n) => {
                  const Icon =
                    n.type === "success" ? CheckCircle2 :
                    n.type === "warning" ? AlertTriangle :
                    n.type === "alert" ? AlertOctagon : Boxes;
                  const iconStyle =
                    n.type === "success" ? "text-emerald-600 bg-emerald-50" :
                    n.type === "warning" ? "text-amber-600 bg-amber-50" :
                    n.type === "alert" ? "text-red-600 bg-red-50" : "text-primary bg-primary-50";

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "p-3.5 flex items-start gap-3 transition cursor-pointer hover:bg-canvas/60 relative group",
                        !n.read ? "bg-primary-50/15" : "bg-white"
                      )}
                    >
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", iconStyle)}>
                        <Icon size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("text-[12.5px] truncate", !n.read ? "font-semibold text-ink" : "font-medium text-slate-700")}>
                            {n.title}
                          </span>
                          <span className="text-[10.5px] text-muted shrink-0 whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="text-[11.5px] text-ink-soft mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        {n.tag && (
                          <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-canvas text-muted border border-line/60">
                            {n.tag}
                          </span>
                        )}
                      </div>

                      {/* Unread indicator & dismiss */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0 self-center">
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(n.id);
                          }}
                          className="text-muted hover:text-ink opacity-0 group-hover:opacity-100 transition p-1"
                          title="Dismiss"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredNotifications.length === 0 && (
                  <div className="py-10 text-center text-muted">
                    <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500 opacity-60" />
                    <p className="text-[13px] font-medium text-ink">No notifications</p>
                    <p className="text-[11px] text-muted mt-0.5">You are completely up to date.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 border-t border-line bg-canvas/30 flex items-center justify-between text-[11.5px]">
                <Link
                  href="/settings?tab=notifications"
                  onClick={() => setOpenMenu(null)}
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Settings size={13} /> Notification Preferences
                </Link>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="text-muted hover:text-danger transition"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("user")}
            aria-expanded={openMenu === "user"}
            className={cn(
              "flex items-center gap-2.5 pl-1.5 pr-2 rounded-lg transition py-1 text-left select-none",
              openMenu === "user" ? "bg-primary-50/50 shadow-sm" : "hover:bg-canvas"
            )}
          >
            <div className="h-9 w-9 rounded-full bg-primary text-white grid place-items-center text-[13px] font-semibold shrink-0 overflow-hidden ring-1 ring-primary/20">
              {mounted && user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span>{user.initials}</span>
              )}
            </div>
            <div className="hidden md:block leading-tight text-left">
              <div className="text-[13.5px] font-semibold text-ink">{user.name}</div>
              <div className="text-[12px] text-muted">{user.role}</div>
            </div>
            <ChevronDown
              size={16}
              className={cn("text-muted hidden md:block transition-transform duration-200", openMenu === "user" && "rotate-180 text-primary")}
            />
          </button>

          {openMenu === "user" && (
            <div className="fixed inset-x-3 top-[68px] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full mt-1 sm:mt-2 w-auto sm:w-72 max-w-[calc(100vw-24px)] rounded-xl border border-line bg-surface shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User Identity Card */}
              <div className="p-3 rounded-lg bg-canvas/60 border border-line mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary text-white grid place-items-center text-[14px] font-bold shrink-0 overflow-hidden ring-1 ring-primary/20">
                    {mounted && user.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{user.initials}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-ink truncate">{user.name}</div>
                    <div className="text-[11px] text-muted truncate">{user.email}</div>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{user.role || "Analyst"}</span>
                  <span className="text-muted font-mono">{user.clearance_level || "Level 3 Clearance"}</span>
                </div>
              </div>

              {/* Menu items */}
              <div className="space-y-0.5 text-[13px]">
                <Link
                  href="/settings?tab=account"
                  onClick={() => setOpenMenu(null)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink-soft hover:bg-canvas hover:text-ink transition"
                >
                  <User size={15} className="text-muted" />
                  <span>Account Profile</span>
                </Link>
                <Link
                  href="/settings?tab=security"
                  onClick={() => setOpenMenu(null)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink-soft hover:bg-canvas hover:text-ink transition"
                >
                  <Shield size={15} className="text-muted" />
                  <span>Security & Credentials</span>
                </Link>
                <Link
                  href="/settings?tab=billing"
                  onClick={() => setOpenMenu(null)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink-soft hover:bg-canvas hover:text-ink transition"
                >
                  <CreditCard size={15} className="text-muted" />
                  <span>Billing & Storage</span>
                  <span className="ml-auto text-[10px] text-muted bg-canvas px-1.5 py-0.5 rounded border border-line/60">
                    2.4 TB / 10 TB
                  </span>
                </Link>
                <Link
                  href="/settings?tab=model"
                  onClick={() => setOpenMenu(null)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-ink-soft hover:bg-canvas hover:text-ink transition"
                >
                  <Settings size={15} className="text-muted" />
                  <span>System Settings</span>
                </Link>
              </div>

              <div className="my-1.5 border-t border-line" />

              <button
                type="button"
                onClick={async () => {
                  setOpenMenu(null);
                  toast("Logging out of session...", "info");
                  await logoutUser();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-danger hover:bg-red-50/60 transition text-[13px] font-medium text-left cursor-pointer"
              >
                <LogOut size={15} />
                <span>Log Out Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

