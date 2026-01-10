# Specyfikacja techniczna systemu autentykacji - DailyPath

## 1. PRZEGLĄD OGÓLNY

### 1.1 Cel dokumentu
Dokument definiuje architekturę i implementację pełnego systemu autentykacji w aplikacji DailyPath zgodnie z wymaganiami US-044, US-045 oraz innymi wymaganiami z PRD związanymi z bezpieczeństwem (US-001 do US-004, US-043).

### 1.2 Zakres funkcjonalny
- Rejestracja użytkownika przez zaproszenie email (US-001) - TYLKO zaproszenia, bez publicznej rejestracji
- Logowanie i wylogowanie (US-002, US-004)
- Odzyskiwanie hasła (US-003)
- Zarządzanie sesją i bezpieczeństwo (US-043)
- Autoryzacja oparta na rolach (US-005)
- Dezaktywacja konta przez admina (US-009)
- Zapraszanie użytkowników przez przełożonego/admina (US-010)

**UWAGA**: US-044 i US-045 z PRD NIE dotyczą DailyPath i zostały błędnie skopiowane z innego projektu. Nie są implementowane w tej specyfikacji.

### 1.3 Stan obecny aplikacji
**TYMCZASOWE ROZWIĄZANIE (do zastąpienia):**
- Middleware używa cookie `temp_user_id` zamiast Supabase Auth
- Brak właściwej walidacji sesji
- Service role key używany do wszystkich operacji (omija RLS)
- Strona login.astro wyświetla listę użytkowników zamiast formularza
- Foreign key między `public.users.id` a `auth.users.id` jest wyłączony

**DOCELOWY STAN:**
- Pełna integracja z Supabase Auth
- Sesje zarządzane przez HTTP-only cookies
- RLS aktywny z kontekstem użytkownika
- Realne formularze logowania, rejestracji i resetu hasła

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1 Strony autentykacji (Astro)

#### 2.1.1 `/login` - Strona logowania

**Lokalizacja:** `src/pages/login.astro`  
**Layout:** Dedykowany `AuthLayout.astro` (nowy)  
**Tryb renderowania:** Server-side (SSR)

**Odpowiedzialność:**
- Sprawdzenie czy użytkownik jest już zalogowany → przekierowanie do `/dashboard`
- Renderowanie podstawowego layoutu i osadzenie formularza logowania (React)
- Obsługa query params (np. `?redirect=/plan`)
- Wyświetlanie komunikatów przekazanych przez query params (np. po wylogowaniu)

**Logika server-side:**
```typescript
// Pseudokod
const user = Astro.locals.user;
if (user) {
  return Astro.redirect('/dashboard');
}

const redirect = Astro.url.searchParams.get('redirect') || '/dashboard';
const message = Astro.url.searchParams.get('message');
```

**Struktura:**
```astro
<AuthLayout title="Logowanie - DailyPath">
  <LoginForm client:load redirect={redirect} initialMessage={message} />
</AuthLayout>
```

---

#### 2.1.2 `/register` - Strona rejestracji (opcjonalna dla US-045)

**Lokalizacja:** `src/pages/register.astro`  
**Layout:** `AuthLayout.astro`  
**Tryb renderowania:** Server-side (SSR)

**Odpowiedzialność:**
- Sprawdzenie czy użytkownik jest już zalogowany → przekierowanie
- Renderowanie formularza rejestracji
- **UWAGA:** Według PRD rejestracja powinna być tylko przez zaproszenia (US-001)
- Dla US-045 możemy mieć publiczną rejestrację, ale z moderacją lub po zatwierdzeniu przez admina

**Jedyny wariant: Zaproszenia (zgodnie z PRD US-001):**
- URL: `/register?token={invitation_token}`
- Sprawdzenie ważności tokena zaproszenia
- Formularz z polami: email (readonly, z tokena), hasło, potwierdzenie hasła, imię i nazwisko
- Link jednorazowy i ważny czasowo (domyślnie 7 dni)

**WAŻNE:** Publiczna rejestracja nie jest częścią MVP zgodnie z PRD. Rejestracja jest dostępna TYLKO przez zaproszenia wysłane przez administratora lub przełożonego.

---

#### 2.1.3 `/reset-password` - Strona resetu hasła

**Lokalizacja:** `src/pages/reset-password.astro`  
**Layout:** `AuthLayout.astro`  
**Tryb renderowania:** Server-side (SSR)

**Scenariusze:**

**A) Żądanie resetu (bez tokena):**
```astro
<AuthLayout title="Reset hasła">
  <RequestPasswordResetForm client:load />
</AuthLayout>
```
- Formularz z polem email
- Po wysłaniu: komunikat "Sprawdź swoją skrzynkę email"

**B) Ustawienie nowego hasła (z tokenem):**
```astro
<AuthLayout title="Ustaw nowe hasło">
  <SetNewPasswordForm client:load token={token} />
</AuthLayout>
```
- Sprawdzenie ważności tokena server-side
- Jeśli token nieważny: komunikat błędu i link do ponownego żądania
- Formularz: nowe hasło, potwierdzenie hasła

---

#### 2.1.4 `/logout` - Strona wylogowania

**Lokalizacja:** `src/pages/logout.astro`  
**Layout:** Brak (proste przekierowanie)  
**Tryb renderowania:** Server-side (SSR)

**Odpowiedzialność:**
- Wywołanie `supabase.auth.signOut()` server-side
- Wyczyszczenie sesji i cookies
- Przekierowanie do `/login?message=Wylogowano pomyślnie`

**Implementacja:**
```astro
---
const supabase = Astro.locals.supabase;
await supabase.auth.signOut();
return Astro.redirect('/login?message=Wylogowano');
---
```

---

#### 2.1.5 `/onboarding` - Kreator pierwszego dnia (US-018)

**Lokalizacja:** `src/pages/onboarding.astro`  
**Layout:** `OnboardingLayout.astro` (istniejący lub nowy)  
**Tryb renderowania:** Server-side (SSR)

**Guard:**
- Wymaga zalogowanego użytkownika
- Jeśli użytkownik już przeszedł onboarding → przekierowanie do `/dashboard`

**Odpowiedzialność:**
- Konfiguracja godzin pracy (US-018)
- Wybór strefy czasowej
- Opcjonalnie: ustawienia preferencji
- Po zakończeniu: ustawienie flagi `onboarding_completed = true` w profilu

---

### 2.2 Nowy layout dla autentykacji

#### 2.2.1 `AuthLayout.astro`

**Lokalizacja:** `src/layouts/AuthLayout.astro`

**Cel:** Dedykowany layout dla stron autentykacji (login, register, reset password), bez sidebara i głównej nawigacji.

**Struktura:**
```astro
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-background">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="mb-8 text-center">
          <h1 class="text-3xl font-bold">DailyPath</h1>
        </div>
        <slot />
      </div>
    </div>
  </body>
</html>
```

---

### 2.3 Komponenty React (client-side)

#### 2.3.1 `LoginForm` - Formularz logowania

