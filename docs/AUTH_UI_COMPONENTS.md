# Dokumentacja komponentów UI autentykacji - DailyPath

## Przegląd

Dokumentacja opisuje zaimplementowane komponenty interfejsu użytkownika dla systemu autentykacji zgodnie ze specyfikacją w `.ai/auth-spec.md`.

**Status:** ✅ Implementacja UI ukończona  
**Data:** 2026-01-08

## Utworzone komponenty

### 1. Layout

#### `src/layouts/AuthLayout.astro`
Dedykowany layout dla stron autentykacji (login, register, reset-password).

**Cechy:**
- Wyśrodkowane centrum strony
- Maksymalna szerokość: 448px (`max-w-md`)
- Logo DailyPath na górze
- Minimalistyczny design

**Użycie:**
```astro
<AuthLayout title="Tytuł strony">
  <KomponentFormularza client:load />
</AuthLayout>
```

---

### 2. Komponenty React (client-side)

#### `src/components/auth/LoginForm.tsx`
Formularz logowania użytkownika.

**Props:**
- `redirect?: string` - URL przekierowania po zalogowaniu (domyślnie: `/dashboard`)
- `initialMessage?: string` - Komunikat wyświetlany po załadowaniu (np. "Wylogowano pomyślnie")

**Pola formularza:**
- Email (type: email, required)
- Hasło (type: password, required, min: 6 znaków)

**Funkcjonalność:**
- ✅ Walidacja HTML5
- ✅ Stan ładowania
- ✅ Wyświetlanie błędów
- ✅ Link do resetu hasła
- ⏳ Backend API (do implementacji)

**Użycie w Astro:**
```astro
<LoginForm client:load redirect="/dashboard" initialMessage="Wylogowano" />
```

---

#### `src/components/auth/RegisterForm.tsx`
Formularz rejestracji użytkownika (tylko przez zaproszenia).

**Props:**
- `invitationToken?: string` - Token zaproszenia z URL
- `invitationEmail?: string` - Email z zaproszenia (pole readonly)

**Pola formularza:**
- Email (readonly jeśli z zaproszenia)
- Imię i nazwisko (min: 2 znaki)
- Hasło (min: 6 znaków)
- Potwierdzenie hasła

**Funkcjonalność:**
- ✅ Walidacja client-side (zgodność haseł, długość)
- ✅ Komunikaty błędów w języku polskim
- ✅ Wyświetlanie info o zaproszeniu
- ✅ Link do strony logowania
- ⏳ Backend API (do implementacji)

**Użycie w Astro:**
```astro
<RegisterForm 
  client:load 
  invitationToken={token} 
  invitationEmail="user@example.com" 
/>
```

---

#### `src/components/auth/RequestPasswordResetForm.tsx`
Formularz żądania resetu hasła (krok 1).

**Props:** Brak

**Pola formularza:**
- Email (type: email, required)

**Funkcjonalność:**
- ✅ Po wysłaniu: wyświetla komunikat sukcesu
- ✅ Nie ujawnia czy email istnieje (bezpieczeństwo)
- ✅ Link powrotu do logowania
- ⏳ Backend API (do implementacji)

**Użycie w Astro:**
```astro
<RequestPasswordResetForm client:load />
```

---

#### `src/components/auth/SetNewPasswordForm.tsx`
Formularz ustawienia nowego hasła (krok 2, z tokenem).

**Props:**
- `token: string` - Token resetu hasła z URL (required)

**Pola formularza:**
- Nowe hasło (min: 6 znaków)
- Potwierdzenie nowego hasła

**Funkcjonalność:**
- ✅ Walidacja zgodności haseł
- ✅ Po sukcesie: wyświetla komunikat i przekierowuje do logowania
- ✅ Automatyczne przekierowanie po 2 sekundach
- ⏳ Backend API (do implementacji)

**Użycie w Astro:**
```astro
<SetNewPasswordForm client:load token={resetToken} />
```

---

### 3. Strony Astro

#### `src/pages/login.astro`
Strona logowania.

