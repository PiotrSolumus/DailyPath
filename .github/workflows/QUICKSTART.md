# 🚀 CI/CD Quick Start

## Co zostało skonfigurowane?

✅ **Workflow GitHub Actions** (`.github/workflows/ci.yml`) który:
- Uruchamia testy jednostkowe (Vitest)
- Uruchamia testy E2E (Playwright)
- Buduje aplikację w trybie produkcyjnym
- Może być uruchamiany **automatycznie** (push do master) lub **manualnie**

## Pierwsze kroki

### 1. Commit i push workflow

```bash
git add .github/workflows/ci.yml
git commit -m "Add CI/CD pipeline"
git push origin master
```

### 2. Sprawdź czy działa

1. Przejdź do zakładki **Actions** w repozytorium GitHub
2. Powinieneś zobaczyć uruchomiony workflow
3. Poczekaj na zakończenie (~10-15 minut)

### 3. Uruchom manualnie (opcjonalnie)

1. **Actions** → **CI/CD Pipeline**
2. Kliknij **Run workflow**
3. Wybierz branch i kliknij **Run workflow**

## Co jest testowane?

| Job | Co testuje | Czas |
|-----|------------|------|
| `test-unit` | Testy Vitest + coverage | ~2-5 min |
| `test-e2e` | Testy Playwright | ~5-10 min |
| `build` | Build produkcyjny Astro | ~2-3 min |

## Konfiguracja Secrets (opcjonalne)

Jeśli potrzebujesz zmiennych środowiskowych:

1. **GitHub** → **Settings** → **Secrets and variables** → **Actions**
2. Dodaj secrets:
   - `SUPABASE_URL` (dla testów E2E)
   - `SUPABASE_KEY` (dla testów E2E)
   - `PUBLIC_SUPABASE_URL` (dla builda)
   - `PUBLIC_SUPABASE_KEY` (dla builda)
   - `CODECOV_TOKEN` (dla coverage)

**Uwaga**: Workflow działa bez secrets, ale niektóre testy mogą wymagać Supabase.

## Troubleshooting

### ❌ Workflow nie uruchamia się
- Sprawdź czy plik `.github/workflows/ci.yml` jest w repozytorium
- Upewnij się, że branch to `master` lub `main`

### ❌ Testy nie przechodzą
- Sprawdź logi w zakładce **Actions**
- Uruchom testy lokalnie: `npm run test` i `npm run test:e2e`

### ❌ Build fails
- Sprawdź czy `npm run build` działa lokalnie
- Zweryfikuj zmienne środowiskowe w logach

## Następne kroki

- 📖 Przeczytaj pełną dokumentację: [README.md](README.md)
- 🔧 Dostosuj workflow do swoich potrzeb
- 🚀 Dodaj deploy do staging/produkcji (opcjonalnie)

## Status Badge

Dodaj do `README.md`:

```markdown
![CI/CD](https://github.com/USERNAME/REPO/workflows/CI%2FCD%20Pipeline/badge.svg)
```

Zastąp `USERNAME` i `REPO` nazwą swojego repozytorium.
