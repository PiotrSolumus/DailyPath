# Przewodnik ochrony stron - DailyPath

## Przegląd

Dokument opisuje mechanizm autoryzacji stron w aplikacji DailyPath, zapewniający że tylko zalogowani użytkownicy mogą uzyskać dostęp do chronionych zasobów.

**Status:** ✅ Implementacja ukończona  
**Data:** 2026-01-08

## Architektura autoryzacji

### 1. Middleware (src/middleware/index.ts)

Middleware Astro automatycznie:
- Tworzy klientów Supabase dla każdego żądania
- Pobiera sesję użytkownika z cookies (Supabase Auth)
- Ładuje profil użytkownika z bazy danych
- Udostępnia dane użytkownika w `Astro.locals.user`

```typescript
// W każdym żądaniu automatycznie:
context.locals.user = {
  id: string;
  app_role: 'Admin' | 'Manager' | 'Employee';
  email: string;
  full_name: string;
  timezone: string;
  active_department: { id: string; name: string } | null;
} | null;
```

### 2. Utility functions (src/lib/utils/auth.ts)

Moduł dostarcza reużywalne funkcje do sprawdzania autoryzacji w stronach Astro:

#### `requireAuth(Astro, redirectTo?)`

**Wymusza autoryzację** - przekierowuje niezalogowanych użytkowników do strony logowania.

```astro
---
import { requireAuth } from "../lib/utils/auth";

const user = requireAuth(Astro);
// Jeśli użytkownik nie jest zalogowany, zostanie przekierowany do /login
---
```

**Parametry:**
- `Astro` - obiekt Astro global
- `redirectTo` (opcjonalny) - URL do przekierowania po zalogowaniu (domyślnie: bieżąca strona)

**Zwraca:** Obiekt `UserMeDTO`

**Przekierowanie:** `/login?redirect={current_page}`

---

#### `requireRole(Astro, role)`

**Wymusza konkretną rolę** - sprawdza autoryzację i rolę użytkownika.

```astro
---
import { requireRole } from "../lib/utils/auth";

const user = requireRole(Astro, "Admin");
// Tylko administratorzy mogą uzyskać dostęp do tej strony
---
```

**Parametry:**
- `Astro` - obiekt Astro global
- `role` - wymagana rola: `'Admin'` | `'Manager'` | `'Employee'`

**Zwraca:** Obiekt `UserMeDTO` (z wymaganą rolą)

**Przekierowania:**
- Jeśli niezalogowany: `/login?redirect={current_page}`
- Jeśli brak uprawnień: `/dashboard?error=insufficient_permissions`

---

#### `isAuthenticated(Astro)`

**Sprawdza autoryzację** bez przekierowania - zwraca `true`/`false`.

```astro
---
import { isAuthenticated } from "../lib/utils/auth";

const isLoggedIn = isAuthenticated(Astro);
---

{isLoggedIn ? (
  <p>Witaj, {Astro.locals.user?.full_name}!</p>
) : (
  <p>Zaloguj się, aby kontynuować</p>
)}
```

**Użycie:** Warunkowe renderowanie treści, opcjonalne funkcje

---

#### `hasRole(Astro, role)`

**Sprawdza rolę** bez przekierowania - zwraca `true`/`false`.

```astro
---
import { hasRole } from "../lib/utils/auth";

const isAdmin = hasRole(Astro, "Admin");
---

{isAdmin && (
  <a href="/admin">Panel administracyjny</a>
)}
```

**Użycie:** Warunkowe wyświetlanie elementów UI

---

#### `redirectIfAuthenticated(Astro)`

**Przekierowuje zalogowanych** użytkowników do dashboardu.

```astro
---
import { redirectIfAuthenticated } from "../lib/utils/auth";

// Na stronie logowania - nie pozwól zalogowanym użytkownikom
redirectIfAuthenticated(Astro);
---
```

**Użycie:** Strony logowania, rejestracji, resetu hasła

**Przekierowanie:** `/dashboard`

---

## Implementacja w stronach

### Chronione strony aplikacji

Wszystkie główne strony aplikacji są chronione za pomocą `requireAuth`:

