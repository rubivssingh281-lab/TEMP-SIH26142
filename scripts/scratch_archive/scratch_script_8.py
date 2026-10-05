import re

with open('frontend/src/app/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix duplicate imports
content = content.replace(
    'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal, Activity, Upload, Wifi, AlertTriangle, Cloud, MessageSquare, Smartphone, LogIn, LogOut, Monitor, MapPin, LockKeyhole, Download, UserX } from "lucide-react";',
    'Trash2, Webhook, RefreshCw, KeyRound, SlidersHorizontal, Activity, Upload, Wifi, AlertTriangle, Cloud, MessageSquare, Smartphone, LogIn, LockKeyhole, Download, UserX } from "lucide-react";'
)

# Rename SectionCard -> SectionCardSecurity in the newly injected block
# The newly injected block starts after ToggleNotification

# I will just replace the exact SectionCard I added:
section_card_original = """function SectionCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string; }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] ${className}`}>
      <div className="border-b border-slate-100 px-4 py-4"><h2 className="text-[14px] font-semibold text-slate-900">{title}</h2></div>
      <div className="p-4">{children}</div>
    </section>
  );
}"""

section_card_new = """function SectionCardSecurity({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string; }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.035)] ${className}`}>
      <div className="border-b border-slate-100 px-4 py-4"><h2 className="text-[14px] font-semibold text-slate-900">{title}</h2></div>
      <div className="p-4">{children}</div>
    </section>
  );
}"""

content = content.replace(section_card_original, section_card_new)

# Now I need to replace all `<SectionCard ` with `<SectionCardSecurity ` inside the security block.
# I'll just replace `<SectionCard title=` to `<SectionCardSecurity title=`
content = content.replace('<SectionCard title="Password">', '<SectionCardSecurity title="Password">')
content = content.replace('<SectionCard title="Two-Factor Authentication (2FA)">', '<SectionCardSecurity title="Two-Factor Authentication (2FA)">')
content = content.replace('<SectionCard title="Active Sessions">', '<SectionCardSecurity title="Active Sessions">')
content = content.replace('<SectionCard title="Login History">', '<SectionCardSecurity title="Login History">')
content = content.replace('<SectionCard title="Access Restrictions">', '<SectionCardSecurity title="Access Restrictions">')
content = content.replace('</SectionCard>', '</SectionCardSecurity>')
# Make sure to revert </SectionCard> for other sections if I accidentally replaced them.
# The previous tabs didn't use `</SectionCard>` but `</SectionCard>` might exist in Model Preferences.
# Let's check.
