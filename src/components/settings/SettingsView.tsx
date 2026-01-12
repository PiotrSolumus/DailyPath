import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../lib/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import type { UserMeDTO } from "../../types";

interface SettingsViewProps {
  initialUser?: UserMeDTO | null;
}

const commonTimezones = [
  { value: "Europe/Warsaw", label: "Europa/Warszawa (CET/CEST)" },
  { value: "Europe/London", label: "Europa/Londyn (GMT/BST)" },
  { value: "Europe/Berlin", label: "Europa/Berlin (CET/CEST)" },
  { value: "Europe/Paris", label: "Europa/Paryż (CET/CEST)" },
  { value: "America/New_York", label: "Ameryka/Nowy Jork (EST/EDT)" },
  { value: "America/Los_Angeles", label: "Ameryka/Los Angeles (PST/PDT)" },
  { value: "Asia/Tokyo", label: "Azja/Tokio (JST)" },
  { value: "UTC", label: "UTC" },
];

export function SettingsView({ initialUser }: SettingsViewProps) {
  const { user } = useAuth();
  const currentUser = user || initialUser;

  const [fullName, setFullName] = useState(currentUser?.full_name || "");
  const [timezone, setTimezone] = useState(currentUser?.timezone || "Europe/Warsaw");
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!currentUser) {
      toast.error("Musisz być zalogowany");
      return;
    }

    if (!fullName.trim()) {
      toast.error("Imię i nazwisko nie może być puste");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          timezone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Nie udało się zapisać zmian");
      }

      toast.success("Ustawienia zostały zapisane");
      // Reload page to update user data in context
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(error instanceof Error ? error.message : "Wystąpił błąd podczas zapisywania");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Wszystkie pola hasła są wymagane");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Nowe hasła nie są identyczne");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Nowe hasło musi mieć co najmniej 8 znaków");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Nie udało się zmienić hasła");
      }

      toast.success("Hasło zostało zmienione");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error instanceof Error ? error.message : "Wystąpił błąd podczas zmiany hasła");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Musisz być zalogowany, aby zobaczyć ustawienia.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Zarządzaj swoimi danymi osobowymi i preferencjami</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={currentUser.email} disabled />
            <p className="text-sm text-muted-foreground">Adres email nie może być zmieniony</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Imię i nazwisko</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jan Kowalski"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Strefa czasowa</Label>
            <Select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {commonTimezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </Select>
            <p className="text-sm text-muted-foreground">
              Aktualna godzina: {new Date().toLocaleString("pl-PL", { timeZone: timezone, timeStyle: "short" })}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Rola</Label>
            <Input
              type="text"
              value={
                currentUser.app_role === "admin"
                  ? "Administrator"
                  : currentUser.app_role === "manager"
                    ? "Menedżer"
                    : "Pracownik"
              }
              disabled
            />
            <p className="text-sm text-muted-foreground">Rola jest przypisana przez administratora</p>
          </div>

          {currentUser.active_department && (
            <div className="space-y-2">
              <Label>Dział</Label>
              <Input type="text" value={currentUser.active_department.name} disabled />
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Zmiana hasła</CardTitle>
          <CardDescription>Zaktualizuj swoje hasło dostępu do systemu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Aktualne hasło</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
            <p className="text-sm text-muted-foreground">Hasło musi mieć co najmniej 8 znaków</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? "Zmiana hasła..." : "Zmień hasło"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
