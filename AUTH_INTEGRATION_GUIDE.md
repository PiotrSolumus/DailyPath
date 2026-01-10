# Przewodnik integracji autentykacji - DailyPath

## 📋 Podsumowanie implementacji

Została przeprowadzona pełna integracja autentykacji Supabase Auth z aplikacją Astro zgodnie z wymaganiami PRD i najlepszymi praktykami.

### ✅ Zrealizowane komponenty

#### 1. **Infrastruktura Supabase SSR**
- `src/lib/supabase/server.ts` - Helper dla server-side Supabase client z cookie management
- `src/lib/supabase/client.ts` - Helper dla browser-side Supabase client
- Wykorzystanie `@supabase/ssr` dla proper SSR session management

#### 2. **Middleware autentykacji**
- `src/middleware/index.ts` - Zrefaktoryzowany z RLS enforcement
- Automatyczne pobieranie sesji użytkownika z cookies
- Rozwiązywanie active department membership
- Ustawienie `context.locals.user` dla wszystkich routes

#### 3. **API Endpoints**
- ✅ `POST /api/auth/login` - Logowanie z email/hasło
- ✅ `POST /api/auth/logout` - Wylogowanie i czyszczenie sesji
- ✅ `POST /api/auth/register` - Rejestracja z invitation token
- ✅ `POST /api/auth/invite` - Wysyłanie zaproszeń (tylko manager/admin)
- ✅ `POST /api/auth/request-password-reset` - Żądanie resetu hasła
- ✅ `POST /api/auth/reset-password` - Ustawienie nowego hasła z tokenem

#### 4. **Komponenty React**
- ✅ `LoginForm.tsx` - Zintegrowany z `/api/auth/login`
- ✅ `RegisterForm.tsx` - Zintegrowany z `/api/auth/register`
- ✅ `RequestPasswordResetForm.tsx` - Zintegrowany z API
- ✅ `SetNewPasswordForm.tsx` - Zintegrowany z API

#### 5. **Strony Astro**
- ✅ `login.astro` - Redirect jeśli już zalogowany
- ✅ `logout.astro` - Wywołuje API endpoint
- ✅ `register.astro` - Gotowa do użycia z invitation token
- ✅ `reset-password.astro` - Obsługuje oba warianty (request + confirm)

#### 6. **Email Service**
- ✅ `src/lib/services/email.service.ts` - Custom email service z Resend
- ✅ Templates dla invitation i password reset emails
- ✅ Development mode (logi do konsoli) i production mode (Resend API)

#### 7. **Security**
- ✅ Rate limiting dla auth endpoints
- ✅ HTTP-only cookies (handled by @supabase/ssr)
- ✅ Email enumeration prevention
- ✅ Input validation z Zod schemas
- ✅ RLS policies enforcement

#### 8. **Database**
- ✅ Nowa migracja: `20260108000000_add_invitations.sql`
- ✅ Tabela `invitations` z tokenami i RLS policies
- ✅ Helper function `validate_invitation_token()`

---

## 🚀 Instrukcje uruchomienia

### Krok 1: Zastosuj migracje bazy danych

```bash
# Upewnij się że Supabase jest uruchomiony
npx supabase status

# Jeśli nie jest uruchomiony:
npx supabase start

# Zastosuj nowe migracje
npx supabase db reset
```

### Krok 2: Usuń stare dane (opcjonalne - czysta baza)

Jeśli chcesz zacząć od czystej bazy (zgodnie z Twoim wyborem):

```bash
# Zatrzymaj Supabase
npx supabase stop

# Usuń volumes (to usunie wszystkie dane)
npx supabase stop --no-backup

# Uruchom ponownie i zastosuj migracje
npx supabase start
```

### Krok 3: Uruchom serwer deweloperski

```bash
npm run dev
```

### Krok 4: Utwórz pierwszego użytkownika (Admin)

Ponieważ rejestracja wymaga zaproszenia, musisz utworzyć pierwszego admina ręcznie przez Supabase:

#### Opcja A: Przez Supabase Studio

1. Otwórz Supabase Studio: http://127.0.0.1:54323
2. Przejdź do "Authentication" → "Users"
3. Kliknij "Add user"
4. Wprowadź:
   - Email: `admin@dailypath.local`
   - Password: `admin123`
   - Confirm email: ✅ Yes
5. Przejdź do "Table Editor" → "users"
6. Dodaj rekord:
   - `id`: (UUID z auth.users)
   - `email`: `admin@dailypath.local`
   - `full_name`: `Admin`
   - `app_role`: `admin`
   - `timezone`: `UTC`
   - `is_active`: `true`

#### Opcja B: Przez SQL (szybsza)

W Supabase Studio przejdź do "SQL Editor" i wykonaj:

