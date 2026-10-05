import re

with open('frontend/src/app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add new imports
content = content.replace(
    'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal, Activity, Upload, Wifi, AlertTriangle, Cloud, MessageSquare, Smartphone } from "lucide-react";',
    'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal, Activity, Upload, Wifi, AlertTriangle, Cloud, MessageSquare, Smartphone, LogIn, LogOut, Monitor, MapPin, LockKeyhole, Download, UserX } from "lucide-react";'
)

security_components = """
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

function SectionCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string; }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] ${className}`}>
      <div className="border-b border-slate-100 px-4 py-4"><h2 className="text-[14px] font-semibold text-slate-900">{title}</h2></div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ToggleSecurity({ enabled, onChange }: { enabled: boolean; onChange: () => void; }) {
  return (
    <button type="button" aria-pressed={enabled} onClick={onChange} className={`relative h-[22px] w-[40px] rounded-full transition-colors ${enabled ? "bg-emerald-600" : "bg-slate-300"}`}>
      <span className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-all ${enabled ? "left-[21px]" : "left-[3px]"}`} />
    </button>
  );
}

export default function SettingsPage() {
"""
content = content.replace("export default function SettingsPage() {", security_components)

security_state_hook = """
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
"""
content = content.replace('  const ORANGE = "#D2691E";', '  const ORANGE = "#D2691E";\n' + security_state_hook)


security_content = """
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
"""
content = content.replace('        {/* Content */}\n        <div className="space-y-5">', '        {/* Content */}\n        <div className="space-y-5">\n' + security_content)

with open('frontend/src/app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