**Lokalizacja:** `src/components/auth/LoginForm.tsx`  
**Typ:** Client-side React (interactive)

**Props:**
```typescript
interface LoginFormProps {
  redirect?: string;      // URL do przekierowania po zalogowaniu
  initialMessage?: string; // Komunikat do wyświetlenia (np. po wylogowaniu)
}
```

**Stan komponentu:**
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Walidacja:**
- Email: format email (Zod schema)
- Hasło: min. 6 znaków (zgodnie z Supabase config)
- Walidacja client-side przed wysłaniem
- Komunikaty błędów po stronie użytkownika

**Obsługa submit:**
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);

  // Walidacja
  const result = loginSchema.safeParse({ email, password });
  if (!result.success) {
    setError(result.error.errors[0].message);
    setIsLoading(false);
    return;
  }

  try {
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

    // Przekierowanie po sukcesie (przeglądarka obsłuży sesję)
    window.location.href = redirect || '/dashboard';
  } catch (err) {
    setError('Wystąpił nieoczekiwany błąd');
  } finally {
    setIsLoading(false);
  }
};
```

**Komponenty UI (Shadcn):**
- `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardFooter>`
- `<Input>` dla email i password
- `<Button>` dla submit
- `<Label>` dla pól
- `<Alert>` dla komunikatów błędów

**Struktura:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Zaloguj się</CardTitle>
  </CardHeader>
  <CardContent>
    {initialMessage && <Alert>{initialMessage}</Alert>}
    {error && <Alert variant="destructive">{error}</Alert>}
    <form onSubmit={handleSubmit}>
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" value={email} onChange={...} />
      
      <Label htmlFor="password">Hasło</Label>
      <Input id="password" type="password" value={password} onChange={...} />
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Logowanie...' : 'Zaloguj się'}
      </Button>
    </form>
  </CardContent>
  <CardFooter>
    <a href="/reset-password">Nie pamiętasz hasła?</a>
  </CardFooter>
</Card>
```

---

#### 2.3.2 `RegisterForm` - Formularz rejestracji

**Lokalizacja:** `src/components/auth/RegisterForm.tsx`  
**Typ:** Client-side React

**Props:**
```typescript
interface RegisterFormProps {
  invitationToken?: string; // Dla wariantu z zaproszeniem
  invitationEmail?: string; // Email z tokena (readonly)
}
```

**Stan:**
```typescript
const [email, setEmail] = useState(invitationEmail || '');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [fullName, setFullName] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Walidacja:**
- Email: format email
- Hasło: min. 6 znaków, zalecane 8+
- Potwierdzenie hasła: musi być identyczne
- Imię i nazwisko: min. 2 znaki

**Walidacja zgodności haseł:**
```typescript
if (password !== confirmPassword) {
  setError('Hasła nie są identyczne');
  return;
}
```

**Obsługa submit:**
- Endpoint: `POST /api/auth/register`
- Body: `{ email, password, fullName, invitationToken? }`
- Po sukcesie: przekierowanie do `/login?message=Konto utworzone` lub `/onboarding`

---

#### 2.3.3 `RequestPasswordResetForm` - Żądanie resetu hasła

**Lokalizacja:** `src/components/auth/RequestPasswordResetForm.tsx`  
**Typ:** Client-side React

**Stan:**
```typescript
const [email, setEmail] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [success, setSuccess] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Obsługa submit:**
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.message);
      return;
    }

    setSuccess(true);
  } catch (err) {
    setError('Wystąpił błąd. Spróbuj ponownie.');
  } finally {
    setIsLoading(false);
  }
};
```

**UI:**
- Jeśli `success === true`: wyświetl komunikat sukcesu i ukryj formularz
- W przeciwnym razie: formularz z polem email

---

#### 2.3.4 `SetNewPasswordForm` - Ustawienie nowego hasła

**Lokalizacja:** `src/components/auth/SetNewPasswordForm.tsx`  
**Typ:** Client-side React

**Props:**
```typescript
interface SetNewPasswordFormProps {
  token: string; // Token z query params
}
```

**Stan:**
```typescript
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState(false);
```

**Walidacja:**
- Hasło: min. 6 znaków
- Potwierdzenie hasła: identyczne
- Token: przekazany jako hidden field lub w body

**Obsługa submit:**
- Endpoint: `POST /api/auth/reset-password`
- Body: `{ token, newPassword }`
- Po sukcesie: `setSuccess(true)` i przekierowanie do `/login?message=Hasło zmienione`

---

### 2.4 Zmiany w istniejących komponentach

#### 2.4.1 `AppLayout.astro` - Guard dla zalogowanych stron

**Aktualizacja:**
```astro
---
const user = Astro.locals.user;

// Lista stron publicznych (nie wymagają logowania)
const publicPaths = ['/login', '/register', '/reset-password'];
const currentPath = Astro.url.pathname;

// Jeśli użytkownik nie jest zalogowany i nie jest na publicznej stronie
if (!user && !publicPaths.includes(currentPath)) {
  return Astro.redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
}

// Jeśli użytkownik jest zalogowany, ale nie ukończył onboardingu
if (user && !user.onboarding_completed && currentPath !== '/onboarding') {
  return Astro.redirect('/onboarding');
}
---
```

---

#### 2.4.2 `Sidebar.tsx` - Przycisk wylogowania

**Aktualizacja:**
- Przycisk "Wyloguj" powinien prowadzić do `/logout` (nie client-side signOut)
- Wyświetlenie nazwy użytkownika i roli w stopce sidebara

```tsx
<div className="mt-auto border-t pt-4">
  <div className="px-4 py-2">
    <p className="text-sm font-medium">{user?.full_name}</p>
    <p className="text-xs text-muted-foreground">{user?.email}</p>
  </div>
  <a
    href="/logout"
    className="flex items-center gap-2 px-4 py-2 hover:bg-accent"
  >
    <LogOutIcon className="h-4 w-4" />
    Wyloguj
  </a>
</div>
```

---

### 2.5 Walidacja i komunikaty błędów

#### 2.5.1 Schematy Zod

**Lokalizacja:** `src/lib/schemas/auth.schema.ts`

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy format email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
});

export const registerSchema = z.object({
  email: z.string().email('Nieprawidłowy format email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Imię i nazwisko muszą mieć co najmniej 2 znaki'),
  invitationToken: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email('Nieprawidłowy format email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token jest wymagany'),
  newPassword: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});
```

---

#### 2.5.2 Komunikaty błędów

**Standardowe komunikaty (polskie):**

| Scenariusz | Komunikat |
|------------|-----------|
| Nieprawidłowe dane logowania | "Nieprawidłowy email lub hasło" |
| Konto nie istnieje | "Konto o podanym adresie email nie istnieje" |
| Email już istnieje | "Konto z tym adresem email już istnieje" |
| Sesja wygasła | "Twoja sesja wygasła. Zaloguj się ponownie" |
| Brak uprawnień | "Nie masz uprawnień do tej operacji" |
| Token resetu nieważny | "Link resetowania hasła jest nieprawidłowy lub wygasł" |
| Token zaproszenia nieważny | "Zaproszenie jest nieprawidłowe lub wygasło" |
| Słabe hasło | "Hasło jest zbyt słabe. Użyj minimum 6 znaków" |
| Email wysłany | "Link do resetu hasła został wysłany na podany adres email" |

