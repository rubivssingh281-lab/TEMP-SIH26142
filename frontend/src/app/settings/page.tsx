"use client";

import { useState, useMemo } from "react";
import {
  User,
  Users,
  Boxes,
  Code2,
  Database,
  Bell,
  ShieldCheck, Shield,
  CreditCard,
  Info,
  ChevronDown,
  CircleDashed,
  Network,
  Layers,
  CheckCircle2,
  Plus,
  Save,
  Satellite,
} from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { Card, Toggle, Checkbox, RatingChip, Button } from "@/components/ui/Primitives";
import { LoadingState, ErrorState } from "@/components/ui/PageState";
import type { ModelType } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Camera, Clock3, MapPin, Monitor, LogOut } from "lucide-react";

function InputField({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-slate-700">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange?.(e.target.value)} className="h-[42px] w-full rounded-[7px] border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 outline-none transition focus:border-[#D2691E] focus:ring-2 focus:ring-[#D2691E]/10" />

    </div>
  );
}

function SelectField({ label, value, options, onChange }: any) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-slate-700">{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className="h-[42px] w-full appearance-none rounded-[7px] border border-slate-200 bg-white px-3.5 pr-10 text-[13px] text-slate-800 outline-none transition focus:border-[#D2691E] focus:ring-2 focus:ring-[#D2691E]/10">
          {options.map((option: string) => (<option key={option}>{option}</option>))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
      </div>

    </div>
  );
}

function CustomToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button type="button" aria-pressed={enabled} onClick={onToggle} className={`relative h-6 w-11 rounded-full transition-all ${enabled ? "bg-emerald-600" : "bg-slate-300"}`}>
      <span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all ${enabled ? "left-[22px]" : "left-[3px]"}`} />
    </button>
  );
}

function SectionCard({ title, children, className = "" }: any) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.035)] ${className}`}>
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}


const SETTINGS_NAV = [
  { key: "account", label: "Account Profile", icon: User },
  { key: "team", label: "Team & Permissions", icon: Users },
  { key: "model", label: "Model Preferences", icon: Boxes },
  { key: "api", label: "API & Integrations", icon: Code2 },
  { key: "data", label: "Data Sources", icon: Database },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: ShieldCheck },
  { key: "billing", label: "Billing & Storage", icon: CreditCard },
];

const MODEL_ICONS: Record<ModelType, React.ElementType> = { gan: Boxes, diffusion: CircleDashed, transformer: Network, cnn: Layers };
const GPU_STEPS = [1, 2, 4, 8];
const GPU_LABELS = ["Low (1 GPU)", "Medium (2 GPU)", "High (4 GPU)", "Max (8 GPU)"];


import { ChevronRight, ChevronLeft, Search, Mail, X, Check, MoreVertical, UserRound, CircleCheck, Copy, ExternalLink, Eye, Link2, Pencil, Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal, Activity, Upload, Wifi, AlertTriangle, Cloud, MessageSquare, Smartphone, LogIn, LockKeyhole, Download, UserX, ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, PackageCheck, ReceiptText, Sparkles, WalletCards, HardDrive, Crown, Headphones, Infinity, Cpu } from "lucide-react";
import { downloadFile } from "@/lib/download";
import { toast, updateToast } from "@/components/ui/Toast";

/** Download an invoice as a generated PDF (parses the "₹ 1,24,560" string to a number). */
async function downloadInvoice(id: string, amountStr: string, date: string) {
  const amount = Number(amountStr.replace(/[^\d]/g, "")) || undefined;
  const t = toast(`Preparing invoice ${id}…`, "loading");
  try {
    await downloadFile(api.reports.invoice(id, amount, date), `invoice-${id}.pdf`);
    updateToast(t, `Invoice ${id} downloaded (PDF)`, "success");
  } catch (e) {
    updateToast(t, e instanceof Error ? e.message : "Download failed", "error");
  }
}

type Role = "Admin" | "Analyst" | "Viewer";
type Status = "Active" | "Pending Invite";

interface TeamMember {
  id: number;
  initials: string;
  name: string;
  email: string;
  role: Role;
  projects: string[];
  projectCount?: number;
  status: Status;
  lastActive: string;
  avatarColor: string;
}

const members: TeamMember[] = [
  { id: 1, initials: "AP", name: "Arjun Pratap", email: "arjun.pratap@ntro.gov.in", role: "Admin", projects: ["All Projects"], status: "Active", lastActive: "21 May 2024, 11:30 AM", avatarColor: "#D2691E" },
  { id: 2, initials: "PN", name: "Priya Nair", email: "priya.nair@ntro.gov.in", role: "Analyst", projects: ["Ladakh Border Infra"], projectCount: 3, status: "Active", lastActive: "20 May 2024, 04:15 PM", avatarColor: "#2878BE" },
  { id: 3, initials: "RM", name: "Rohan Mehta", email: "rohan.mehta@ntro.gov.in", role: "Analyst", projects: ["Arunachal Outposts"], projectCount: 2, status: "Active", lastActive: "19 May 2024, 09:40 AM", avatarColor: "#2878BE" },
  { id: 4, initials: "SI", name: "Sana Iqbal", email: "sana.iqbal@ntro.gov.in", role: "Viewer", projects: ["Siachen Glacier Study"], projectCount: 1, status: "Pending Invite", lastActive: "—", avatarColor: "#9CA3AF" },
];

function StatCard({ title, value, subtitle, icon, tone }: any) {
  const backgrounds: any = { orange: "bg-[#FFF1E9]", green: "bg-[#ECF9F3]", amber: "bg-[#FFF8E8]", red: "bg-[#FFF1F1]" };
  const iconColors: any = { orange: "#D2691E", green: "#12835A", amber: "#CA8700", red: "#D84040" };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-slate-600">{title}</p>
          <p className={`mt-2 text-[25px] font-semibold tracking-[-0.03em] ${tone === "green" ? "text-emerald-700" : tone === "amber" ? "text-amber-600" : tone === "red" ? "text-red-600" : "text-slate-950"}`}>{value}</p>
          <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${backgrounds[tone]}`} style={{ color: iconColors[tone] }}>
          {icon}
        </div>
      </div>

    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const styles: any = { Admin: "bg-[#FFF0E9] text-[#D2691E]", Analyst: "bg-[#EDF4FC] text-[#1763A6]", Viewer: "bg-slate-100 text-slate-600" };
  return <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold ${styles[role]}`}>{role}</span>;
}

function StatusBadgeTeam({ status }: { status: Status }) {
  const active = status === "Active";
  return (
    <span className={`inline-flex items-center gap-2 text-[12px] font-medium ${active ? "text-emerald-700" : "text-amber-600"}`}>
      <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-600" : "bg-amber-500"}`} />
      {status}
    </span>
  );
}

function ProjectAccess({ projects, projectCount }: { projects: string[]; projectCount?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {projects.map((project) => (
        <span key={project} className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${project === "All Projects" ? "bg-[#EAF7F1] text-emerald-700" : "bg-slate-100 text-slate-700"}`}>{project}</span>
      ))}
      {projectCount && projectCount > projects.length && (
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">+{projectCount - projects.length} more</span>
      )}

    </div>
  );
}

function PermissionIcon({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-600 text-emerald-600"><Check size={12} strokeWidth={2.5} /></span>
  ) : (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-red-400 text-red-500"><X size={12} strokeWidth={2.5} /></span>
  );
}


type APIKey = { id: number; name: string; prefix: string; suffix: string; created: string; lastUsed: string; status: "Active" | "Revoked"; };
type WebhookItem = { id: number; name: string; endpoint: string; events: string[]; enabled: boolean; };
type Integration = { id: string; name: string; shortName: string; description: string; connected: boolean; type: "copernicus" | "sentinel" | "slack" | "teams" | "aws" | "gcp"; };

const apiKeysList: APIKey[] = [
  { id: 1, name: "Production Key", prefix: "tsa_live_", suffix: "8f2a", created: "12 May 2024", lastUsed: "21 May 2024, 11:20 AM", status: "Active" },
  { id: 2, name: "Dev/Testing Key", prefix: "tsa_dev_", suffix: "7c9b", created: "03 Apr 2024", lastUsed: "18 May 2024, 04:45 AM", status: "Active" },
];

const initialWebhooks: WebhookItem[] = [
  { id: 1, name: "Job Completion Notifier", endpoint: "https://api.client.gov.in/webhook/...", events: ["job.completed", "job.failed"], enabled: true },
  { id: 2, name: "Failure Alert Webhook", endpoint: "https://alerts.client.gov.in/hook/...", events: ["job.failed"], enabled: true },
  { id: 3, name: "Usage Report Webhook", endpoint: "https://reports.client.gov.in/webhook/...", events: ["usage.daily"], enabled: false },
];

const integrations: Integration[] = [
  { id: "copernicus", name: "Copernicus Data Space Ecosystem", shortName: "CDSE", description: "Sentinel-1, Sentinel-2, Sentinel-3", connected: true, type: "copernicus" },
  { id: "sentinel", name: "Sentinel Hub API", shortName: "SH", description: "High-resolution imagery & processing", connected: true, type: "sentinel" },
  { id: "slack", name: "Slack Notifications", shortName: "S", description: "Job and system notifications", connected: false, type: "slack" },
  { id: "teams", name: "Microsoft Teams", shortName: "T", description: "Team notifications & collaboration", connected: false, type: "teams" },
  { id: "aws", name: "AWS S3 Storage", shortName: "aws", description: "Object storage & exports", connected: true, type: "aws" },
  { id: "gcp", name: "Google Cloud Storage", shortName: "G", description: "Cloud storage & backups", connected: false, type: "gcp" },
];

function IntegrationLogo({ type }: { type: Integration["type"] }) {
  const styles: any = {
    copernicus: { bg: "#EDF4FC", fg: "#215E9B", text: "C" },
    sentinel: { bg: "#F1F8E9", fg: "#729A14", text: "◆" },
    slack: { bg: "#FFF1F5", fg: "#D94673", text: "✣" },
    teams: { bg: "#EEF2FF", fg: "#4F46A5", text: "T" },
    aws: { bg: "#FFF5E8", fg: "#7C5800", text: "aws" },
    gcp: { bg: "#EEF5FF", fg: "#4285F4", text: "G" },
  };
  const style = styles[type];
  return <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold" style={{ backgroundColor: style.bg, color: style.fg }}>{style.text}</div>;
}

function StatusBadgeApi({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
      <CircleCheck size={12} />{children}
    </span>
  );
}

function WebhookEventTag({ event }: { event: string }) {
  return <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{event}</span>;
}


type ProviderStatus = "Connected" | "Not Connected";
type SatelliteProvider = { id: number; name: string; shortLabel: string; logoType: "copernicus" | "sentinel" | "planet" | "maxar"; status: ProviderStatus; collections: string[]; lastSync: string; };
type ReferenceDataset = { id: number; name: string; region: string; size: string; coverage: string; uploadDate: string; image: string; };
type StorageConnection = { id: number; provider: "aws" | "gcp"; name: string; bucket: string; region: string; status: ProviderStatus; used: string; capacity: string; usagePercent: number; };

const providers: SatelliteProvider[] = [
  { id: 1, name: "Copernicus Data Space Ecosystem", shortLabel: "CDSE", logoType: "copernicus", status: "Connected", collections: ["Sentinel-1", "Sentinel-2", "Sentinel-3", "+2"], lastSync: "21 May 2024, 08:45 AM" },
  { id: 2, name: "Sentinel Hub API", shortLabel: "SH", logoType: "sentinel", status: "Connected", collections: ["Sentinel-2", "Landsat 8/9", "MODIS", "+3"], lastSync: "21 May 2024, 09:15 AM" },
  { id: 3, name: "Planet Labs (PlanetScope)", shortLabel: "planet", logoType: "planet", status: "Connected", collections: ["PlanetScope 3m", "SkySat", "RapidEye"], lastSync: "20 May 2024, 10:30 PM" },
  { id: 4, name: "Maxar Open Data", shortLabel: "MAXAR", logoType: "maxar", status: "Not Connected", collections: ["WorldView", "GeoEye", "DigitalGlobe"], lastSync: "—" },
];

const datasets: ReferenceDataset[] = [
  { id: 1, name: "PlanetScope 3m Reference", region: "Ladakh Region", size: "245 GB", coverage: "15,420 km²", uploadDate: "18 May 2024", image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=300&q=80" },
  { id: 2, name: "Aerial Survey 2023", region: "Northern Border", size: "512 GB", coverage: "22,830 km²", uploadDate: "10 Apr 2024", image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=300&q=80" },
  { id: 3, name: "Drone Imagery", region: "Siachen Sector", size: "128 GB", coverage: "3,250 km²", uploadDate: "05 Mar 2024", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80" },
];

const initialStorageConnections: StorageConnection[] = [
  { id: 1, provider: "aws", name: "AWS S3 Bucket", bucket: "ts-atlas-data-prod", region: "ap-south-1", status: "Connected", used: "2.48 TB", capacity: "5 TB", usagePercent: 50 },
  { id: 2, provider: "gcp", name: "Google Cloud Storage", bucket: "ts-atlas-gcs", region: "asia-south1", status: "Not Connected", used: "—", capacity: "—", usagePercent: 0 },
];

function ProviderLogo({ type }: { type: SatelliteProvider["logoType"] }) {
  if (type === "copernicus") return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF5FD] text-[16px] font-bold text-[#2263A0]">C</div>;
  if (type === "sentinel") return <div className="flex h-8 w-8 items-center justify-center text-[22px] font-bold text-[#82A61B]">◆</div>;
  if (type === "planet") return <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-400 text-[9px] font-semibold text-slate-600">planet</div>;
  return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-[7px] font-bold text-white">MAXAR</div>;
}

function StatusBadgeData({ status }: { status: ProviderStatus }) {
  if (status === "Connected") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100"><Check size={10} strokeWidth={2.5} /></span>
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
      <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Not Connected
    </span>
  );
}

function CollectionTag({ label }: { label: string }) {
  return <span className={`inline-flex rounded-md px-2 py-1 text-[9px] font-medium ${label.startsWith("+") ? "bg-slate-100 text-slate-500" : "bg-slate-100 text-slate-700"}`}>{label}</span>;
}

function SwitchData({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button type="button" aria-pressed={enabled} onClick={onChange} className={`relative h-5 w-9 rounded-full transition ${enabled ? "bg-[#D2691E]" : "bg-slate-300"}`}>
      <span className={`absolute top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? "left-[18px]" : "left-[2px]"}`} />
    </button>
  );
}

function StorageLogo({ provider }: { provider: StorageConnection["provider"] }) {
  if (provider === "aws") return <div className="text-[20px] font-semibold tracking-tight text-[#252F3E]">aws</div>;
  return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF5FF] text-lg font-semibold text-[#4285F4]">G</div>;
}


type Channel = "email" | "inApp" | "sms";
type AlertRule = { id: string; label: string; email: boolean; inApp: boolean; sms: boolean; };

const initialJobAlerts: AlertRule[] = [
  { id: "job-completed", label: "Job Completed", email: true, inApp: true, sms: false },
  { id: "job-failed", label: "Job Failed", email: true, inApp: true, sms: true },
  { id: "processing-delayed", label: "Processing Delayed", email: true, inApp: true, sms: false },
  { id: "validation-ready", label: "Validation Report Ready", email: true, inApp: true, sms: false },
  { id: "storage-threshold", label: "Storage Threshold Reached (90%)", email: true, inApp: false, sms: true },
  { id: "gpu-change", label: "GPU Cluster Status Change", email: true, inApp: true, sms: true },
];

const initialTeamAlerts: AlertRule[] = [
  { id: "team-invite", label: "New Team Member Invited", email: true, inApp: true, sms: false },
  { id: "role-changed", label: "Role/Permission Changed", email: true, inApp: true, sms: false },
  { id: "project-comment", label: "New Comment on Project", email: false, inApp: true, sms: false },
  { id: "new-device", label: "Security Login from New Device", email: true, inApp: true, sms: true },
];

function ToggleNotification({ enabled, onChange }: { enabled: boolean; onChange: () => void; }) {
  return (
    <button type="button" aria-pressed={enabled} onClick={onChange} className={`relative h-[22px] w-[40px] rounded-full transition-colors ${enabled ? "bg-emerald-600" : "bg-slate-300"}`}>
      <span className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-all ${enabled ? "left-[21px]" : "left-[3px]"}`} />
    </button>
  );
}

function ChannelCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void; }) {
  return (
    <button type="button" aria-pressed={checked} onClick={onChange} className={`flex h-[17px] w-[17px] items-center justify-center rounded-[3px] border transition ${checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"}`}>
      {checked && <Check size={11} strokeWidth={3} />}
    </button>
  );
}

