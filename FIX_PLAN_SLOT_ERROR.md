# Naprawa błędu 54001 przy dodawaniu zadań do planu

## Problem
Gdy użytkownik klikał przycisk "Dodaj do planu" i wybierał godzinę, pojawiał się błąd:
```json
{"error":"Database error","message":"Failed to fetch tasks","code":"54001"}
```

Kod błędu 54001 to PostgreSQL error oznaczający "program_limit_exceeded", który zazwyczaj wskazuje na przekroczenie limitów połączeń lub głębokości stosu wywołań.

## Przyczyna
Problem był spowodowany przez **rekurencyjne wywołania RLS (Row Level Security)** w PostgreSQL:

1. Funkcja `current_app_role()` była używana w politykach RLS
2. Ta funkcja wykonywała zapytanie do tabeli `users`: `SELECT app_role FROM users WHERE id = auth.uid()`
3. Tabela `users` ma własne polityki RLS, które również wywołują `current_app_role()`
4. To tworzyło nieskończoną rekursję lub przekraczało limity głębokości stosu

## Rozwiązanie

### 1. Dodano `SECURITY DEFINER` do funkcji `current_app_role()`

Utworzono nową migrację `20260104000004_fix_current_app_role.sql`, która modyfikuje funkcję `current_app_role()`:

```sql
create or replace function public.current_app_role()
returns app_role
language plpgsql
stable
security definer -- To jest kluczowe: omija RLS podczas wykonywania tej funkcji
set search_path = public
as $$
declare
  v_role app_role;
begin
  select u.app_role into v_role
  from public.users u
  where u.id = auth.uid();

  if v_role is null then
    return 'employee'::app_role;
  end if;
  return v_role;
end;
$$;
```

**Kluczowe zmiany:**
- `SECURITY DEFINER` - funkcja wykonuje się z uprawnieniami jej twórcy (owner), omijając RLS
- `set search_path = public` - zabezpieczenie przed atakami przez manipulację search_path

### 2. Poprawiono komunikat błędu

Zaktualizowano `src/lib/utils/error-handler.ts`, aby wyświetlał rzeczywisty komunikat błędu z bazy danych zamiast na stałe wpisanego "Failed to fetch tasks":

```typescript
message: error.message || "A database error occurred",
```

### 3. Naprawiono skrypty seedowania

- Zaktualizowano `scripts/seed-database.js`, aby używał klucza `service_role` zamiast `anon`
- Dodano automatyczne ładowanie rzeczywistych UUID użytkowników z `test-tokens.json`
- To zapewnia, że seed data używa poprawnych ID użytkowników

## Testowanie

1. Zresetuj bazę danych:
   ```bash
   npx supabase db reset
   ```

2. Utwórz użytkowników testowych:
   ```bash
   node scripts/create-test-users.js
   ```

3. Zaseeduj bazę danych:
   ```bash
   node scripts/seed-database.js
   ```

4. Uruchom serwer dev:
   ```bash
   npm run dev
   ```

5. Zaloguj się jako employee1@test.com (hasło: test123test)

6. Przejdź do listy zadań i kliknij "Dodaj do planu" na dowolnym zadaniu

7. Wybierz datę i godzinę, a następnie kliknij "Dodaj do planu"

8. Zadanie powinno zostać dodane bez błędu 54001

## Pliki zmodyfikowane

- `supabase/migrations/20260104000004_fix_current_app_role.sql` - nowa migracja
- `src/lib/utils/error-handler.ts` - poprawiony komunikat błędu
- `scripts/seed-database.js` - używa service_role i rzeczywistych UUID

## Uwagi techniczne

### Dlaczego SECURITY DEFINER jest bezpieczne tutaj?

1. Funkcja tylko odczytuje `app_role` dla bieżącego użytkownika (`auth.uid()`)
2. Nie przyjmuje parametrów od użytkownika
3. Nie modyfikuje danych
4. Ma ustawiony `search_path` dla bezpieczeństwa
5. Jest oznaczona jako `STABLE`, co oznacza że nie modyfikuje bazy danych

### Alternatywne rozwiązania (nie zastosowane)

1. **Usunięcie RLS z tabeli users** - nie zalecane ze względów bezpieczeństwa
2. **Cachowanie app_role w sesji** - wymaga zmian w middleware i może być nieaktualne
3. **Używanie auth.jwt() zamiast zapytania do users** - wymaga przechowywania app_role w JWT

## Status
✅ Naprawione i przetestowane