**Zasady:**
- Nie ujawniać czy email istnieje w systemie (bezpieczeństwo)
- Komunikaty zawsze po polsku
- Wyświetlanie w `<Alert variant="destructive">` (Shadcn)

---

## 3. LOGIKA BACKENDOWA

### 3.1 Middleware autentykacji

#### 3.1.1 `src/middleware/index.ts` - Aktualizacja

**Cel:** Zastąpienie tymczasowego rozwiązania (`temp_user_id` cookie) na pełną integrację z Supabase Auth.

**Kluczowe zmiany:**

**A) Utworzenie klienta Supabase z cookies:**
```typescript
import { createServerClient } from '@supabase/ssr';

export const onRequest = defineMiddleware(async (context, next) => {
  // Klient z dostępem do cookies (dla sesji użytkownika)
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get: (key) => context.cookies.get(key)?.value,
        set: (key, value, options) => {
          context.cookies.set(key, value, options);
        },
        remove: (key, options) => {
          context.cookies.delete(key, options);
        },
      },
    }
  );

  context.locals.supabase = supabase;

  // ...
});
```

**B) Pobieranie użytkownika z sesji:**
```typescript
// Pobierz sesję z cookies
const { data: { session }, error: sessionError } = await supabase.auth.getSession();

if (session && session.user) {
  const authUser = session.user;

  // Pobierz pełne dane użytkownika z tabeli public.users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, app_role, timezone, onboarding_completed')
    .eq('id', authUser.id)
    .single();

  if (userData && !userError) {
    // Rozwiązanie aktywnego działu (jak w obecnym kodzie)
    const activeDepartment = await resolveActiveDepartment(supabase, userData.id);

    context.locals.user = {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      app_role: userData.app_role,
      timezone: userData.timezone || 'UTC',
      active_department: activeDepartment,
      onboarding_completed: userData.onboarding_completed || false,
    };
  }
} else {
  context.locals.user = null;
}
```

**C) Admin client (dla operacji service_role):**
```typescript
// Tylko dla specyficznych operacji (np. admin endpoints)
const adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

context.locals.supabaseAdmin = adminClient;
```

**D) Usunięcie tymczasowego kodu:**
- Usunąć obsługę cookie `temp_user_id`
- Usunąć komentarze "TEMPORARY"

---

#### 3.1.2 Funkcja pomocnicza `resolveActiveDepartment`

**Lokalizacja:** `src/middleware/index.ts` (lub `src/lib/utils/auth.utils.ts`)

```typescript
async function resolveActiveDepartment(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ id: string; name: string } | null> {
  try {
    const nowIso = new Date().toISOString();
    
    const { data: membership } = await supabase
      .from('memberships')
      .select('department_id')
      .eq('user_id', userId)
      .contains('period', nowIso)
      .maybeSingle();

    if (!membership?.department_id) {
      return null;
    }

    const { data: dept } = await supabase
      .from('departments')
      .select('id, name')
      .eq('id', membership.department_id)
      .single();

    return dept ? { id: dept.id, name: dept.name } : null;
  } catch (error) {
    console.error('Error resolving active department:', error);
    return null;
  }
}
```

---

### 3.2 Endpointy API autentykacji

#### 3.2.1 `POST /api/auth/login` - Logowanie użytkownika

**Lokalizacja:** `src/pages/api/auth/login.ts`

**Odpowiedzialność:**
- Walidacja danych wejściowych (email, hasło)
- Wywołanie `supabase.auth.signInWithPassword()`
- Ustawienie sesji w cookies (automatycznie przez Supabase)
- Zwrócenie sukcesu lub błędu

