# Przewodnik Manualnego Setupu - Test Users

**Problem**: Fetch API nie działa z Node.js do lokalnego Supabase  
**Rozwiązanie**: Manualne utworzenie użytkowników przez Supabase Studio

---

## Krok 1: Otwórz Supabase Studio

1. Otwórz przeglądarkę
2. Przejdź do: `http://127.0.0.1:54323`
3. Studio powinno się otworzyć automatycznie

---

## Krok 2: Utwórz użytkowników testowych

### Przejdź do Authentication → Users

1. Kliknij **Authentication** w menu bocznym
2. Kliknij **Users**
3. Kliknij **Add User** (lub **Create New User**)

### Utwórz 6 użytkowników:

#### User 1: Admin
- **Email**: `admin@test.com`
- **Password**: `test123test`
- **Auto Confirm User**: ✅ TAK
- **User Metadata**: `{}`
- **App Metadata**: 
```json
{
  "app_role": "admin"
}
```

#### User 2: Manager 1
- **Email**: `manager1@test.com`
- **Password**: `test123test`
- **Auto Confirm User**: ✅ TAK
- **App Metadata**: 
```json
{
  "app_role": "manager"
}
```

#### User 3: Manager 2
- **Email**: `manager2@test.com`
- **Password**: `test123test`
- **Auto Confirm User**: ✅ TAK
- **App Metadata**: 
```json
{
  "app_role": "manager"
}
```

#### User 4: Employee 1
- **Email**: `employee1@test.com`
- **Password**: `test123test`
- **Auto Confirm User**: ✅ TAK
- **App Metadata**: 
```json
{
  "app_role": "employee"
}
```

#### User 5: Employee 2
- **Email**: `employee2@test.com`
- **Password**: `test123test`
- **Auto Confirm User**: ✅ TAK
- **App Metadata**: 
```json
{
  "app_role": "employee"
}
```

#### User 6: Employee 3
- **Email**: `employee3@test.com`
- **Password**: `test123test`
- **Auto Confirm User**: ✅ TAK
- **App Metadata**: 
```json
{
  "app_role": "employee"
}
```

---

## Krok 3: Zaaplikuj Seed Data

### Przejdź do SQL Editor

1. Kliknij **SQL Editor** w menu bocznym
2. Kliknij **New Query**
3. Skopiuj całą zawartość pliku `supabase/seed.sql`
4. Wklej do SQL Editor
5. Kliknij **Run** (lub Ctrl/Cmd + Enter)

### Zweryfikuj dane

1. Przejdź do **Table Editor**
2. Sprawdź tabele:
   - `users` - powinno być 6 użytkowników
   - `departments` - powinny być 3 działy
   - `tasks` - powinno być 7 zadań
   - `plan_slots` - powinny być 3 sloty

---

## Krok 4: Uzyskaj JWT Tokens

### Metoda 1: Przez API (Postman/cURL)

```bash
# For each user:
curl -X POST http://127.0.0.1:54321/auth/v1/token?grant_type=password \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"test123test"}'
```

### Metoda 2: Przez Browser Console

1. Otwórz `http://localhost:3000` w przeglądarce
2. Otwórz Developer Tools (F12)
3. W Console wklej:

```javascript
// Supabase client już powinien być dostępny
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@test.com',
  password: 'test123test'
});

if (data.session) {
  console.log('Token:', data.session.access_token);
  // Copy token from console
}
```

4. Powtórz dla każdego użytkownika
5. Zapisz tokeny do pliku `test-tokens.txt`

---

## Krok 5: Testowanie

Teraz możesz użyć tokenów do testowania API:

```bash
# Replace TOKEN with actual JWT token
curl -X GET "http://localhost:3000/api/tasks" \
  -H "Authorization: Bearer TOKEN"
```

Lub użyj pliku `test-api.http` w VS Code z REST Client extension.

---

## Troubleshooting

### Problem: "Invalid login credentials"
- Sprawdź czy hasło to `test123test` (min 10 znaków)
- Sprawdź czy użytkownik został oznaczony jako "confirmed"

### Problem: "User not found in public.users"
- Zaaplikuj seed data z `supabase/seed.sql`
- Lub ręcznie dodaj użytkowników do tabeli `public.users`

### Problem: "403 Forbidden" lub brak zadań
- Sprawdź czy RLS policies są włączone
- Sprawdź czy seed data zawiera zadania
- Sprawdź czy `app_metadata.app_role` jest ustawiony poprawnie

---

**Po wykonaniu tych kroków** możesz kontynuować testy API! 🚀

