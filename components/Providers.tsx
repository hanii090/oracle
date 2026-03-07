"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsent } from "@/components/CookieConsent";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { migrateLocalStorage } from "@/lib/migration";

export function Providers({ children }: { children: React.ReactNode }) {
  // Run one-time Oracle → Sorca localStorage migration
  useEffect(() => {
    migrateLocalStorage();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SmoothScroll>
          {children}
          <CookieConsent />
          <SessionTimeoutWarning />
        </SmoothScroll>
      </AuthProvider>
    </ErrorBoundary>
  );
}