**Implementacja:**
```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { loginSchema } from '../../lib/schemas/auth.schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: validation.error.errors[0]?.message || 'Nieprawidłowe dane',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email, password } = validation.data;
    const supabase = locals.supabase;

    // Próba logowania
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return new Response(
        JSON.stringify({
          error: 'Authentication error',
          message: 'Nieprawidłowy email lub hasło',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sesja jest automatycznie ustawiona w cookies przez Supabase
    return new Response(
      JSON.stringify({ success: true, user: data.user }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in /api/auth/login:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Wystąpił nieoczekiwany błąd',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

#### 3.2.2 `POST /api/auth/register` - Rejestracja użytkownika

**Lokalizacja:** `src/pages/api/auth/register.ts`

**Wariant z zaproszeniem (PRD):**
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: validation.error.errors[0]?.message,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, fullName, invitationToken } = validation.data;
    const supabase = locals.supabase;
    const supabaseAdmin = locals.supabaseAdmin;

    // Opcjonalnie: Walidacja tokena zaproszenia
    if (invitationToken) {
      const { data: invitation } = await supabaseAdmin
        .from('invitations') // Tabela zaproszeń (do utworzenia)
        .select('*')
        .eq('token', invitationToken)
        .eq('email', email)
        .gt('expires_at', new Date().toISOString())
        .eq('used', false)
        .maybeSingle();

      if (!invitation) {
        return new Response(
          JSON.stringify({
            error: 'Invalid invitation',
            message: 'Zaproszenie jest nieprawidłowe lub wygasło',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Utworzenie konta w Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      console.error('Signup error:', authError);
      return new Response(
        JSON.stringify({
          error: 'Signup error',
          message: authError.message === 'User already registered'
            ? 'Konto z tym adresem email już istnieje'
            : 'Nie udało się utworzyć konta',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Oznaczenie zaproszenia jako użyte (jeśli istnieje)
    if (invitationToken) {
      await supabaseAdmin
        .from('invitations')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('token', invitationToken);
    }

    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in /api/auth/register:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Wystąpił nieoczekiwany błąd',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

#### 3.2.3 `POST /api/auth/request-password-reset` - Żądanie resetu hasła

**Lokalizacja:** `src/pages/api/auth/request-password-reset.ts`

**Implementacja:**
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validation = requestPasswordResetSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: validation.error.errors[0]?.message,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email } = validation.data;
    const supabase = locals.supabase;

    // Wywołanie Supabase Auth resetPasswordForEmail
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.PUBLIC_SITE_URL}/reset-password`,
    });

    // Zawsze zwracamy sukces (nie ujawniamy czy email istnieje)
    if (error) {
      console.error('Password reset error:', error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Jeśli konto o podanym adresie email istnieje, wysłaliśmy link do resetu hasła',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in /api/auth/request-password-reset:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Wystąpił nieoczekiwany błąd',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

#### 3.2.4 `POST /api/auth/reset-password` - Ustawienie nowego hasła

**Lokalizacja:** `src/pages/api/auth/reset-password.ts`

**Implementacja:**
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: validation.error.errors[0]?.message,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { token, newPassword } = validation.data;
    const supabase = locals.supabase;

    // Weryfikacja tokena i ustawienie nowego hasła
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Password update error:', error);
      return new Response(
        JSON.stringify({
          error: 'Password update error',
          message: 'Nie udało się zmienić hasła. Link może być nieprawidłowy lub wygasły',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Hasło zostało zmienione pomyślnie',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in /api/auth/reset-password:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Wystąpił nieoczekiwany błąd',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

### 3.3 Aktualizacja istniejących endpointów API

#### 3.3.1 Guard dla wymagania autentykacji

**Wszystkie chronione endpointy (np. `POST /api/tasks`, `GET /api/plan-slots`, etc.) powinny mieć guard:**

```typescript
export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Musisz być zalogowany',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ... logika endpointa
};
```

---

#### 3.3.2 Usunięcie supabaseAdmin z endpointów użytkownika

**Problem obecny:** Wszystkie endpointy używają `locals.supabaseAdmin` (service_role), co omija RLS.

**Rozwiązanie:** Używać `locals.supabase` (klient z kontekstem użytkownika) dla operacji użytkownika.

**Przykład - aktualizacja `GET /api/tasks`:**
```typescript
// PRZED (obecnie):
const { data, error } = await supabaseAdmin
  .from('tasks')
  .select('*')
  .eq('assigned_user_id', user.id);

// PO:
const { data, error } = await supabase // <- używamy supabase, nie supabaseAdmin
  .from('tasks')
  .select('*')
  .eq('assigned_user_id', user.id);
```

**Skutek:** RLS będzie działać poprawnie, użytkownik zobaczy tylko swoje dane zgodnie z politykami.

---

### 3.3.3 Dezaktywacja konta użytkownika (US-009)

#### `POST /api/admin/users/{userId}/deactivate` - Dezaktywacja konta

**Lokalizacja:** `src/pages/api/admin/users/[userId]/deactivate.ts`

**Odpowiedzialność:**
- Admin może dezaktywować konto użytkownika
- Użytkownik nie będzie mógł się zalogować po dezaktywacji
- Dane pozostają w systemie dla raportów historycznych

**Implementacja:**
```typescript
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  try {
    const user = locals.user;

    // Guard: tylko admin
    if (!user || user.app_role !== 'admin') {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Tylko administrator może dezaktywować konta',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { userId } = params;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = locals.supabaseAdmin;

    // Dezaktywacja w auth.users (Supabase Admin API)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { ban_duration: 'none' } // Permanent ban
    );

    if (authError) {
      console.error('Error deactivating user in auth:', authError);
      return new Response(
        JSON.stringify({
          error: 'Deactivation failed',
          message: 'Nie udało się dezaktywować konta',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Oznaczenie jako nieaktywny w public.users (opcjonalnie)
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (dbError) {
      console.error('Error updating user status in DB:', dbError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Konto zostało dezaktywowane',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in deactivate user:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Wystąpił nieoczekiwany błąd',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

**Uwaga:** Wymaga dodania kolumny `is_active` do tabeli `public.users` lub użycia tylko mechanizmu ban w Supabase Auth.

---

### 3.4 Zmiana hasła dla zalogowanego użytkownika

#### 3.4.1 `POST /api/users/change-password` - Zmiana hasła

**Lokalizacja:** `src/pages/api/users/change-password.ts` (istniejący, wymaga aktualizacji)

**Schemat:**
```typescript
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Obecne hasło jest wymagane'),
  newPassword: z.string().min(6, 'Nowe hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});
```

**Implementacja:**
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user;

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Musisz być zalogowany' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: validation.error.errors[0]?.message,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { currentPassword, newPassword } = validation.data;
    const supabase = locals.supabase;

    // Weryfikacja obecnego hasła przez ponowne logowanie
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid password',
          message: 'Obecne hasło jest nieprawidłowe',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Ustawienie nowego hasła
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Password update error',
          message: 'Nie udało się zmienić hasła',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Hasło zostało zmienione pomyślnie',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in /api/users/change-password:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Wystąpił nieoczekiwany błąd',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

### 3.5 System wysyłania emaili (US-001, US-003, US-010)

#### 3.5.1 Integracja z email service

**Problem:** US-001 i US-003 wymagają działającego systemu wysyłania emaili (zaproszenia, reset hasła).

**Opcje implementacji:**

**Opcja 1: Supabase Auth Email (preferowana dla MVP)**
- Supabase ma wbudowany system emailowy
- Wymaga konfiguracji SMTP w `supabase/config.toml`
- Automatyczne wysyłanie emaili przy rejestracji i resecie hasła

**Konfiguracja SMTP (lokalny development):**
```toml
[auth.email]
enable_signup = false
enable_confirmations = false
template_paths = "./supabase/templates"

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326
```

**Konfiguracja SMTP (produkcja):**
```toml
[auth.email.smtp]
host = "smtp.sendgrid.net"
port = 587
user = "apikey"
pass = "env(SMTP_PASSWORD)"
admin_email = "admin@dailypath.com"
sender_name = "DailyPath"
```

**Opcja 2: Zewnętrzny serwis email (np. SendGrid, AWS SES)**

**Lokalizacja:** `src/lib/services/email.service.ts`

```typescript
import sgMail from '@sendgrid/mail';

// Inicjalizacja SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function sendInvitationEmail(
  toEmail: string,
  inviteLink: string,
  token: string
): Promise<void> {
  const msg = {
    to: toEmail,
    from: 'noreply@dailypath.com',
    subject: 'Zaproszenie do DailyPath',
    html: `
      <h1>Witaj w DailyPath!</h1>
      <p>Zostałeś zaproszony do dołączenia do aplikacji DailyPath.</p>
      <p>Kliknij poniższy link aby aktywować konto:</p>
      <a href="${inviteLink}">Aktywuj konto</a>
      <p>Link wygasa za 7 dni.</p>
      <p><small>Token: ${token}</small></p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('Invitation email sent to:', toEmail);
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetLink: string
): Promise<void> {
  const msg = {
    to: toEmail,
    from: 'noreply@dailypath.com',
    subject: 'Reset hasła - DailyPath',
    html: `
      <h1>Reset hasła</h1>
      <p>Otrzymaliśmy prośbę o reset hasła dla Twojego konta.</p>
      <p>Kliknij poniższy link aby ustawić nowe hasło:</p>
      <a href="${resetLink}">Resetuj hasło</a>
      <p>Link wygasa za 1 godzinę.</p>
      <p>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('Password reset email sent to:', toEmail);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}
```

**Pakiety wymagane:**
```bash
npm install @sendgrid/mail
```

**Zmienne środowiskowe:**
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@dailypath.com
```

#### 3.5.2 Email templates (US-001)

**Lokalizacja:** `supabase/templates/` (jeśli używamy Supabase Auth Email)

**Szablon zaproszenia:** `supabase/templates/invite.html`
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Zaproszenie do DailyPath</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #4A5568;">Witaj w DailyPath!</h1>
    <p>Zostałeś zaproszony do dołączenia do aplikacji DailyPath.</p>
    <p>Kliknij poniższy przycisk aby aktywować swoje konto:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background-color: #4299E1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Aktywuj konto
      </a>
    </div>
    <p style="color: #718096; font-size: 14px;">
      Link wygasa za 7 dni. Jeśli nie rejestrowałeś się w DailyPath, zignoruj tę wiadomość.
    </p>
  </div>
</body>
</html>
```

**Szablon resetu hasła:** `supabase/templates/recovery.html`
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reset hasła - DailyPath</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #4A5568;">Reset hasła</h1>
    <p>Otrzymaliśmy prośbę o reset hasła dla Twojego konta w DailyPath.</p>
    <p>Kliknij poniższy przycisk aby ustawić nowe hasło:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background-color: #4299E1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Resetuj hasło
      </a>
    </div>
    <p style="color: #718096; font-size: 14px;">
      Link wygasa za 1 godzinę. Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.
    </p>
  </div>
</body>
</html>
```

**Rekomendacja dla MVP:** Użyć Opcji 1 (Supabase Auth Email) z Inbucket dla developmentu lokalnego, a SendGrid/AWS SES dla produkcji.

---

## 4. SYSTEM AUTENTYKACJI

### 4.1 Integracja Supabase Auth z Astro

#### 4.1.1 Pakiety wymagane

**Aktualny:** `@supabase/supabase-js`  
**Dodać:** `@supabase/ssr` (już zainstalowany?)

**Instalacja (jeśli brak):**
```bash
npm install @supabase/ssr
```

---

#### 4.1.2 Konfiguracja Supabase (zmienne środowiskowe)

**Plik `.env`:**
```env
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
PUBLIC_SITE_URL=http://localhost:3000
```

**Użycie:**
- `PUBLIC_*` dostępne w kliencie i serwerze
- `SUPABASE_SERVICE_ROLE_KEY` tylko w serwerze (backend, middleware)

---

#### 4.1.3 Konfiguracja Supabase Auth (`supabase/config.toml`)

**Wymagana konfiguracja (zgodnie z PRD):**
```toml
[auth]
enabled = true
site_url = "http://127.0.0.1:3000"
jwt_expiry = 43200 # 12 godzin (zgodnie z US-002)
enable_signup = false # TYLKO zaproszenia (US-001)
minimum_password_length = 8 # Zalecane minimum
```

**KRYTYCZNE**: `enable_signup` MUSI być ustawione na `false` zgodnie z PRD. Rejestracja odbywa się wyłącznie przez system zaproszeń (US-001, US-010).

**Email templates:**
Skonfigurować w Supabase Dashboard (lub lokalnie w `config.toml`):
- Reset password email
- Invitation email (opcjonalnie)
- Email verification (jeśli używany)

---

### 4.2 Mechanizm sesji i cookies

#### 4.2.1 HTTP-only cookies (Supabase SSR)

**Zarządzanie przez `@supabase/ssr`:**
- Sesja przechowywana w HTTP-only cookies (bezpieczne)
- Automatyczne odświeżanie tokena (refresh token rotation)
- Cookie names: `sb-<project-ref>-auth-token`, `sb-<project-ref>-auth-token-code-verifier`

**Czas wygaśnięcia sesji:**
- Zgodnie z `jwt_expiry` w `config.toml` (domyślnie 1h)
- Po wygaśnięciu: automatyczne odświeżenie przez refresh token
- Refresh token: ważny 60 dni (domyślnie)

**Bezpieczeństwo cookies:**
- `HttpOnly: true` (nie dostępne dla JS client-side)
- `Secure: true` (tylko HTTPS w produkcji)
- `SameSite: Lax` (ochrona przed CSRF)

---

#### 4.2.2 Odświeżanie sesji

**Automatyczne odświeżanie:**
- Middleware sprawdza `getSession()` przy każdym requeście
- Jeśli token wygasł, Supabase automatycznie używa refresh tokena
- Nowa sesja zapisywana w cookies

**Wylogowanie po okresie bezczynności:**
- Skonfigurować osobny timer client-side (opcjonalnie)
- Lub polegać na wygaśnięciu refresh tokena (60 dni)

---

### 4.3 Row Level Security (RLS)

#### 4.3.1 Przywrócenie foreign key constraint

**Migracja: `supabase/migrations/202601XX000000_restore_users_fk.sql`**

```sql
-- Przywróć foreign key constraint między public.users a auth.users
ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Upewnij się, że wszystkie istniejące użytkownicy mają odpowiedniki w auth.users
-- (może wymagać czyszczenia testowych danych lub migracji)
```

---

#### 4.3.2 Polityki RLS dla tabeli `users`

**Włączenie RLS:**
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

**Polityki:**

**A) Użytkownik może odczytać swój własny profil:**
```sql
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);
```

**B) Użytkownik może aktualizować swój profil:**
```sql
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

**C) Admin i Manager mogą widzieć wszystkich użytkowników:**
```sql
CREATE POLICY "Admins and managers can view all users"
  ON public.users
  FOR SELECT
  USING (
    current_app_role() IN ('admin', 'manager')
  );
```

**D) Admin może tworzyć użytkowników:**
```sql
CREATE POLICY "Admins can create users"
  ON public.users
  FOR INSERT
  WITH CHECK (current_app_role() = 'admin');
```

**Funkcja pomocnicza `current_app_role()`:**
```sql
CREATE OR REPLACE FUNCTION current_app_role()
RETURNS TEXT AS $$
  SELECT app_role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

---

#### 4.3.3 Aktualizacja polityk RLS innych tabel

**Wszystkie istniejące polityki (`tasks`, `plan_slots`, `time_logs`, etc.) powinny:**
- Używać `auth.uid()` zamiast `current_user_id()` (jeśli istniała taka funkcja)
- Weryfikować kontekst użytkownika z `public.users`

**Przykład dla `tasks`:**
```sql
-- Użytkownik widzi swoje zadania lub zadania swojego działu
CREATE POLICY "Users can view own tasks"
  ON public.tasks
  FOR SELECT
  USING (
    assigned_user_id = auth.uid()
    OR assigned_department_id IN (
      SELECT department_id FROM public.memberships
      WHERE user_id = auth.uid()
      AND period @> NOW()
    )
    OR (is_private = false AND assigned_department_id IS NOT NULL)
  );
```

---

### 4.4 Trigger utworzenia profilu użytkownika

#### 4.4.1 Automatyczne tworzenie profilu w `public.users`

**Migracja:** `supabase/migrations/202601XX000001_create_user_profile_trigger.sql`

```sql
-- Funkcja tworzenia profilu użytkownika po rejestracji w auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, app_role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'employee', -- Domyślna rola
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger po utworzeniu użytkownika w auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Efekt:** Po rejestracji przez Supabase Auth, automatycznie tworzony jest profil w `public.users`.

---

### 4.5 Zaproszenia użytkowników (US-001)

#### 4.5.1 Tabela `invitations`

**Migracja:** `supabase/migrations/202601XX000002_create_invitations_table.sql`

```sql
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL REFERENCES public.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeksy
CREATE INDEX invitations_email_idx ON public.invitations(email);
CREATE INDEX invitations_token_idx ON public.invitations(token);
CREATE INDEX invitations_expires_at_idx ON public.invitations(expires_at);

-- RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Admins i managers mogą tworzyć zaproszenia
CREATE POLICY "Admins and managers can create invitations"
  ON public.invitations
  FOR INSERT
  WITH CHECK (current_app_role() IN ('admin', 'manager'));

-- Admins i managers mogą przeglądać zaproszenia
CREATE POLICY "Admins and managers can view invitations"
  ON public.invitations
  FOR SELECT
  USING (current_app_role() IN ('admin', 'manager'));
```

---

#### 4.5.2 Endpoint tworzenia zaproszenia

**Lokalizacja:** `src/pages/api/invitations/index.ts`

**Funkcjonalność:**
- Admin lub Manager może wysłać zaproszenie
- Generowany unikalny token
- Wysyłany email z linkiem: `{SITE_URL}/register?token={token}`

**Implementacja (szkic):**
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;

  if (!user || !['admin', 'manager'].includes(user.app_role)) {
    return new Response(
      JSON.stringify({ error: 'Forbidden', message: 'Brak uprawnień' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json();
  const { email } = body;

  // Walidacja email
  if (!z.string().email().safeParse(email).success) {
    return new Response(
      JSON.stringify({ error: 'Invalid email' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = locals.supabase;

  // Sprawdzenie czy użytkownik już istnieje
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    return new Response(
      JSON.stringify({ error: 'User already exists' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Utworzenie zaproszenia
  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      email,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error || !invitation) {
    console.error('Error creating invitation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create invitation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Wysłanie emaila z zaproszeniem (US-001)
  const inviteLink = `${process.env.PUBLIC_SITE_URL}/register?token=${invitation.token}`;
  
  try {
    // Wysłanie emaila przez Supabase Auth Email Templates
    // lub zewnętrzny serwis (np. SendGrid, AWS SES)
    await sendInvitationEmail(email, inviteLink, invitation.token);
  } catch (emailError) {
    console.error('Failed to send invitation email:', emailError);
    // Zaproszenie zostało utworzone, ale email nie został wysłany
    // Można opcjonalnie usunąć zaproszenie lub oznaczyć jako "pending email"
  }

  return new Response(
    JSON.stringify({ success: true, invitation }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
};
```

---

### 4.6 Bezpieczeństwo (US-043)

#### 4.6.1 Ochrona przed atakami

**A) CSRF (Cross-Site Request Forgery):**
- Sesja w HTTP-only cookies (chroniona przed XSS)
- `SameSite: Lax` w cookies
- Opcjonalnie: CSRF token dla wrażliwych operacji

**B) XSS (Cross-Site Scripting):**
- Sanitacja wejścia użytkownika (Zod schemas)
- Escapowanie outputu w React (automatyczne)
- Content Security Policy (CSP) w headerach

**C) Brute force:**
- Rate limiting w Supabase Auth (domyślnie: max 5 prób logowania / 5 min)
- Konfiguracja w `supabase/config.toml`:
  ```toml
  [auth.rate_limit]
  token_refresh = 150
  ```

**D) SQL Injection:**
- Supabase automatycznie chroni (parametrized queries)
- Zod walidacja przed przekazaniem do DB

