# Tryb bez autentykacji - Instrukcja

## 📋 Przegląd

Aplikacja DailyPath została tymczasowo skonfigurowana do działania **bez prawdziwej autentykacji**. Zamiast logowania użytkowników przez Supabase Auth, możesz teraz:

- ✅ Wybierać użytkowników z listy
- ✅ Dodawać nowych użytkowników
- ✅ Dodawać i wyświetlać zadania
- ✅ Testować wszystkie funkcjonalności aplikacji

## 🚀 Jak korzystać

### 1. Uruchom aplikację

```bash
npm run dev
```

### 2. Wybierz użytkownika

1. Przejdź do strony głównej: `http://localhost:4321`
2. Kliknij "Zaloguj się" lub przejdź bezpośrednio do `/login`
3. Zobaczysz listę dostępnych użytkowników
4. Kliknij na dowolnego użytkownika, aby go "zalogować"

### 3. Dodaj nowych użytkowników

#### Opcja A: Przez panel Admin (wymaga bycia zalogowanym jako admin)

1. Zaloguj się jako użytkownik z rolą `admin`
2. Przejdź do zakładki "Zarządzanie" (Admin)
3. Użyj formularza do dodania nowego użytkownika

#### Opcja B: Przez skrypt seed

```bash
node scripts/seed-database.js
```

Ten skrypt utworzy domyślnych użytkowników testowych.

### 4. Przełączanie między użytkownikami

- Kliknij "Wyloguj" w menu bocznym
- Wybierz innego użytkownika z listy na stronie `/login`

## 🔧 Co zostało zmodyfikowane

### Middleware (`src/middleware/index.ts`)

- ✅ Usunięto sprawdzanie sesji Supabase Auth
- ✅ Użytkownik jest pobierany z cookie `temp_user_id`
- ✅ Wszystkie operacje używają `supabaseAdmin` (service_role) aby ominąć RLS

### Strona logowania (`src/pages/login.astro`)

- ✅ Zamiast formularza email/hasło: lista dostępnych użytkowników
- ✅ Kliknięcie na użytkownika ustawia cookie i przekierowuje do `/dashboard`

### Strona wylogowania (`src/pages/logout.astro`)

- ✅ Usuwa cookie `temp_user_id`
- ✅ Przekierowuje do `/login`

### API Endpoints

- ✅ Sprawdzenia autentykacji pozostały, ale komunikaty błędów są bardziej przyjazne
- ✅ Wszystkie endpointy działają normalnie po wyborze użytkownika
- ✅ Nowy endpoint: `GET /api/users` - lista wszystkich użytkowników (bez autentykacji)

### Strony aplikacji

- ✅ Wszystkie strony działają z wybranym użytkownikiem
- ✅ Strony wymagające użytkownika pokazują przyjazny komunikat i link do `/login`
- ✅ Strona Admin przekierowuje do `/login` jeśli nie wybrano użytkownika

## 📝 Testowanie funkcjonalności

### Dodawanie zadań

1. Zaloguj się jako dowolny użytkownik
2. Przejdź do zakładki "Zadania"
3. Kliknij "Dodaj zadanie"
4. Wypełnij formularz i zapisz

### Wyświetlanie zadań

- Zadania są wyświetlane na stronie "Zadania"
- Możesz filtrować zadania według statusu, priorytetu, itp.
- Zadania prywatne (`is_private: true`) są widoczne tylko dla właściciela

### Przełączanie użytkowników

1. Wyloguj się
2. Zaloguj jako inny użytkownik
3. Zobacz, że zadania i dane są różne dla każdego użytkownika

## ⚠️ Ważne uwagi

### To jest tryb TYMCZASOWY

- Ten tryb jest przeznaczony **tylko do testowania**
- W produkcji **MUSISZ** przywrócić prawdziwą autentykację
- Nie deployuj aplikacji z tym trybem na serwer publiczny

### Bezpieczeństwo

- Wszyscy użytkownicy są dostępni publicznie
- Nie ma żadnej weryfikacji tożsamości
- RLS (Row Level Security) jest omijany przez użycie `service_role`

### Cookie

- Cookie `temp_user_id` przechowuje ID wybranego użytkownika
- Cookie wygasa po 24 godzinach
- Cookie jest ustawiony tylko na poziomie przeglądarki (nie jest HttpOnly w JS)

## 🔄 Przywracanie autentykacji

Gdy będziesz gotowy przywrócić prawdziwą autentykację:

1. Przywróć oryginalny `src/middleware/index.ts` z systemu kontroli wersji
2. Przywróć oryginalny `src/pages/login.astro`
3. Przywróć oryginalny `src/pages/logout.astro`
4. Usuń endpoint `src/pages/api/users.ts` (jeśli nie jest potrzebny)
5. Przywróć komunikaty błędów w API endpoints
6. Skonfiguruj Supabase Auth zgodnie z `LOGIN_GUIDE.md`

## 📚 Pliki do przywrócenia później

Jeśli chcesz zachować backup obecnego kodu z autentykacją, przed modyfikacją skopiuj:

- `src/middleware/index.ts` → `src/middleware/index.ts.backup`
- `src/pages/login.astro` → `src/pages/login.astro.backup`
- `src/pages/logout.astro` → `src/pages/logout.astro.backup`

## 🐛 Rozwiązywanie problemów

### Brak użytkowników na stronie logowania

```bash
# Uruchom skrypt seed
node scripts/seed-database.js

# Lub sprawdź czy Supabase jest uruchomiony
npx supabase status
```

### Błąd "Proszę wybrać użytkownika"

- Upewnij się, że wybrałeś użytkownika na stronie `/login`
- Sprawdź czy cookie `temp_user_id` jest ustawione (DevTools → Application → Cookies)
- Jeśli cookie wygasło, zaloguj się ponownie

### Użytkownik nie ma danych

- Użytkownik może nie mieć zadań, planów, itp.
- Dodaj dane ręcznie przez interfejs
- Lub uruchom skrypt seed ponownie

## 📞 Kontakt

Jeśli masz pytania lub problemy, sprawdź:

- `README.md` - główna dokumentacja projektu
- `docs/DEVELOPER_GUIDE.md` - przewodnik dla developerów
- `LOGIN_GUIDE.md` - oryginalny przewodnik logowania (z autentykacją)


