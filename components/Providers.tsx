"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </AuthProvider>
    </ErrorBoundary>
  );
}