```astro
---
import { requireAuth } from "../lib/utils/auth";

const user = requireAuth(Astro);
---
```

**Lista chronionych stron:**
- `/` (index.astro) - strona główna
- `/dashboard` - pulpit użytkownika
- `/tasks` - lista zadań
- `/plan` - kalendarz planowania
- `/settings` - ustawienia użytkownika
- `/reports` - raporty
- `/team` - widok zespołu
- `/time-logs` - czas pracy

---

### Strony wymagające konkretnych ról

Strona administracyjna wymaga roli `Admin`:

```astro
---
// src/pages/admin.astro
import { requireRole } from "../lib/utils/auth";

const user = requireRole(Astro, "Admin");
---
```

**Lista stron z kontrolą ról:**
- `/admin` - wymaga roli `Admin`

---

### Strony autoryzacji (logowanie, rejestracja)

Strony logowania i rejestracji używają `redirectIfAuthenticated`:

```astro
---
// src/pages/login.astro
import { redirectIfAuthenticated } from "../lib/utils/auth";

// Zalogowani użytkownicy są automatycznie przekierowywani do dashboardu
redirectIfAuthenticated(Astro);

const redirect = Astro.url.searchParams.get("redirect") || "/dashboard";
---
```

**Lista stron z przekierowaniem zalogowanych:**
- `/login` - strona logowania
- `/register` - strona rejestracji

**Uwaga:** Strona `/reset-password` nie przekierowuje zalogowanych użytkowników, aby umożliwić zmianę hasła.

---

## Przykłady użycia

### Przykład 1: Prosta chroniona strona

```astro
---
// src/pages/my-protected-page.astro
import AppLayout from "../layouts/AppLayout.astro";
import { requireAuth } from "../lib/utils/auth";

// Wymaga autoryzacji
const user = requireAuth(Astro);
---

<AppLayout title="Moja strona - DailyPath" user={user}>
  <h1>Witaj, {user.full_name}!</h1>
  <p>To jest chroniona strona.</p>
</AppLayout>
```

---

### Przykład 2: Strona tylko dla administratorów

```astro
---
// src/pages/admin-only.astro
import AppLayout from "../layouts/AppLayout.astro";
import { requireRole } from "../lib/utils/auth";

// Wymaga roli Admin
const user = requireRole(Astro, "Admin");
---

<AppLayout title="Panel Admin - DailyPath" user={user}>
  <h1>Panel administracyjny</h1>
  <p>Tylko administratorzy mają dostęp do tej strony.</p>
</AppLayout>
```

---

### Przykład 3: Strona z warunkową treścią

```astro
---
// src/pages/conditional-content.astro
import AppLayout from "../layouts/AppLayout.astro";
import { requireAuth, hasRole } from "../lib/utils/auth";

const user = requireAuth(Astro);
const isAdmin = hasRole(Astro, "Admin");
const isManager = hasRole(Astro, "Manager");
---

<AppLayout title="Treść warunkowa - DailyPath" user={user}>
  <h1>Witaj, {user.full_name}!</h1>
  
  {isAdmin && (
    <div class="admin-section">
      <h2>Sekcja administratora</h2>
      <a href="/admin">Panel administracyjny</a>
    </div>
  )}
  
  {(isAdmin || isManager) && (
    <div class="manager-section">
      <h2>Sekcja menedżerska</h2>
      <a href="/team">Zarządzaj zespołem</a>
    </div>
  )}
  
  <div class="user-section">
    <h2>Sekcja użytkownika</h2>
    <p>Dostępna dla wszystkich zalogowanych użytkowników.</p>
  </div>
</AppLayout>
```

---

### Przykład 4: Strona logowania z przekierowaniem

```astro
---
// src/pages/login.astro
import AuthLayout from "../layouts/AuthLayout.astro";
import { LoginForm } from "../components/auth/LoginForm";
import { redirectIfAuthenticated } from "../lib/utils/auth";

// Zalogowani są automatycznie przekierowywani do dashboardu
redirectIfAuthenticated(Astro);

// Obsługa parametru ?redirect= dla powrotu po zalogowaniu
const redirect = Astro.url.searchParams.get("redirect") || "/dashboard";
const message = Astro.url.searchParams.get("message");
---

<AuthLayout title="Logowanie - DailyPath">
  <LoginForm client:load redirect={redirect} initialMessage={message} />
</AuthLayout>
```

