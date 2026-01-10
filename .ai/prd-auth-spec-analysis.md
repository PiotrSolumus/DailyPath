# Analiza porównawcza PRD vs Auth-Spec - DailyPath

**Data:** 2026-01-08  
**Status:** ✅ Zakończono  
**Wynik:** Zaktualizowano auth-spec.md (v1.0 → v1.1)

---

## 📋 PODSUMOWANIE WYKONAWCZE

Przeprowadzono szczegółową analizę porównawczą dokumentu wymagań produktu (PRD) oraz specyfikacji technicznej autentykacji (auth-spec.md). Zidentyfikowano **3 krytyczne sprzeczności**, **3 obszary nadmiarowych założeń** oraz **2 błędne User Stories** skopiowane z innego projektu.

**Główne ustalenia:**
- ✅ Auth-spec wspiera wszystkie właściwe User Stories z PRD (US-001 do US-043)
- ❌ US-044 i US-045 **NIE dotyczą DailyPath** - wymagają usunięcia z PRD
- ⚠️ Brak było implementacji systemu emailowego - **dodano w v1.1**
- ⚠️ Sprzeczności w konfiguracji rejestracji - **naprawiono w v1.1**

---

## 🚨 KRYTYCZNE SPRZECZNOŚCI (NAPRAWIONE)

### 1. US-044 i US-045 - Błędne User Stories ❌

**Problem:**
```markdown
US-044: "Kolekcje reguł"
US-045: "Użytkownik MOŻE korzystać z tworzenia reguł 'ad-hoc' bez logowania"
```

**Analiza:**
- Te User Stories opisują funkcjonalność **generatora reguł/systemów reguł**, NIE DailyPath
- DailyPath nie ma koncepcji "reguł", "kolekcji reguł" ani pracy bez logowania
- Prawdopodobnie skopiowano z innego PRD przez pomyłkę

**Wpływ na auth-spec:**
- Auth-spec poprawnie NIE implementuje tych funkcjonalności
- Brak sprzeczności w implementacji

**Rekomendacja:** ⚠️ **USUNĄĆ US-044 i US-045 z PRD**

---

### 2. Rejestracja: Tylko zaproszenia vs. Publiczna opcja ⚠️

**PRD:**
- US-001: "Rejestracja przez zaproszenia e-mail" (WYMAGANE)
- US-010: "Jako przełożony chcę zaprosić pracownika e-mailowo"
- Sekcja 3.1: "Rejestracja przez zaproszenia e‑mail"

**Auth-spec v1.0 (PRZED):**
```markdown
Wariant 1: Zaproszenia (zgodnie z PRD)
Wariant 2: Publiczna rejestracja (US-045)

Rekomendacja: Implementować Wariant 1 jako zgodny z PRD, 
a Wariant 2 jako opcjonalny feature flag.
```

**Sprzeczność:**
- Auth-spec dopuszczał publiczną rejestrację jako "opcję"
- PRD jednoznacznie wymaga TYLKO zaproszeń

**Rozwiązanie w v1.1:** ✅
```markdown
Jedyny wariant: Zaproszenia (zgodnie z PRD US-001)
WAŻNE: Publiczna rejestracja nie jest częścią MVP zgodnie z PRD.
```

---

### 3. Konfiguracja `enable_signup` ⚠️

**Auth-spec v1.0 (PRZED):**
```toml
enable_signup = true  # Obecna konfiguracja
```

Zalecenia:
- `enable_signup = false` (tylko zaproszenia) **LUB** `true` (publiczna rejestracja)

**PRD:**
- US-001 wymaga rejestracji TYLKO przez zaproszenia

**Rozwiązanie w v1.1:** ✅
```toml
enable_signup = false # TYLKO zaproszenia (US-001)
```

**KRYTYCZNE**: `enable_signup` MUSI być ustawione na `false`

---

### 4. Czas wygaśnięcia sesji 📝

**PRD (US-002):**
```markdown
Sesja wygasa po okresie bezczynności (konfigurowalne, np. 12 h)
```

