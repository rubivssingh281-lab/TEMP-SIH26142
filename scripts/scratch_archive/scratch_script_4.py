import re

with open('frontend/src/app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add new imports
content = content.replace(
    'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal } from "lucide-react";',
    'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal, Activity, Upload, Wifi, AlertTriangle, Cloud } from "lucide-react";'
)

data_components = """
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

export default function SettingsPage() {
"""
content = content.replace("export default function SettingsPage() {", data_components)

data_state_hook = """
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
"""
content = content.replace('  const ORANGE = "#D2691E";', '  const ORANGE = "#D2691E";\n' + data_state_hook)


data_content = """
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
"""
content = content.replace('        {/* Content */}\n        <div className="space-y-5">', '        {/* Content */}\n        <div className="space-y-5">\n' + data_content)

modals_data = """
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
"""

last_part = """    </div>
  );
}
"""

if content.endswith(last_part):
    content = content[:-len(last_part)] + modals_data + last_part
else:
    content = last_part.join(content.rsplit(last_part, 1))
    content = content.replace(last_part, modals_data + last_part)

with open('frontend/src/app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
