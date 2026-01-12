# CI/CD Pipeline Documentation

## Przegląd

Minimalny setup CI/CD dla projektu DailyPath, który weryfikuje:
- ✅ Testy jednostkowe i integracyjne (Vitest)
- ✅ Testy E2E (Playwright)
- ✅ Build produkcyjny (Astro)

## Workflow: `.github/workflows/ci.yml`

### Wyzwalacze (Triggers)

Workflow uruchamia się automatycznie w następujących sytuacjach:
- **Push do `master` lub `main`** - automatyczna weryfikacja zmian
- **Pull Request do `master` lub `main`** - weryfikacja przed merge
- **Ręczne uruchomienie** (`workflow_dispatch`) - możliwość manualnego triggera z GitHub UI

### Joby (Zadania)

#### 1. `test-unit` - Testy jednostkowe i integracyjne
- **Czas wykonania**: ~2-5 minut
- **Działania**:
  - Instalacja zależności (`npm ci`)
  - Uruchomienie testów Vitest (`npm run test`)
  - Generowanie raportu coverage (`npm run test:coverage`)
  - Upload coverage do Codecov (opcjonalnie, jeśli token jest skonfigurowany)

#### 2. `test-e2e` - Testy end-to-end
- **Czas wykonania**: ~5-10 minut
- **Działania**:
  - Instalacja zależności
  - Instalacja przeglądarek Playwright
  - Uruchomienie testów E2E (`npm run test:e2e`)
  - Upload raportu Playwright jako artifact

**Uwaga**: Testy E2E mogą wymagać skonfigurowania Supabase. Zobacz sekcję "Konfiguracja zmiennych środowiskowych".

#### 3. `build` - Build produkcyjny
- **Czas wykonania**: ~2-3 minuty
- **Zależności**: Wymaga sukcesu `test-unit`
- **Działania**:
  - Build aplikacji Astro (`npm run build`)
  - Upload build artifacts (`dist/`)

#### 4. `ci-success` - Podsumowanie
- Sprawdza status wszystkich jobów
- Fails jeśli którykolwiek job nie przeszedł

## Konfiguracja

### Wymagane Secrets (GitHub Secrets)

Aby w pełni wykorzystać pipeline, skonfiguruj następujące secrets w GitHub:

1. **Dla testów E2E z Supabase** (opcjonalne):
   ```
   SUPABASE_URL - URL instancji Supabase
   SUPABASE_KEY - Anon key z Supabase
   ```

2. **Dla builda produkcyjnego** (opcjonalne, jeśli build wymaga env vars):
   ```
   PUBLIC_SUPABASE_URL - Publiczny URL Supabase
   PUBLIC_SUPABASE_KEY - Publiczny anon key
   ```

3. **Dla Codecov** (opcjonalne):
   ```
   CODECOV_TOKEN - Token do uploadu coverage
   ```

### Jak skonfigurować Secrets

1. Przejdź do repozytorium na GitHub
2. Settings → Secrets and variables → Actions
3. Kliknij "New repository secret"
4. Dodaj każdy secret z nazwą i wartością

### Konfiguracja Supabase dla testów E2E

Jeśli testy E2E wymagają Supabase, masz dwie opcje:

#### Opcja 1: Supabase Test Containers (Rekomendowane)
Zainstaluj i skonfiguruj Supabase Test Containers w workflow:
```yaml
- name: Setup Supabase
  run: |
    npx supabase start
    # Zastosuj migracje
    npx supabase migration up
```

#### Opcja 2: Zewnętrzna instancja Supabase
Użyj secrets do połączenia z staging/testową instancją Supabase.

## Uruchomienie manualne

1. Przejdź do zakładki **Actions** w repozytorium GitHub
2. Wybierz workflow **CI/CD Pipeline**
3. Kliknij **Run workflow**
4. Wybierz branch (domyślnie `master`)
5. Kliknij **Run workflow**

## Status Badge

Dodaj badge statusu do README.md:

```markdown
![CI/CD](https://github.com/USERNAME/REPO/workflows/CI%2FCD%20Pipeline/badge.svg)
```

## Troubleshooting

### Testy E2E nie przechodzą
- Sprawdź czy Playwright browsers są zainstalowane
- Zweryfikuj czy serwer dev startuje poprawnie (timeout 120s)
- Sprawdź logi w sekcji "Run E2E tests"

### Build fails
- Sprawdź czy wszystkie zmienne środowiskowe są ustawione
- Zweryfikuj logi builda w sekcji "Build production"
- Upewnij się, że `astro.config.mjs` jest poprawnie skonfigurowany

### Coverage nie jest uploadowane
- Token Codecov jest opcjonalny - workflow nie failuje jeśli go brakuje
- Jeśli chcesz coverage, dodaj `CODECOV_TOKEN` do secrets

## Rozszerzenia (Future)

Możliwe rozszerzenia pipeline:
- ✅ Deploy do staging po sukcesie testów
- ✅ Deploy do produkcji po merge do master
- ✅ Linting i formatowanie kodu
- ✅ Security scanning
- ✅ Performance testing
- ✅ Docker image build (jeśli używany)

## Koszty

GitHub Actions oferuje:
- **2000 minut/miesiąc** dla planu Free
- **3000 minut/miesiąc** dla planu Team

Szacowany czas wykonania pełnego pipeline: **~10-15 minut**
- Można uruchomić **~130-200 razy/miesiąc** na planie Free