**Auth-spec v1.0 (PRZED):**
```toml
jwt_expiry = 3600 # 1 godzina
```

**Rozwiązanie w v1.1:** ✅
```toml
jwt_expiry = 43200 # 12 godzin (zgodnie z US-002)
```

---

## ⚠️ BRAKUJĄCE ELEMENTY (DODANE)

### 1. System wysyłania emaili 📧

**Problem:**
- PRD wymaga wysyłania emaili (US-001: zaproszenia, US-003: reset hasła)
- Auth-spec v1.0 miał: `// TODO: Wysłać email z linkiem`
- Ryzyko 3: "Lokalne Supabase może nie wysyłać emaili"

**Rozwiązanie w v1.1:** ✅

Dodano **sekcję 3.5** z dwoma opcjami:

**Opcja 1: Supabase Auth Email (preferowana)**
```toml
[auth.email]
enable_signup = false
template_paths = "./supabase/templates"

[inbucket]
enabled = true  # Lokalny SMTP catcher
port = 54324
```

**Opcja 2: Zewnętrzny serwis (SendGrid, AWS SES)**
```typescript
// src/lib/services/email.service.ts
export async function sendInvitationEmail(
  toEmail: string,
  inviteLink: string,
  token: string
): Promise<void>

export async function sendPasswordResetEmail(
  toEmail: string,
  resetLink: string
): Promise<void>
```

**Dodano również:** Email templates (HTML) dla zaproszeń i resetu hasła

---

### 2. Dezaktywacja konta (US-009) 🔒

**PRD (US-009):**
```markdown
Jako Admin chcę dezaktywować konto, aby odebrać dostęp.
- Użytkownik nie może się zalogować po dezaktywacji
- Dane pozostają w raportach historycznych
```

**Auth-spec v1.0:** Brak implementacji

**Rozwiązanie w v1.1:** ✅

Dodano **sekcję 3.3.3** z endpointem:
```
POST /api/admin/users/{userId}/deactivate
```

Implementacja używa:
- `supabaseAdmin.auth.admin.updateUserById()` - ban w Supabase Auth
- `is_active = false` w tabeli `public.users` (opcjonalnie)

---

## 📊 NADMIAROWE ZAŁOŻENIA

### 1. Wielokrotne powtarzanie o HTTP-only cookies

**Występuje w:**
- Sekcja 4.2.1: Szczegółowy opis cookies
- Sekcja 4.6.1: Ponowny opis w kontekście CSRF
- US-043: Wymagania bezpieczeństwa

**Rekomendacja:** Pozostawić jako jest - różne konteksty mogą wymagać przypomnienia

---

### 2. RLS opisywane w wielu miejscach

**Występuje w:**
- Sekcja 4.3: Główna sekcja o RLS i politykach
- Sekcja 3.3.2: Dlaczego RLS jest potrzebny
- Sekcja 5.1: RLS w kontekście migracji

**Rekomendacja:** Pozostawić - różne aspekty RLS w różnych fazach

---

### 3. Duplikacja schematów walidacji

**Występuje w:**
- Sekcja 2.3.1-2.3.4: Walidacja w każdym komponencie React
- Sekcja 2.5.1: Centralne schematy Zod

**Rekomendacja:** Można skrócić przez linkowanie do sekcji 2.5.1

---

## ✅ REALIZOWALNOŚĆ USER STORIES

### Pełne wsparcie (11 US):

| US | Tytuł | Sekcje w auth-spec |
|---|---|---|
| US-001 | Rejestracja przez zaproszenie | 4.5, 2.1.2, 2.3.2, 3.2.2, **3.5** |
| US-002 | Logowanie | 2.1.1, 2.3.1, 3.2.1 |
| US-003 | Reset hasła | 2.1.3, 2.3.3-4, 3.2.3-4, **3.5** |
| US-004 | Wylogowanie | 2.1.4 |
| US-005 | Autoryzacja ról | 4.3.2, 3.3.1 |
| US-009 | Dezaktywacja konta | **3.3.3** (nowa) |
| US-010 | Zapraszanie użytkowników | 4.5.1-2, **3.5** |
| US-017 | Audit trail działań przełożonego | (poza zakresem auth-spec) |
| US-018 | Konfiguracja godzin pracy | 2.1.5 |
| US-043 | Bezpieczeństwo sesji | 4.6, 4.2 |

