"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsent } from "@/components/CookieConsent";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SmoothScroll>
          {children}
          <CookieConsent />
        </SmoothScroll>
      </AuthProvider>
    </ErrorBoundary>
  );
}