---

## Przepływ autoryzacji

### 1. Użytkownik niezalogowany próbuje uzyskać dostęp do chronionej strony

```
1. Użytkownik przechodzi do /dashboard
2. Middleware sprawdza sesję → brak sesji
3. Astro.locals.user = null
4. requireAuth(Astro) wykrywa brak użytkownika
5. Przekierowanie do /login?redirect=/dashboard
6. Użytkownik widzi formularz logowania
```

### 2. Użytkownik loguje się pomyślnie

```
1. Użytkownik wypełnia formularz logowania
2. POST /api/auth/login → tworzy sesję w Supabase Auth
3. Przegladarka otrzymuje cookies sesji
4. Przekierowanie do /dashboard (z parametru ?redirect=)
5. Middleware sprawdza sesję → sesja istnieje
6. Middleware ładuje profil użytkownika
7. Astro.locals.user = { ... }
8. requireAuth(Astro) zwraca obiekt użytkownika
9. Dashboard renderuje się prawidłowo
```

### 3. Użytkownik próbuje uzyskać dostęp do strony administratora bez uprawnień

```
1. Employee próbuje wejść na /admin
2. Middleware sprawdza sesję → sesja istnieje
3. Astro.locals.user = { app_role: "Employee", ... }
4. requireRole(Astro, "Admin") sprawdza rolę
5. Rola nie pasuje (Employee !== Admin)
6. Przekierowanie do /dashboard?error=insufficient_permissions
7. Użytkownik widzi dashboard z komunikatem błędu
```

### 4. Zalogowany użytkownik próbuje wejść na stronę logowania

```
1. Zalogowany użytkownik przechodzi do /login
2. Middleware sprawdza sesję → sesja istnieje
3. Astro.locals.user = { ... }
4. redirectIfAuthenticated(Astro) wykrywa użytkownika
5. Przekierowanie do /dashboard
6. Użytkownik widzi dashboard
```

---

## Best practices

### ✅ Dobre praktyki

1. **Zawsze używaj `requireAuth` na stronach wymagających autoryzacji**
   ```astro
   const user = requireAuth(Astro);
   ```

2. **Używaj `requireRole` dla kontroli dostępu opartej na rolach**
   ```astro
   const user = requireRole(Astro, "Admin");
   ```

3. **Używaj `redirectIfAuthenticated` na stronach autoryzacji**
   ```astro
   redirectIfAuthenticated(Astro);
   ```

4. **Używaj `isAuthenticated` i `hasRole` dla warunkowego renderowania**
   ```astro
   const isAdmin = hasRole(Astro, "Admin");
   ```

5. **Przekazuj obiekt `user` do layoutów i komponentów**
   ```astro
   <AppLayout title="..." user={user}>
   ```

---

### ❌ Antypatterns

1. **Nie sprawdzaj `Astro.locals.user` bezpośrednio w każdej stronie**
   ```astro
   // ❌ ZŁE
   const user = Astro.locals.user;
   if (!user) {
     return Astro.redirect("/login");
   }
   
   // ✅ DOBRE
   const user = requireAuth(Astro);
   ```

2. **Nie używaj różnych konwencji sprawdzania autoryzacji**
   ```astro
   // ❌ ZŁE - niespójna implementacja
   if (!Astro.locals.user) return Astro.redirect("/login");
   if (Astro.locals.user.app_role !== "admin") return Astro.redirect("/dashboard");
   
   // ✅ DOBRE - użyj utility functions
   const user = requireRole(Astro, "Admin");
   ```

3. **Nie pomijaj sprawdzania autoryzacji na stronach wrażliwych**
   ```astro
   // ❌ ZŁE - brak sprawdzenia autoryzacji
   ---
   import AppLayout from "../layouts/AppLayout.astro";
   const user = Astro.locals.user; // może być null!
   ---
   
   // ✅ DOBRE
   ---
   import { requireAuth } from "../lib/utils/auth";
   const user = requireAuth(Astro);
   ---
   ```

