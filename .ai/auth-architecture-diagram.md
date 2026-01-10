# Diagram architektury autentykacji - DailyPath

## 1. Architektura wysokiego poziomu (C4 Context)

```mermaid
graph TB
    subgraph "Użytkownicy"
        EMPLOYEE[👤 Pracownik<br/>Employee]
        MANAGER[👥 Przełożony<br/>Manager]
        ADMIN[🔧 Administrator<br/>Admin]
    end
    
    subgraph "DailyPath Application"
        UI[🖥️ Frontend<br/>Astro + React]
        MW[⚙️ Middleware<br/>Session & Auth]
        API[🔌 API Endpoints<br/>/api/*]
        SERVICES[📦 Services Layer<br/>Business Logic]
    end
    
    subgraph "Supabase Backend"
        SBAUTH[🔐 Supabase Auth<br/>auth.users]
        SBDB[(📊 PostgreSQL<br/>public.users, departments)]
        RLS[🛡️ Row Level Security<br/>Access Policies]
    end
    
    EMPLOYEE -->|HTTP Requests| UI
    MANAGER -->|HTTP Requests| UI
    ADMIN -->|HTTP Requests| UI
    
    UI -->|SSR/API Calls| MW
    MW -->|Protected Routes| API
    API -->|Business Logic| SERVICES
    SERVICES -->|Database Queries| SBDB
    
    MW -.->|Verify Session| SBAUTH
    SBAUTH -.->|JWT Token| MW
    SBDB -.->|Enforce| RLS
    
    style SBAUTH fill:#4ade80
    style RLS fill:#fbbf24
    style MW fill:#60a5fa
```

## 2. Schemat bazy danych - tabele autentykacji

```mermaid
erDiagram
    AUTH_USERS ||--o| PUBLIC_USERS : "id (FK)"
    PUBLIC_USERS ||--o{ MEMBERSHIPS : "user_id"
    DEPARTMENTS ||--o{ MEMBERSHIPS : "department_id"
    DEPARTMENTS ||--o{ MANAGER_ASSIGNMENTS : "department_id"
    PUBLIC_USERS ||--o{ MANAGER_ASSIGNMENTS : "manager_user_id"
    PUBLIC_USERS ||--o{ MANAGER_CROSS_VIEWS : "manager_user_id"
    DEPARTMENTS ||--o{ MANAGER_CROSS_VIEWS : "department_id"
    
    AUTH_USERS {
        uuid id PK
        string email
        string encrypted_password
        timestamp created_at
        timestamp last_sign_in_at
    }
    
    PUBLIC_USERS {
        uuid id PK "FK to auth.users"
        string email
        string full_name
        enum app_role "employee|manager|admin"
        string timezone
        boolean is_active
        timestamp created_at
    }
    
    DEPARTMENTS {
        uuid id PK
        string name
        timestamp created_at
    }
    
    MEMBERSHIPS {
        uuid id PK
        uuid user_id FK
        uuid department_id FK
        tstzrange period "date range"
    }
    
    MANAGER_ASSIGNMENTS {
        uuid department_id FK
        uuid manager_user_id FK
    }
    
    MANAGER_CROSS_VIEWS {
        uuid manager_user_id FK
        uuid department_id FK
    }
```

## 3. Stan obecny (TEMPORARY) vs Stan docelowy

### 3.1 STAN OBECNY - Tymczasowa autentykacja