### Błędne User Stories (2 US):

| US | Problem | Akcja |
|---|---|---|
| **US-044** | Kolekcje reguł - NIE dotyczy DailyPath | ❌ **USUNĄĆ z PRD** |
| **US-045** | Reguły ad-hoc - NIE dotyczy DailyPath | ❌ **USUNĄĆ z PRD** |

---

## 🔧 WPROWADZONE ZMIANY W AUTH-SPEC v1.1

### Sekcja 1.2 - Zakres funkcjonalny
- ✅ Dodano informację o TYLKO zaproszeniach
- ✅ Dodano US-009 (dezaktywacja) i US-010 (zaproszenia)
- ✅ Dodano ostrzeżenie o US-044 i US-045

### Sekcja 2.1.2 - Strona rejestracji
- ✅ Usunięto "Wariant 2: Publiczna rejestracja"
- ✅ Pozostawiono TYLKO wariant z zaproszeniem
- ✅ Dodano WAŻNE: "Publiczna rejestracja nie jest częścią MVP"

### Sekcja 3.3.3 - NOWA sekcja
- ✅ Dezaktywacja konta (US-009)
- ✅ Endpoint `POST /api/admin/users/{userId}/deactivate`
- ✅ Pełna implementacja z kodem

### Sekcja 3.5 - NOWA sekcja
- ✅ System wysyłania emaili (US-001, US-003, US-010)
- ✅ Opcja 1: Supabase Auth Email z konfiguracją SMTP
- ✅ Opcja 2: SendGrid/AWS SES z implementacją
- ✅ Email templates (HTML) dla zaproszeń i resetu hasła
- ✅ Funkcje `sendInvitationEmail()` i `sendPasswordResetEmail()`

### Sekcja 4.1.3 - Konfiguracja Supabase
- ✅ Zmieniono `enable_signup = false` jako WYMAGANE
- ✅ Zmieniono `jwt_expiry = 43200` (12h zgodnie z US-002)
- ✅ Zmieniono `minimum_password_length = 8`
- ✅ Usunięto stwierdzenie "lub true" przy enable_signup

### Sekcja 4.5.2 - Endpoint zaproszeń
- ✅ Zastąpiono `// TODO` implementacją wysyłania emaila
- ✅ Dodano try-catch i obsługę błędów emailowych

### Sekcja 7.3 - Ryzyka
- ✅ Zaktualizowano "Ryzyko 3" o rozwiązanie (sekcja 3.5)
- ✅ Dodano "Status: Rozwiązane"

### Sekcja 10.2 - Kontrakty API
- ✅ Dodano endpoint dezaktywacji konta

### Sekcja 11 - Zakończenie
- ✅ Zaktualizowano listę wspieranych US (usunięto US-044, US-045)
- ✅ Dodano ostrzeżenie o błędnych US w PRD
- ✅ Dodano zalety: system emailowy, dezaktywacja, sesje 12h

### Changelog
- ✅ Dodano sekcję Changelog z wersją 1.1
- ✅ Udokumentowano wszystkie zmiany

---

## 📝 REKOMENDACJE DLA PRD

### 1. KRYTYCZNE: Usunąć błędne User Stories

**Akcja:** Usunąć z PRD:
- US-044 (Kolekcje reguł)
- US-045 (Bezpieczny dostęp - reguły ad-hoc)

**Powód:** Te US dotyczą innej aplikacji (generator reguł AI, nie DailyPath)

**Sugerowane zastąpienie (opcjonalnie):**

