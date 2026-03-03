"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { SmoothScroll } from "@/components/SmoothScroll";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SmoothScroll>
        {children}
      </SmoothScroll>
    </AuthProvider>
  );
}