**URL:** `/login`  
**Query params:**
- `?redirect=/path` - URL przekierowania po zalogowaniu
- `?message=Tekst` - Komunikat do wyświetlenia

**TODO (backend):**
- Sprawdzenie czy użytkownik jest zalogowany → redirect do `/dashboard`

---

#### `src/pages/register.astro`
Strona rejestracji (tylko przez zaproszenia).

**URL:** `/register?token={invitation_token}`  
**Query params:**
- `?token=abc123` - Token zaproszenia (required dla pełnej funkcjonalności)

**TODO (backend):**
- Walidacja tokena zaproszenia server-side
- Pobranie email z zaproszenia
- Redirect jeśli użytkownik już zalogowany

---

#### `src/pages/reset-password.astro`
Strona resetu hasła (2 warianty).

**Wariant A - Żądanie resetu (bez tokena):**
- URL: `/reset-password`
- Wyświetla: `RequestPasswordResetForm`

**Wariant B - Ustawienie nowego hasła (z tokenem):**
- URL: `/reset-password?token=xyz789`
- Wyświetla: `SetNewPasswordForm`

**TODO (backend):**
- Walidacja tokena resetu server-side

---

### 4. Komponenty UI (Shadcn/ui)

#### `src/components/ui/alert.tsx` (NOWY)
Komponent do wyświetlania komunikatów.

**Warianty:**
- `default` - Standardowy (szary)
- `destructive` - Błąd (czerwony)
- `success` - Sukces (zielony)

**Użycie:**
```tsx
<Alert variant="destructive">
  <AlertDescription>Nieprawidłowy email lub hasło</AlertDescription>
</Alert>
```

**Eksport:**
```tsx
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
```

---

## Stylistyka i UX

### Design System
Wszystkie komponenty używają:
- **Tailwind CSS 4** - utility classes
- **Shadcn/ui** - komponenty bazowe (Button, Input, Card, Label)
- **class-variance-authority** - warianty komponentów
- Motyw ciemny/jasny (automatyczny z systemu)

### Wspólne cechy
- ✅ Responsywność (mobile-first)
- ✅ Stany ładowania (disabled, spinner)
- ✅ Komunikaty błędów w języku polskim
- ✅ Walidacja HTML5 + client-side
- ✅ Accessibility (ARIA labels, semantic HTML)

### Kolory i typy komunikatów

| Typ | Wariant | Kolor | Użycie |
|-----|---------|-------|--------|
| Info | `default` | Szary | Komunikaty informacyjne |
| Błąd | `destructive` | Czerwony | Błędy walidacji, błędy API |
| Sukces | `success` | Zielony | Potwierdzenia akcji |

---

## Integracja z backendem (TODO)

### Endpointy API do implementacji

| Endpoint | Method | Komponent | Sekcja spec |
|----------|--------|-----------|-------------|
| `/api/auth/login` | POST | `LoginForm` | 3.2.1 |
| `/api/auth/register` | POST | `RegisterForm` | 3.2.2 |
| `/api/auth/request-password-reset` | POST | `RequestPasswordResetForm` | 3.2.3 |
| `/api/auth/reset-password` | POST | `SetNewPasswordForm` | 3.2.4 |

### Przykład integracji - LoginForm

**Zamiast:**
```typescript
// TODO: Implementacja logowania
console.log("Login attempt:", { email, password });
```

**Należy dodać:**
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

if (!response.ok) {
  const data = await response.json();
  setError(data.message || 'Błąd logowania');
  return;
}