---

#### 4.6.2 Content Security Policy (CSP)

**Dodać w middleware lub `astro.config.mjs`:**
```typescript
context.response.headers.set(
  'Content-Security-Policy',
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
);
```

---

#### 4.6.3 HTTPS w produkcji

**Wymagane:**
- Wszystkie cookies z flagą `Secure: true`
- Przekierowanie HTTP → HTTPS na poziomie serwera/reverse proxy

---

## 5. MIGRACJA Z TRYBU TYMCZASOWEGO

### 5.1 Kroki migracji

#### Krok 1: Backup danych
```bash
npx supabase db dump -f backup.sql
```

#### Krok 2: Przywrócenie foreign key constraint
```bash
npx supabase migration new restore_users_fk
```
Dodać SQL z sekcji 4.3.1.

#### Krok 3: Utworzenie triggerów i polityk RLS
- Migracje z sekcji 4.4.1 (trigger profilu)
- Migracje z sekcji 4.3.2 (polityki RLS)

#### Krok 4: Aktualizacja middleware
- Zamienić kod z `temp_user_id` na Supabase Auth (sekcja 3.1.1)

#### Krok 5: Aktualizacja stron i komponentów
- Zamienić `login.astro` (sekcja 2.1.1)
- Dodać `register.astro`, `reset-password.astro`
- Dodać komponenty React (sekcja 2.3)