function AlertMatrix({ title, rules, onToggle }: { title: string; rules: AlertRule[]; onToggle: (ruleId: string, channel: Channel) => void; }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
      <div className="border-b border-slate-100 px-4 py-4"><h2 className="text-[14px] font-semibold text-slate-900">{title}</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-600">Event</th>
              <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-slate-600"><span className="inline-flex items-center gap-1"><Mail size={13} /> Email</span></th>
              <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-slate-600"><span className="inline-flex items-center gap-1"><Bell size={13} /> In-App</span></th>
              <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-slate-600"><span className="inline-flex items-center gap-1"><Smartphone size={13} /> SMS</span></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-t border-slate-100">
                <td className="px-3 py-3 text-[11px] font-medium text-slate-700">{rule.label}</td>
                <td className="px-3 py-3"><div className="flex justify-center"><ChannelCheckbox checked={rule.email} onChange={() => onToggle(rule.id, "email")} /></div></td>
                <td className="px-3 py-3"><div className="flex justify-center"><ChannelCheckbox checked={rule.inApp} onChange={() => onToggle(rule.id, "inApp")} /></div></td>
                <td className="px-3 py-3"><div className="flex justify-center"><ChannelCheckbox checked={rule.sms} onChange={() => onToggle(rule.id, "sms")} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


type Session = { id: number; device: string; platform: string; location: string; ip: string; lastActive: string; current?: boolean; };
type LoginRecord = { id: number; timestamp: string; device: string; location: string; ip: string; success: boolean; };

const initialSessions: Session[] = [
  { id: 1, device: "Chrome on Windows", platform: "Windows 11", location: "New Delhi, IN", ip: "103.***.**.45", lastActive: "21 May 2024, 11:30 AM", current: true },
  { id: 2, device: "Mobile App - Android", platform: "Android 13", location: "New Delhi, IN", ip: "103.***.**.67", lastActive: "21 May 2024, 09:15 AM" },
  { id: 3, device: "Edge on Windows", platform: "Windows 10", location: "Bengaluru, IN", ip: "106.***.**.12", lastActive: "20 May 2024, 07:42 PM" },
  { id: 4, device: "Safari on iPad", platform: "iPadOS 17", location: "New Delhi, IN", ip: "103.***.**.89", lastActive: "18 May 2024, 08:10 PM" },
];

const initialLoginHistory: LoginRecord[] = [
  { id: 1, timestamp: "21 May 2024, 11:30 AM", device: "Chrome on Windows", location: "New Delhi, IN", ip: "103.***.**.45", success: true },
  { id: 2, timestamp: "21 May 2024, 09:15 AM", device: "Mobile App - Android", location: "New Delhi, IN", ip: "103.***.**.67", success: true },
  { id: 3, timestamp: "20 May 2024, 07:42 PM", device: "Edge on Windows", location: "Bengaluru, IN", ip: "106.***.**.12", success: true },
  { id: 4, timestamp: "20 May 2024, 01:18 PM", device: "Chrome on Windows", location: "Mumbai, IN", ip: "106.***.**.55", success: false },
  { id: 5, timestamp: "19 May 2024, 10:05 AM", device: "Safari on iPad", location: "New Delhi, IN", ip: "103.***.**.89", success: true },
];



function ToggleSecurity({ enabled, onChange }: { enabled: boolean; onChange: () => void; }) {
  return (
    <button type="button" aria-pressed={enabled} onClick={onChange} className={`relative h-[22px] w-[40px] rounded-full transition-colors ${enabled ? "bg-emerald-600" : "bg-slate-300"}`}>
      <span className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-all ${enabled ? "left-[21px]" : "left-[3px]"}`} />
    </button>
  );
}


type StorageItem = { id: number; project: string; storage: string; percentage: number; tone: "orange" | "teal" | "amber" | "gray"; };
type Invoice = { id: string; date: string; amount: string; status: "Paid" | "Pending" | "Overdue"; };

const storageProjects: StorageItem[] = [
  { id: 1, project: "Ladakh Border Infrastructure", storage: "1.18 TB", percentage: 48.9, tone: "orange" },
  { id: 2, project: "Arunachal Outposts", storage: "0.72 TB", percentage: 29.9, tone: "teal" },
  { id: 3, project: "Siachen Glacier Study", storage: "0.31 TB", percentage: 12.9, tone: "amber" },
  { id: 4, project: "Punjab Crop Monitoring", storage: "0.20 TB", percentage: 8.3, tone: "gray" },
];

const invoices: Invoice[] = [
  { id: "INV-2024-00045", date: "01 May 2024", amount: "₹ 1,24,560", status: "Paid" },
  { id: "INV-2024-00038", date: "01 Apr 2024", amount: "₹ 1,18,340", status: "Paid" },
  { id: "INV-2024-00031", date: "01 Mar 2024", amount: "₹ 1,05,870", status: "Paid" },
];

const computeData = [18, 32, 24, 16, 41, 35, 28, 22, 50, 38, 26, 45, 30, 20, 54, 43, 29, 34, 48, 39, 24, 31, 46, 52, 40];

const monthlyHistory = [
  { month: "Dec 2023", compute: 120, storage: 1.0 },
  { month: "Jan 2024", compute: 185, storage: 1.4 },
  { month: "Feb 2024", compute: 220, storage: 1.9 },
  { month: "Mar 2024", compute: 268, storage: 2.3 },
  { month: "Apr 2024", compute: 255, storage: 2.8 },
  { month: "May 2024", compute: 305, storage: 3.2 },
];

function PaidBadge({ status }: { status: Invoice["status"]; }) {
  if (status === "Paid") { return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700"><Check size={11} /> Paid</span>; }
  if (status === "Pending") { return <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">Pending</span>; }
  return <span className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600">Overdue</span>;
}

function UsageDonut() {
  const radius = 43; const circumference = 2 * Math.PI * radius; const used = 24.1; const progress = (used / 100) * circumference;
  return (
    <div className="relative h-[125px] w-[125px] shrink-0">
      <svg width="125" height="125" viewBox="0 0 125 125" className="-rotate-90">
        <circle cx="62.5" cy="62.5" r={radius} fill="none" stroke="#E8EDF0" strokeWidth="12" />
        <circle cx="62.5" cy="62.5" r={radius} fill="none" stroke="#D2691E" strokeWidth="12" strokeDasharray={`${progress * 0.46} ${circumference}`} strokeDashoffset="0" />
        <circle cx="62.5" cy="62.5" r={radius} fill="none" stroke="#148C78" strokeWidth="12" strokeDasharray={`${progress * 0.32} ${circumference}`} strokeDashoffset={-progress * 0.46} />
        <circle cx="62.5" cy="62.5" r={radius} fill="none" stroke="#E4A52E" strokeWidth="12" strokeDasharray={`${progress * 0.13} ${circumference}`} strokeDashoffset={-progress * 0.78} />
        <circle cx="62.5" cy="62.5" r={radius} fill="none" stroke="#A7ADB3" strokeWidth="12" strokeDasharray={`${progress * 0.09} ${circumference}`} strokeDashoffset={-progress * 0.91} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-[18px] font-semibold text-slate-900">2.41 TB</span><span className="text-[9px] text-slate-500">of 10 TB used</span></div>
    </div>
  );
}

function ArrowRightIcon() { return <span className="text-[14px] leading-none">→</span>; }

export default function SettingsPage() {






  const { data, error, loading } = useFetch(() => api.getSettings());
  const [nav, setNav] = useState("model");
  const [model, setModel] = useState<ModelType>("gan");
  const [bands, setBands] = useState({ rgb: true, nir: true, swir: false });
  const [cloudMask, setCloudMask] = useState(true);
  const [uncertainty, setUncertainty] = useState(true);
  const [gpuIdx, setGpuIdx] = useState(1);
  const [priority, setPriority] = useState<"standard" | "high">("standard");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState("Arjun Pratap");
  const [email, setEmail] = useState("arjun.pratap@ntro.gov.in");
  const [role, setRole] = useState("NTRO Analyst");
  const [department, setDepartment] = useState("Space Technology");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [darkMode, setDarkMode] = useState(false);
  const [emailDigest, setEmailDigest] = useState("Daily");
  const [landingPage, setLandingPage] = useState("Dashboard");
  const [timezone, setTimezone] = useState("(GMT+05:30) Asia/Kolkata (IST)");
  const ORANGE = "#D2691E";

  const [savedBilling, setSavedBilling] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  const totalStorage = 2.41;
  const storageLimit = 10;
  const storagePercentage = ((totalStorage / storageLimit) * 100).toFixed(1);
  const computedBars = useMemo(() => computeData, []);
  const maxCompute = Math.max(...monthlyHistory.map((x) => x.compute));
  const maxStorage = Math.max(...monthlyHistory.map((x) => x.storage));

  const handleSaveBilling = () => {
    setSavedBilling(true);
    setTimeout(() => { setSavedBilling(false); }, 2200);
  };


  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [loginHistory] = useState<LoginRecord[]>(initialLoginHistory);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [restrictNetwork, setRestrictNetwork] = useState(true);
  const [clearanceVerification, setClearanceVerification] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30 min");
  const [savedSecurity, setSavedSecurity] = useState(false);

  const handleLogoutSession = (id: number) => { setSessions((current) => current.filter((session) => session.id !== id)); };
  const handleLogoutOthers = () => { setSessions((current) => current.filter((session) => session.current)); };
  const handleSaveSecurity = () => {
    console.log({ twoFactorEnabled, restrictNetwork, clearanceVerification, sessionTimeout });
    setSavedSecurity(true);
    setTimeout(() => { setSavedSecurity(false); }, 2200);
  };


  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [jobAlerts, setJobAlerts] = useState<AlertRule[]>(initialJobAlerts);
  const [teamAlerts, setTeamAlerts] = useState<AlertRule[]>(initialTeamAlerts);
  const [frequency, setFrequency] = useState("Real-time");
  const [quietHours, setQuietHours] = useState(true);
  const [quietStart, setQuietStart] = useState("10:00 PM");
  const [quietEnd, setQuietEnd] = useState("07:00 AM");
  const [previewChannel, setPreviewChannel] = useState<"In-App" | "Email" | "SMS">("In-App");
  const [savedNotifications, setSavedNotifications] = useState(false);

  const toggleRule = (setter: React.Dispatch<React.SetStateAction<AlertRule[]>>, ruleId: string, channel: Channel) => {
    setter((current) => current.map((rule) => rule.id === ruleId ? { ...rule, [channel]: !rule[channel] } : rule));
  };
  const handleSaveNotifications = () => {
    const preferences = { channels: { email: emailEnabled, inApp: inAppEnabled, sms: smsEnabled }, jobAlerts, teamAlerts, frequency, quietHours, quietStart, quietEnd };
    console.log("Notification preferences:", preferences);
    setSavedNotifications(true);
    setTimeout(() => { setSavedNotifications(false); }, 2500);
  };


  const [providerList, setProviderList] = useState(providers);
  const [storageConnections, setStorageConnections] = useState(initialStorageConnections);
  const [autoSync, setAutoSync] = useState(true);
  const [notifyFailure, setNotifyFailure] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState("Daily");
  const [cloudThreshold, setCloudThreshold] = useState(20);
  const [searchData, setSearchData] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [sourceType, setSourceType] = useState("Satellite Imagery Provider");

  const connectedCount = providerList.filter((provider) => provider.status === "Connected").length;
  const disconnectedCount = providerList.length - connectedCount;

  const filteredProviders = useMemo(() => {
    if (!searchData.trim()) return providerList;
    const q = searchData.toLowerCase();
    return providerList.filter((provider) => provider.name.toLowerCase().includes(q) || provider.collections.some((collection) => collection.toLowerCase().includes(q)));
  }, [searchData, providerList]);

  const handleConnectProvider = (id: number) => {
    setProviderList((current) => current.map((provider) => provider.id === id ? { ...provider, status: "Connected", lastSync: "Just connected" } : provider));
    setMenuOpen(null);
  };
  const handleDisconnectProvider = (id: number) => {
    setProviderList((current) => current.map((provider) => provider.id === id ? { ...provider, status: "Not Connected", lastSync: "—" } : provider));
    setMenuOpen(null);
  };
  const handleAddSource = () => {
    if (!sourceName.trim()) return;
    const newProvider: SatelliteProvider = { id: Date.now(), name: sourceName, shortLabel: "NEW", logoType: "sentinel", status: "Connected", collections: ["Custom Collection"], lastSync: "Just connected" };
    setProviderList((current) => [...current, newProvider]);
    setSourceName("");
    setSourceType("Satellite Imagery Provider");
    setShowAddSourceModal(false);
  };
  const handleSaveChangesData = () => { alert("Data source settings saved."); };


  const [keys, setKeys] = useState(apiKeysList);
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [revealedKeys, setRevealedKeys] = useState<number[]>([]);
  const [copiedKey, setCopiedKey] = useState<number | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newWebhookName, setNewWebhookName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [showActionId, setShowActionId] = useState<string | null>(null);

  const totalCalls = 12450;
  const quota = 25000;
  const usagePercentage = Math.round((totalCalls / quota) * 100);

  const usageBars = useMemo(
    () => [ 310, 430, 520, 640, 420, 820, 990, 410, 380, 1050, 760, 610, 920, 300, 500, 420, 880, 990, 620, 530, 800, 970, 490, 330, 720, 610, 450, 280, 390, 470 ],
    []
  );

  const toggleWebhook = (id: number) => { setWebhooks((current) => current.map((webhook) => webhook.id === id ? { ...webhook, enabled: !webhook.enabled } : webhook )); };
  const deleteWebhook = (id: number) => { setWebhooks((current) => current.filter((webhook) => webhook.id !== id)); setShowActionId(null); };
  const revokeKey = (id: number) => { setKeys((current) => current.map((key) => key.id === id ? { ...key, status: "Revoked" } : key )); setShowActionId(null); };
  const revealKey = (id: number) => { setRevealedKeys((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id] ); };

  const copyKey = async (key: APIKey) => {
    const value = `${key.prefix}••••••••••••${key.suffix}`;
    try { await navigator.clipboard.writeText(value); setCopiedKey(key.id); setTimeout(() => { setCopiedKey(null); }, 1500); } catch { console.log("Clipboard unavailable"); }
  };

  const generateApiKey = () => {
    if (!newKeyName.trim()) return;
    const generated: APIKey = { id: Date.now(), name: newKeyName, prefix: "tsa_new_", suffix: Math.random().toString(16).slice(2, 6), created: "21 May 2024", lastUsed: "Never", status: "Active" };
    setKeys((current) => [...current, generated]);
    setNewKeyName("");
    setShowGenerateModal(false);
  };

  const addWebhook = () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) return;
    setWebhooks((current) => [ ...current, { id: Date.now(), name: newWebhookName, endpoint: newWebhookUrl, events: ["job.completed"], enabled: true } ]);
    setNewWebhookName("");
    setNewWebhookUrl("");
    setShowWebhookModal(false);
  };


  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All Roles" | Role>("All Roles");
  const [page, setPage] = useState(1);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase()) || member.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "All Roles" || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [search, roleFilter]);

  const PRIMARY_ORANGE = "#D2691E";



  if (loading) return <div className="p-6"><LoadingState /></div>;
  if (error) return <div className="p-6"><ErrorState error={error} /></div>;
  if (!data) return null;

  async function save() {
    setSaving(true);
    try {
      await api.saveSettings({ default_model: model, gpu_allocation: GPU_STEPS[gpuIdx], priority });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
        {/* Settings sub-nav */}
        <Card className="p-2 h-fit">
          {SETTINGS_NAV.map((n) => {
            const Icon = n.icon;
            const active = nav === n.key;
            return (
              <button key={n.key} onClick={() => setNav(n.key)}
                className={cn("relative w-full flex items-center gap-3 rounded-lg px-3 h-11 text-[14px] transition",
                  active ? "bg-primary-50 text-primary font-semibold" : "text-ink-soft hover:bg-canvas")}>
                {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-primary" />}
                <Icon size={18} /> {n.label}
              </button>
            );
          })}
        </Card>

        {/* Content */}
        <div className="space-y-5">

          {nav === "billing" && (
            <section className="min-w-0">
              <div className="mb-5">
                <h1 className="text-[27px] font-semibold tracking-[-0.03em] text-slate-950">Billing & Storage</h1>
                <p className="mt-1 text-[13px] text-slate-500">Manage your subscription plan, usage, and storage</p>
              </div>

              {/* CURRENT PLAN */}
              <SectionCard title="Current Plan">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#FFF1EA] text-[#D2691E]"><Crown size={25} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-[16px] font-semibold text-slate-900">Enterprise - Government Tier</h3>
                        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Active</span>
                      </div>
                      <div className="mt-3">
                        <div className="mb-2 text-[10px] font-medium text-slate-500">Plan Inclusions</div>
                        <div className="flex flex-wrap gap-5">
                          <div className="flex items-center gap-2">
                            <HardDrive size={15} className="text-slate-600" />
                            <div><div className="text-[11px] font-semibold">10 TB</div><div className="text-[9px] text-slate-500">Storage</div></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Cpu size={15} className="text-slate-600" />
                            <div><div className="text-[11px] font-semibold">8 GPU</div><div className="text-[9px] text-slate-500">Cluster Access</div></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Infinity size={15} className="text-slate-600" />
                            <div><div className="text-[11px] font-semibold">Unlimited</div><div className="text-[9px] text-slate-500">Jobs</div></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Headphones size={15} className="text-slate-600" />
                            <div><div className="text-[11px] font-semibold">Priority</div><div className="text-[9px] text-slate-500">Support</div></div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-[10px]">
                        <span className="font-semibold text-slate-700">Renewal Date</span>
                        <CalendarDays size={13} className="text-slate-500" />
                        <span className="font-medium">31 May 2025</span>
                        <span className="text-slate-400">(32 days remaining)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 xl:w-[205px]">
                    <button type="button" onClick={() => setPlanOpen(true)} className="h-[38px] rounded-md border border-[#D2691E] bg-white text-[11px] font-semibold text-[#D2691E] hover:bg-[#FFF5EF]">Change Plan</button>
                    <button type="button" onClick={() => setContactOpen(true)} className="h-[38px] rounded-md border border-slate-300 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50">Contact Account Manager</button>
                  </div>
                </div>
              </SectionCard>

              {/* METRICS ROW */}
              <div className="mt-4 grid gap-4 xl:grid-cols-[1.18fr_1fr_0.9fr]">
                <SectionCard title="Storage Used">
                  <div className="flex items-center gap-5">
                    <UsageDonut />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-[10px]"><span className="h-2 w-2 rounded-full bg-[#D2691E]" />Raw Imagery</span>
                        <span className="text-[10px] font-medium">1.12 TB (46%)</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-[10px]"><span className="h-2 w-2 rounded-full bg-[#148C78]" />Processed Outputs</span>
                        <span className="text-[10px] font-medium">0.78 TB (32%)</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-[10px]"><span className="h-2 w-2 rounded-full bg-[#E4A52E]" />Validation Datasets</span>
                        <span className="text-[10px] font-medium">0.31 TB (13%)</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-[10px]"><span className="h-2 w-2 rounded-full bg-[#A7ADB3]" />Backups</span>
                        <span className="text-[10px] font-medium">0.20 TB (9%)</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-[10px] font-medium text-teal-700">{storagePercentage}% of total storage used</div>
                </SectionCard>

                <SectionCard title="Compute Hours Used This Month">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[25px] font-semibold tracking-[-0.03em]">186.4 <span className="text-[14px] font-medium text-slate-500">hrs</span></div>
                      <div className="mt-1 text-[10px] text-slate-500">of 400 hrs quota</div>
                      <div className="mt-1 text-[11px] font-semibold text-teal-700">46.6% used</div>
                    </div>
                    <div className="flex h-[100px] items-end gap-[4px] border-b border-slate-200 px-1">
                      {computedBars.slice(0, 12).map((bar, index) => (
                        <div key={`${bar}-${index}`} className="w-[6px] rounded-t-[2px] bg-teal-600" style={{ height: `${Math.max(8, bar * 1.4)}px` }} />
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between text-[8px] text-slate-400">
                    <span>Apr 21</span><span>Apr 28</span><span>May 5</span><span>May 12</span><span>May 19</span>
                  </div>
                </SectionCard>

                <SectionCard title="Estimated Monthly Cost">
                  <div>
                    <div className="text-[27px] font-semibold tracking-[-0.035em] text-slate-950">₹ 1,24,560</div>
                    <p className="mt-1 text-[10px] text-slate-500">Estimated for May 2024</p>
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700">
                      <ArrowDownRight size={13} /> 12.6% vs last month
                    </div>
                    <button type="button" className="mt-5 flex items-center gap-2 text-[10px] font-semibold text-[#D2691E] hover:underline">
                      View Cost Breakdown <ArrowRightIcon />
                    </button>
                  </div>
                </SectionCard>
              </div>

              {/* STORAGE + USAGE HISTORY */}
              <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.08fr]">
                <SectionCard title="Storage Breakdown by Project">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px]">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-2 py-2 text-left text-[9px] font-semibold text-slate-500">Project</th>
                          <th className="px-2 py-2 text-left text-[9px] font-semibold text-slate-500">Storage Used</th>
                          <th className="px-2 py-2 text-left text-[9px] font-semibold text-slate-500">% of Total</th>
                          <th className="px-2 py-2 text-right text-[9px] font-semibold text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storageProjects.map((item) => {
                          const barColor = item.tone === "orange" ? ORANGE : item.tone === "teal" ? "#148C78" : item.tone === "amber" ? "#E4A52E" : "#A7ADB3";
                          return (
                            <tr key={item.id} className="border-b border-slate-100 last:border-0">
                              <td className="px-2 py-3"><div className="text-[10px] font-medium text-slate-700">{item.project}</div></td>
                              <td className="px-2 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-1.5 w-[120px] overflow-hidden rounded-full bg-slate-200">
                                    <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: barColor }} />
                                  </div>
                                  <span className="whitespace-nowrap text-[9px] font-medium text-slate-700">{item.storage}</span>
                                </div>
                              </td>
                              <td className="px-2 py-3 text-[9px] text-slate-600">{item.percentage}%</td>
                              <td className="px-2 py-3 text-right">
                                <button type="button" className="text-[9px] font-medium text-[#D2691E] hover:underline" onClick={() => alert(`Cleanup options for ${item.project}`)}>Clean up</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-[#D2691E]">View all projects <ArrowRightIcon /></button>
                </SectionCard>

                <SectionCard title="Usage History (Last 6 Months)">
                  <div className="mb-3 flex items-center gap-5">
                    <span className="flex items-center gap-2 text-[9px] text-slate-600"><span className="h-2 w-2 rounded-full bg-teal-600" />Compute Hours (hrs)</span>
                    <span className="flex items-center gap-2 text-[9px] text-slate-600"><span className="h-2 w-2 rounded-full bg-[#D2691E]" />Storage Used (TB)</span>
                  </div>
                  <div className="relative h-[175px] border-l border-b border-slate-200">
                    {[0, 1, 2, 3, 4].map((line) => (
                      <div key={line} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: `${line * 25}%` }} />
                    ))}
                    <div className="absolute inset-x-5 bottom-0 top-3 flex items-end justify-between gap-4">
                      {monthlyHistory.map((item) => {
                        const height = (item.compute / maxCompute) * 125;
                        return (
                          <div key={item.month} className="flex flex-1 items-end justify-center">
                            <div className="w-5 rounded-t-[3px] bg-teal-600" style={{ height: `${height}px` }} />
                          </div>
                        );
                      })}
                    </div>
                    <svg viewBox="0 0 600 170" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
                      <polyline points={monthlyHistory.map((item, index) => { const x = 65 + index * (490 / (monthlyHistory.length - 1)); const y = 145 - (item.storage / maxStorage) * 100; return `${x},${y}`; }).join(" ")} fill="none" stroke={ORANGE} strokeWidth="3" />
                      {monthlyHistory.map((item, index) => { const x = 65 + index * (490 / (monthlyHistory.length - 1)); const y = 145 - (item.storage / maxStorage) * 100; return <circle key={item.month} cx={x} cy={y} r="4" fill={ORANGE} />; })}
                    </svg>
                  </div>
                  <div className="mt-3 flex justify-between px-4 text-[8px] text-slate-500">
                    {monthlyHistory.map((item) => <span key={item.month}>{item.month.replace(" 2024", "")}</span>)}
                  </div>
                </SectionCard>
              </div>

              {/* INVOICES + PAYMENT */}
              <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.7fr_0.9fr]">
                <SectionCard title="Invoices & Payment">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[470px]">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-2 py-2 text-left text-[9px] font-semibold text-slate-500">Invoice ID</th>
                          <th className="px-2 py-2 text-left text-[9px] font-semibold text-slate-500">Date</th>
                          <th className="px-2 py-2 text-left text-[9px] font-semibold text-slate-500">Amount</th>
                          <th className="px-2 py-2 text-left text-[9px] font-semibold text-slate-500">Status</th>
                          <th className="px-2 py-2 text-right text-[9px] font-semibold text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b border-slate-100 last:border-0">
                            <td className="px-2 py-3 text-[9px] font-medium text-slate-700">{invoice.id}</td>
                            <td className="px-2 py-3 text-[9px] text-slate-600">{invoice.date}</td>
                            <td className="px-2 py-3 text-[9px] font-medium text-slate-700">{invoice.amount}</td>
                            <td className="px-2 py-3"><PaidBadge status={invoice.status} /></td>
                            <td className="px-2 py-3 text-right"><button type="button" title="Download invoice (PDF)" className="text-slate-600 hover:text-[#D2691E] transition" onClick={() => downloadInvoice(invoice.id, invoice.amount, invoice.date)}><Download size={14} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-[#D2691E]">View all invoices <ArrowRightIcon /></button>
                </SectionCard>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
                  <div className="flex items-center gap-2"><WalletCards size={17} className="text-[#D2691E]" /><h2 className="text-[14px] font-semibold">Payment Method</h2></div>
                  <div className="mt-5">
                    <div className="text-[9px] font-medium text-slate-500">Current method</div>
                    <div className="mt-1 text-[11px] font-semibold text-slate-800">Government Purchase Order</div>
                    <div className="mt-4 text-[9px] font-medium text-slate-500">PO Number</div>
                    <div className="mt-1 font-mono text-[10px] text-slate-700">GPO/NTRO/2024/0421</div>
                    <div className="mt-4 text-[9px] font-medium text-slate-500">Valid Until</div>
                    <div className="mt-1 text-[10px] text-slate-700">31 Mar 2025</div>
                    <button type="button" className="mt-4 text-[10px] font-semibold text-[#D2691E]" onClick={() => alert("Payment method update")}>Update</button>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFF1EA] text-[#D2691E]"><HardDrive size={23} /></div>
                    <div><h2 className="text-[14px] font-semibold">Need More Storage?</h2><p className="mt-2 text-[10px] leading-5 text-slate-500">You can request additional storage based on your project needs.</p></div>
                  </div>
                  <button type="button" className="mt-5 flex h-[38px] w-full items-center justify-center gap-2 rounded-md px-4 text-[11px] font-semibold text-white hover:brightness-95" style={{ backgroundColor: ORANGE }} onClick={() => setContactOpen(true)}>
                    <Plus size={15} /> Request Storage Increase
                  </button>
                </section>
              </div>

              <div className="mt-4 flex justify-end">
                <button type="button" onClick={handleSaveBilling} className="inline-flex h-[40px] items-center gap-2 rounded-[7px] px-5 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-95" style={{ backgroundColor: ORANGE }}>
                  <Save size={15} />
                  {savedBilling ? "Changes Saved" : "Save Changes"}
                </button>
              </div>
            </section>
          )}


          {nav === "security" && (
            <section className="min-w-0">
              {/* Page heading */}
              <div className="mb-5">
                <h1 className="text-[27px] font-semibold tracking-[-0.03em] text-slate-950">Security</h1>
                <p className="mt-1 text-[13px] text-slate-500">Manage authentication, access, and account protection</p>
              </div>

              {/* TOP ROW */}
              <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
                {/* PASSWORD + 2FA */}
                <div className="space-y-4">
                  {/* Password */}
                  <SectionCard title="Password">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF1EA] text-[#D2691E]"><LockKeyhole size={17} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-slate-500">Last changed</div>
                        <div className="mt-0.5 text-[11px] font-medium text-slate-800">15 Apr 2024, 10:32 AM IST</div>
                      </div>
                      <button type="button" className="h-[35px] rounded-md border border-[#D2691E] px-3 text-[10px] font-medium text-[#D2691E] hover:bg-[#FFF5EF]" onClick={() => alert("Change Password flow")}>Change Password</button>
                    </div>
                  </SectionCard>
                  {/* 2FA */}
                  <SectionCard title="Two-Factor Authentication (2FA)">
                    <div className="flex items-center gap-5">
                      {/* shield / QR visual */}
                      <div className="relative flex h-[82px] w-[82px] shrink-0 items-center justify-center">
                        <div className="absolute inset-0 rounded-[42%_58%_52%_48%/45%_44%_56%_55%] border-[3px] border-emerald-700" />
                        <div className="rounded-md bg-slate-50 p-2">
                          <div className="grid grid-cols-4 gap-[2px]">
                            {Array.from({ length: 16 }).map((_, i) => (
                              <span key={i} className={`h-[5px] w-[5px] ${[0, 1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 15].includes(i) ? "bg-slate-700" : "bg-white"}`} />
                            ))}
                          </div>
                        </div>
                        <span className="absolute bottom-1 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white"><Check size={13} /></span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          {twoFactorEnabled ? (
                            <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Enabled</span>
                          ) : (
                            <span className="inline-flex rounded-md bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600">Disabled</span>
                          )}
                        </div>
                        <div className="mt-3 text-[10px] text-slate-500">Method</div>
                        <div className="mt-1 text-[12px] font-medium text-slate-800">Authenticator App (TOTP)</div>
                        <div className="mt-4 flex items-center gap-5">
                          <button type="button" className="text-[10px] font-medium text-[#D2691E] hover:underline" onClick={() => alert("Reconfigure authenticator")}>Reconfigure</button>
                          <button type="button" className="text-[10px] font-medium text-red-600 hover:underline" onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}>{twoFactorEnabled ? "Disable" : "Enable"}</button>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                {/* ACTIVE SESSIONS */}
                <SectionCard title="Active Sessions">
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-[700px] w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-3 py-2.5 text-left text-[9px] font-semibold text-slate-600">Device / Browser</th>
                          <th className="px-3 py-2.5 text-left text-[9px] font-semibold text-slate-600">Location</th>
                          <th className="px-3 py-2.5 text-left text-[9px] font-semibold text-slate-600">IP Address</th>
                          <th className="px-3 py-2.5 text-left text-[9px] font-semibold text-slate-600">Last Active</th>
                          <th className="px-3 py-2.5 text-center text-[9px] font-semibold text-slate-600">Status</th>
                          <th className="px-3 py-2.5 text-right text-[9px] font-semibold text-slate-600">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((session) => (
                          <tr key={session.id} className="border-t border-slate-100">
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50">
                                  {session.device.toLowerCase().includes("mobile") ? (
                                    <Smartphone size={15} className="text-slate-700" />
                                  ) : session.device.toLowerCase().includes("ipad") ? (
                                    <Smartphone size={15} className="text-slate-700" />
                                  ) : (
                                    <Monitor size={15} className="text-slate-700" />
                                  )}
                                </div>
                                <div>
                                  <div className="text-[10px] font-semibold text-slate-800">{session.device}</div>
                                  <div className="mt-0.5 text-[9px] text-slate-500">{session.platform}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-[9px] text-slate-600">{session.location}</td>
                            <td className="font-mono px-3 py-3 text-[9px] text-slate-600">{session.ip}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-[9px] text-slate-600">{session.lastActive}</td>
                            <td className="px-3 py-3 text-center">
                              {session.current ? (
                                <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">This Device</span>
                              ) : (
                                <span className="text-[9px] text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {session.current ? (
                                <span className="text-[9px] text-slate-400">—</span>
                              ) : (
                                <button type="button" onClick={() => handleLogoutSession(session.id)} className="text-[9px] font-medium text-red-600 hover:underline">Log Out</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={handleLogoutOthers} className="mt-3 inline-flex h-[35px] items-center gap-2 rounded-md border border-[#D2691E] px-3.5 text-[10px] font-medium text-[#D2691E] hover:bg-[#FFF5EF]">
                    <LogOut size={13} /> Log Out All Other Sessions
                  </button>
                </SectionCard>
              </div>

              {/* SECOND ROW */}
              <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                {/* LOGIN HISTORY */}
                <SectionCard title="Login History">
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-[570px] w-full">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-3 py-2.5 text-left text-[9px] font-semibold text-slate-600">Timestamp</th>
                          <th className="px-3 py-2.5 text-left text-[9px] font-semibold text-slate-600">Device / Browser</th>
                          <th className="px-3 py-2.5 text-left text-[9px] font-semibold text-slate-600">Location</th>
                          <th className="px-3 py-2.5 text-left text-[9px] font-semibold text-slate-600">IP Address</th>
                          <th className="px-3 py-2.5 text-left text-[9px] font-semibold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loginHistory.map((record) => (
                          <tr key={record.id} className="border-t border-slate-100">
                            <td className="whitespace-nowrap px-3 py-2.5 text-[9px] text-slate-600">{record.timestamp}</td>
                            <td className="px-3 py-2.5 text-[9px] text-slate-700">{record.device}</td>
                            <td className="px-3 py-2.5 text-[9px] text-slate-600">{record.location}</td>
                            <td className="font-mono px-3 py-2.5 text-[9px] text-slate-600">{record.ip}</td>
                            <td className="px-3 py-2.5">
                              {record.success ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-700">
                                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-emerald-600"><Check size={9} /></span> Success
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-medium text-red-600">
                                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-red-500"><X size={9} /></span> Failed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" className="mt-3 text-[10px] font-medium text-[#D2691E] hover:underline">
                    View full login history<span className="ml-2">→</span>
                  </button>
                </SectionCard>

                {/* ACCESS RESTRICTIONS */}
                <div className="space-y-4">
                  <SectionCard title="Access Restrictions">
                    <div className="space-y-4">
                      {/* Network */}
                      <div className="flex items-center justify-between gap-5">
                        <div>
                          <div className="text-[11px] font-medium text-slate-800">Restrict login to office network/VPN only</div>
                          <div className="mt-1 text-[9px] text-slate-500">Allow access only from trusted networks</div>
                        </div>
                        <ToggleSecurity enabled={restrictNetwork} onChange={() => setRestrictNetwork(!restrictNetwork)} />
                      </div>
                      {/* Clearance */}
                      <div className="flex items-center justify-between gap-5">
                        <div>
                          <div className="text-[11px] font-medium text-slate-800">Require security clearance verification</div>
                          <div className="mt-1 text-[9px] text-slate-500">Verify clearance level during login</div>
                        </div>
                        <ToggleSecurity enabled={clearanceVerification} onChange={() => setClearanceVerification(!clearanceVerification)} />
                      </div>
                      {/* Timeout */}
                      <div className="flex items-center justify-between gap-5">
                        <div>
                          <div className="text-[11px] font-medium text-slate-800">Session timeout</div>
                          <div className="mt-1 text-[9px] text-slate-500">Automatically log out after inactivity</div>
                        </div>
                        <div className="relative w-[125px] shrink-0">
                          <select value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className="h-[38px] w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-8 text-[10px] text-slate-700 outline-none focus:border-[#D2691E]">
                            <option>15 min</option>
                            <option>30 min</option>
                            <option>1 hour</option>
                          </select>
                          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  {/* DANGER ZONE */}
                  <section className="rounded-xl border border-red-300 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.025)]">
                    <div className="border-b border-red-100 px-4 py-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-600" />
                        <h2 className="text-[14px] font-semibold text-red-600">Danger Zone</h2>
                      </div>
                    </div>
                    <div className="space-y-3 p-4">
                      {/* Deactivate */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"><UserX size={17} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold text-slate-800">Deactivate Account</div>
                          <div className="mt-1 text-[9px] text-slate-500">Temporarily disable your account access</div>
                        </div>
                        <button type="button" onClick={() => alert("Deactivate account confirmation")} className="h-[34px] rounded-md border border-red-300 px-3 text-[10px] font-medium text-red-600 hover:bg-red-50">Deactivate</button>
                      </div>
                      {/* Export */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"><Download size={17} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold text-slate-800">Request Data Export</div>
                          <div className="mt-1 text-[9px] text-slate-500">Download a copy of your account data</div>
                        </div>
                        <button type="button" onClick={() => alert("Data export request submitted")} className="h-[34px] rounded-md border border-red-300 px-3 text-[10px] font-medium text-red-600 hover:bg-red-50">Request Export</button>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* SAVE CHANGES */}
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={handleSaveSecurity} className="inline-flex h-[40px] items-center gap-2 rounded-[7px] px-5 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-95" style={{ backgroundColor: ORANGE }}>
                  <Save size={15} />
                  {savedSecurity ? "Changes Saved" : "Save Changes"}
                </button>
              </div>
            </section>
          )}


          {nav === "notifications" && (
            <section className="min-w-0">
              {/* Page title */}
              <div className="mb-5">
                <h1 className="text-[27px] font-semibold tracking-[-0.03em] text-slate-950">Notifications</h1>
                <p className="mt-1 text-[13px] text-slate-500">Choose how and when you want to be notified</p>
              </div>

              {/* TOP THREE PANELS */}
              <div className="grid gap-4 xl:grid-cols-[0.8fr_1fr_1fr]">
                {/* Notification Channels */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                  <div className="border-b border-slate-100 px-4 py-4"><h2 className="text-[14px] font-semibold">Notification Channels</h2></div>
                  <div>
                    {/* Email */}
                    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Mail size={17} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold text-slate-800">Email Notifications</div>
                        <div className="mt-1 truncate text-[9px] text-slate-500">arjun.pratap@ntro.gov.in</div>
                      </div>
                      <ToggleNotification enabled={emailEnabled} onChange={() => setEmailEnabled(!emailEnabled)} />
                    </div>
                    {/* In App */}
                    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Bell size={17} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold text-slate-800">In-App Notifications</div>
                        <div className="mt-1 text-[9px] text-slate-500">Receive notifications inside the platform</div>
                      </div>
                      <ToggleNotification enabled={inAppEnabled} onChange={() => setInAppEnabled(!inAppEnabled)} />
                    </div>
                    {/* SMS */}
                    <div className="flex items-start gap-3 px-4 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-600"><MessageSquare size={17} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold text-slate-800">SMS Alerts</div>
                        <div className="mt-1 text-[9px] text-slate-500">Get critical alerts on your mobile</div>
                        <button type="button" className="mt-2 text-[10px] font-medium text-[#D2691E] hover:underline" onClick={() => alert("Add phone number flow")}>Add phone number</button>
                      </div>
                      <ToggleNotification enabled={smsEnabled} onChange={() => setSmsEnabled(!smsEnabled)} />
                    </div>
                  </div>
                </section>
                {/* Job Alerts */}
                <AlertMatrix title="Job & Processing Alerts" rules={jobAlerts} onToggle={(ruleId, channel) => toggleRule(setJobAlerts, ruleId, channel)} />
                {/* Team Alerts */}
                <AlertMatrix title="Team & Account Alerts" rules={teamAlerts} onToggle={(ruleId, channel) => toggleRule(setTeamAlerts, ruleId, channel)} />
              </div>

              {/* LOWER SECTION */}
              <div className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                {/* Notification Frequency */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                  <div className="border-b border-slate-100 px-4 py-4"><h2 className="text-[14px] font-semibold">Notification Frequency</h2></div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {[
                        { title: "Real-time", description: "Get notified instantly as events occur" },
                        { title: "Hourly Digest", description: "Receive a summary every hour" },
                        { title: "Daily Digest", description: "Receive a summary once a day" },
                        { title: "Weekly Summary", description: "Receive a summary once a week" },
                      ].map((option) => {
                        const selected = frequency === option.title;
                        return (
                          <button key={option.title} type="button" onClick={() => setFrequency(option.title)} className="flex w-full items-start gap-3 text-left">
                            <span className={`mt-[1px] flex h-4 w-4 items-center justify-center rounded-full border ${selected ? "border-[#D2691E]" : "border-slate-300"}`}>
                              {selected && <span className="h-2 w-2 rounded-full bg-[#D2691E]" />}
                            </span>
                            <span>
                              <span className="block text-[11px] font-medium text-slate-800">{option.title}</span>
                              <span className="mt-0.5 block text-[9px] text-slate-500">{option.description}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {/* Quiet hours */}
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-semibold">Quiet Hours</div>
                          <div className="mt-1 text-[9px] text-slate-500">Pause non-critical notifications during this time</div>
                        </div>
                        <ToggleNotification enabled={quietHours} onChange={() => setQuietHours(!quietHours)} />
                      </div>
                      <div className="mt-3 grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                        <div className="relative">
                          <input type="text" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} className="h-[38px] w-full rounded-md border border-slate-200 bg-white px-3 text-[11px] outline-none focus:border-[#D2691E]" />
                          <Clock3 size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        </div>
                        <span className="text-slate-400">–</span>
                        <div className="relative">
                          <input type="text" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} className="h-[38px] w-full rounded-md border border-slate-200 bg-white px-3 text-[11px] outline-none focus:border-[#D2691E]" />
                          <Clock3 size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        </div>
                        <span className="text-[10px] font-medium text-slate-500">IST</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-500">
                        <ShieldCheck size={12} /> Critical alerts will still be delivered.
                      </div>
                    </div>
                  </div>
                </section>
                {/* Notification Preview */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                    <div>
                      <h2 className="text-[14px] font-semibold">Notification Preview</h2>
                      <p className="mt-1 text-[9px] text-slate-500">This is how your notifications will appear.</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {(["In-App", "Email", "SMS"] as const).map((channel) => (
                        <button key={channel} type="button" onClick={() => setPreviewChannel(channel)} className={`rounded-md border px-3 py-1.5 text-[10px] font-medium transition ${previewChannel === channel ? "border-[#D2691E] text-[#D2691E]" : "border-slate-200 text-slate-600"}`}>
                          {channel}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    {previewChannel === "In-App" && (
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.08)]">
                        <div className="border-l-4 border-emerald-500 px-5 py-5">
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><Check size={20} /></div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="text-[13px] font-semibold text-slate-900">Job SR_v2_20240521 completed successfully</div>
                                <span className="shrink-0 text-[9px] text-slate-400">2m ago</span>
                              </div>
                              <p className="mt-2 text-[10px] leading-5 text-slate-600">Your super-resolution job has completed.</p>
                              <div className="mt-2 text-[10px] text-slate-600">Tiles processed: <span className="font-medium">124</span><span className="mx-2 text-slate-300">•</span>Resolution: <span className="font-medium">2.5 m/pixel</span></div>
                              <div className="mt-1 text-[10px] text-slate-600">Project: <span className="font-medium">Ladakh Border Infrastructure</span></div>
                            </div>
                          </div>
                          <div className="mt-5 border-t border-slate-100 pt-3">
                            <button type="button" className="flex w-full items-center justify-between text-[10px] font-semibold text-[#D2691E]">
                              <span>View Details</span><span className="text-base">→</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {previewChannel === "Email" && (
                      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_3px_14px_rgba(15,23,42,0.06)]">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full text-white bg-[#D2691E]"><Mail size={16} /></div>
                          <div>
                            <div className="text-[11px] font-semibold">भू DRISTI</div>
                            <div className="text-[9px] text-slate-500">Notification Service</div>
                          </div>
                        </div>
                        <div className="mt-4 text-[14px] font-semibold">Job completed successfully</div>
                        <p className="mt-2 text-[10px] leading-5 text-slate-600">SR_v2_20240521 completed successfully for Ladakh Border Infrastructure.</p>
                        <button type="button" className="mt-4 rounded-md px-4 py-2 text-[10px] font-semibold text-white bg-[#D2691E]">View Details</button>
                      </div>
                    )}
                    {previewChannel === "SMS" && (
                      <div className="mx-auto max-w-[350px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="rounded-2xl rounded-bl-sm bg-white p-4 shadow-sm">
                          <div className="text-[11px] leading-5 text-slate-800">✅ भू DRISTI:<br />Job SR_v2_20240521 completed successfully.<br />Resolution: 2.5 m/pixel.</div>
                          <div className="mt-2 text-right text-[8px] text-slate-400">11:28 AM</div>
                        </div>
                      </div>
                    )}
                    <div className="mt-6 flex justify-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#D2691E]" />
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    </div>
                  </div>
                </section>
              </div>

              {/* SAVE BUTTON */}
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={handleSaveNotifications} className="inline-flex h-[40px] items-center gap-2 rounded-[7px] px-5 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-95" style={{ backgroundColor: ORANGE }}>
                  <Save size={15} />
                  {savedNotifications ? "Preferences Saved" : "Save Preferences"}
                </button>
              </div>
            </section>
          )}


          {nav === "data" && (
            <section className="min-w-0">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h1 className="text-[27px] font-semibold tracking-[-0.03em] text-slate-950">Data Sources</h1>
                  <p className="mt-1 text-[13px] text-slate-500">Manage satellite imagery providers and reference datasets</p>
                </div>
                <button type="button" onClick={() => setShowAddSourceModal(true)} className="inline-flex h-[40px] items-center justify-center gap-2 rounded-[7px] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:brightness-95" style={{ backgroundColor: ORANGE }}>
                  <Plus size={16} /> Add New Data Source
                </button>
              </div>

              {/* SATELLITE IMAGERY PROVIDERS */}
              <section className="rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Database size={17} className="text-[#D2691E]" />
                    <h2 className="text-[14px] font-semibold">Satellite Imagery Providers</h2>
                  </div>
                  <div className="relative hidden md:block">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={searchData} onChange={(e) => setSearchData(e.target.value)} placeholder="Search providers..." className="h-[32px] w-[190px] rounded-md border border-slate-200 pl-8 pr-3 text-[10px] outline-none focus:border-[#D2691E]" />
                  </div>
                </div>
                <div className="overflow-x-auto p-3">
                  <table className="min-w-[850px] w-full border-collapse overflow-hidden rounded-lg border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-600">Provider</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-600">Status</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-600">Available Collections</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-600">Last Sync</th>
                        <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProviders.map((provider) => (
                        <tr key={provider.id} className="border-t border-slate-100">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <ProviderLogo type={provider.logoType} />
                              <div><div className="text-[11px] font-semibold text-slate-800">{provider.name}</div></div>
                            </div>
                          </td>
                          <td className="px-3 py-3"><StatusBadgeData status={provider.status} /></td>
                          <td className="px-3 py-3">
                            <div className="flex max-w-[310px] flex-wrap gap-1.5">
                              {provider.collections.map((collection) => <CollectionTag key={collection} label={collection} />)}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-[10px] text-slate-600">{provider.lastSync}</td>
                          <td className="relative px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-4">
                              <button type="button" onClick={() => { if (provider.status === "Connected") { alert(`${provider.name} settings`); } else { handleConnectProvider(provider.id); } }} className="text-[10px] font-medium text-[#D2691E] hover:underline">
                                {provider.status === "Connected" ? "Manage" : "Connect"}
                              </button>
                              <button type="button" className="text-[10px] font-medium text-blue-600 hover:underline" onClick={() => alert(`Testing connection for ${provider.name}`)}>Test</button>
                              <button type="button" onClick={() => setMenuOpen(menuOpen === `provider-${provider.id}` ? null : `provider-${provider.id}`)} className="text-slate-500 hover:text-slate-900"><MoreVertical size={15} /></button>
                            </div>
                            {menuOpen === `provider-${provider.id}` && (
                              <div className="absolute right-3 top-10 z-20 w-36 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg">
                                {provider.status === "Connected" ? (
                                  <button type="button" onClick={() => handleDisconnectProvider(provider.id)} className="w-full px-3 py-2 text-[10px] text-red-600 hover:bg-red-50">Disconnect</button>
                                ) : (
                                  <button type="button" onClick={() => handleConnectProvider(provider.id)} className="w-full px-3 py-2 text-[10px] text-emerald-700 hover:bg-emerald-50">Connect source</button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredProviders.length === 0 && (
                        <tr><td colSpan={5} className="px-3 py-10 text-center text-[12px] text-slate-500">No matching data sources found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* REFERENCE DATASETS + STORAGE */}
              <div className="mt-4 grid gap-4 xl:grid-cols-[1.08fr_1fr]">
                {/* Reference Datasets */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                  <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
                    <Eye size={17} className="text-[#D2691E]" />
                    <h2 className="text-[14px] font-semibold">High-Resolution Reference Datasets</h2>
                    <span className="text-[10px] text-slate-400">(used for validation)</span>
                  </div>
                  <div className="overflow-x-auto p-3">
                    <table className="min-w-[590px] w-full border-collapse overflow-hidden rounded-lg border border-slate-200">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-600">Dataset</th>
                          <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-600">Dataset Size</th>
                          <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-600">Coverage Area</th>
                          <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-600">Upload Date</th>
                          <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-600">Preview</th>
                          <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datasets.map((dataset) => (
                          <tr key={dataset.id} className="border-t border-slate-100">
                            <td className="px-3 py-3">
                              <div className="max-w-[170px]"><div className="text-[10px] font-semibold text-slate-800">{dataset.name}</div><div className="mt-0.5 text-[9px] text-slate-500">{dataset.region}</div></div>
                            </td>
                            <td className="px-3 py-3 text-[9px] text-slate-700">{dataset.size}</td>
                            <td className="px-3 py-3 text-[9px] text-slate-700">{dataset.coverage}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-[9px] text-slate-600">{dataset.uploadDate}</td>
                            <td className="px-3 py-3"><img src={dataset.image} alt={dataset.name} className="h-9 w-9 rounded-md object-cover" /></td>
                            <td className="px-3 py-3">
                              <button type="button" onClick={() => alert(`Viewing ${dataset.name}`)} className="text-[9px] font-medium text-[#D2691E]">View</button>
                              <button type="button" className="ml-3 text-slate-500" onClick={() => setMenuOpen(menuOpen === `dataset-${dataset.id}` ? null : `dataset-${dataset.id}`)}><MoreVertical size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-slate-100 px-4 py-3">
                    <button type="button" onClick={() => setShowDatasetModal(true)} className="inline-flex h-[34px] items-center gap-2 rounded-md border border-dashed border-[#D2691E] px-3 text-[10px] font-semibold text-[#D2691E]">
                      <Upload size={13} /> Add Reference Dataset
                    </button>
                  </div>
                </section>

                {/* Storage Connections */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                  <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
                    <Cloud size={17} className="text-[#D2691E]" />
                    <h2 className="text-[14px] font-semibold">Storage Connections</h2>
                  </div>
                  <div className="p-3">
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-600">Storage</th>
                            <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-600">Details</th>
                            <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-600">Status</th>
                            <th className="px-3 py-2 text-left text-[9px] font-semibold text-slate-600">Capacity Used</th>
                            <th className="px-3 py-2 text-right text-[9px] font-semibold text-slate-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {storageConnections.map((storage) => (
                            <tr key={storage.id} className="border-t border-slate-100">
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2.5"><StorageLogo provider={storage.provider} /><div className="text-[10px] font-semibold text-slate-800">{storage.name}</div></div>
                              </td>
                              <td className="px-3 py-3"><div className="text-[9px] text-slate-700">{storage.bucket}</div><div className="mt-0.5 text-[9px] text-slate-500">{storage.region}</div></td>
                              <td className="px-3 py-3"><StatusBadgeData status={storage.status} /></td>
                              <td className="min-w-[130px] px-3 py-3">
                                {storage.status === "Connected" ? (
                                  <>
                                    <div className="text-[9px] font-medium text-slate-700">{storage.used} / {storage.capacity}</div>
                                    <div className="mt-1.5 flex items-center gap-2">
                                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                                        <div className="h-full rounded-full bg-teal-600" style={{ width: `${storage.usagePercent}%` }} />
                                      </div>
                                      <span className="text-[9px] text-slate-500">{storage.usagePercent}%</span>
                                    </div>
                                  </>
                                ) : (<span className="text-[9px] text-slate-400">—</span>)}
                              </td>
                              <td className="px-3 py-3 text-right">
                                <button type="button" onClick={() => { if (storage.status === "Connected") { alert(`${storage.name} settings`); } else { setStorageConnections((current) => current.map((item) => item.id === storage.id ? { ...item, status: "Connected", used: "0 GB", capacity: "5 TB", usagePercent: 0, } : item )); } }} className="text-[9px] font-medium text-[#D2691E]">
                                  {storage.status === "Connected" ? "Manage" : "Connect"}
                                </button>
                                <button type="button" className="ml-3 text-slate-500"><MoreVertical size={14} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </div>

              {/* DATA SYNC + HEALTH */}
              <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                {/* DATA SYNC SETTINGS */}
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={17} className="text-[#D2691E]" />
                    <h2 className="text-[14px] font-semibold">Data Sync Settings</h2>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div><div className="text-[11px] font-medium text-slate-700">Auto-sync new imagery</div><div className="mt-0.5 text-[9px] text-slate-500">Automatically fetch newly available scenes.</div></div>
                      <SwitchData enabled={autoSync} onChange={() => setAutoSync(!autoSync)} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div><div className="text-[11px] font-medium text-slate-700">Sync frequency</div></div>
                      <div className="relative w-[135px]">
                        <select value={syncFrequency} onChange={(e) => setSyncFrequency(e.target.value)} className="h-[35px] w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-8 text-[10px] text-slate-700 outline-none focus:border-[#D2691E]">
                          <option>Daily</option><option>Weekly</option><option>Every 12 hours</option>
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <div><div className="text-[11px] font-medium text-slate-700">Cloud cover threshold</div><div className="mt-0.5 text-[9px] text-slate-500">Ignore imagery above this threshold.</div></div>
                        <span className="text-[10px] font-semibold text-slate-700">Max {cloudThreshold}% cloud cover</span>
                      </div>
                      <input type="range" min={0} max={100} step={5} value={cloudThreshold} onChange={(e) => setCloudThreshold(Number(e.target.value))} className="mt-3 w-full accent-[#D2691E]" />
                      <div className="mt-1 flex justify-between text-[8px] text-slate-400"><span>0%</span><span>20%</span><span>40%</span><span>60%</span><span>100%</span></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div><div className="text-[11px] font-medium text-slate-700">Notify on sync failure</div></div>
                      <SwitchData enabled={notifyFailure} onChange={() => setNotifyFailure(!notifyFailure)} />
                    </div>
                  </div>
                </section>

                {/* HEALTH OVERVIEW */}
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
                  <div className="flex items-center gap-2">
                    <Wifi size={17} className="text-[#D2691E]" />
                    <h2 className="text-[14px] font-semibold">Data Source Health Overview</h2>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                      <div className="flex items-center gap-2"><Database size={19} className="text-emerald-700" /><span className="text-[24px] font-semibold text-emerald-700">{connectedCount}</span></div>
                      <div className="mt-1 text-[10px] font-medium text-slate-700">Connected Sources</div>
                      <div className="mt-3 flex items-center gap-1.5 text-[9px] text-emerald-700"><Check size={11} /> All systems operational</div>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                      <div className="flex items-center gap-2"><AlertTriangle size={19} className="text-amber-600" /><span className="text-[24px] font-semibold text-amber-600">{disconnectedCount}</span></div>
                      <div className="mt-1 text-[10px] font-medium text-slate-700">Not Connected</div>
                      <div className="mt-3 flex items-center gap-1.5 text-[9px] text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Action required</div>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                      <div className="flex items-center gap-2"><Cloud size={19} className="text-blue-600" /><span className="text-[20px] font-semibold text-blue-700">2.48 TB</span></div>
                      <div className="mt-1 text-[10px] font-medium text-slate-700">Total Data Synced</div>
                      <div className="mt-3 text-[9px] text-slate-500">This month</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-2"><RefreshCw size={19} className="text-slate-700" /><span className="text-[24px] font-semibold text-slate-800">98%</span></div>
                      <div className="mt-1 text-[10px] font-medium text-slate-700">Sync Success Rate</div>
                      <div className="mt-3 text-[9px] text-slate-500">Last 30 days</div>
                    </div>
                  </div>
                </section>
              </div>

              {/* SAVE BUTTON */}
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={handleSaveChangesData} className="inline-flex h-[38px] items-center gap-2 rounded-[7px] px-5 text-[11px] font-semibold text-white shadow-sm hover:brightness-95" style={{ backgroundColor: ORANGE }}>
                  <Save size={14} /> Save Changes
                </button>
              </div>
            </section>
          )}


          {nav === "api" && (
            <section className="min-w-0">
              <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h1 className="text-[27px] font-semibold tracking-[-0.03em] text-slate-950">API & Integrations</h1>
                  <p className="mt-1 text-[13px] text-slate-500">Manage API keys and connected external services</p>
                </div>
                <button type="button" className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-[12px] font-medium text-blue-700 transition hover:bg-blue-100">
                  <Link2 size={15} /> Read our API documentation <ExternalLink size={14} />
                </button>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.9fr]">
                {/* API KEYS */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                    <div className="flex items-center gap-2">
                      <KeyRound size={17} className="text-[#D2691E]" />
                      <h2 className="text-[14px] font-semibold">API Keys</h2>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-[650px] w-full">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600">Key Name</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600">API Key</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600">Created</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600">Last Used</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600">Status</th>
                            <th className="w-10 px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {keys.map((key) => {
                            const revealed = revealedKeys.includes(key.id);
                            return (
                              <tr key={key.id} className="border-t border-slate-100">
                                <td className="px-3 py-3"><span className="text-[11px] font-medium text-slate-800">{key.name}</span></td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <code className="font-mono text-[10px] text-slate-700">
                                      {revealed ? `${key.prefix}4a8ef72d6b1c${key.suffix}` : `${key.prefix}••••••••••••${key.suffix}`}
                                    </code>
                                    <button type="button" onClick={() => copyKey(key)} className="text-slate-500 hover:text-[#D2691E]"><Copy size={13} /></button>
                                    <button type="button" onClick={() => revealKey(key.id)} className="text-slate-500 hover:text-[#D2691E]"><Eye size={13} /></button>
                                    {copiedKey === key.id && <span className="text-[9px] text-emerald-600">Copied</span>}
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-[10px] text-slate-600">{key.created}</td>
                                <td className="px-3 py-3 text-[10px] text-slate-600">{key.lastUsed}</td>
                                <td className="px-3 py-3">
                                  {key.status === "Active" ? <StatusBadgeApi>Active</StatusBadgeApi> : <span className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600">Revoked</span>}
                                </td>
                                <td className="relative px-3 py-3 text-right">
                                  <button type="button" onClick={() => setShowActionId(showActionId === `key-${key.id}` ? null : `key-${key.id}`)} className="text-slate-500 hover:text-slate-900"><MoreVertical size={16} /></button>
                                  {showActionId === `key-${key.id}` && (
                                    <div className="absolute right-2 top-9 z-20 w-32 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg">
                                      <button type="button" onClick={() => revokeKey(key.id)} className="w-full px-3 py-2 text-[11px] text-red-600 hover:bg-red-50">Revoke key</button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" onClick={() => setShowGenerateModal(true)} className="mt-3 inline-flex h-[38px] items-center gap-2 rounded-[7px] border border-[#D2691E] px-4 text-[11px] font-semibold text-[#D2691E] hover:bg-[#FFF5EF]">
                      <Plus size={15} /> Generate New API Key
                    </button>
                  </div>
                </section>

                {/* WEBHOOKS */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
                  <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
                    <Webhook size={17} className="text-[#D2691E]" />
                    <h2 className="text-[14px] font-semibold">Webhooks</h2>
                  </div>
                  <div className="p-3">
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-[570px] w-full">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600">Endpoint</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600">Events</th>
                            <th className="px-3 py-2 text-center text-[10px] font-semibold text-slate-600">Status</th>
                            <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {webhooks.map((webhook) => (
                            <tr key={webhook.id} className="border-t border-slate-100">
                              <td className="px-3 py-3">
                                <div className="min-w-[180px]">
                                  <p className="text-[11px] font-semibold text-slate-800">{webhook.name}</p>
                                  <p className="mt-0.5 truncate text-[9px] text-slate-500">{webhook.endpoint}</p>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex max-w-[160px] flex-wrap gap-1">
                                  {webhook.events.map((event) => <WebhookEventTag key={event} event={event} />)}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <button type="button" aria-label={`Toggle ${webhook.name}`} onClick={() => toggleWebhook(webhook.id)} className={`relative h-5 w-9 rounded-full transition ${webhook.enabled ? "bg-emerald-600" : "bg-slate-300"}`}>
                                  <span className={`absolute top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition ${webhook.enabled ? "left-[18px]" : "left-[2px]"}`} />
                                </button>
                              </td>
                              <td className="relative px-3 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <button type="button" className="text-slate-600 hover:text-[#D2691E]"><Pencil size={14} /></button>
                                  <button type="button" onClick={() => deleteWebhook(webhook.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" onClick={() => setShowWebhookModal(true)} className="mt-3 inline-flex h-[38px] items-center gap-2 rounded-[7px] border border-[#D2691E] px-4 text-[11px] font-semibold text-[#D2691E] hover:bg-[#FFF5EF]">
                      <Plus size={15} /> Add Webhook
                    </button>
                  </div>
                </section>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.05fr]">
                {/* CONNECTED INTEGRATIONS */}
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 size={17} className="text-[#D2691E]" />
                      <h2 className="text-[14px] font-semibold">Connected Integrations</h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {integrations.map((integration) => (
                      <div key={integration.id} className="rounded-xl border border-slate-200 bg-white p-3 text-center transition hover:border-slate-300 hover:shadow-sm">
                        <div className="flex justify-center"><IntegrationLogo type={integration.type} /></div>
                        <div className="mt-2 min-h-[32px] text-[10px] font-semibold leading-4 text-slate-800">{integration.name}</div>
                        <div className="mt-2">
                          {integration.connected ? (
                            <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-emerald-700">
                              <span className="h-2 w-2 rounded-full bg-emerald-600" /> Connected
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                              <span className="h-2 w-2 rounded-full bg-slate-300" /> Not Connected
                            </div>
                          )}
                        </div>
                        <button type="button" className={`mt-2 text-[10px] font-medium ${integration.connected ? "text-[#D2691E]" : "rounded-md border border-[#D2691E] px-3 py-1.5 text-[#D2691E]"}`}>
                          {integration.connected ? "Manage" : "Connect"}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* API USAGE */}
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal size={17} className="text-[#D2691E]" />
                        <h2 className="text-[14px] font-semibold">API Usage</h2>
                      </div>
                      <div className="mt-4">
                        <div className="text-[25px] font-semibold tracking-[-0.03em]">12,450</div>
                        <div className="text-[11px] text-slate-500">calls this month</div>
                      </div>
                    </div>
                    <div className="min-w-[210px]">
                      <div className="text-[11px] text-slate-500"><span className="font-semibold text-slate-800">{usagePercentage}%</span> of monthly quota used</div>
                      <div className="mt-2 text-right text-[10px] text-slate-500">25,000 / 40,000 calls</div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full" style={{ width: `${usagePercentage}%`, backgroundColor: ORANGE }} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="flex h-[170px] items-end gap-[4px] border-b border-l border-slate-200 px-3 pb-2">
                      {usageBars.map((value, index) => {
                        const height = Math.max(8, Math.min(145, value / 7));
                        return (
                          <div key={`${value}-${index}`} className="group relative flex h-full flex-1 items-end">
                            <div className="w-full rounded-t-[2px] transition hover:opacity-80" style={{ height: `${height}px`, backgroundColor: ORANGE }} />
                            <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-slate-800 px-1.5 py-1 text-[8px] text-white group-hover:block">{value}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex justify-between text-[9px] text-slate-500">
                      <span>21 Apr</span><span>26 Apr</span><span>1 May</span><span>6 May</span><span>11 May</span><span>16 May</span><span>21 May</span>
                    </div>
                  </div>
                </section>
              </div>
            </section>
          )}


          {nav === "team" && (
            <section className="min-w-0">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-[27px] font-semibold tracking-[-0.03em] text-slate-950">Team & Permissions</h1>
                  <p className="mt-1.5 text-[13px] text-slate-500">Manage team members and their access levels</p>
                </div>
                <button type="button" className="inline-flex h-[40px] items-center justify-center gap-2 rounded-[7px] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:brightness-95" style={{ backgroundColor: PRIMARY_ORANGE }} onClick={() => alert("Invite Member")}>
                  <Plus size={16} /> Invite Member
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total Members" value="24" subtitle="All users in organization" icon={<Users size={21} />} tone="orange" />
                <StatCard title="Active" value="21" subtitle="Currently active users" icon={<UserRound size={21} />} tone="green" />
                <StatCard title="Pending Invites" value="3" subtitle="Awaiting acceptance" icon={<Mail size={21} />} tone="amber" />
                <StatCard title="Admins" value="5" subtitle="Users with admin access" icon={<Shield size={21} />} tone="red" />
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 flex-1 sm:max-w-[400px]">
                  <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search members..." className="h-[40px] w-full rounded-[7px] border border-slate-200 bg-white pl-10 pr-3 text-[12px] outline-none transition focus:border-[#D2691E] focus:ring-2 focus:ring-[#D2691E]/10" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-slate-500">Filter by Role</span>
                  <div className="relative min-w-[190px]">
                    <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as "All Roles" | Role); setPage(1); }} className="h-[40px] w-full appearance-none rounded-[7px] border border-slate-200 bg-white px-3 pr-9 text-[12px] outline-none focus:border-[#D2691E]">
                      <option>All Roles</option>
                      <option>Admin</option>
                      <option>Analyst</option>
                      <option>Viewer</option>
                    </select>
                    <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-600">Member</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-600">Role</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-600">Project Access</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-600">Status</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-600">Last Active</th>
                        <th className="w-16 px-4 py-3 text-center text-[11px] font-semibold text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="border-t border-slate-100 transition hover:bg-slate-50/60">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-[37px] w-[37px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: member.avatarColor }}>{member.initials}</div>
                              <div className="min-w-0">
                                <div className="text-[12.5px] font-semibold text-slate-800">{member.name}</div>
                                <div className="mt-0.5 truncate text-[10.5px] text-slate-500">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5"><RoleBadge role={member.role} /></td>
                          <td className="max-w-[260px] px-4 py-3.5"><ProjectAccess projects={member.projects} projectCount={member.projectCount} /></td>
                          <td className="px-4 py-3.5"><StatusBadgeTeam status={member.status} /></td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[11px] text-slate-600">{member.lastActive}</td>
                          <td className="px-4 py-3.5 text-center">
                            <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"><MoreVertical size={16} /></button>
                          </td>
                        </tr>
                      ))}
                      {filteredMembers.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] text-slate-500">No team members found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
                <h2 className="mb-3 text-[14px] font-semibold text-slate-900">Role Permissions Matrix</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-[650px] w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border border-slate-200 px-3 py-2 text-left text-[11px] font-semibold text-slate-600">Permission</th>
                        <th className="border border-slate-200 px-3 py-2 text-center text-[11px] font-semibold text-[#D2691E]">Admin</th>
                        <th className="border border-slate-200 px-3 py-2 text-center text-[11px] font-semibold text-[#1763A6]">Analyst</th>
                        <th className="border border-slate-200 px-3 py-2 text-center text-[11px] font-semibold text-slate-600">Viewer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Create Jobs", true, true, false],
                        ["Delete Jobs", true, false, false],
                        ["Manage Team", true, false, false],
                        ["Export Data", true, true, false],
                        ["View Reports", true, true, true],
                        ["Edit Settings", true, false, false],
                      ].map(([permission, admin, analyst, viewer]) => (
                        <tr key={permission as string}>
                          <td className="border border-slate-200 px-3 py-2 text-[11px] text-slate-700">{permission as string}</td>
                          <td className="border border-slate-200 px-3 py-2 text-center"><PermissionIcon allowed={Boolean(admin)} /></td>
                          <td className="border border-slate-200 px-3 py-2 text-center"><PermissionIcon allowed={Boolean(analyst)} /></td>
                          <td className="border border-slate-200 px-3 py-2 text-center"><PermissionIcon allowed={Boolean(viewer)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1">
                <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={15} /></button>
                {[1, 2, 3, 4, 5].map((number) => (
                  <button key={number} type="button" onClick={() => setPage(number)} className={`flex h-8 w-8 items-center justify-center rounded-md border text-[11px] font-medium ${page === number ? "border-[#D2691E] bg-[#D2691E] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{number}</button>
                ))}
                <button type="button" onClick={() => setPage(page + 1)} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600"><ChevronRight size={15} /></button>
              </div>
            </section>
          )}


          {nav === "account" && (
            <section className="min-w-0">
              <div className="mb-6">
                <h1 className="text-[29px] font-semibold tracking-[-0.025em] text-slate-950">Account Profile</h1>
                <p className="mt-1.5 text-[14px] text-slate-500">Manage your personal information and preferences</p>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
                <SectionCard title="Profile Information">
                  <div className="grid gap-7 md:grid-cols-[132px_minmax(0,1fr)]">
                    <div className="flex flex-col items-center">
                      <div className="flex h-[108px] w-[108px] items-center justify-center rounded-full text-[36px] font-medium text-white" style={{ backgroundColor: ORANGE }}>AP</div>
                      <button type="button" className="mt-4 inline-flex h-[36px] items-center gap-2 rounded-[7px] border border-[#D2691E] px-3 text-[12px] font-medium text-[#D2691E] hover:bg-[#FFF5EF]">
                        <Camera size={14} /> Change Photo
                      </button>
                      <button type="button" className="mt-2 text-[12px] font-medium text-[#D2691E] hover:underline">Remove</button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <InputField label="Full Name" value={fullName} onChange={setFullName} />
                      <InputField label="Email" value={email} onChange={setEmail} type="email" />
                      <InputField label="Role / Designation" value={role} onChange={setRole} />
                      <SelectField label="Department" value={department} options={["Space Technology", "Remote Sensing", "Geospatial Intelligence", "Research & Development"]} onChange={setDepartment} />
                      <div className="sm:col-span-2">
                        <InputField label="Phone Number" value={phone} onChange={setPhone} type="tel" />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Organization Details">
                  <div className="rounded-lg bg-slate-50">
                    <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[13px] text-slate-600">Organization</span>
                      <span className="text-right text-[12px] font-medium text-slate-800">National Technical Research Organisation</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                      <span className="text-[13px] text-slate-600">Employee ID</span>
                      <span className="font-mono text-[12px] text-slate-800">NTRO-AN-02871</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                      <span className="text-[13px] text-slate-600">Clearance Level</span>
                      <span className="rounded-md bg-[#FFF2D9] px-3 py-1.5 text-[11px] font-medium text-[#B7791F]">Level 3 - Confidential</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-4">
                      <span className="text-[13px] text-slate-600">Region / Base Assigned</span>
                      <span className="text-[12px] font-medium text-slate-800">New Delhi, India</span>
                    </div>
                  </div>
                </SectionCard>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[0.98fr_1.02fr]">
                <SectionCard title="Preferences">
                  <div className="space-y-0">
                    <div className="flex items-center justify-between border-b border-slate-100 py-4">
                      <div className="text-[13px] font-medium text-slate-700">Dark Mode</div>
                      <CustomToggle enabled={darkMode} onToggle={() => setDarkMode(!darkMode)} />
                    </div>
                    <div className="flex flex-col gap-2 border-b border-slate-100 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-[13px] font-medium text-slate-700">Email Digest Frequency</div>
                      <div className="relative w-full sm:w-[240px]">
                        <select value={emailDigest} onChange={(e) => setEmailDigest(e.target.value)} className="h-[42px] w-full appearance-none rounded-[7px] border border-slate-200 bg-white px-3 pr-10 text-[13px] outline-none focus:border-[#D2691E]">
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Never</option>
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 border-b border-slate-100 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-[13px] font-medium text-slate-700">Default Landing Page</div>
                      <div className="relative w-full sm:w-[240px]">
                        <select value={landingPage} onChange={(e) => setLandingPage(e.target.value)} className="h-[42px] w-full appearance-none rounded-[7px] border border-slate-200 bg-white px-3 pr-10 text-[13px] outline-none focus:border-[#D2691E]">
                          <option>Dashboard</option>
                          <option>Project History</option>
                          <option>Processing Queue</option>
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-[13px] font-medium text-slate-700">Timezone</div>
                      <div className="relative w-full sm:w-[315px]">
                        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="h-[42px] w-full appearance-none rounded-[7px] border border-slate-200 bg-white px-3 pr-10 text-[13px] outline-none focus:border-[#D2691E]">
                          <option>(GMT+05:30) Asia/Kolkata (IST)</option>
                          <option>(GMT+00:00) Europe/London</option>
                          <option>(GMT-05:00) America/New_York</option>
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Session Info">
                  <div className="space-y-0">
                    <div className="flex items-center gap-4 border-b border-slate-100 py-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                        <Clock3 size={17} className="text-slate-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] text-slate-500">Last Login</div>
                        <div className="mt-1 text-[13px] font-medium text-slate-800">21 May 2024, 11:30 AM IST</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 border-b border-slate-100 py-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                        <Monitor size={17} className="text-slate-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] text-slate-500">Device / Browser</div>
                        <div className="mt-1 text-[13px] font-medium text-slate-800">Windows 11 / Chrome 124.0.0.0</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 border-b border-slate-100 py-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                        <MapPin size={17} className="text-slate-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] text-slate-500">IP Location</div>
                        <div className="mt-1 text-[13px] font-medium text-slate-800">103.***.**.45 (New Delhi, India)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 py-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                        <ShieldCheck size={17} className="text-slate-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] text-slate-500">Active Session</div>
                      </div>
                      <span className="rounded-md bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">Current Device</span>
                    </div>
                    <button type="button" onClick={() => window.location.href = '/login'} className="mt-2 flex h-[43px] w-full items-center justify-center gap-2 rounded-[7px] border border-red-300 text-[13px] font-medium text-red-600 transition hover:bg-red-50">
                      <LogOut size={16} /> Log out of all devices
                    </button>
                  </div>
                </SectionCard>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" className="h-[44px] min-w-[145px] rounded-[7px] border border-slate-300 bg-white px-6 text-[13px] font-medium text-slate-800 transition hover:bg-slate-50">Cancel</button>
                <button type="button" onClick={() => console.log("Save Profile")} className="inline-flex h-[44px] min-w-[185px] items-center justify-center gap-2 rounded-[7px] px-6 text-[13px] font-semibold text-white shadow-sm transition hover:brightness-95" style={{ backgroundColor: ORANGE }}>
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </section>
          )}

          {nav === "model" && (
          <>
          <div>
            <h2 className="text-[20px] font-semibold text-ink">Model Preferences</h2>
            <p className="text-[13.5px] text-muted">Configure default models and processing behavior for new enhancement jobs.</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
            {/* Default model */}
            <Card className="p-5">
              <div className="flex items-center gap-1.5 mb-4"><h3 className="text-[15px] font-semibold">Default Super-Resolution Model</h3><Info size={13} className="text-muted" /></div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {data.models.map((m) => {
                  const Icon = MODEL_ICONS[m.key];
                  const active = model === m.key;
                  return (
                    <button key={m.key} onClick={() => setModel(m.key)}
                      className={cn("text-left rounded-xl border p-3 relative transition",
                        active ? "border-primary bg-primary-50/40 ring-1 ring-primary/30" : "border-line hover:border-line-strong")}>
                      <span className={cn("absolute left-3 top-3 h-4 w-4 rounded-full border grid place-items-center", active ? "border-primary" : "border-line-strong")}>
                        {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </span>
                      <div className="flex justify-center my-3"><Icon size={30} className={active ? "text-primary" : "text-teal"} /></div>
                      <div className="text-center text-[14px] font-semibold text-ink">{m.name}</div>
                      <div className="text-center text-[11px] text-muted mt-1 leading-snug min-h-[48px]">{m.description}</div>
                      <div className="mt-2 pt-2 border-t border-line text-[11.5px] text-muted">Avg. Time</div>
                      <div className="text-[12.5px] text-ink-soft">⏱ {m.avg_time}</div>
                      <div className="text-[11.5px] text-muted mt-1.5">Accuracy</div>
                      <div className="mt-0.5"><RatingChip rating={m.accuracy} /></div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Default processing params */}
            <Card className="p-5">
              <div className="flex items-center gap-1.5 mb-4"><h3 className="text-[15px] font-semibold">Default Processing Parameters</h3><Info size={13} className="text-muted" /></div>
              <div className="mb-4">
                <label className="field-label">Target Resolution</label>
                <div className="relative">
                  <select className="select" defaultValue={data.target_resolution}><option>2.5 m / pixel</option><option>5 m / pixel</option><option>10 m / pixel</option></select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              </div>
              <div className="mb-4">
                <label className="field-label">Default Band Combination</label>
                <div className="flex flex-wrap gap-4">
                  <Checkbox checked={bands.rgb} onChange={(v) => setBands((b) => ({ ...b, rgb: v }))} label="RGB (B2, B3, B4)" />
                  <Checkbox checked={bands.nir} onChange={(v) => setBands((b) => ({ ...b, nir: v }))} label="NIR (B8)" />
                  <Checkbox checked={bands.swir} onChange={(v) => setBands((b) => ({ ...b, swir: v }))} label="SWIR (B11, B12)" />
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-t border-line">
                <span className="text-[13.5px] text-ink-soft flex items-center gap-1">Auto Cloud Masking <Info size={12} className="text-muted" /></span>
                <Toggle checked={cloudMask} onChange={setCloudMask} />
              </div>
              <div className="flex items-center justify-between py-3 border-t border-line">
                <span className="text-[13.5px] text-ink-soft flex items-center gap-1">Uncertainty Map Generation <Info size={12} className="text-muted" /></span>
                <Toggle checked={uncertainty} onChange={setUncertainty} />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Compute resources */}
            <Card className="p-5">
              <div className="flex items-center gap-1.5 mb-4"><h3 className="text-[15px] font-semibold">Compute Resources</h3><Info size={13} className="text-muted" /></div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-ink-soft">GPU Cluster Allocation</span>
                <span className="text-[12.5px] font-semibold text-primary border border-primary/40 rounded-md px-2 py-0.5">{GPU_STEPS[gpuIdx]} GPU</span>
              </div>
              <input type="range" min={0} max={3} step={1} value={gpuIdx} onChange={(e) => setGpuIdx(Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-[11px] mt-1">
                {GPU_LABELS.map((l, i) => <span key={l} className={cn(i === gpuIdx ? "text-primary font-medium" : "text-muted")}>{l}</span>)}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-5">
                <div>
                  <div className="text-[13px] text-ink-soft mb-2 flex items-center gap-1">Priority Queue <Info size={12} className="text-muted" /></div>
                  <div className="inline-flex rounded-lg overflow-hidden border border-line-strong">
                    <button onClick={() => setPriority("standard")} className={cn("px-4 h-10 text-[13px] font-medium", priority === "standard" ? "bg-primary text-white" : "text-ink-soft")}>Standard</button>
                    <button onClick={() => setPriority("high")} className={cn("px-4 h-10 text-[13px] font-medium", priority === "high" ? "bg-primary text-white" : "text-ink-soft")}>High Priority</button>
                  </div>
                </div>
                <div className="rounded-lg bg-canvas/60 border border-line p-3 flex items-center gap-3">
                  <div>
                    <div className="text-[12px] text-muted">Estimated Cost / Job</div>
                    <div className="text-[20px] font-semibold text-ink">~ ₹{(data.estimated_cost_inr * (priority === "high" ? 1.5 : 1) * (GPU_STEPS[gpuIdx] / 2)).toFixed(2)}</div>
                    <div className="text-[11px] text-muted">({GPU_STEPS[gpuIdx]} GPU • ~18 min)</div>
                  </div>
                  <Database size={26} className="text-ink-soft ml-auto" />
                </div>
              </div>
            </Card>

            {/* Data sources */}
            <Card className="p-5">
              <div className="flex items-center gap-1.5 mb-4"><h3 className="text-[15px] font-semibold">Data Source Preferences</h3><Info size={13} className="text-muted" /></div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 text-[12px] text-muted border-b border-line pb-2">
                <span>Data Source</span><span>Status</span><span>Actions</span>
              </div>
              {data.data_sources.map((ds) => (
                <div key={ds.id} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center py-3 border-b border-line">
                  <div className="flex items-center gap-2.5">
                    <span className="h-9 w-9 rounded-lg bg-canvas grid place-items-center"><Satellite size={17} className="text-teal" /></span>
                    <div>
                      <div className="text-[13.5px] font-medium text-ink">{ds.name}</div>
                      <div className="text-[11.5px] text-muted">{ds.detail}</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-success"><CheckCircle2 size={15} /> Connected</span>
                  <button className="text-[13px] text-primary font-medium">Manage</button>
                </div>
              ))}
              <button className="mt-4 w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg border-2 border-dashed border-primary/40 text-primary text-[13.5px] font-medium hover:bg-primary-50 transition">
                <Plus size={16} /> Add New Data Source
              </button>
            </Card>
          </div>

          {/* Save bar */}
          <div className="flex justify-end gap-3">
            {saved && <span className="self-center text-[13px] text-success">Settings saved ✓</span>}
            <Button variant="secondary">Reset to Defaults</Button>
            <Button onClick={save} disabled={saving}><Save size={16} /> {saving ? "Saving…" : "Save Changes"}</Button>
          </div>
          </>
          )}
        </div>
      </div>

      {/* GENERATE API KEY MODAL */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[440px] rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-[15px] font-semibold">Generate New API Key</h3>
                <p className="mt-1 text-[11px] text-slate-500">Create a new key for API access.</p>
              </div>
              <button type="button" onClick={() => setShowGenerateModal(false)} className="rounded-lg p-2 hover:bg-slate-100"><X size={17} /></button>
            </div>
            <div className="p-5">
              <label className="mb-2 block text-[12px] font-medium text-slate-700">Key Name</label>
              <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production Integration" className="h-[42px] w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none focus:border-[#D2691E] focus:ring-2 focus:ring-[#D2691E]/10" />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button type="button" onClick={() => setShowGenerateModal(false)} className="h-[38px] rounded-md border border-slate-300 px-4 text-[12px] font-medium">Cancel</button>
              <button type="button" onClick={generateApiKey} className="h-[38px] rounded-md px-4 text-[12px] font-semibold text-white" style={{ backgroundColor: ORANGE }}>Generate Key</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD WEBHOOK MODAL */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[470px] rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-[15px] font-semibold">Add Webhook</h3>
                <p className="mt-1 text-[11px] text-slate-500">Configure an endpoint for भू DRISTI events.</p>
              </div>
              <button type="button" onClick={() => setShowWebhookModal(false)} className="rounded-lg p-2 hover:bg-slate-100"><X size={17} /></button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-[12px] font-medium text-slate-700">Webhook Name</label>
                <input value={newWebhookName} onChange={(e) => setNewWebhookName(e.target.value)} placeholder="e.g. Job Completion Notifier" className="h-[42px] w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none focus:border-[#D2691E]" />
              </div>
              <div>
                <label className="mb-2 block text-[12px] font-medium text-slate-700">Endpoint URL</label>
                <input value={newWebhookUrl} onChange={(e) => setNewWebhookUrl(e.target.value)} placeholder="https://example.gov.in/webhook" className="h-[42px] w-full rounded-lg border border-slate-200 px-3 font-mono text-[12px] outline-none focus:border-[#D2691E]" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button type="button" onClick={() => setShowWebhookModal(false)} className="h-[38px] rounded-md border border-slate-300 px-4 text-[12px] font-medium">Cancel</button>
              <button type="button" onClick={addWebhook} className="h-[38px] rounded-md px-4 text-[12px] font-semibold text-white" style={{ backgroundColor: ORANGE }}>Add Webhook</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD DATA SOURCE MODAL */}
      {showAddSourceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[470px] rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-[15px] font-semibold">Add New Data Source</h3>
                <p className="mt-1 text-[11px] text-slate-500">Connect a satellite imagery or storage provider.</p>
              </div>
              <button type="button" onClick={() => setShowAddSourceModal(false)} className="rounded-lg p-2 hover:bg-slate-100"><X size={17} /></button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-[11px] font-medium text-slate-700">Data Source Name</label>
                <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="e.g. Regional EO Provider" className="h-[40px] w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-[#D2691E]" />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-medium text-slate-700">Source Type</label>
                <div className="relative">
                  <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className="h-[40px] w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-8 text-[12px] outline-none focus:border-[#D2691E]">
                    <option>Satellite Imagery Provider</option><option>Reference Dataset</option><option>Cloud Storage</option><option>Custom API</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-[10px] leading-5 text-slate-600">
                New external connections should be configured with appropriate API credentials before they are used for ingestion.
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button type="button" onClick={() => setShowAddSourceModal(false)} className="h-[38px] rounded-md border border-slate-300 px-4 text-[11px] font-medium">Cancel</button>
              <button type="button" onClick={handleAddSource} className="h-[38px] rounded-md px-4 text-[11px] font-semibold text-white" style={{ backgroundColor: ORANGE }}>Add Data Source</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD REFERENCE DATASET MODAL */}
      {showDatasetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[470px] rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-[15px] font-semibold">Add Reference Dataset</h3>
                <p className="mt-1 text-[11px] text-slate-500">Upload a high-resolution validation reference.</p>
              </div>
              <button type="button" onClick={() => setShowDatasetModal(false)} className="rounded-lg p-2 hover:bg-slate-100"><X size={17} /></button>
            </div>
            <div className="p-5">
              <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-8 hover:border-[#D2691E]">
                <Upload size={28} className="text-[#D2691E]" />
                <div className="mt-3 text-[12px] font-semibold text-slate-700">Drop GeoTIFF or reference imagery here</div>
                <div className="mt-1 text-[10px] text-slate-500">Maximum supported upload depends on deployment limits.</div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button type="button" onClick={() => setShowDatasetModal(false)} className="h-[38px] rounded-md border border-slate-300 px-4 text-[11px] font-medium">Cancel</button>
              <button type="button" onClick={() => { setShowDatasetModal(false); alert("Reference dataset upload flow opened."); }} className="h-[38px] rounded-md px-4 text-[11px] font-semibold text-white" style={{ backgroundColor: ORANGE }}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {planOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[550px] rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div><h3 className="text-[16px] font-semibold">Change Plan</h3><p className="mt-1 text-[10px] text-slate-500">Contact your account manager to modify the government-tier subscription.</p></div>
              <button type="button" onClick={() => setPlanOpen(false)} className="rounded-lg p-2 hover:bg-slate-100"><X size={17} /></button>
            </div>
            <div className="space-y-3 p-5">
              {[
                { name: "Enterprise - Government Tier", detail: "Current plan · 10 TB · 8 GPU · Unlimited jobs" },
                { name: "Enterprise - Extended Tier", detail: "20 TB · 16 GPU · Unlimited jobs · Priority support" },
                { name: "Research Tier", detail: "5 TB · 4 GPU · Standard support" },
              ].map((plan, index) => (
                <button type="button" key={plan.name} className={`w-full rounded-lg border p-4 text-left ${index === 0 ? "border-[#D2691E] bg-[#FFF7F2]" : "border-slate-200 hover:border-slate-300"}`}>
                  <div className="text-[12px] font-semibold">{plan.name}</div>
                  <div className="mt-1 text-[10px] text-slate-500">{plan.detail}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button type="button" onClick={() => setPlanOpen(false)} className="h-[38px] rounded-md border border-slate-300 px-4 text-[11px] font-medium">Cancel</button>
              <button type="button" onClick={() => { setPlanOpen(false); setContactOpen(true); }} className="h-[38px] rounded-md px-4 text-[11px] font-semibold text-white bg-[#D2691E]">Contact Account Manager</button>
            </div>
          </div>
        </div>
      )}

      {contactOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[470px] rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div><h3 className="text-[16px] font-semibold">Account Manager</h3><p className="mt-1 text-[10px] text-slate-500">Submit a request for plan or storage changes.</p></div>
              <button type="button" onClick={() => setContactOpen(false)} className="rounded-lg p-2 hover:bg-slate-100"><X size={17} /></button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-[11px] font-medium text-slate-700">Request Type</label>
                <select className="h-[40px] w-full rounded-md border border-slate-200 bg-white px-3 text-[12px] outline-none focus:border-[#D2691E]">
                  <option>Storage Increase</option><option>Plan Change</option><option>Additional GPU Capacity</option><option>Billing Question</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-medium text-slate-700">Message</label>
                <textarea rows={4} placeholder="Describe your request..." className="w-full resize-none rounded-md border border-slate-200 p-3 text-[12px] outline-none focus:border-[#D2691E]" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button type="button" onClick={() => setContactOpen(false)} className="h-[38px] rounded-md border border-slate-300 px-4 text-[11px] font-medium">Cancel</button>
              <button type="button" onClick={() => { setContactOpen(false); alert("Request submitted."); }} className="h-[38px] rounded-md px-4 text-[11px] font-semibold text-white bg-[#D2691E]">Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
