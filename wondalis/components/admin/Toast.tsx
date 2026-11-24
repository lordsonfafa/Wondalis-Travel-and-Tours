"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Kind = "success" | "error";
type ToastState = { id: number; message: string; kind: Kind } | null;

const ToastContext = createContext<(message: string, kind?: Kind) => void>(() => {});

/** Show a short message from any admin component: const toast = useToast(); toast("Saved"). */
export const useToast = () => useContext(ToastContext);

/**
 * Lives in the admin layout, so a toast survives page changes
 * (e.g. "Trip created" stays visible after redirecting to the trips list).
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const counter = useRef(0);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((message: string, kind: Kind = "success") => {
    clearTimeout(timer.current);
    setToast({ id: ++counter.current, message, kind });
    timer.current = setTimeout(() => setToast(null), kind === "error" ? 6000 : 4000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* Live region: screen readers announce whatever appears inside it. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-5 lg:bottom-8 lg:justify-end lg:px-10"
      >
        {toast && (
          <div
            key={toast.id}
            role={toast.kind === "error" ? "alert" : "status"}
            className={`animate-fade-up pointer-events-auto flex max-w-md items-center gap-3 rounded-full py-3 pl-4 pr-3 text-[15px] font-semibold leading-5 shadow-[0_16px_32px_-12px_rgba(11,42,36,0.45)] ${
              toast.kind === "error" ? "bg-kente-red text-ivory" : "bg-forest-900 text-ivory"
            }`}
          >
            <span
              aria-hidden
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm ${
                toast.kind === "error" ? "bg-ivory/20" : "bg-[#2e7d4f]"
              }`}
            >
              {toast.kind === "error" ? "!" : "✓"}
            </span>
            <span>{toast.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismiss}
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-lg leading-none text-ivory/80 hover:bg-ivory/15 hover:text-ivory"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}