# ⚠️ Tymczasowe wyłączenie Auth przy tworzeniu użytkowników

## Status

**UWAGA**: Obecnie tworzenie użytkowników jest skonfigurowane **BEZ** systemu uwierzytelniania Supabase Auth.

## ✅ Co zostało zmienione (2026-01-04)

1. **Migracja bazy danych** - `supabase/migrations/20260104120000_temp_remove_users_fk.sql`
   - Usunięto foreign key constraint `users.id -> auth.users(id)`
   - Pozwala na tworzenie użytkowników bez wpisu w `auth.users`

2. **Endpoint API** - `src/pages/api/admin/users.ts`
   - Zmieniony na generowanie losowego UUID zamiast tworzenia konta w Auth
   - Używa `supabaseAdmin` do ominięcia RLS i constraints

3. **Seed data** - `supabase/seed.sql`
   - Tworzy testowych użytkowników bezpośrednio w `public.users`
   - Nie wymaga skryptu `create-test-users.js`

4. **Komponent frontend** - `src/components/admin/UsersManagement.tsx`
   - Dodano powiadomienia toast (sukces/błąd)
   - Poprawiono odświeżanie listy użytkowników po dodaniu

## Co to oznacza?

- ✅ Możesz dodawać użytkowników przez panel administratora
- ✅ Użytkownicy będą widoczni na liście
- ✅ Możesz przypisywać im role i działy
- ❌ Użytkownicy **NIE BĘDĄ MOGLI SIĘ ZALOGOWAĆ** do systemu

## Jak to działa obecnie?

Zamiast tworzyć użytkownika w `auth.users` (Supabase Auth), system:
1. Generuje losowy UUID dla użytkownika
2. Tworzy profil bezpośrednio w tabeli `public.users`
3. Pomija całkowicie tworzenie konta w Supabase Auth

## Zmodyfikowane pliki

- `src/pages/api/admin/users.ts` - funkcje `POST` i `GET`
- `supabase/migrations/20260104120000_temp_remove_users_fk.sql` - usunięcie foreign key constraint
- `src/components/admin/UsersManagement.tsx` - dodano toasty i poprawiono odświeżanie

## Jak przywrócić normalne działanie?

Gdy Supabase Auth będzie poprawnie skonfigurowany, należy:

### 0. Przywrócić foreign key constraint

Usuń migrację `supabase/migrations/20260104120000_temp_remove_users_fk.sql` i utwórz nową migrację:

```sql
-- Restore foreign key constraint on users.id -> auth.users(id)
ALTER TABLE public.users 
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Update comment
COMMENT ON TABLE public.users IS NULL;
```

### 1. Przywrócić oryginalny kod w `src/pages/api/admin/users.ts`

Zamień sekcję tworzącą użytkownika (linie ~66-115) na:

```typescript
const { email, full_name, password, app_role, timezone } = validation.data;

// Create user in Supabase Auth using Admin API with service role key
const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // Auto-confirm email
  user_metadata: {
    full_name,
  },
});

if (authError) {
  console.error("Error creating user in auth:", authError);

  // Check for duplicate email
  if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
    return new Response(
      JSON.stringify({
        error: "Conflict",
        message: "Użytkownik z tym adresem email już istnieje",
      }),
      {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      error: "Auth error",
      message: "Nie udało się utworzyć użytkownika w systemie uwierzytelniania",
      details: authError.message,
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}

if (!authData.user) {
  return new Response(
    JSON.stringify({
      error: "Auth error",
      message: "Nie udało się utworzyć użytkownika",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// Create user profile in public.users table
const { data: profileData, error: profileError } = await supabase
  .from("users")
  .insert({
    id: authData.user.id, // Use Auth user ID
    email,
    full_name,
    app_role,
    timezone: timezone || "UTC",
    is_active: true,
  })
  .select()
  .single();

if (profileError) {
  console.error("Error creating user profile:", profileError);

  // Try to delete the auth user if profile creation failed
  await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

  return new Response(
    JSON.stringify({
      error: "Database error",
      message: "Nie udało się utworzyć profilu użytkownika",
      details: profileError.message,
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

### 2. Usuń tymczasowe komentarze

Usuń komentarze z `⚠️ TEMPORARY` z:
- Dokumentacji funkcji `POST`
- Schema walidacji (`createUserSchema`)

### 3. Migracja istniejących użytkowników (opcjonalnie)

Jeśli utworzyłeś użytkowników podczas okresu bez Auth, będziesz musiał:

1. Dla każdego użytkownika utworzyć konto w Supabase Auth
2. Zaktualizować ID użytkownika w tabeli `users` na ID z Auth
3. Lub usunąć tych użytkowników i utworzyć ich ponownie

## Sprawdzanie czy Auth jest włączony

Po przywróceniu normalnego działania, przetestuj:

```bash
# W Supabase Studio lub przez API
# Sprawdź czy użytkownicy są w auth.users
SELECT * FROM auth.users;
```

## Problem który prowadził do tej zmiany

Błąd: `"Nie udało się utworzyć użytkownika w systemie uwierzytelniania"`

Możliwe przyczyny:
- Brak poprawnego `SUPABASE_SERVICE_ROLE_KEY`
- Problemy z konfiguracją Supabase
- Supabase Auth nie jest dostępny

**Należy rozwiązać ten problem przed przywróceniem normalnego działania!**

---

**Data utworzenia**: 2026-01-04
**Należy usunąć ten plik po przywróceniu normalnego działania Auth.**