```mermaid
sequenceDiagram
    actor User as 👤 Użytkownik
    participant LP as 🌐 /login
    participant Cookie as 🍪 temp_user_id
    participant MW as ⚙️ Middleware
    participant DB as 📊 Database (Admin Client)
    participant Dashboard as 📱 /dashboard
    
    Note over LP,DB: ⚠️ TRYB TESTOWY - Brak prawdziwej autentykacji
    
    User->>LP: 1. Otwórz stronę logowania
    LP->>DB: 2. Pobierz wszystkich użytkowników<br/>(service_role_key - bypass RLS)
    DB-->>LP: 3. Lista użytkowników
    LP->>User: 4. Wyświetl listę do wyboru
    
    User->>LP: 5. Kliknij użytkownika
    LP->>Cookie: 6. Ustaw cookie temp_user_id=UUID
    LP->>Dashboard: 7. Przekieruj do /dashboard
    
    Note over MW: Każde żądanie HTTP
    
    Dashboard->>MW: 8. Request z cookie
    MW->>Cookie: 9. Odczytaj temp_user_id
    MW->>DB: 10. SELECT * FROM users WHERE id=?<br/>(service_role_key)
    DB-->>MW: 11. Dane użytkownika
    MW->>MW: 12. Ustaw context.locals.user
    MW->>Dashboard: 13. Renderuj stronę
    
    Note over MW,DB: 🔴 PROBLEMY:<br/>- Brak walidacji sesji<br/>- Service role key dla wszystkiego<br/>- RLS wyłączony<br/>- Brak ochrony przed manipulacją cookie
```

### 3.2 STAN DOCELOWY - Pełna autentykacja Supabase

```mermaid
sequenceDiagram
    actor User as 👤 Użytkownik
    participant LP as 🌐 /login
    participant API as 🔌 /api/auth/login
    participant SBAUTH as 🔐 Supabase Auth
    participant Cookie as 🍪 HTTP-only cookies
    participant MW as ⚙️ Middleware
    participant DB as 📊 Database (RLS)
    participant Dashboard as 📱 /dashboard
    
    Note over LP,DB: ✅ PRODUKCJA - Pełne zabezpieczenia
    
    User->>LP: 1. Wprowadź email i hasło
    LP->>API: 2. POST /api/auth/login<br/>{email, password}
    API->>API: 3. Walidacja (Zod schema)
    API->>SBAUTH: 4. signInWithPassword()
    SBAUTH->>SBAUTH: 5. Weryfikacja credentials
    SBAUTH-->>API: 6. JWT session token
    API->>Cookie: 7. Ustaw HTTP-only secure cookies<br/>(sb-*-auth-token)
    API-->>LP: 8. 200 OK {success: true}
    LP->>Dashboard: 9. Przekieruj do /dashboard
    
    Note over MW: Każde żądanie HTTP
    
    Dashboard->>MW: 10. Request z cookies
    MW->>Cookie: 11. Odczytaj session cookies
    MW->>SBAUTH: 12. getSession() - validate JWT
    SBAUTH-->>MW: 13. Session data (user_id, role)
    MW->>DB: 14. SELECT * FROM users WHERE id=?<br/>(authenticated user context + RLS)
    
    Note over DB: RLS sprawdza:<br/>auth.uid() == user.id
    
    DB-->>MW: 15. Dane użytkownika (filtrowane przez RLS)
    MW->>MW: 16. Ustaw context.locals.user
    MW->>Dashboard: 17. Renderuj stronę
    
    Note over MW,DB: ✅ KORZYŚCI:<br/>- Prawdziwa walidacja JWT<br/>- HTTP-only cookies (XSS protection)<br/>- RLS aktywny<br/>- Audit trail<br/>- Session expiry
```

## 4. Przepływ rejestracji przez zaproszenie (US-001, US-010)

