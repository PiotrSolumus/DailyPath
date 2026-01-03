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

1. Upewnij się, że serwer deweloperski działa:
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

1. **Sprawdź konsolę przeglądarki** - wszystkie logi są tam wyświetlane
2. **Sprawdź terminal** - logi serwera są wyświetlane w terminalu gdzie uruchomiłeś `npm run dev`
3. **Sprawdź czy Supabase działa**:
   ```bash
   npx supabase status
   ```
   Powinno pokazać że wszystkie usługi są uruchomione.

4. **Sprawdź Supabase Studio**:
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

### Problem: "Wystąpił błąd podczas logowania"

**Rozwiązanie:**
1. Sprawdź czy Supabase jest uruchomiony: `npx supabase status`
2. Jeśli nie działa, uruchom: `npx supabase start`
3. Odśwież stronę logowania

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

