import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { AppProviders } from "../../lib/contexts/AppProviders";
import type { UserMeDTO } from "../../types";

interface AppLayoutProps {
  children: ReactNode;
  initialUser?: UserMeDTO | null;
  currentPath?: string;
}

export function AppLayout({ children, initialUser, currentPath }: AppLayoutProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar currentPath={currentPath} />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </AppProviders>
  );
}