```mermaid
sequenceDiagram
    actor Admin as 🔧 Admin/Manager
    participant AdminUI as 🖥️ Panel Admin
    participant InviteAPI as 🔌 /api/auth/invite
    participant SBAUTH as 🔐 Supabase Auth
    participant Email as 📧 Email Service
    participant User as 👤 Nowy użytkownik
    participant AcceptPage as 🌐 /accept-invite
    participant ActivateAPI as 🔌 /api/auth/activate
    participant DB as 📊 Database
    
    Admin->>AdminUI: 1. Wypełnij formularz zaproszenia<br/>(email, role, department)
    AdminUI->>InviteAPI: 2. POST {email, app_role, dept_id}
    InviteAPI->>InviteAPI: 3. Sprawdź uprawnienia<br/>(tylko admin/manager)
    InviteAPI->>SBAUTH: 4. admin.createUser()<br/>(email, temp password)
    SBAUTH->>DB: 5. INSERT INTO auth.users
    InviteAPI->>DB: 6. INSERT INTO public.users<br/>(email, role, inactive)
    InviteAPI->>DB: 7. Utwórz invitation_token<br/>(jednorazowy, wygasa za 7 dni)
    InviteAPI->>Email: 8. Wyślij email z linkiem<br/>?token=xxx
    Email-->>User: 9. Email z zaproszeniem
    
    User->>AcceptPage: 10. Kliknij link w email
    AcceptPage->>AcceptPage: 11. Waliduj token (nie wygasł)
    AcceptPage->>User: 12. Formularz: hasło + potwierdzenie
    User->>ActivateAPI: 13. POST {token, password}
    ActivateAPI->>ActivateAPI: 14. Waliduj siłę hasła (min 8 znaków)
    ActivateAPI->>DB: 15. Sprawdź token (valid, not used)
    ActivateAPI->>SBAUTH: 16. admin.updateUser()<br/>(set password, confirm email)
    ActivateAPI->>DB: 17. UPDATE users SET is_active=true
    ActivateAPI->>DB: 18. Mark token as used
    ActivateAPI-->>AcceptPage: 19. 200 OK
    AcceptPage->>AcceptPage: 20. Przekieruj do /onboarding
    
    Note over User,DB: Użytkownik może się teraz zalogować<br/>i skonfigurować konto (godziny pracy, strefa czasowa)
```

## 5. Przepływ resetowania hasła (US-003)

```mermaid
sequenceDiagram
    actor User as 👤 Użytkownik
    participant ForgotPage as 🌐 /forgot-password
    participant ResetAPI as 🔌 /api/auth/reset-password
    participant SBAUTH as 🔐 Supabase Auth
    participant Email as 📧 Email Service
    participant ResetPage as 🌐 /reset-password
    participant UpdateAPI as 🔌 /api/auth/update-password
    
    User->>ForgotPage: 1. Wprowadź email
    ForgotPage->>ResetAPI: 2. POST {email}
    ResetAPI->>SBAUTH: 3. resetPasswordForEmail(email)
    SBAUTH->>Email: 4. Wyślij email z linkiem<br/>(token ważny 1h)
    ResetAPI-->>ForgotPage: 5. 200 OK (zawsze, bez ujawniania czy email istnieje)
    ForgotPage->>User: 6. "Link wysłany na email"
    
    Email-->>User: 7. Email z linkiem reset
    User->>ResetPage: 8. Kliknij link ?token=xxx
    ResetPage->>SBAUTH: 9. Weryfikuj token
    SBAUTH-->>ResetPage: 10. Token valid
    ResetPage->>User: 11. Formularz: nowe hasło
    User->>UpdateAPI: 12. POST {token, new_password}
    UpdateAPI->>UpdateAPI: 13. Waliduj siłę hasła
    UpdateAPI->>SBAUTH: 14. updateUser({password})
    SBAUTH->>SBAUTH: 15. Hash hasła, zapisz
    SBAUTH-->>UpdateAPI: 16. Success
    UpdateAPI-->>ResetPage: 17. 200 OK
    ResetPage->>ResetPage: 18. Przekieruj do /login
    
    Note over User,SBAUTH: ✅ Nowe hasło ustawione<br/>🔒 Token jednorazowy
```

## 6. Autoryzacja oparta na rolach (US-005)

