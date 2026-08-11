"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CrudModalProvider } from "@/context/CrudModalContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CrudModalProvider>
        {children}
      </CrudModalProvider>
    </AuthProvider>
  );
}