#### Krok 6: Aktualizacja endpointów API
- Dodać `/api/auth/*` (sekcja 3.2)
- Zaktualizować istniejące endpointy (usunąć `supabaseAdmin`, dodać guarding)

#### Krok 7: Migracja użytkowników testowych
Jeśli użytkownicy testowi istnieją tylko w `public.users`:
```bash
node scripts/migrate-test-users-to-auth.js
```
Skrypt powinien:
- Dla każdego użytkownika w `public.users` bez odpowiednika w `auth.users`
- Utworzyć konto w `auth.users` przez Supabase Admin API
- Ustawić hasło (np. `test123test`)

#### Krok 8: Testowanie
- Wylogowanie wszystkich użytkowników
- Testowanie logowania, rejestracji, resetu hasła
- Weryfikacja RLS (użytkownik widzi tylko swoje dane)

---

### 5.2 Pliki do usunięcia/zmodyfikowania

**Usunąć:**
- `NO_AUTH_MODE_GUIDE.md`
- `TEMPORARY_NO_AUTH_SETUP.md`
- Cookie logic z `temp_user_id` w middleware

**Zmodyfikować:**
- `LOGIN_GUIDE.md` - zaktualizować instrukcje
- `README.md` - zaktualizować sekcję autentykacji

---

## 6. TESTOWANIE

### 6.1 Scenariusze testowe

#### Test 1: Logowanie użytkownika
1. Przejdź do `/login`
2. Wprowadź poprawne dane: `admin@test.com` / `test123test`
3. Kliknij "Zaloguj się"
4. **Oczekiwany wynik:** Przekierowanie do `/dashboard`, widoczna nazwa użytkownika w sidebarze

#### Test 2: Logowanie z błędnym hasłem
1. Przejdź do `/login`
2. Wprowadź: `admin@test.com` / `wrongpassword`
3. Kliknij "Zaloguj się"
4. **Oczekiwany wynik:** Komunikat "Nieprawidłowy email lub hasło"

#### Test 3: Dostęp do chronionej strony bez logowania
1. Wyloguj się (jeśli zalogowany)
2. Przejdź bezpośrednio do `/tasks`
3. **Oczekiwany wynik:** Przekierowanie do `/login?redirect=/tasks`