```mermaid
flowchart TD
    START([🔐 Użytkownik zalogowany]) --> GET_ROLE{Odczytaj app_role<br/>z context.locals.user}
    
    GET_ROLE -->|employee| EMP_PERM[📋 EMPLOYEE Permissions]
    GET_ROLE -->|manager| MGR_PERM[👥 MANAGER Permissions]
    GET_ROLE -->|admin| ADM_PERM[🔧 ADMIN Permissions]
    
    EMP_PERM --> EMP_LIST[✅ Odczyt:<br/>- Własne zadania<br/>- Zadania działu<br/>- Własne plany<br/>- Plany działu<br/>- Własne logi czasu]
    EMP_LIST --> EMP_WRITE[✅ Zapis:<br/>- Tworzenie własnych zadań<br/>- Planowanie własnego dnia<br/>- Logowanie własnego czasu<br/>- Przypisanie zadań w dziale]
    EMP_WRITE --> EMP_DENY[❌ BRAK dostępu:<br/>- Planowanie dnia innych<br/>- Edycja zadań innych<br/>- Raporty menedżerskie<br/>- Zarządzanie działami]
    
    MGR_PERM --> MGR_LIST[✅ Odczyt:<br/>- Wszystko jak Employee<br/>- Zadania podległych działów<br/>- Plany pracowników działu<br/>- Logi czasu działu<br/>- Raporty menedżerskie]
    MGR_LIST --> MGR_WRITE[✅ Zapis:<br/>- Wszystko jak Employee<br/>- Tworzenie zadań dla działu<br/>- Planowanie dnia pracowników<br/>- Zapraszanie użytkowników<br/>- Świadome dopuszczanie overlapów]
    MGR_WRITE --> MGR_DENY[❌ BRAK dostępu:<br/>- Tworzenie działów<br/>- Nadawanie ról<br/>- Cross-department view<br/>- Dezaktywacja kont]
    
    ADM_PERM --> ADM_ALL[✅ Pełny dostęp:<br/>- Wszystko jak Manager<br/>- Tworzenie/edycja działów<br/>- Nadawanie ról<br/>- Cross-department permissions<br/>- Dezaktywacja kont<br/>- Audit trail<br/>- System configuration]
    
    EMP_DENY --> RLS_CHECK{🛡️ Middleware + RLS<br/>Sprawdzenie uprawnień}
    MGR_DENY --> RLS_CHECK
    ADM_ALL --> RLS_CHECK
    
    RLS_CHECK -->|Authorized| ALLOW[✅ 200 OK<br/>Dostęp przyznany]
    RLS_CHECK -->|Unauthorized| DENY[🚫 403 Forbidden<br/>Brak uprawnień]
    
    DENY --> LOG[📝 Audit log:<br/>unauthorized_access_attempt]
    
    style EMP_DENY fill:#fee
    style MGR_DENY fill:#fee
    style DENY fill:#f44
    style ALLOW fill:#4f4
    style RLS_CHECK fill:#fb4
```

## 7. Middleware - Przepływ walidacji sesji

```mermaid
flowchart TD
    START([🌐 HTTP Request]) --> CREATE_CLIENT[Utwórz Supabase Client<br/>z dostępem do cookies]
    
    CREATE_CLIENT --> GET_SESSION[getSession()<br/>z HTTP-only cookies]
    
    GET_SESSION --> HAS_SESSION{Czy sesja<br/>istnieje?}
    
    HAS_SESSION -->|NIE| SET_NULL[context.locals.user = null]
    SET_NULL --> CHECK_ROUTE{Czy chroniona<br/>ścieżka?}
    CHECK_ROUTE -->|TAK| REDIRECT_LOGIN[🔄 Redirect to /login]
    CHECK_ROUTE -->|NIE| CONTINUE[✅ Continue]
    
    HAS_SESSION -->|TAK| VALIDATE_JWT[Waliduj JWT token<br/>Sprawdź expiry]
    
    VALIDATE_JWT --> VALID{Token<br/>ważny?}
    
    VALID -->|NIE| CLEAR_SESSION[Wyczyść sesję<br/>Usuń cookies]
    CLEAR_SESSION --> REDIRECT_LOGIN
    
    VALID -->|TAK| GET_USER[Pobierz dane użytkownika<br/>z public.users<br/>WHERE id = auth.uid()]
    
    GET_USER --> GET_DEPT[Pobierz aktywny dział<br/>z memberships<br/>WHERE period @> NOW()]
    
    GET_DEPT --> BUILD_CONTEXT[Zbuduj context.locals.user:<br/>- id<br/>- email<br/>- full_name<br/>- app_role<br/>- timezone<br/>- active_department]
    
    BUILD_CONTEXT --> SET_RLS[Ustaw RLS context:<br/>SET LOCAL request.jwt.claims<br/>TO 'user_id, role']
    
    SET_RLS --> CONTINUE
    
    CONTINUE --> NEXT[Przekaż do następnego<br/>handler/route]
    
    style REDIRECT_LOGIN fill:#fbb
    style CONTINUE fill:#bfb
    style VALID fill:#fb4
    style SET_RLS fill:#4bf
```

