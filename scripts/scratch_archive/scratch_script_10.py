import re

with open('frontend/src/app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add new imports
content = content.replace(
    'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal, Activity, Upload, Wifi, AlertTriangle, Cloud, MessageSquare, Smartphone, LogIn, LockKeyhole, Download, UserX } from "lucide-react";',
    'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal, Activity, Upload, Wifi, AlertTriangle, Cloud, MessageSquare, Smartphone, LogIn, LockKeyhole, Download, UserX, ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, PackageCheck, ReceiptText, Sparkles, WalletCards, HardDrive, Crown, Headphones, Infinity, Cpu } from "lucide-react";'
)

billing_components = """
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
"""
content = content.replace("export default function SettingsPage() {", billing_components)

billing_state_hook = """
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
"""
content = content.replace('  const ORANGE = "#D2691E";', '  const ORANGE = "#D2691E";\n' + billing_state_hook)


billing_content = """
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
                            <td className="px-2 py-3 text-right"><button type="button" className="text-slate-600 hover:text-[#D2691E]" onClick={() => alert(`Downloading ${invoice.id}`)}><Download size={14} /></button></td>
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
"""
content = content.replace('        {/* Content */}\n        <div className="space-y-5">', '        {/* Content */}\n        <div className="space-y-5">\n' + billing_content)


billing_modals = """
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
"""

last_part = """    </div>
  );
}
"""

if content.endswith(last_part):
    content = content[:-len(last_part)] + billing_modals + last_part
else:
    content = last_part.join(content.rsplit(last_part, 1))
    content = content.replace(last_part, billing_modals + last_part)


with open('frontend/src/app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
