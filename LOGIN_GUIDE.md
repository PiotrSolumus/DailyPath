# Przewodnik logowania - DailyPath

## ✅ Status

- ✅ Supabase uruchomiony i działa
- ✅ Użytkownicy testowi utworzeni
- ✅ Strona logowania gotowa z debugowaniem
- ✅ Rejestracja użytkowników wyłączona - tylko admin może dodawać użytkowników

## 🔐 Dane testowe

Możesz zalogować się używając następujących kont:

| Email | Hasło | Rola |
|-------|-------|------|
| admin@test.com | test123test | Admin |
| manager1@test.com | test123test | Manager |
| manager2@test.com | test123test | Manager |
| employee1@test.com | test123test | Employee |
| employee2@test.com | test123test | Employee |
| employee3@test.com | test123test | Employee |

## 🚀 Jak się zalogować

1. **Upewnij się, że Docker Desktop jest uruchomiony** ⚠️
   - Docker Desktop musi być uruchomiony przed Supabase

2. **Uruchom Supabase** (jeśli nie jest uruchomiony):
   ```bash
   npx supabase start
   ```
   Poczekaj aż zobaczysz: "Started supabase local development setup"

3. **Upewnij się, że użytkownicy testowi istnieją**:
   ```bash
   node scripts/create-test-users.js
   ```
   Ten skrypt utworzy użytkowników testowych jeśli jeszcze nie istnieją.

4. **Uruchom serwer deweloperski**:
   ```bash
   npm run dev
   ```

2. Otwórz przeglądarkę i przejdź do:
   ```
   http://localhost:3000/login
   ```

3. Otwórz konsolę przeglądarki (F12) aby zobaczyć logi debugowania

4. Wprowadź dane logowania:
   - Email: `admin@test.com`
   - Hasło: `test123test`

5. Kliknij "Zaloguj się"

6. Sprawdź konsolę przeglądarki:
   - Powinieneś zobaczyć logi: "Form submitted!", "Attempting login for: admin@test.com", "Login successful!"
   - Po udanym logowaniu zostaniesz przekierowany do `/dashboard`

## 🐛 Debugowanie

Jeśli logowanie nie działa:

1. **Sprawdź czy Docker Desktop jest uruchomiony** ⚠️ **WAŻNE**
   - Docker Desktop musi być uruchomiony przed uruchomieniem Supabase
   - Sprawdź czy Docker Desktop działa w systemie Windows
   - Jeśli nie, uruchom Docker Desktop i poczekaj aż się w pełni załaduje

2. **Sprawdź konsolę przeglądarki** - wszystkie logi są tam wyświetlane
3. **Sprawdź terminal** - logi serwera są wyświetlane w terminalu gdzie uruchomiłeś `npm run dev`
4. **Sprawdź czy Supabase działa**:
   ```bash
   npx supabase status
   ```
   Powinno pokazać że wszystkie usługi są uruchomione.
   
   Jeśli widzisz błąd `ECONNREFUSED` lub `Docker Desktop is a prerequisite`:
   - Uruchom Docker Desktop
   - Następnie uruchom: `npx supabase start`
   - Poczekaj aż wszystkie usługi się uruchomią (może to zająć 1-2 minuty)

5. **Sprawdź Supabase Studio**:
   - Otwórz http://127.0.0.1:54323
   - Przejdź do Authentication > Users
   - Sprawdź czy użytkownicy istnieją

## 📝 Dodawanie nowego użytkownika

Użytkownicy mogą być dodawani wyłącznie przez administratora w panelu administracyjnym:

1. Zaloguj się jako administrator (admin@test.com)
2. Przejdź do http://localhost:3000/admin
3. Kliknij przycisk "Dodaj użytkownika" w sekcji Użytkownicy
4. Wypełnij formularz z danymi nowego użytkownika

## 🔧 Rozwiązywanie problemów

### Problem: "Wystąpił błąd podczas logowania" lub "fetch failed" lub "ECONNREFUSED"

**Rozwiązanie:**
1. **Uruchom Docker Desktop** (jeśli nie jest uruchomiony)
2. Sprawdź czy Supabase jest uruchomiony: `npx supabase status`
3. Jeśli nie działa, uruchom: `npx supabase start`
   - Poczekaj aż zobaczysz: "Started supabase local development setup"
4. Odśwież stronę logowania

### Problem: "Nieprawidłowy email lub hasło"

**Rozwiązanie:**
1. Sprawdź czy użytkownik istnieje w Supabase Studio (http://127.0.0.1:54323)
2. Jeśli nie, uruchom: `node scripts/create-test-users.js`
3. Użyj dokładnie tych danych: `admin@test.com` / `test123test`

### Problem: Po kliknięciu "Zaloguj się" nic się nie dzieje

**Rozwiązanie:**
1. Otwórz konsolę przeglądarki (F12)
2. Sprawdź czy widzisz logi: "Form submitted!", "Attempting login for: ..."
3. Jeśli nie widzisz logów, odśwież stronę (Ctrl+F5)
4. Jeśli nadal nie działa, sprawdź czy nie ma błędów JavaScript w konsoli

## 🎯 Następne kroki

Po zalogowaniu możesz:
- Przejść do `/dashboard` - panel główny
- Przejść do `/tasks` - lista zadań
- Przejść do `/plan` - kalendarz planowania
- Przejść do `/reports` - raporty
- Przejść do `/team` - zespół

## 📊 Testowanie API

Jeśli chcesz przetestować API bezpośrednio, użyj tokenów z pliku `test-tokens.json`:

```powershell
# Przykład: GET /api/tasks
$token = (Get-Content test-tokens.json | ConvertFrom-Json).tokens[0].token
Invoke-WebRequest -Uri "http://localhost:3000/api/tasks" -Headers @{"Authorization"="Bearer $token"}
```

## ✅ Potwierdzenie

Jeśli wszystko działa poprawnie:
- ✅ Widzisz stronę logowania
- ✅ Po wprowadzeniu danych i kliknięciu "Zaloguj się" widzisz logi w konsoli
- ✅ Po udanym logowaniu jesteś przekierowany do `/dashboard`
- ✅ Na dashboardzie widzisz swoje dane użytkownika

Jeśli którykolwiek z tych punktów nie działa, sprawdź sekcję "Rozwiązywanie problemów" powyżej.

