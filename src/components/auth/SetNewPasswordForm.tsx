import * as React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";

interface SetNewPasswordFormProps {
  token: string;
}

export function SetNewPasswordForm({ token }: SetNewPasswordFormProps) {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Walidacja po stronie klienta
    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Wystąpił błąd podczas resetowania hasła");
        setIsLoading(false);
        return;
      }

      // Password reset successful
      console.log("✅ Password reset successful");
      setSuccess(true);
      setIsLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login?message=Hasło zostało zmienione pomyślnie. Możesz się teraz zalogować.";
      }, 2000);
    } catch (error) {
      console.error("Password reset error:", error);
      setError("Wystąpił błąd podczas łączenia z serwerem");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hasło zostało zmienione</CardTitle>
          <CardDescription>
            Możesz teraz zalogować się przy użyciu nowego hasła
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="success">
            <AlertDescription>
              Twoje hasło zostało pomyślnie zmienione. Za chwilę zostaniesz przekierowany
              do strony logowania.
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm text-primary hover:underline"
            >
              Przejdź do logowania
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>
          Wprowadź nowe hasło dla swojego konta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nowe hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Hasło musi mieć co najmniej 6 znaków
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Zmienianie hasła..." : "Ustaw nowe hasło"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
