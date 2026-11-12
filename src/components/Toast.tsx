"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";

export interface ToastState {
  id: number;
  message: string;
  onUndo?: () => void;
}

const DURATION_MS = 6000;

export function Toast({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    // The live region stays mounted so screen readers announce each new message.
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 rounded-xl bg-[#1f1f1d] py-2.5 pl-4 pr-2 text-sm text-white shadow-2xl dark:bg-[#f0efec] dark:text-[#0b0b0b]"
        >
          <CheckCircle2 aria-hidden className="size-4 shrink-0 text-[#3fc23f] dark:text-[#006300]" />
          <span>{toast.message}</span>
          {toast.onUndo && (
            <button
              type="button"
              onClick={() => {
                toast.onUndo?.();
                onDismiss();
              }}
              className="rounded-md px-2 py-1 font-semibold text-[#9ec5f4] hover:bg-white/10 dark:text-[#1c5cab] dark:hover:bg-black/5"
            >
              Undo
            </button>
          )}
          <button type="button" onClick={onDismiss} aria-label="Dismiss" className="rounded-md p-1 opacity-70 hover:opacity-100">
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
