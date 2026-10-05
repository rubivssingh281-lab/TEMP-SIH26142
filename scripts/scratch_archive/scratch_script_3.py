import re

with open('frontend/src/app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add new imports
content = content.replace('import { ChevronRight, ChevronLeft, Search, Mail, X, Check, MoreVertical, UserRound } from "lucide-react";', 
'import { ChevronRight, ChevronLeft, Search, Mail, X, Check, MoreVertical, UserRound, CircleCheck, Copy, ExternalLink, Eye, Link2, Pencil, Trash2, Webhook, RefreshCw } from "lucide-react";')

api_components = """
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

export default function SettingsPage() {
"""
content = content.replace("export default function SettingsPage() {", api_components)

api_state_hook = """
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
"""
content = content.replace('  const ORANGE = "#D2691E";', '  const ORANGE = "#D2691E";\n' + api_state_hook)

api_content = """
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
"""
content = content.replace('        {/* Content */}\n        <div className="space-y-5">', '        {/* Content */}\n        <div className="space-y-5">\n' + api_content)

modals = """
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
                <p className="mt-1 text-[11px] text-slate-500">Configure an endpoint for TerraSharp events.</p>
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
"""
content = content.replace("    </div>\n  );\n}\n", modals + "    </div>\n  );\n}\n")

with open('frontend/src/app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
