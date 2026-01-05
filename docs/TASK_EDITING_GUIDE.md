# Przewodnik - Edycja zadań i zmiana statusu

## Jak oznaczyć zadanie jako wykonane?

### Krok 1: Przejdź do zakładki "Zadania"
Kliknij w menu boczne na "Zadania" lub przejdź do `/tasks`

### Krok 2: Kliknij na zadanie
Kliknij na dowolną kartę zadania, które chcesz edytować

### Krok 3: Zmień status
W otwartym oknie edycji:
1. Znajdź pole "Status"
2. Wybierz z listy rozwijanej:
   - **Do zrobienia** - zadanie nie rozpoczęte
   - **W trakcie** - zadanie w realizacji
   - **Zablokowane** - zadanie zablokowane przez zależności
   - **Wykonane** ✅ - zadanie ukończone

### Krok 4: Zapisz zmiany
Kliknij przycisk "Zapisz zmiany" na dole formularza

## Dodatkowe możliwości edycji

W oknie edycji zadania możesz również zmienić:

- **Tytuł** - nazwa zadania
- **Opis** - szczegółowy opis zadania
- **Priorytet** - niski, średni, wysoki
- **Estymacja** - przewidywany czas wykonania (w minutach, wielokrotność 15)
- **Termin** - data zakończenia
- **Zadanie prywatne** - czy zadanie jest widoczne tylko dla Ciebie i menedżerów

## Statusy zadań

### 📋 Do zrobienia (todo)
Zadanie oczekuje na rozpoczęcie

### 🔄 W trakcie (in_progress)
Zadanie jest obecnie realizowane

### 🚫 Zablokowane (blocked)
Zadanie nie może być kontynuowane z powodu blokad (np. oczekiwanie na inne zadanie, brak zasobów)

### ✅ Wykonane (done)
Zadanie zostało ukończone

**Uwaga:** Zadania ze statusem "Wykonane" nie pokazują przycisku "Dodaj do planu"

## Uprawnienia

- **Pracownik** - może edytować własne zadania
- **Manager** - może edytować zadania w swoich działach
- **Admin** - może edytować wszystkie zadania

## Techniczne szczegóły

### API Endpoint
```
PATCH /api/tasks/:id
```

### Walidacja
- Tytuł: wymagany, max 255 znaków
- Opis: opcjonalny, max 5000 znaków
- Estymacja: minimum 15 minut, wielokrotność 15
- Status: jeden z: todo, in_progress, blocked, done
- Priorytet: jeden z: low, medium, high

### Komponenty
- `EditTaskForm.tsx` - formularz edycji
- `EditTaskModal.tsx` - modal z formularzem
- `TaskList.tsx` - lista zadań z obsługą kliknięcia

### Serwisy
- `task.service.ts::updateTask()` - aktualizacja zadania w bazie
- `task.schema.ts::updateTaskSchema` - walidacja Zod


