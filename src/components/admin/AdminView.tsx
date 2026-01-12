import { useState } from "react";
import { Users, Building2, Settings, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { UsersManagement } from "./UsersManagement";
import { DepartmentsManagement } from "./DepartmentsManagement";

type AdminTab = "users" | "departments" | "settings" | "system";

export function AdminView() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  const tabs = [
    {
      id: "users" as AdminTab,
      label: "Użytkownicy",
      icon: Users,
      description: "Zarządzaj użytkownikami systemu",
    },
    {
      id: "departments" as AdminTab,
      label: "Działy",
      icon: Building2,
      description: "Zarządzaj strukturą organizacji",
    },
    {
      id: "settings" as AdminTab,
      label: "Ustawienia",
      icon: Settings,
      description: "Konfiguracja systemu",
    },
    {
      id: "system" as AdminTab,
      label: "System",
      icon: Database,
      description: "Informacje o systemie",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "outline"}
              className="h-auto justify-start p-4"
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs font-normal text-muted-foreground">{tab.description}</div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "users" && <UsersManagement />}
      {activeTab === "departments" && <DepartmentsManagement />}
      {activeTab === "settings" && <SystemSettings />}
      {activeTab === "system" && <SystemInfo />}
    </div>
  );
}

function SystemSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ustawienia systemowe</CardTitle>
        <CardDescription>Konfiguracja systemu DailyPath</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Ustawienia systemowe będą dostępne wkrótce.</p>
      </CardContent>
    </Card>
  );
}

function SystemInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacje o systemie</CardTitle>
        <CardDescription>Status i statystyki systemu</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium">Wersja</div>
            <div className="text-sm text-muted-foreground">1.0.0</div>
          </div>
          <div>
            <div className="text-sm font-medium">Status</div>
            <div className="text-sm text-muted-foreground">Operacyjny</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
