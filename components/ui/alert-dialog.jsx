"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ── Smart Konstruksi Design Tokens ─────────────────────────────────────────
const T = {
  primary: "#004f35",
  primaryLight: "rgba(0,79,53,0.08)",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  surfaceContainerLow: "#eff4ff",
  surfaceContainerHigh: "#dce9ff",
  error: "#ba1a1a",
  errorLight: "rgba(186,26,26,0.06)",
  warning: "#b45309",
  success: "#15803d",
  fontDisplay: "'Hanken Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontLabel: "'Geist', monospace",
}

function AlertDialog({
  ...props
}) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({
  ...props
}) {
  return (<AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />);
}

function AlertDialogPortal({
  ...props
}) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogOverlay({
  className,
  ...props
}) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm",
        "data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0",
        "duration-200",
        className
      )}
      {...props} />
  );
}

function AlertDialogContent({
  className,
  ...props
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-[9999] w-full -translate-x-1/2 -translate-y-1/2 gap-0",
          "rounded-2xl border-0 p-0",
          "bg-white",
          "shadow-[0_24px_60px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.08)]",
          "max-w-[440px]",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          "duration-200",
          className
        )}
        style={{ fontFamily: T.fontBody }}
        {...props} />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-3 p-6 pb-4 text-center sm:text-left", className)}
      style={{ fontFamily: T.fontBody }}
      {...props} />
  );
}

function AlertDialogFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end",
        "border-t border-[rgba(190,201,193,0.3)]",
        "bg-[#f8fafb] rounded-b-2xl",
        className
      )}
      {...props} />
  );
}

function AlertDialogMedia({
  className,
  ...props
}) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "mx-auto flex size-14 items-center justify-center rounded-2xl sm:mx-0",
        "bg-[rgba(186,26,26,0.08)]",
        className
      )}
      {...props} />
  );
}

function AlertDialogTitle({
  className,
  ...props
}) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "text-[20px] font-bold leading-tight tracking-tight",
        className
      )}
      style={{ fontFamily: T.fontDisplay, color: T.onSurface }}
      {...props} />
  );
}

function AlertDialogDescription({
  className,
  ...props
}) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-[14px] leading-relaxed text-balance", className)}
      style={{ fontFamily: T.fontBody, color: T.onSurfaceVariant }}
      {...props} />
  );
}

// ── Custom-styled Cancel & Action buttons (override shadcn defaults) ─────
function AlertDialogAction({
  className,
  children,
  loading = false,
  ...props
}) {
  return (
    <AlertDialogPrimitive.Action asChild>
      <button
        data-slot="alert-dialog-action"
        className={cn(
          "inline-flex items-center justify-center gap-2",
          "h-11 px-6 rounded-xl",
          "text-[14px] font-semibold",
          "bg-[#ba1a1a] text-white",
          "shadow-[0_2px_8px_rgba(186,26,26,0.25)]",
          "transition-all duration-150",
          "hover:bg-[#a01515] hover:shadow-[0_4px_12px_rgba(186,26,26,0.35)]",
          "focus:outline-none focus:ring-2 focus:ring-[#ba1a1a]/30 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
          "cursor-pointer",
          className
        )}
        style={{ fontFamily: T.fontLabel }}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <>
            <span
              className="material-symbols-outlined animate-spin"
              style={{ fontSize: "16px" }}
            >
              progress_activity
            </span>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    </AlertDialogPrimitive.Action>
  );
}

function AlertDialogCancel({
  className,
  children,
  ...props
}) {
  return (
    <AlertDialogPrimitive.Cancel asChild>
      <button
        data-slot="alert-dialog-cancel"
        className={cn(
          "inline-flex items-center justify-center",
          "h-11 px-6 rounded-xl",
          "text-[14px] font-semibold",
          "bg-white text-[#3f4943]",
          "border border-[#bec9c1]",
          "transition-all duration-150",
          "hover:bg-[#eff4ff] hover:border-[#6f7a72]",
          "focus:outline-none focus:ring-2 focus:ring-[#004f35]/20 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "cursor-pointer",
          className
        )}
        style={{ fontFamily: T.fontLabel }}
        {...props}
      >
        {children}
      </button>
    </AlertDialogPrimitive.Cancel>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}