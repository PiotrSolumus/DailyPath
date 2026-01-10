import * as React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";

export function RequestPasswordResetForm() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Wystąpił błąd podczas wysyłania żądania");
        setIsLoading(false);
        return;
      }

      // Request successful
      console.log("✅ Password reset requested for:", email);
      setSuccess(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Password reset request error:", error);
      setError("Wystąpił błąd podczas łączenia z serwerem");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sprawdź swoją skrzynkę email</CardTitle>
          <CardDescription>
            Link do resetowania hasła został wysłany
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="success">
            <AlertDescription>
              Jeśli konto o podanym adresie email istnieje, wysłaliśmy link do resetu hasła.
              Sprawdź swoją skrzynkę email i kliknij w link, aby ustawić nowe hasło.
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm text-primary hover:underline"
            >
              Wróć do logowania
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset hasła</CardTitle>
        <CardDescription>
          Podaj adres email powiązany z Twoim kontem
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Wysyłanie..." : "Wyślij link do resetu"}
          </Button>

          <div className="text-center">
            <a
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Wróć do logowania
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
