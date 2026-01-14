import type { ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/react";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthContext";
import { ToastProvider } from "./ToastProvider";
import { ThemeProvider } from "./ThemeContext";
import type { UserMeDTO } from "../../types";

interface AppProvidersProps {
  children: ReactNode;
  initialUser?: UserMeDTO | null;
}

export function AppProviders({ children, initialUser }: AppProvidersProps) {
  return (
    <NuqsAdapter>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider initialUser={initialUser}>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </NuqsAdapter>
  );
}
