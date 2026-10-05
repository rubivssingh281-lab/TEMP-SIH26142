import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="h-12 shrink-0 border-t border-line bg-surface flex items-center px-6 text-[12.5px] text-muted">
      <span>भू DRISTI v2.1.0</span>
      <div className="mx-auto flex items-center gap-3">
        <span>NTRO Internal Use Only</span>
        <span className="text-line-strong">|</span>
        <span>All data is classified</span>
      </div>
      <span className="flex items-center gap-1.5 text-teal">
        <ShieldCheck size={15} />
        Secure Session
        <span className="ml-1 h-2 w-2 rounded-full bg-success-soft" />
      </span>
    </footer>
  );
}