---

## Testowanie

### Test manualny 1: Dostęp bez logowania

1. Wyloguj się z aplikacji (przejdź do `/logout`)
2. Spróbuj wejść na chronioną stronę (np. `/dashboard`)
3. ✅ Powinieneś być przekierowany do `/login?redirect=/dashboard`
4. Po zalogowaniu powinieneś być przekierowany z powrotem do `/dashboard`

---

### Test manualny 2: Dostęp do strony administratora

1. Zaloguj się jako Employee (np. `employee1@test.com`)
2. Spróbuj wejść na `/admin`
3. ✅ Powinieneś być przekierowany do `/dashboard?error=insufficient_permissions`
4. Wyloguj się i zaloguj jako Admin (`admin@test.com`)
5. Przejdź do `/admin`
6. ✅ Powinieneś zobaczyć panel administracyjny

---

### Test manualny 3: Strona logowania gdy jesteś zalogowany

1. Zaloguj się do aplikacji
2. Spróbuj wejść na `/login`
3. ✅ Powinieneś być przekierowany do `/dashboard`

---

## Rozszerzanie systemu

### Dodawanie nowej chronionej strony

1. Utwórz nowy plik w `src/pages/`
2. Zaimportuj `requireAuth` lub `requireRole`
3. Wywołaj funkcję na początku skryptu Astro

```astro
---
// src/pages/new-protected-page.astro
import AppLayout from "../layouts/AppLayout.astro";
import { requireAuth } from "../lib/utils/auth";

const user = requireAuth(Astro);
---

<AppLayout title="Nowa strona - DailyPath" user={user}>
  <!-- Twoja treść -->
</AppLayout>
```

---

### Dodawanie nowych ról

Jeśli potrzebujesz dodać nowe role:

1. Zaktualizuj typ `AppRole` w `src/types.ts`
2. Zaktualizuj funkcje w `src/lib/utils/auth.ts`
3. Dodaj odpowiednie migracje bazy danych
4. Zaktualizuj tę dokumentację

---

## Integracja z Supabase Auth

System autoryzacji DailyPath jest zbudowany na bazie **Supabase Auth** z obsługą SSR:

- **@supabase/ssr** - zarządza sesją po stronie serwera
- **Middleware** - pobiera sesję z cookies dla każdego żądania
- **RLS (Row Level Security)** - polityki bezpieczeństwa na poziomie bazy danych
- **Cookies** - przechowują tokeny sesji (httpOnly, secure)

### Cykl życia sesji

```
1. Logowanie → Supabase Auth tworzy sesję
2. Sesja zapisana w cookies (httpOnly, secure)
3. Każde żądanie → Middleware odczytuje cookies
4. Middleware → Weryfikuje sesję w Supabase Auth
5. Middleware → Ładuje profil użytkownika z bazy
6. Middleware → Ustawia context.locals.user
7. Strona → Używa requireAuth/requireRole
8. Wylogowanie → Supabase Auth usuwa sesję i cookies
```

---

## Zgodność z PRD

✅ **US-002** - Logowanie email/hasło z przekierowaniem  
✅ **US-004** - Wylogowanie (strona `/logout`)  
✅ **Kontrola dostępu** - Chronione strony wymagają autoryzacji  
✅ **Role-based access** - Strona `/admin` tylko dla administratorów  
✅ **Session management** - Supabase Auth z SSR  
✅ **Security** - RLS policies, httpOnly cookies

---

## Podsumowanie

**Status implementacji:** ✅ Ukończona  
**Chronione strony:** 9 (index, dashboard, tasks, plan, settings, reports, team, time-logs, admin)  
**Strony z kontrolą ról:** 1 (admin)  
**Utworzone pliki:** 2  
- `src/lib/utils/auth.ts` - utility functions
- `docs/AUTH_PROTECTION_GUIDE.md` - dokumentacja

**Zmodyfikowane strony:** 11  
**Błędy lintingu:** 0

System autoryzacji jest w pełni funkcjonalny i gotowy do użycia w produkcji.
