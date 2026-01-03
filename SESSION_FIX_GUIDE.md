# Naprawa sesji użytkownika - DailyPath

## ✅ Co zostało naprawione

### Problem:
- Logowanie działało ✅
- Przekierowanie do dashboard działało ✅  
- Ale inne strony wymagały ponownego logowania ❌
- Sesja nie była przechowywana między stronami ❌

### Przyczyna:
Middleware używało globalnego Supabase client który nie miał dostępu do cookies z przeglądarki, więc nie mógł odczytać sesji użytkownika.

### Rozwiązanie:
1. ✅ **Zainstalowano `@supabase/ssr`** - pakiet do obsługi sesji w środowisku serwerowym
2. ✅ **Zaktualizowano middleware** - teraz tworzy nowy Supabase client dla każdego requesta z dostępem do cookies
3. ✅ **Zaktualizowano stronę logowania** - używa `createBrowserClient` do zapisywania sesji w cookies
4. ✅ **Dodano zmienne środowiskowe** - `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_KEY`
5. ✅ **Dodano logi debugowania** - w middleware i stronie logowania

## 🚀 Jak przetestować

### Krok 1: Zrestartuj serwer deweloperski

**WAŻNE:** Musisz zrestartować serwer, aby zmiany w middleware zostały załadowane!

W terminalu gdzie działa `npm run dev`:
1. Naciśnij `Ctrl+C` aby zatrzymać serwer
2. Uruchom ponownie: `npm run dev`

### Krok 2: Wyloguj się i zaloguj ponownie

1. Otwórz http://localhost:3000/logout (to wyczyści starą sesję)
2. Przejdź do http://localhost:3000/login
3. Zaloguj się używając:
   - Email: `admin@test.com`
   - Hasło: `test123test`

### Krok 3: Sprawdź czy sesja działa

Po zalogowaniu:

1. **Otwórz konsolę przeglądarki (F12)**
2. **Przejdź do zakładki "Application" (Chrome) lub "Storage" (Firefox)**
3. **Sprawdź cookies** - powinieneś zobaczyć cookies od Supabase:
   - `sb-<project-ref>-auth-token`
   - `sb-<project-ref>-auth-token-code-verifier`

4. **Przejdź do innych stron:**
   - http://localhost:3000/dashboard - powinno działać ✅
   - http://localhost:3000/tasks - powinno działać ✅
   - http://localhost:3000/plan - powinno działać ✅
   - http://localhost:3000/reports - powinno działać ✅
   - http://localhost:3000/team - powinno działać ✅

5. **Sprawdź terminal** - w logach serwera powinieneś zobaczyć:
   ```
   User authenticated: admin@test.com Role: admin
   ```

### Krok 4: Test dodawania zadania

Po przejściu do `/tasks`, spróbuj kliknąć "Nowe zadanie" - powinno zadziałać!

## 🐛 Rozwiązywanie problemów

### Problem: Nadal każe się logować

**Rozwiązanie:**
1. Upewnij się, że zrestartowałeś serwer deweloperski (`Ctrl+C` → `npm run dev`)
2. Wyloguj się (http://localhost:3000/logout)
3. Wyczyść cookies w przeglądarce:
   - Chrome: F12 → Application → Cookies → localhost:3000 → usuń wszystkie
   - Firefox: F12 → Storage → Cookies → http://localhost:3000 → usuń wszystkie
4. Zaloguj się ponownie

### Problem: Błąd "createBrowserClient is not defined"

**Rozwiązanie:**
1. Upewnij się, że `@supabase/ssr` został zainstalowany: `npm install @supabase/ssr`
2. Zrestartuj serwer deweloperski

### Problem: W konsoli przeglądarki widzę błędy związane z Supabase

**Rozwiązanie:**
1. Sprawdź czy Supabase jest uruchomiony: `npx supabase status`
2. Jeśli nie, uruchom: `npx supabase start`
3. Zrestartuj serwer deweloperski

### Problem: W terminalu serwera nie widzę "User authenticated: ..."

**Rozwiązanie:**
1. Wyloguj się i zaloguj ponownie
2. Sprawdź terminal - logi powinny się pojawić po zalogowaniu
3. Jeśli nie ma logów, sprawdź czy w przeglądarce są zapisane cookies (F12 → Application/Storage → Cookies)

## 📋 Zmiany w kodzie

### `src/middleware/index.ts`
- Używa `createServerClient` z `@supabase/ssr`
- Tworzy nowy client dla każdego requesta z dostępem do cookies
- Dodano logi debugowania dla sesji

### `src/pages/login.astro`
- Używa `createBrowserClient` z `@supabase/ssr`
- Zapisuje sesję w cookies które są dostępne dla middleware
- Dodano małe opóźnienie przed przekierowaniem (100ms) aby cookies zdążyły się zapisać

### `src/env.d.ts`
- Dodano typy dla `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_KEY`

### `.env`
- Dodano publiczne zmienne środowiskowe

## ✅ Potwierdzenie że wszystko działa

Po zrestartowaniu serwera i zalogowaniu się, powinieneś móc:

- ✅ Zalogować się na `/login`
- ✅ Zobaczyć dashboard na `/dashboard`
- ✅ Przejść do `/tasks` bez ponownego logowania
- ✅ Przejść do `/plan` bez ponownego logowania
- ✅ Przejść do `/reports` bez ponownego logowania
- ✅ Przejść do `/team` bez ponownego logowania
- ✅ Kliknąć "Nowe zadanie" i zobaczyć formularz
- ✅ W terminalu serwera widzieć logi: "User authenticated: admin@test.com Role: admin"

Jeśli wszystkie powyższe punkty działają - gratulacje! Sesja działa poprawnie! 🎉