window.location.href = redirect || '/dashboard';
```

---

## Walidacja i komunikaty błędów

### Walidacja client-side

Wszystkie formularze implementują:
1. **HTML5 validation** - natywna walidacja przeglądarki
2. **Client-side validation** - przed wysłaniem do API
3. **Komunikaty po polsku** - zgodnie z sekcją 2.5.2 spec

### Przykładowe komunikaty

| Scenariusz | Komunikat |
|------------|-----------|
| Nieprawidłowe dane logowania | "Nieprawidłowy email lub hasło" |
| Hasła nie pasują | "Hasła nie są identyczne" |
| Za krótkie hasło | "Hasło musi mieć co najmniej 6 znaków" |
| Za krótkie imię | "Imię i nazwisko muszą mieć co najmniej 2 znaki" |
| Link wysłany | "Jeśli konto o podanym adresie email istnieje, wysłaliśmy link do resetu hasła" |

---

## Testy manualne

### Test 1: Strona logowania
1. Przejdź do http://localhost:4321/login
2. ✅ Sprawdź czy formularz się wyświetla
3. ✅ Wprowadź dane i kliknij "Zaloguj się"
4. ✅ Sprawdź czy przycisk zmienia stan na "Logowanie..."
5. ⏳ Backend: sprawdź czy następuje przekierowanie

### Test 2: Strona rejestracji
1. Przejdź do http://localhost:4321/register
2. ✅ Sprawdź czy formularz się wyświetla
3. ✅ Wprowadź różne hasła i sprawdź walidację
4. ✅ Wprowadź za krótkie imię (1 znak) i sprawdź błąd

### Test 3: Reset hasła
1. Przejdź do http://localhost:4321/reset-password
2. ✅ Sprawdź formularz żądania resetu
3. ✅ Wyślij email i sprawdź komunikat sukcesu
4. Przejdź do http://localhost:4321/reset-password?token=test123
5. ✅ Sprawdź formularz ustawienia nowego hasła

---

## Następne kroki (dla zespołu backend)

1. **Middleware** - implementacja sekcji 3.1.1 spec (Supabase Auth)
2. **API endpoints** - implementacja sekcji 3.2 spec
3. **RLS policies** - implementacja sekcji 4.3 spec
4. **Email service** - implementacja sekcji 3.5 spec
5. **Migracje** - implementacja sekcji 4 spec (foreign keys, triggers)

**Ważne:** Wszystkie komponenty są gotowe do podpięcia API. Wystarczy zamienić funkcje `handleSubmit` w komponentach React zgodnie z przykładami w specyfikacji.

---

## Struktura plików

```
src/
├── components/
│   ├── auth/                         # ✅ NOWE
│   │   ├── LoginForm.tsx             # ✅
│   │   ├── RegisterForm.tsx          # ✅
│   │   ├── RequestPasswordResetForm.tsx  # ✅
│   │   ├── SetNewPasswordForm.tsx    # ✅
│   │   └── index.ts                  # ✅ Eksport
│   └── ui/
│       ├── alert.tsx                 # ✅ NOWY
│       ├── button.tsx                # ✅ Istniejący
│       ├── card.tsx                  # ✅ Istniejący
│       ├── input.tsx                 # ✅ Istniejący
│       └── label.tsx                 # ✅ Istniejący
├── layouts/
│   └── AuthLayout.astro              # ✅ NOWY
└── pages/
    ├── login.astro                   # ✅ ZAKTUALIZOWANY
    ├── register.astro                # ✅ NOWY
    └── reset-password.astro          # ✅ NOWY
```

---

## Zgodność z PRD i specyfikacją

✅ **US-001** - Rejestracja przez zaproszenie (UI gotowe)  
✅ **US-002** - Logowanie (UI gotowe)  
✅ **US-003** - Odzyskiwanie hasła (UI gotowe)  
✅ **US-004** - Wylogowanie (stara strona logout.astro pozostaje bez zmian)  
✅ **Sekcja 2** spec - Wszystkie komponenty UI zaimplementowane  
⏳ **Sekcja 3** spec - Backend API (do implementacji)  

---

## Podsumowanie

**Status implementacji UI:** ✅ Ukończona  
**Gotowe do integracji z backendem:** ✅ Tak  
**Testy manualne:** ✅ Możliwe (mock handlers)  
**Dokumentacja:** ✅ Ukończona

**Utworzone pliki:** 10  
**Zaktualizowane pliki:** 1  
**Błędy lintingu:** 0

Wszystkie komponenty są zgodne z:
- Specyfikacją techniczną (`.ai/auth-spec.md`)
- Stylistyką istniejących komponentów (Shadcn/ui)
- Założeniami Astro i React (z Cursor Rules)
- Best practices dla accessibility i UX
