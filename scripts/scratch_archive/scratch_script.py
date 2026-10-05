import re

with open('frontend/src/app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
new_imports = """
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
"""

content = content.replace('import { cn } from "@/lib/utils";', 'import { cn } from "@/lib/utils";\n' + new_imports)

# Add states
states_hook = """
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
"""
content = content.replace('const [saved, setSaved] = useState(false);', 'const [saved, setSaved] = useState(false);\n' + states_hook)

account_profile_content = """
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
                    <button type="button" className="mt-2 flex h-[43px] w-full items-center justify-center gap-2 rounded-[7px] border border-red-300 text-[13px] font-medium text-red-600 transition hover:bg-red-50">
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
"""

content = content.replace('        {/* Content */}\n        <div className="space-y-5">', '        {/* Content */}\n        <div className="space-y-5">\n' + account_profile_content)

# Wrap existing model content in {nav === "model" && (<> ... </>)}
content = content.replace('          <div>\n            <h2 className="text-[20px] font-semibold text-ink">Model Preferences</h2>', '          {nav === "model" && (\n          <>\n          <div>\n            <h2 className="text-[20px] font-semibold text-ink">Model Preferences</h2>')
content = content.replace('            <Button onClick={save} disabled={saving}><Save size={16} /> {saving ? "Saving…" : "Save Changes"}</Button>\n          </div>', '            <Button onClick={save} disabled={saving}><Save size={16} /> {saving ? "Saving…" : "Save Changes"}</Button>\n          </div>\n          </>\n          )}')

with open('frontend/src/app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