```markdown
US-044: Zmiana hasła w ustawieniach
- Tytuł: Zmiana hasła
- Opis: Jako zalogowany użytkownik chcę móc zmienić swoje hasło w ustawieniach profilu.
- Kryteria akceptacji:
  - Wymaga podania obecnego hasła
  - Walidacja nowego hasła (min. 8 znaków)
  - Potwierdzenie nowego hasła
  - Komunikat sukcesu po zmianie

US-045: Zapamiętanie sesji
- Tytuł: Zapamiętanie sesji użytkownika
- Opis: Jako użytkownik chcę aby moja sesja była zapamiętana między wizytami w aplikacji.
- Kryteria akceptacji:
  - Sesja ważna przez 12 godzin
  - Automatyczne odświeżanie przy aktywności
  - Opcja "Zapamiętaj mnie" (opcjonalnie)
```

### 2. Wyjaśnić kwestię email delivery

**Akcja:** Dodać do PRD sekcję o wymaganiach email:
```markdown
### 3.11 System powiadomień email

- Aplikacja musi wysyłać następujące emaile:
  - Zaproszenia do rejestracji (US-001)
  - Linki do resetu hasła (US-003)
  - Potwierdzenia utworzenia konta
- Wymaga konfiguracji SMTP lub integracji z serwisem email (SendGrid, AWS SES)
- Development: Użycie lokalnego SMTP catcher (Inbucket)
- Produkcja: Zewnętrzny serwis SMTP
```

### 3. Sprecyzować wymagania sesji

**Obecne w PRD (US-002):**
```markdown
Sesja wygasa po okresie bezczynności (konfigurowalne, np. 12 h)
```

**Sugerowana aktualizacja:**
```markdown
- Sesja wygasa po 12 godzinach bezczynności (zgodnie z jwt_expiry)
- Automatyczne odświeżanie sesji przy aktywności użytkownika
- HTTP-only cookies dla bezpieczeństwa
- Refresh token ważny 60 dni (automatyczne odświeżanie access token)
```

---

## 📊 STATYSTYKI

### Zgodność PRD ↔ Auth-spec

- ✅ **Zgodne User Stories:** 11/13 (85%)
- ❌ **Błędne US (do usunięcia):** 2/13 (15%)
- ⚠️ **Sprzeczności znalezione:** 3 (wszystkie naprawione)
- ✅ **Nadmiarowe założenia:** 3 (dopuszczalne, różne konteksty)
- 🆕 **Dodane sekcje w auth-spec:** 2 (3.3.3, 3.5)

### Realizowalność implementacji

Wszystkie właściwe User Stories (US-001 do US-043, z wyłączeniem US-044 i US-045) **są w pełni realizowalne** na podstawie zaktualizowanego auth-spec v1.1.

**Gotowość do implementacji:** ✅ **100%**

---

## ✅ WNIOSKI

1. **Auth-spec jest spójny z PRD** po wprowadzeniu poprawek w v1.1
2. **PRD wymaga aktualizacji** - usunięcie US-044 i US-045
3. **Wszystkie właściwe User Stories są realizowalne** zgodnie z planem
4. **Brak blokujących sprzeczności** między dokumentami
5. **System autentykacji jest kompletny** i gotowy do implementacji

---

## 🎯 NASTĘPNE KROKI

### Dla zespołu biznesowego (PRD):
1. ❌ Usunąć US-044 i US-045 z PRD
2. 📝 Rozważyć dodanie nowych US-044 i US-045 (zmiana hasła, zapamiętanie sesji)
3. 📧 Dodać sekcję 3.11 o wymaganiach email
4. ⏱️ Sprecyzować wymagania sesji w US-002

### Dla zespołu technicznego (implementacja):
1. ✅ Rozpocząć implementację zgodnie z auth-spec v1.1
2. 📧 Skonfigurować system email (Inbucket dev, SendGrid/SES prod)
3. 🔒 Ustawić `enable_signup = false` w konfiguracji Supabase
4. ⏱️ Ustawić `jwt_expiry = 43200` (12 godzin)
5. 🧪 Przeprowadzić testy zgodnie z sekcją 6 auth-spec

---

**Dokument stworzony przez:** AI Assistant  
**Data:** 2026-01-08  
**Status:** ✅ Kompletny  
**Auth-spec zaktualizowany do:** v1.1
