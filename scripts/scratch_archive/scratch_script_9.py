import re

with open('frontend/src/app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix duplicate imports
content = content.replace(
    'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal, Activity, Upload, Wifi, AlertTriangle, Cloud, MessageSquare, Smartphone, LogIn, LogOut, Monitor, MapPin, LockKeyhole, Download, UserX } from "lucide-react";',
    'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal, Activity, Upload, Wifi, AlertTriangle, Cloud, MessageSquare, Smartphone, LogIn, LockKeyhole, Download, UserX } from "lucide-react";'
)

# Instead of defining SectionCardSecurity, maybe I can just delete the duplicate `SectionCard` and reuse the existing one?
# The existing one takes `{ title, children, className = "" }: any`
# The new one takes `{ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string; }`
# I'll just remove the newly injected SectionCard completely!

section_card_original = """function SectionCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string; }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] ${className}`}>
      <div className="border-b border-slate-100 px-4 py-4"><h2 className="text-[14px] font-semibold text-slate-900">{title}</h2></div>
      <div className="p-4">{children}</div>
    </section>
  );
}"""

content = content.replace(section_card_original, "")

with open('frontend/src/app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