```sql
-- Utwórz użytkownika auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@dailypath.local',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  '',
  NOW(),
  '',
  NOW(),
  '',
  '',
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin"}',
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NOW(),
  '',
  0,
  NULL,
  '',
  NOW()
) RETURNING id;

-- Skopiuj UUID z wyniku powyżej i użyj w poniższym zapytaniu
-- Zastąp 'YOUR_USER_ID' rzeczywistym UUID
INSERT INTO public.users (id, email, full_name, app_role, timezone, is_active)
VALUES ('YOUR_USER_ID', 'admin@dailypath.local', 'Admin', 'admin', 'UTC', true);
```

### Krok 5: Przetestuj logowanie

1. Otwórz http://localhost:4321/login
2. Zaloguj się jako admin:
   - Email: `admin@dailypath.local`
   - Hasło: `admin123`
3. Powinieneś zostać przekierowany do `/dashboard`

---

## 📧 Konfiguracja Email Service (opcjonalnie)

### Tryb Development (domyślny)

W trybie development emaile są logowane do konsoli. Nie potrzebujesz żadnej konfiguracji.

### Tryb Production (Resend)

1. Załóż konto na https://resend.com
2. Uzyskaj API key
3. Dodaj do `.env`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

4. Skonfiguruj domenę w Resend dashboard
5. Zaktualizuj adres nadawcy w `email.service.ts`:

```typescript
const fromEmail = from || "DailyPath <noreply@twoja-domena.pl>";
```

### Alternatywa: SendGrid lub inny provider

Jeśli wolisz SendGrid lub inny provider, zmodyfikuj `sendEmail()` function w `src/lib/services/email.service.ts`.

---

## 🧪 Testowanie funkcjonalności

### Test 1: Logowanie

```bash
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dailypath.local","password":"admin123"}'
```

Oczekiwany wynik:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "admin@dailypath.local",
    "full_name": "Admin",
    "app_role": "admin"
  }
}
```

### Test 2: Wysłanie zaproszenia

Zaloguj się jako admin, następnie:

```bash
curl -X POST http://localhost:4321/api/auth/invite \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "email":"employee@dailypath.local",
    "app_role":"employee"
  }'
```

W development mode, link zaproszenia zostanie wyświetlony w konsoli serwera.

### Test 3: Rejestracja z invitation token

```bash
curl -X POST http://localhost:4321/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"employee@dailypath.local",
    "password":"employee123",
    "full_name":"Employee User",
    "token":"TOKEN_Z_ZAPROSZENIA"
  }'
```

### Test 4: Password reset flow

```bash
# Krok 1: Request reset
curl -X POST http://localhost:4321/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dailypath.local"}'

# Link do resetu pojawi się w konsoli (dev mode)
# lub zostanie wysłany przez Supabase Auth

# Krok 2: Reset password (użyj tokena z emaila)
curl -X POST http://localhost:4321/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_Z_EMAILA","password":"newpassword123"}'
```

---

## 🔐 Security Checklist

### Zaimplementowane zabezpieczenia

- ✅ **HTTP-only cookies** - Sesje przechowywane w secure cookies
- ✅ **RLS enforcement** - Row Level Security policies w Supabase
- ✅ **Input validation** - Zod schemas dla wszystkich endpoints
- ✅ **Rate limiting** - Podstawowy rate limiter dla auth endpoints
- ✅ **Email enumeration prevention** - Password reset zawsze zwraca sukces
- ✅ **Password strength** - Minimum 6 znaków (można zwiększyć)
- ✅ **Invitation tokens** - Single-use, time-limited (7 dni)
- ✅ **Auto email confirm** - Użytkownicy z zaproszeniem nie muszą potwierdzać emaila

### TODO dla production

- ⚠️ **HTTPS** - Konfiguracja w hosting provider (Vercel, Netlify, etc.)
- ⚠️ **Session timeout** - Konfiguracja w Supabase Dashboard
- ⚠️ **Redis rate limiting** - Dla distributed deployments
- ⚠️ **CSRF tokens** - Dodatkowa warstwa ochrony
- ⚠️ **Account lockout** - Po N nieudanych prób logowania
- ⚠️ **Audit logging** - Logowanie wrażliwych operacji
- ⚠️ **CSP headers** - Content Security Policy
- ⚠️ **Stronger passwords** - Wymaganie 12+ znaków, cyfry, znaki specjalne

---

## 📁 Struktura plików (nowe/zmienione)

```
src/
├── lib/
│   ├── supabase/
│   │   ├── server.ts                    # ✨ NOWY - Supabase SSR helpers
│   │   └── client.ts                    # ✨ NOWY - Browser client
│   ├── services/
│   │   └── email.service.ts             # ✨ NOWY - Custom email service
│   ├── schemas/
│   │   └── auth.schema.ts               # ✨ NOWY - Zod schemas dla auth
│   └── utils/
│       └── security.ts                  # ✨ NOWY - Rate limiting & security
├── middleware/
│   └── index.ts                         # ♻️  ZMIENIONY - Prawdziwa autentykacja
├── pages/
│   ├── login.astro                      # ♻️  ZMIENIONY - Redirect logic
│   ├── logout.astro                     # ♻️  ZMIENIONY - API call
│   └── api/
│       └── auth/
│           ├── login.ts                 # ✨ NOWY
│           ├── logout.ts                # ✨ NOWY
│           ├── register.ts              # ✨ NOWY
│           ├── invite.ts                # ✨ NOWY
│           ├── request-password-reset.ts # ✨ NOWY
│           └── reset-password.ts        # ✨ NOWY
└── components/
    └── auth/
        ├── LoginForm.tsx                # ♻️  ZMIENIONY - API integration
        ├── RegisterForm.tsx             # ♻️  ZMIENIONY - API integration
        ├── RequestPasswordResetForm.tsx # ♻️  ZMIENIONY - API integration
        └── SetNewPasswordForm.tsx       # ♻️  ZMIENIONY - API integration

