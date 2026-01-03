# Database Setup Guide

## Inicjalizacja lokalnej bazy danych Supabase

### Wymagania
- Node.js
- Supabase CLI (zainstalowany jako dev dependency)

### Kroki

#### 1. Uruchom lokalny Supabase
```bash
npx supabase start
```

#### 2. Wykonaj migracje (jeśli to pierwszy raz)
```bash
npx supabase db reset --local
```

**Uwaga:** Reset bazy wyczyści wszystkie dane i wykona wszystkie migracje.

#### 3. Utwórz użytkowników testowych
Po resecie bazy, musisz utworzyć użytkowników w Supabase Auth:

```bash
node scripts/create-test-users.js
```

Ten skrypt utworzy:
- Użytkowników w `auth.users` (Supabase Auth)
- Odpowiadające im rekordy w `public.users`
- Zapisze tokeny JWT do `test-tokens.json` dla testowania API

#### 4. Załaduj dodatkowe dane testowe
Jeśli chcesz załadować dane testowe (departamenty, zadania, etc.), uruchom:

```bash
node scripts/seed-database.js
```

Lub możesz załadować je ręcznie przez Supabase Studio (http://127.0.0.1:54323).

### Użytkownicy testowi

Po wykonaniu `create-test-users.js`, będziesz miał następujących użytkowników:

| Email | Hasło | Rola |
|-------|-------|------|
| admin@test.com | test123test | admin |
| manager1@test.com | test123test | manager |
| manager2@test.com | test123test | manager |
| employee1@test.com | test123test | employee |
| employee2@test.com | test123test | employee |
| employee3@test.com | test123test | employee |

### Rozwiązywanie problemów

#### Błąd 42P17 (partition not found)
Ten błąd oznacza, że brakuje partycji dla bieżącego miesiąca. Tabele `plan_slots`, `time_logs` i `events` są partycjonowane miesięcznie.

**Rozwiązanie:**
1. Sprawdź czy istnieje migracja dla bieżącego miesiąca w `supabase/migrations/`
2. Jeśli nie, stwórz nową migrację:
   ```bash
   npx supabase migration new add_<month>_<year>_partitions
   ```
3. Dodaj partycje według wzoru z istniejących migracji
4. Wykonaj migrację:
   ```bash
   npx supabase db reset --local
   node scripts/create-test-users.js
   ```

#### Błąd foreign key constraint na users
Ten błąd występuje, gdy `seed.sql` próbuje wstawić dane do `public.users` bez wcześniejszego utworzenia użytkowników w `auth.users`.

**Rozwiązanie:**
Zawsze uruchamiaj `node scripts/create-test-users.js` po resecie bazy.

### Automatyczny setup

Możesz stworzyć skrypt w `package.json`:

```json
{
  "scripts": {
    "db:reset": "npx supabase db reset --local",
    "db:seed": "node scripts/create-test-users.js && node scripts/seed-database.js",
    "db:setup": "npm run db:reset && npm run db:seed"
  }
}
```

Wtedy możesz po prostu uruchomić:
```bash
npm run db:setup
```

## Produkcja

Dla produkcyjnej bazy danych:
1. Połącz projekt z Supabase Cloud: `npx supabase link`
2. Wykonaj migracje: `npx supabase db push`
3. Utwórz użytkowników przez Supabase Dashboard lub API

