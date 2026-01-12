Zajrzyjmy do `\.ai\prd.md`, żeby porównać wymagania z proponowanym stackiem.

[1 tool called]

Przeczytałem `\.ai\prd.md` i porównałem wymagania z proponowanym stackiem. Poniżej zwięzła, krytyczna ocena i rekomendacje.

### Ocena względem pytań

- **1) Szybkość dostarczenia MVP**: 
  - **Tak, ale z kilkoma ryzykami**. Astro + React + Supabase umożliwią szybkie MVP (auth, DB, RLS, e‑maile, CSV, prosty SSR). Największe ryzyka czasu to: kalendarz z drag&drop i logika overlapa, model czasu (sloty 15 min + DST), role/poziomy dostępu z RLS.
  - Ryzyko wersji: **Tailwind 4** (jeszcze świeży) i **React 19** (zmiany w ekosystemie) mogą spowolnić start. Stabilniejsze: Tailwind 3.4 i React 18.3.

- **2) Skalowalność**:
  - **Wystarczająca na etap MVP i dalej**. Supabase/Postgres skaluje, RLS dobrze wspiera multi‑tenant (działy/role). Astro wyśle mało JS na klienta (lepsze p90 renderu). Skalowanie serwisu www na DO wymaga własnego autoscalingu/observability (dodatkowa praca ops).
  - Uwaga na widok planu: w PRD p90 < 2 s — wymaga indeksów, paginacji/okien czasowych i minimalizacji overfetchingu.

- **3) Koszt utrzymania/rozwoju**:
  - **Akceptowalny**. Supabase (EU) + 1 droplet DO + GitHub Actions to niski koszt początkowy. Największy koszt operacyjny to czas deweloperski na kalendarz/raporty/analitykę.
  - **OpenRouter** nie jest potrzebny w MVP (PRD nie wymaga AI) — to zbędny koszt/kompleksowość na starcie.

- **4) Złożoność rozwiązania**:
  - **Lekko ponad potrzebę MVP**. Stos zawiera kilka ruchomych części: Astro SSR na DO (Docker), React, Tailwind, shadcn, Supabase, OpenRouter, CI/CD. AI i Docker/DO można odroczyć.
  - Alternatywa obniżająca złożoność: jeden framework full‑stack (np. Next.js) z hostingiem zarządzanym.

- **5) Prostsze podejście**:
  - **Tak — rekomendowane uproszczenie na MVP**:
    - Front/back: **Next.js 15 (App Router) + React 18.3/19** zamiast Astro, żeby mieć SSR, API routes, middleware i RSC w jednym miejscu.
    - UI: **Tailwind 3.4 + shadcn/ui** (stabilne).
    - Backend: **Supabase (EU, hosted)**: Auth, RLS, DB, Edge Functions/Cron.
    - Hosting: **Vercel (region EU) lub Supabase Functions + statyczny front**. DO/Docker odroczyć, chyba że jest wymóg własnej maszyny.
    - AI/OpenRouter: odłożyć do „poza MVP”.
  - Jeśli trzymamy Astro: dopilnować adaptera SSR, stabilnych wersji (TW 3.4), i ograniczać wyspy Reactowe do miejsc z interakcją (kalendarz, formularze).

- **6) Bezpieczeństwo**:
  - **Wymagania PRD są osiągalne**: Supabase Auth (HTTP‑only cookies lub JWT), **RLS per rola/dział**, dzienny backup, region UE. 
  - Dołożyć:
    - Polityki RLS dla `users`, `departments`, `memberships`, `tasks`, `plan_slots`, `time_logs`, `manager_audit_logs`, `events`.
    - Postgres triggers do audytu działań przełożonych i jednorazowości linków zaproszeń/resetu hasła.
    - Rate limiting (np. middleware albo Supabase Edge Functions), CSRF dla endpointów cookie‑based, Content Security Policy, sanitacja wejścia (XSS).
    - Czas/strefy: przechowywać w UTC (`timestamptz`), obliczenia klienta z `date-fns-tz`/Luxon.

### Najważniejsze ryzyka realizacyjne z PRD
- Kalendarz 24/7 w slotach 15 min z overlap i dostępnością klawiatury (drag&drop + alternatywy).
- Poprawność DST i metryk (plan_filled_% ignorujący overlap).
- Spójne i szczelne RLS dla ról/działów i widoczności prywatnych zadań.
- p90 < 2 s dla widoku planu (limit danych, indeksy, cache, selektywny fetch).

### Rekomendowane korekty stacku na MVP
- **Zamień Tailwind 4 → 3.4** (stabilność).
- **Rozważ React 18.3** na start; 19 jeśli biblioteki w projekcie wspierają bez zastrzeżeń.
- **Usuń OpenRouter na MVP** (brak wymagań AI w PRD).
- **Rozważ Next.js zamiast Astro** dla mniejszej liczby elementów operacyjnych i szybszego developmentu funkcji serwerowych (API/SSR/middleware).
- Jeśli zostajesz przy Astro: trzymaj SSR prosty, wyspy React tylko tam, gdzie konieczne.

### Czy obecny stack „przechodzi” względem PRD?
- **Tak, z zastrzeżeniami**: dostarczy MVP i jest skalowalny, ale można go uprościć bez utraty funkcjonalności i z niższym ryzykiem wdrożeniowym.

- Kluczowe uproszczenia na tu i teraz:
  - Tailwind 3.4, opcjonalnie React 18.3.
  - Wyrzucić AI z MVP.
  - Rozważyć hosting zarządzany (Vercel) zamiast Docker+DO na start.
  - Wczesne zaprojektowanie schematu i RLS (działy/role/visibility) oraz indeksów pod widoki planu i raporty.

- Bezpieczeństwo: osiągalne, przy dobrze napisanych politykach RLS, audycie DB i standardowych zabezpieczeniach web.

- Podsumowanie zmian i wpływ:
  - Uproszczenia zmniejszają ryzyko i czas delivery, ułatwiają utrzymanie i ograniczają koszty, nie ograniczając wymagań PRD.

### Narzędzia testowe

Projekt wykorzystuje następujące narzędzia do testowania:

- **Testy jednostkowe i integracyjne**: **Vitest** — szybki framework testowy kompatybilny z Vite, idealny dla projektów Astro. Wspiera testy jednostkowe funkcji utility, serwisów, komponentów React oraz integracyjne testy API endpoints i integracji z bazą danych.
- **Testy E2E**: **Playwright** — framework do testów end-to-end z obsługą wielu przeglądarek (Chrome, Firefox, Safari, Edge). Umożliwia testowanie pełnych flow użytkownika, w tym logowania, tworzenia zadań, planowania i logowania czasu.
- **Testy komponentów**: **Testing Library** — biblioteka do testowania komponentów React z naciskiem na dostępność i testowanie z perspektywy użytkownika.
- **Infrastruktura testowa**: **Supabase Test Containers** — lokalne środowisko testowe umożliwiające testowanie integracji z bazą danych i RLS policies bez potrzeby połączenia z zewnętrznym Supabase.

**Strategia testowania** (piramida testów):
- 60% testy jednostkowe (Vitest)
- 30% testy integracyjne (Vitest + Supabase Test Containers)
- 10% testy E2E (Playwright)

Cel pokrycia kodu: minimum 70% dla testów jednostkowych i integracyjnych.

Szczegółowy plan testów znajduje się w [.ai/test-plan.md](.ai/test-plan.md).