#### Test 4: Rejestracja przez zaproszenie
1. Admin tworzy zaproszenie dla `newuser@test.com`
2. Nowy użytkownik klika link z emaila: `/register?token=abc123`
3. Wypełnia formularz i zatwierdza
4. **Oczekiwany wynik:** Konto utworzone, przekierowanie do `/onboarding`

#### Test 5: Reset hasła
1. Przejdź do `/reset-password`
2. Wprowadź email: `admin@test.com`
3. Kliknij "Wyślij link"
4. **Oczekiwany wynik:** Komunikat "Sprawdź swoją skrzynkę email"
5. Kliknij link z emaila: `/reset-password?token=xyz789`
6. Ustaw nowe hasło
7. **Oczekiwany wynik:** Hasło zmienione, możliwość zalogowania

#### Test 6: Wylogowanie
1. Będąc zalogowanym, kliknij "Wyloguj" w sidebarze
2. **Oczekiwany wynik:** Przekierowanie do `/login`, sesja zakończona

#### Test 7: Onboarding po pierwszym logowaniu
1. Nowy użytkownik loguje się po raz pierwszy
2. **Oczekiwany wynik:** Przekierowanie do `/onboarding`
3. Po ukończeniu: przekierowanie do `/dashboard`, flaga `onboarding_completed = true`

#### Test 8: RLS - użytkownik widzi tylko swoje zadania
1. Zaloguj się jako `employee1@test.com`
2. Przejdź do `/tasks`
3. **Oczekiwany wynik:** Widoczne tylko zadania przypisane do tego użytkownika
4. Próba GET `/api/tasks/{id}` dla zadania innego użytkownika
5. **Oczekiwany wynik:** 404 lub 403

---

### 6.2 Testowanie automatyczne (opcjonalne)

**Playwright lub Vitest:**
- Testy E2E dla flow logowania, rejestracji, resetu hasła
- Testy unit dla schematów Zod
- Testy integracyjne dla endpointów API

---

## 7. DOKUMENTACJA DLA UŻYTKOWNIKA

### 7.1 Zaktualizować `LOGIN_GUIDE.md`

**Nowa treść:**
```markdown
# Przewodnik logowania - DailyPath

## Logowanie

1. Przejdź do http://localhost:3000/login
2. Wprowadź swój email i hasło
3. Kliknij "Zaloguj się"

## Nie pamiętasz hasła?

1. Kliknij "Nie pamiętasz hasła?" na stronie logowania
2. Wprowadź swój adres email
3. Sprawdź swoją skrzynkę email i kliknij link
4. Ustaw nowe hasło

## Pierwsze logowanie

Po pierwszym zalogowaniu zostaniesz poproszony o:
- Konfigurację godzin pracy
- Wybór strefy czasowej
- Ustawienia podstawowych preferencji

## Wylogowanie

Kliknij "Wyloguj" w menu bocznym aplikacji.
```

---

## 8. PODSUMOWANIE I KOLEJNOŚĆ IMPLEMENTACJI

### 8.1 Priorytet implementacji

**Faza 1: Podstawy (P0 - krytyczne):**
1. ✅ Aktualizacja middleware (sekcja 3.1.1)
2. ✅ Przywrócenie foreign key i RLS (sekcja 4.3)
3. ✅ Trigger tworzenia profilu (sekcja 4.4.1)
4. ✅ Strona `/login` i `LoginForm` (sekcja 2.1.1, 2.3.1)
5. ✅ Endpoint `POST /api/auth/login` (sekcja 3.2.1)
6. ✅ Strona `/logout` (sekcja 2.1.4)

**Faza 2: Reset hasła (P1 - ważne):**
7. ✅ Strona `/reset-password` (sekcja 2.1.3)
8. ✅ Komponenty `RequestPasswordResetForm`, `SetNewPasswordForm` (sekcja 2.3.3, 2.3.4)
9. ✅ Endpointy reset hasła (sekcja 3.2.3, 3.2.4)

**Faza 3: Rejestracja (P2 - opcjonalne):**
10. ✅ Tabela `invitations` (sekcja 4.5.1)
11. ✅ Endpoint tworzenia zaproszeń (sekcja 4.5.2)
12. ✅ Strona `/register` (sekcja 2.1.2)
13. ✅ Komponent `RegisterForm` (sekcja 2.3.2)
14. ✅ Endpoint `POST /api/auth/register` (sekcja 3.2.2)

**Faza 4: Onboarding (P3 - rozszerzenie):**
15. ✅ Aktualizacja strony `/onboarding` (sekcja 2.1.5)
16. ✅ Guard w `AppLayout.astro` dla onboarding (sekcja 2.4.1)

**Faza 5: Bezpieczeństwo i finalne testy (P4):**
17. ✅ CSP headers (sekcja 4.6.2)
18. ✅ Aktualizacja polityk RLS dla wszystkich tabel (sekcja 4.3.3)
19. ✅ Zmiana hasła dla zalogowanego użytkownika (sekcja 3.4)
20. ✅ Testy E2E (sekcja 6)

---

### 8.2 Estymacja czasu

| Faza | Czas (osobodni) |
|------|-----------------|
| Faza 1 | 3-4 dni |
| Faza 2 | 2-3 dni |
| Faza 3 | 3-4 dni |
| Faza 4 | 1-2 dni |
| Faza 5 | 2-3 dni |
| **Razem** | **11-16 dni** |

---

### 8.3 Ryzyka i wyzwania

**Ryzyko 1: Migracja istniejących użytkowników**
- Użytkownicy w `public.users` bez odpowiedników w `auth.users`
- **Mitigacja:** Skrypt migracji (sekcja 5.1, krok 7)

**Ryzyko 2: Konflikty RLS z istniejącymi politykami**
- Polityki mogą być nieprawidłowo skonfigurowane
- **Mitigacja:** Testowanie w środowisku lokalnym, przegląd polityk

**Ryzyko 3: Problemy z email delivery**
- Lokalne Supabase może nie wysyłać emaili (wymaga konfiguracji SMTP)
- **Mitigacja:** 
  - Development: Użyć Inbucket (wbudowany w Supabase CLI) - dostępny na http://localhost:54324
  - Produkcja: Skonfigurować SMTP przez SendGrid/AWS SES (szczegóły w sekcji 3.5)
  - Alternatywa: Zewnętrzny serwis email (SendGrid, AWS SES) przez dedykowany service (sekcja 3.5.1)
- **Status:** Rozwiązane przez sekcję 3.5

**Ryzyko 4: Kompatybilność `@supabase/ssr` z Astro**
- Możliwe problemy z cookies w Astro middleware
- **Mitigacja:** Testowanie i ewentualna zmiana na manualną obsługę cookies

---

## 9. ZAŁĄCZNIKI

### 9.1 Schemat przepływu autentykacji

