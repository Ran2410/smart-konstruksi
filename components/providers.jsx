"use client";

import { SessionProvider } from "next-auth/react";
import { AppDialogProvider } from "@/components/app-dialog-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }) {
  return (
    <SessionProvider>
      <AppDialogProvider>{children}</AppDialogProvider>
      <Toaster position="top-right" richColors closeButton />
    </SessionProvider>
  );
}
