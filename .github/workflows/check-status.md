# 🔍 Jak sprawdzić status CI/CD na GitHub

## Szybki sposób

1. **Otwórz w przeglądarce:**
   ```
   https://github.com/PiotrSolumus/DailyPath/actions
   ```

2. **Znajdź workflow "CI/CD Pipeline"** i sprawdź status ostatniego uruchomienia:
   - ✅ **Zielony znacznik** = wszystkie testy przeszły
   - ❌ **Czerwony znacznik** = niektóre testy nie przeszły
   - 🟡 **Żółty znacznik** = workflow w trakcie wykonywania

## Szczegółowy status

### Sprawdź każdy job osobno:

1. **Lint** - sprawdza jakość kodu
2. **Unit & Integration Tests** - testy jednostkowe (146 testów)
3. **E2E Tests** - testy end-to-end
4. **Production Build** - build produkcyjny
5. **CI Status** - podsumowanie

### Jeśli testy nie przeszły:

1. Kliknij na nieudany job
2. Sprawdź logi w sekcji "Run unit and integration tests"
3. Znajdź błąd w logach
4. Napraw lokalnie i push ponownie

## Status lokalny ✅

Lokalnie wszystkie testy przechodzą:
- ✅ **146 testów** przeszło pomyślnie
- ✅ **Build produkcyjny** działa
- ✅ **Workflow** został poprawnie skonfigurowany

## Link bezpośredni

[Sprawdź status CI/CD](https://github.com/PiotrSolumus/DailyPath/actions/workflows/ci.yml)
