"use client";

import { cn } from "@/lib/utils";

export function Logo({ showText = true, onDark = false }: { showText?: boolean; onDark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/brand-logo.png"
        alt="भू DRISTI"
        width={36}
        height={36}
        className="shrink-0 select-none object-contain"
        draggable={false}
        // Falls back to the vector version only if brand-logo.png isn't present yet.
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.src.endsWith("/brand-logo.svg")) img.src = "/brand-logo.svg";
        }}
      />
      {showText && (
        <div className="leading-tight">
          <div className="text-[17px] font-semibold tracking-tight">
            <span className={onDark ? "text-white" : "text-ink"}>भू </span>
            <span className={onDark ? "text-white/80" : "text-primary"}>DRISTI</span>
          </div>
          <div className={cn("text-[11px] -mt-0.5", onDark ? "text-white/60" : "text-muted")}>AI Super-Resolution Platform</div>
        </div>
      )}
    </div>
  );
}