## 8. Bezpieczeństwo sesji (US-043)

```mermaid
mindmap
  root((🔐 Bezpieczeństwo<br/>Sesji))
    🍪 Cookies
      HTTP-only
        JavaScript nie ma dostępu
        Ochrona przed XSS
      Secure flag
        Tylko HTTPS w produkcji
      SameSite=Lax
        Ochrona przed CSRF
      Expiry
        Automatyczne wygasanie po 12h
    🔑 JWT Token
      Signed by Supabase
        Weryfikacja podpisu
      Claims
        user_id, role, email
        exp timestamp
      Refresh token
        Automatyczne odświeżanie
        Stored in HTTP-only cookie
    🛡️ Ochrony
      Rate limiting
        Max 5 prób logowania/min
        Lockout po 5 błędnych próbach
      Password policy
        Min 8 znaków
        Wymagana złożoność
      Session invalidation
        Logout = usunięcie wszystkich tokenów
        Change password = invalidate all sessions
    📝 Audit Trail
      Login attempts
        Success, Failed, Locked
      Session events
        Created, Refreshed, Expired, Destroyed
      Authorization failures
        403 attempts logged
        With user_id, resource, timestamp
```

## 9. Komponenty implementacji

### 9.1 Struktura plików (docelowa)

```mermaid
graph TB
    subgraph "Frontend - Pages"
        LOGIN[📄 src/pages/login.astro]
        LOGOUT[📄 src/pages/logout.astro]
        FORGOT[📄 src/pages/forgot-password.astro]
        RESET[📄 src/pages/reset-password.astro]
        ACCEPT[📄 src/pages/accept-invite.astro]
        ONBOARD[📄 src/pages/onboarding.astro]
    end
    
    subgraph "Frontend - Components"
        LOGINFORM[⚛️ LoginForm.tsx]
        REGFORM[⚛️ AcceptInviteForm.tsx]
        RESETFORM[⚛️ ResetPasswordForm.tsx]
        AUTHCTX[⚛️ AuthContext.tsx]
    end
    
    subgraph "API Endpoints"
        API_LOGIN[🔌 /api/auth/login.ts]
        API_LOGOUT[🔌 /api/auth/logout.ts]
        API_INVITE[🔌 /api/auth/invite.ts]
        API_ACTIVATE[🔌 /api/auth/activate.ts]
        API_RESET[🔌 /api/auth/reset-password.ts]
        API_UPDATE_PASS[🔌 /api/auth/update-password.ts]
        API_ME[🔌 /api/users/me.ts]
    end
    
    subgraph "Middleware & Config"
        MW[⚙️ src/middleware/index.ts]
        SBCLIENT[🔧 src/db/supabase.client.ts]
        SCHEMAS[📋 src/lib/schemas/auth.schema.ts]
    end
    
    subgraph "Database"
        AUTH_TABLE[(🗄️ auth.users)]
        USERS_TABLE[(🗄️ public.users)]
        INVITES_TABLE[(🗄️ invitations)]
        RLS_POLICIES[🛡️ RLS Policies]
    end
    
    LOGIN --> LOGINFORM
    LOGINFORM --> API_LOGIN
    ACCEPT --> REGFORM
    REGFORM --> API_ACTIVATE
    
    API_LOGIN --> MW
    API_INVITE --> MW
    MW --> SBCLIENT
    SBCLIENT --> AUTH_TABLE
    SBCLIENT --> USERS_TABLE
    
    AUTH_TABLE -.->|Enforce| RLS_POLICIES
    USERS_TABLE -.->|Enforce| RLS_POLICIES
    
    style MW fill:#60a5fa
    style RLS_POLICIES fill:#fbbf24
    style AUTH_TABLE fill:#4ade80
```

## 10. Macierz uprawnień - szczegółowa

