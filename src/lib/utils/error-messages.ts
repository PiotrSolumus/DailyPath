/**
 * Map HTTP status codes and API errors to user-friendly messages
 */
export function getErrorMessage(error: unknown): string {
  // Handle Response objects
  if (error instanceof Response) {
    switch (error.status) {
      case 400:
        return "Nieprawidłowe dane. Sprawdź formularz i spróbuj ponownie.";
      case 401:
        return "Musisz się zalogować, aby wykonać tę operację.";
      case 403:
        return "Nie masz uprawnień do wykonania tej operacji.";
      case 404:
        return "Nie znaleziono zasobu.";
      case 409:
        return "Wykryto konflikt. Czy chcesz kontynuować?";
      case 422:
        return "Nieprawidłowe dane wejściowe.";
      case 429:
        return "Zbyt wiele żądań. Spróbuj ponownie za chwilę.";
      case 500:
        return "Błąd serwera. Spróbuj ponownie później.";
      default:
        return "Wystąpił nieoczekiwany błąd.";
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Check for specific error messages from API
    const message = error.message.toLowerCase();

    if (message.includes("overlap") || message.includes("conflict")) {
      return "Wykryto nakładające się sloty czasowe.";
    }
    if (message.includes("unauthorized")) {
      return "Brak autoryzacji.";
    }
    if (message.includes("forbidden")) {
      return "Brak uprawnień do wykonania tej operacji.";
    }
    if (message.includes("not found")) {
      return "Nie znaleziono zasobu.";
    }
    if (message.includes("network")) {
      return "Błąd połączenia. Sprawdź połączenie internetowe.";
    }

    // Return original message if it's user-friendly
    if (error.message.length < 100) {
      return error.message;
    }
  }

  // Fallback
  return "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
}

/**
 * Format validation errors from Zod or similar
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  const messages = Object.entries(errors)
    .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
    .join("; ");

  return `Błędy walidacji: ${messages}`;
}
