import re

with open('frontend/src/app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add useMemo
content = content.replace('import { useState } from "react";', 'import { useState, useMemo } from "react";')

# Team components to insert before SettingsPage
team_components = """
import { ChevronRight, ChevronLeft, Search, Mail, X, Check, MoreVertical, UserRound } from "lucide-react";

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

export default function SettingsPage() {
"""
content = content.replace("export default function SettingsPage() {", team_components)

# Team state hook
team_state_hook = """
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
"""
content = content.replace('  const ORANGE = "#D2691E";', '  const ORANGE = "#D2691E";\n' + team_state_hook)

team_content = """
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
"""

content = content.replace('        {/* Content */}\n        <div className="space-y-5">', '        {/* Content */}\n        <div className="space-y-5">\n' + team_content)


with open('frontend/src/app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