supabase/
└── migrations/
    └── 20260108000000_add_invitations.sql # ✨ NOWY - Invitations table
```

---

## 🐛 Troubleshooting

### Problem: "Nie udało się utworzyć sesji"

**Rozwiązanie:**
1. Sprawdź czy Supabase jest uruchomiony: `npx supabase status`
2. Sprawdź logi serwera w terminalu
3. Sprawdź czy użytkownik istnieje w tabeli `users` (nie tylko w `auth.users`)

### Problem: "Token zaproszenia jest nieprawidłowy"

**Rozwiązanie:**
1. Sprawdź czy migracja `20260108000000_add_invitations.sql` została zastosowana
2. Sprawdź logi - token może wygasł (7 dni)
3. Utwórz nowe zaproszenie

### Problem: "Zbyt wiele prób logowania"

**Rozwiązanie:**
1. To jest rate limiting - odczekaj 15 minut
2. Lub zrestartuj serwer (in-memory rate limiter się wyczyści)
3. W production użyj Redis-based rate limiting

### Problem: Emaile nie są wysyłane

**Rozwiązanie:**
1. W development mode emaile są logowane do konsoli - to jest normalne
2. Jeśli skonfigurowałeś `RESEND_API_KEY`, sprawdź:
   - Czy API key jest poprawny
   - Czy domena jest zweryfikowana w Resend
   - Czy adres nadawcy jest poprawny

---

## 🎯 Następne kroki

### Immediate (przed testowaniem)

1. ✅ Zastosuj migracje (`npx supabase db reset`)
2. ✅ Utwórz pierwszego admina (SQL lub Supabase Studio)
3. ✅ Uruchom dev server (`npm run dev`)
4. ✅ Przetestuj logowanie

### Short-term (przed wdrożeniem)

1. Skonfiguruj Resend lub inny email provider
2. Dostosuj email templates (branding, treść)
3. Zwiększ wymagania dotyczące haseł (min. 12 znaków?)
4. Skonfiguruj session timeout w Supabase
5. Przetestuj wszystkie flow (login, register, password reset)

### Long-term (production ready)

1. Implementuj Redis-based rate limiting
2. Dodaj CSRF protection
3. Skonfiguruj CSP headers
4. Implementuj audit logging
5. Dodaj monitoring i alerting
6. Przeprowadź security audit
7. Dodaj testy automatyczne (E2E)

---

## 📚 Dodatkowe zasoby

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Astro Middleware Guide](https://docs.astro.build/en/guides/middleware/)
- [Resend Documentation](https://resend.com/docs)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## ✅ Zgodność z PRD

| User Story | Status | Notatki |
|------------|--------|---------|
| US-001 (Rejestracja przez zaproszenie) | ✅ Zaimplementowane | `/api/auth/invite` + `/api/auth/register` |
| US-002 (Logowanie) | ✅ Zaimplementowane | `/api/auth/login` + redirect logic |
| US-003 (Reset hasła) | ✅ Zaimplementowane | 2-step flow z tokenem |
| US-004 (Wylogowanie) | ✅ Zaimplementowane | `/api/auth/logout` |
| US-005 (Autoryzacja ról) | ✅ Zaimplementowane | RLS policies + middleware |
| US-043 (Bezpieczeństwo sesji) | ✅ Zaimplementowane | HTTP-only cookies, rate limiting |

---

**Data implementacji:** 2026-01-08  
**Wersja:** 1.0  
**Status:** ✅ Gotowe do testowania
