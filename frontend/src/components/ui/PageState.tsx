"use client";

import { Loader2, AlertTriangle } from "lucide-react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid place-items-center py-24 text-muted">
      <Loader2 className="animate-spin mb-3" size={26} />
      <span className="text-[14px]">{label}</span>
    </div>
  );
}

export function ErrorState({ error }: { error: Error }) {
  return (
    <div className="grid place-items-center py-24 text-danger">
      <AlertTriangle className="mb-3" size={26} />
      <span className="text-[14px]">Failed to load data: {error.message}</span>
    </div>
  );
}
