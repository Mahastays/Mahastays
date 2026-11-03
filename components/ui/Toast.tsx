"use client";

import React, { useState, useEffect, useCallback } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms, default 4000
}

interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

// Global Event Emitter for Toast without React context boilerplate
type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  show(options: ToastOptions): string {
    const id = options.id || Math.random().toString(36).substring(2, 9);
    const type = options.type || "info";
    const duration = options.duration ?? (type === "error" ? 5000 : 4000);

    const toastItem: ToastItem = {
      ...options,
      id,
      type,
      duration,
      createdAt: Date.now(),
    };

    // Keep max 3 toasts on screen simultaneously
    this.toasts = [toastItem, ...this.toasts.slice(0, 2)];
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }

  success(message: string, title?: string, duration?: number) {
    return this.show({ type: "success", message, title: title || "Success", duration });
  }

  error(message: string, title?: string, duration?: number) {
    return this.show({ type: "error", message, title: title || "Error", duration });
  }

  warning(message: string, title?: string, duration?: number) {
    return this.show({ type: "warning", message, title: title || "Warning", duration });
  }

  info(message: string, title?: string, duration?: number) {
    return this.show({ type: "info", message, title: title || "Notice", duration });
  }
}

export const toast = new ToastManager();

export function useToast() {
  return {
    show: useCallback((opts: ToastOptions) => toast.show(opts), []),
    success: useCallback((msg: string, title?: string, d?: number) => toast.success(msg, title, d), []),
    error: useCallback((msg: string, title?: string, d?: number) => toast.error(msg, title, d), []),
    warning: useCallback((msg: string, title?: string, d?: number) => toast.warning(msg, title, d), []),
    info: useCallback((msg: string, title?: string, d?: number) => toast.info(msg, title, d), []),
    dismiss: useCallback((id: string) => toast.dismiss(id), []),
  };
}

// Single Toast Card Component with countdown progress bar
function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (item.duration <= 0) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / item.duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [item.duration]);

  const styleConfig = {
    success: {
      badgeBg: "bg-emerald-500",
      badgeText: "text-white",
      badgeIcon: "✓",
      cardBorder: "border-emerald-200/90",
      cardBg: "bg-white/95",
      titleColor: "text-emerald-950",
      barColor: "bg-emerald-500",
      shadow: "shadow-[0_12px_36px_rgba(16,185,129,0.18)]",
    },
    error: {
      badgeBg: "bg-[#ea110d]",
      badgeText: "text-white",
      badgeIcon: "✕",
      cardBorder: "border-rose-200/90",
      cardBg: "bg-white/95",
      titleColor: "text-rose-950",
      barColor: "bg-[#ea110d]",
      shadow: "shadow-[0_12px_36px_rgba(234,17,13,0.18)]",
    },
    warning: {
      badgeBg: "bg-amber-500",
      badgeText: "text-white",
      badgeIcon: "!",
      cardBorder: "border-amber-200/90",
      cardBg: "bg-white/95",
      titleColor: "text-amber-950",
      barColor: "bg-amber-500",
      shadow: "shadow-[0_12px_36px_rgba(245,158,11,0.18)]",
    },
    info: {
      badgeBg: "bg-slate-900",
      badgeText: "text-white",
      badgeIcon: "ℹ",
      cardBorder: "border-slate-200/90",
      cardBg: "bg-white/95",
      titleColor: "text-slate-900",
      barColor: "bg-slate-900",
      shadow: "shadow-[0_12px_36px_rgba(15,23,42,0.14)]",
    },
  }[item.type];

  return (
    <div
      role="alert"
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${styleConfig.cardBorder} ${styleConfig.cardBg} ${styleConfig.shadow} backdrop-blur-md p-3.5 sm:p-4 transition-all duration-300 flex items-start gap-3 w-full shadow-lg`}
      style={{
        animation: "toastSlideInRight 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      {/* Icon Badge */}
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${styleConfig.badgeBg} ${styleConfig.badgeText} flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-xs`}
      >
        {styleConfig.badgeIcon}
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0 pr-1">
        {item.title && (
          <h5 className={`text-xs font-bold font-poppins tracking-tight ${styleConfig.titleColor}`}>
            {item.title}
          </h5>
        )}
        <p className="text-[12px] font-medium text-slate-700 leading-snug break-words mt-0.5">
          {item.message}
        </p>
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Close notification"
        className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors flex items-center justify-center shrink-0 cursor-pointer text-xs font-bold"
      >
        ✕
      </button>

      {/* Countdown Progress Bar along bottom */}
      {item.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100/80 overflow-hidden">
          <div
            className={`h-full ${styleConfig.barColor} transition-all duration-75 ease-linear rounded-r-full`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Global Toast Container to place in RootLayout
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe((updated) => {
      setToasts(updated);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastSlideInRight {
          0% {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          70% {
            transform: translateX(-4px) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
      <div
        className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[99999] pointer-events-none flex flex-col items-end gap-2.5 w-full max-w-[calc(100vw-32px)] sm:max-w-md"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={(id) => toast.dismiss(id)} />
        ))}
      </div>
    </>
  );
}

