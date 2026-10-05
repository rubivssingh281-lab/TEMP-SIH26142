"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, Loader2, X } from "lucide-react";

export type ToastKind = "success" | "error" | "info" | "loading";
export interface ToastItem { id: number; message: string; kind: ToastKind; }

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

function emit() {
  for (const l of listeners) l(items);
}

/** Show a toast. Returns an id you can pass to dismiss()/update the toast. */
export function toast(message: string, kind: ToastKind = "success", ttl = 3200): number {
  const id = nextId++;
  items = [...items, { id, message, kind }];
  emit();
  if (kind !== "loading" && ttl > 0) setTimeout(() => dismiss(id), ttl);
  return id;
}

export function updateToast(id: number, message: string, kind: ToastKind = "success", ttl = 3200): void {
  items = items.map((t) => (t.id === id ? { ...t, message, kind } : t));
  emit();
  if (kind !== "loading" && ttl > 0) setTimeout(() => dismiss(id), ttl);
}

export function dismiss(id: number): void {
  items = items.filter((t) => t.id !== id);
  emit();
}

const ICON = { success: CheckCircle2, error: AlertTriangle, info: Info, loading: Loader2 };
const TONE: Record<ToastKind, string> = {
  success: "text-success",
  error: "text-danger",
  info: "text-teal",
  loading: "text-primary",
};

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>(items);
  useEffect(() => {
    const l: Listener = (i) => setList([...i]);
    listeners.add(l);
    setList([...items]);
    return () => void listeners.delete(l);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-[340px] max-w-[calc(100vw-2rem)]">
      {list.map((t) => {
        const Icon = ICON[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-line bg-surface shadow-pop px-3.5 py-3 animate-toast-in"
          >
            <Icon size={18} className={`${TONE[t.kind]} shrink-0 mt-0.5 ${t.kind === "loading" ? "animate-spin" : ""}`} />
            <span className="text-[13px] text-ink leading-snug flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink transition -mt-0.5" aria-label="Dismiss">
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
