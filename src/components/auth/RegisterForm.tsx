import * as React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";

interface RegisterFormProps {
  invitationToken?: string;
  invitationEmail?: string;
}

export function RegisterForm({ invitationToken, invitationEmail }: RegisterFormProps) {
  const [email, setEmail] = React.useState(invitationEmail || "");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
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

    if (fullName.length < 2) {
      setError("Imię i nazwisko muszą mieć co najmniej 2 znaki");
      setIsLoading(false);
      return;
    }

    if (!invitationToken) {
      setError("Token zaproszenia jest wymagany");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          token: invitationToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Wystąpił błąd podczas rejestracji");
        setIsLoading(false);
        return;
      }

      // Registration successful - redirect to login with success message
      console.log("✅ Registration successful:", data.user);
      window.location.href = "/login?message=Rejestracja zakończona pomyślnie. Możesz się teraz zalogować.";
    } catch (error) {
      console.error("Registration error:", error);
      setError("Wystąpił błąd podczas łączenia z serwerem");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utwórz konto</CardTitle>
        <CardDescription>
          {invitationToken
            ? "Wypełnij formularz, aby aktywować swoje konto"
            : "Zarejestruj się w DailyPath"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {invitationToken && (
            <Alert>
              <AlertDescription>
                Rejestracja na podstawie zaproszenia dla: <strong>{invitationEmail}</strong>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || !!invitationEmail}
              readOnly={!!invitationEmail}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Imię i nazwisko</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Jan Kowalski"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
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
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
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
            {isLoading ? "Tworzenie konta..." : "Utwórz konto"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground text-center w-full">
          Masz już konto?{" "}
          <a href="/login" className="text-primary hover:underline">
            Zaloguj się
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
