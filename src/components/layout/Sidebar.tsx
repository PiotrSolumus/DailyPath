import { Home, Calendar, CheckSquare, Clock, FileText, Users, Settings, Crown, LogOut, FolderPlus } from "lucide-react";
import { useAuth } from "../../lib/contexts/AuthContext";
import { cn } from "../../lib/utils";
import type { Enums } from "../../db/database.types";
import { CreateTaskModal } from "../tasks/CreateTaskModal";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Enums<"app_role">[];
  badge?: number;
}

const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["employee", "manager", "admin"],
  },
  {
    label: "Plan dnia",
    href: "/plan",
    icon: Calendar,
    roles: ["employee", "manager", "admin"],
  },
  {
    label: "Zadania",
    href: "/tasks",
    icon: CheckSquare,
    roles: ["employee", "manager", "admin"],
  },
  {
    label: "Czas pracy",
    href: "/time-logs",
    icon: Clock,
    roles: ["employee", "manager", "admin"],
  },
  {
    label: "Raporty",
    href: "/reports",
    icon: FileText,
    roles: ["employee", "manager", "admin"],
  },
  {
    label: "Zespół",
    href: "/team",
    icon: Users,
    roles: ["manager", "admin"],
  },
  {
    label: "Zarządzanie",
    href: "/admin",
    icon: Crown,
    roles: ["admin"],
  },
  {
    label: "Ustawienia",
    href: "/settings",
    icon: Settings,
    roles: ["employee", "manager", "admin"],
  },
];

interface SidebarProps {
  currentPath?: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  const { user } = useAuth();

  // Show all items if no user (for demo), or filter by role
  const visibleItems = user ? navigationItems.filter((item) => item.roles.includes(user.app_role)) : navigationItems;

  const handleLogout = () => {
    window.location.href = "/logout";
  };

  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card" data-test-id="sidebar">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">DailyPath</h1>
      </div>

      {/* User Info or Login Prompt */}
      {user ? (
        <div className="border-b px-6 py-4">
          <div className="text-sm font-medium">{user.full_name}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
          {user.active_department && (
            <div className="mt-1 text-xs text-muted-foreground">Dział: {user.active_department.name}</div>
          )}
        </div>
      ) : (
        <div className="border-b px-6 py-4">
          <div className="text-sm text-muted-foreground">Nie jesteś zalogowany</div>
          <button
            onClick={handleLogin}
            className="mt-2 w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Zaloguj się
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4" data-test-id="sidebar-navigation">
        {/* Create Task Button */}
        <div className="mb-2">
          <CreateTaskModal />
        </div>

        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;

          return (
            <a
              key={item.href}
              href={item.href}
              data-test-id={`sidebar-nav-${item.href.replace("/", "") || "home"}`}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Logout (only if logged in) */}
      {user && (
        <div className="border-t p-4">
          <button
            onClick={handleLogout}
            data-test-id="sidebar-logout-button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span>Wyloguj</span>
          </button>
        </div>
      )}
    </aside>
  );
}
