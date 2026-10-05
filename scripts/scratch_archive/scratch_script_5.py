import re

with open('frontend/src/app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add new imports
content = content.replace(
    'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal, Activity, Upload, Wifi, AlertTriangle, Cloud } from "lucide-react";',
    'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal, Activity, Upload, Wifi, AlertTriangle, Cloud, MessageSquare, Smartphone, ShieldCheck } from "lucide-react";'
)

notifications_components = """
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

export default function SettingsPage() {
"""
content = content.replace("export default function SettingsPage() {", notifications_components)

notifications_state_hook = """
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
"""
content = content.replace('  const ORANGE = "#D2691E";', '  const ORANGE = "#D2691E";\n' + notifications_state_hook)


notifications_content = """
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
                            <div className="text-[11px] font-semibold">TerraSharp Atlas</div>
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
                          <div className="text-[11px] leading-5 text-slate-800">✅ TerraSharp Atlas:<br />Job SR_v2_20240521 completed successfully.<br />Resolution: 2.5 m/pixel.</div>
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
"""
content = content.replace('        {/* Content */}\n        <div className="space-y-5">', '        {/* Content */}\n        <div className="space-y-5">\n' + notifications_content)

with open('frontend/src/app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