```
┌─────────────┐
│   /login    │
└──────┬──────┘
       │
       v
┌─────────────────────┐
│  LoginForm (React)  │
│  - Walidacja Zod    │
│  - POST /api/auth/  │
│    login            │
└──────┬──────────────┘
       │
       v
┌─────────────────────────┐
│  Middleware             │
│  - createServerClient   │
│  - getSession()         │
│  - Resolve user from    │
│    public.users         │
└──────┬──────────────────┘
       │
       v
┌─────────────────────────┐
│  context.locals.user    │
│  - id, email, app_role  │
│  - active_department    │
└──────┬──────────────────┘
       │
       v
┌─────────────────────────┐
│  Protected Pages/API    │
│  - Guard: if (!user)    │
│    redirect to /login   │
└─────────────────────────┘
```

---

### 9.2 Struktura katalogów po implementacji

```
src/
├── components/
│   ├── auth/                  # NOWE
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── RequestPasswordResetForm.tsx
│   │   └── SetNewPasswordForm.tsx
│   ├── layout/
│   │   ├── AppLayout.tsx      # AKTUALIZACJA (guard onboarding)
│   │   └── Sidebar.tsx        # AKTUALIZACJA (przycisk wylogowania)
│   └── ...
├── layouts/
│   ├── AppLayout.astro        # AKTUALIZACJA (guard logowania)
│   ├── AuthLayout.astro       # NOWE
│   └── Layout.astro
├── lib/
│   ├── schemas/
│   │   ├── auth.schema.ts     # NOWE
│   │   └── ...
│   └── ...
├── middleware/
│   └── index.ts               # AKTUALIZACJA (Supabase Auth)
├── pages/
│   ├── api/
│   │   ├── auth/              # NOWE
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   ├── request-password-reset.ts
│   │   │   └── reset-password.ts
│   │   ├── invitations/       # NOWE
│   │   │   └── index.ts
│   │   ├── users/
│   │   │   ├── change-password.ts  # AKTUALIZACJA
│   │   │   └── me.ts
│   │   └── ...                # AKTUALIZACJA (guards, RLS)
│   ├── login.astro            # AKTUALIZACJA
│   ├── logout.astro           # AKTUALIZACJA
│   ├── register.astro         # NOWE
│   ├── reset-password.astro   # NOWE
│   ├── onboarding.astro       # AKTUALIZACJA
│   └── ...
└── ...

supabase/
└── migrations/
    ├── ...
    ├── 202601XX000000_restore_users_fk.sql         # NOWE
    ├── 202601XX000001_create_user_profile_trigger.sql  # NOWE
    ├── 202601XX000002_create_invitations_table.sql     # NOWE
    ├── 202601XX000003_update_rls_policies.sql      # NOWE
    └── ...
```

---

## 10. KONTRAKT INTEGRACJI

### 10.1 Typy TypeScript (rozszerzenie `src/types.ts`)

```typescript
// Rozszerz istniejący UserMeDTO
export interface UserMeDTO extends Pick<Tables<"users">, "id" | "email" | "full_name" | "app_role" | "timezone"> {
  active_department: {
    id: string;
    name: string;
  } | null;
  onboarding_completed?: boolean; // NOWE
}

// Nowe DTOs dla autentykacji
export interface LoginCommand {
  email: string;
  password: string;
}

export interface RegisterCommand {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  invitationToken?: string;
}

export interface RequestPasswordResetCommand {
  email: string;
}

export interface ResetPasswordCommand {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordCommand {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface InvitationDTO {
  id: string;
  email: string;
  token: string;
  invited_by: string;
  expires_at: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
}

export interface CreateInvitationCommand {
  email: string;
}
```

---

### 10.2 Kontrakty API

| Endpoint | Method | Body | Response | Auth Required |
|----------|--------|------|----------|---------------|
| `/api/auth/login` | POST | `LoginCommand` | `{ success: true, user }` | ❌ |
| `/api/auth/register` | POST | `RegisterCommand` | `{ success: true, user }` | ❌ |
| `/api/auth/request-password-reset` | POST | `RequestPasswordResetCommand` | `{ success: true, message }` | ❌ |
| `/api/auth/reset-password` | POST | `ResetPasswordCommand` | `{ success: true, message }` | ❌ |
| `/api/users/change-password` | POST | `ChangePasswordCommand` | `{ success: true, message }` | ✅ |
| `/api/invitations` | POST | `CreateInvitationCommand` | `{ success: true, invitation }` | ✅ (Admin/Manager) |
| `/api/invitations` | GET | - | `{ invitations: InvitationDTO[] }` | ✅ (Admin/Manager) |
| `/api/admin/users/{userId}/deactivate` | POST | - | `{ success: true, message }` | ✅ (Admin) |

---

## 11. ZAKOŃCZENIE

Niniejsza specyfikacja definiuje kompletny system autentykacji dla aplikacji DailyPath zgodny z wymaganiami PRD (US-001, US-002, US-003, US-004, US-005, US-009, US-010, US-018, US-043).

**UWAGA WAŻNA:** US-044 i US-045 zostały pominięte, ponieważ dotyczą funkcjonalności z innego projektu (kolekcje reguł, reguły ad-hoc) i zostały błędnie umieszczone w PRD DailyPath. Zalecana aktualizacja PRD - usunięcie tych User Stories.

**Kluczowe zalety rozwiązania:**
- ✅ Pełna integracja z Supabase Auth (bezpieczeństwo, skalowalność)
- ✅ HTTP-only cookies (ochrona przed XSS)
- ✅ Row Level Security (separacja danych użytkowników)
- ✅ Obsługa zaproszeń zgodnie z PRD (TYLKO zaproszenia, bez publicznej rejestracji)
- ✅ System wysyłania emaili (zaproszenia, reset hasła) przez Supabase lub SendGrid
- ✅ Reset hasła i zmiana hasła
- ✅ Dezaktywacja konta przez admina (US-009)
- ✅ Onboarding nowych użytkowników (US-018)
- ✅ Zgodność z istniejącą architekturą Astro + React
- ✅ Sesje 12-godzinne zgodnie z US-002

**Następne kroki:**
1. Review specyfikacji przez zespół
2. Implementacja zgodnie z kolejnością w sekcji 8.1
3. Testowanie każdej fazy przed przejściem do kolejnej
4. Aktualizacja dokumentacji użytkownika

---

**Wersja dokumentu:** 1.1  
**Data:** 2026-01-08  
**Autor:** AI Assistant  
**Status:** Zaktualizowany po analizie sprzeczności z PRD

**Changelog v1.1:**
- Usunięto sprzeczności z PRD dotyczące publicznej rejestracji (tylko zaproszenia)
- Dodano sekcję 3.3.3 o dezaktywacji konta (US-009)
- Dodano sekcję 3.5 o systemie wysyłania emaili (US-001, US-003, US-010)
- Wyjaśniono, że US-044 i US-045 nie dotyczą DailyPath
- Zmieniono jwt_expiry na 12 godzin zgodnie z US-002
- Ustawiono enable_signup = false jako wymagane
- Zaktualizowano wszystkie referencje do "opcjonalnej publicznej rejestracji"