| Zasób / Akcja | Employee | Manager (own dept) | Manager (cross-view) | Admin |
|---------------|----------|-------------------|---------------------|-------|
| **Zadania** |
| Odczyt własnych zadań | ✅ | ✅ | ✅ | ✅ |
| Odczyt zadań działu | ✅ | ✅ | ✅ (read-only) | ✅ |
| Odczyt zadań innych działów | ❌ | ❌ | ✅ (assigned only) | ✅ |
| Tworzenie zadań dla siebie | ✅ | ✅ | ✅ | ✅ |
| Tworzenie zadań dla działu | ✅ | ✅ | ❌ | ✅ |
| Edycja własnych zadań | ✅ | ✅ | ✅ | ✅ |
| Edycja zadań działu | ❌ | ✅ | ❌ | ✅ |
| Usuwanie zadań | ❌ | ✅ (dept only) | ❌ | ✅ |
| **Plan dnia** |
| Odczyt własnego planu | ✅ | ✅ | ✅ | ✅ |
| Odczyt planów działu | ✅ | ✅ | ✅ (read-only) | ✅ |
| Planowanie własnego dnia | ✅ | ✅ | ✅ | ✅ |
| Planowanie dnia innych | ❌ | ✅ (dept only) | ❌ | ✅ |
| Dopuszczanie overlapa (własnego) | ✅ | ✅ | ✅ | ✅ |
| Dopuszczanie overlapa (innych) | ❌ | ✅ (dept only) | ❌ | ✅ |
| **Logi czasu** |
| Logowanie własnego czasu | ✅ | ✅ | ✅ | ✅ |
| Edycja własnych logów (≤7 dni) | ✅ | ✅ | ✅ | ✅ |
| Odczyt logów działu | ❌ | ✅ | ✅ (read-only) | ✅ |
| Edycja logów innych | ❌ | ❌ | ❌ | ✅ |
| **Raporty** |
| Raport osobisty | ✅ | ✅ | ✅ | ✅ |
| Raport działu | ❌ | ✅ | ✅ (assigned only) | ✅ |
| Raport międzydziałowy | ❌ | ❌ | ❌ | ✅ |
| Eksport CSV | ✅ | ✅ | ✅ | ✅ |
| **Zarządzanie** |
| Zapraszanie użytkowników | ❌ | ✅ (to dept) | ❌ | ✅ |
| Tworzenie działów | ❌ | ❌ | ❌ | ✅ |
| Przypisywanie do działów | ❌ | ✅ (own dept) | ❌ | ✅ |
| Nadawanie ról | ❌ | ❌ | ❌ | ✅ |
| Nadawanie cross-view | ❌ | ❌ | ❌ | ✅ |
| Dezaktywacja kont | ❌ | ❌ | ❌ | ✅ |
| Podgląd audit trail | ❌ | ✅ (dept changes) | ❌ | ✅ |

## Legenda

| Symbol | Znaczenie |
|--------|-----------|
| ✅ | Pełny dostęp / Akcja dozwolona |
| ❌ | Brak dostępu / Akcja zabroniona |
| 🔐 | Wymaga autentykacji |
| 🛡️ | Wymaga autoryzacji (sprawdzenie roli) |
| ⚠️ | Stan tymczasowy (do zastąpienia) |
| 🔴 | Problem do rozwiązania |
| 🟡 | Uwaga / Zastrzeżenie |
| 🟢 | Działające rozwiązanie |

---

## Podsumowanie

Diagram przedstawia pełną architekturę systemu autentykacji aplikacji DailyPath, obejmując:

1. **Obecny stan (tymczasowy)**: Autentykacja przez cookie `temp_user_id` bez RLS
2. **Docelowy stan**: Pełna integracja z Supabase Auth, HTTP-only cookies, aktywny RLS
3. **Przepływy użytkownika**: Logowanie, rejestracja przez zaproszenie, reset hasła
4. **Autoryzacja**: 3 role (Employee, Manager, Admin) z szczegółową macierzą uprawnień
5. **Bezpieczeństwo**: JWT tokens, HTTP-only cookies, rate limiting, audit trail
6. **Architektura**: Middleware, API endpoints, komponenty React, baza danych

Implementacja zgodna z wymaganiami z PRD (US-001 do US-005, US-009, US-010, US-043) oraz specyfikacją techniczną auth-spec.md.
