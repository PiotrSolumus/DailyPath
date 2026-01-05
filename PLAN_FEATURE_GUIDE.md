# Przewodnik - Dodawanie zadań do planu dnia

## ✅ Status implementacji

Funkcjonalność dodawania zadań do planu dnia została w pełni zaimplementowana i jest gotowa do użycia.

## 🎯 Jak używać

### 1. Otwórz listę zadań

Przejdź do strony zadań:
```
http://localhost:3001/tasks
```

### 2. Znajdź zadanie, które chcesz zaplanować

Na liście zadań każda karta zadania (które nie jest jeszcze ukończone) ma przycisk **"Dodaj do planu"** na dole.

### 3. Kliknij "Dodaj do planu"

Po kliknięciu przycisku otworzy się okno dialogowe z formularzem planowania.

### 4. Wypełnij formularz

Formularz zawiera:

- **Data** - wybierz dzień, w którym chcesz wykonać zadanie (domyślnie: dzisiaj)
- **Godzina rozpoczęcia** - wybierz godzinę rozpoczęcia (lista z 15-minutowymi interwałami)
- **Czas trwania** - wybierz jak długo chcesz pracować nad zadaniem (domyślnie: estymacja zadania)
- **Pozwól na nakładanie** - zaznacz, jeśli chcesz pozwolić na konflikt z innymi zadaniami w tym samym czasie

### 5. Kliknij "Dodaj do planu"

Po kliknięciu:
- Zadanie zostanie dodane do Twojego kalendarza
- Zobaczysz powiadomienie o sukcesie
- Lista zadań i kalendarz zostaną automatycznie odświeżone

### 6. Sprawdź swój plan

Przejdź do widoku planu dnia:
```
http://localhost:3001/plan
```

Tam zobaczysz swoje zaplanowane zadania w kalendarzu.

## 🔧 Funkcje

### Walidacja

System automatycznie sprawdza:
- ✅ Godziny są wyrównane do 15 minut (08:00, 08:15, 08:30, 08:45, itd.)
- ✅ Czas trwania jest wielokrotnością 15 minut
- ✅ Czas trwania wynosi co najmniej 15 minut
- ✅ Brak konfliktów z innymi zadaniami (jeśli nie zaznaczono "Pozwól na nakładanie")

### Domyślne wartości

- **Data**: dzisiejsza data
- **Godzina**: następny zaokrąglony 15-minutowy slot (np. jeśli jest 14:37, domyślnie będzie 14:45)
- **Czas trwania**: estymacja zadania (z karty zadania)

### Obsługa konfliktów

Jeśli próbujesz zaplanować zadanie w czasie, który nakłada się z innym zadaniem:
- System wyświetli błąd
- Możesz zaznaczyć "Pozwól na nakładanie" aby wymusić dodanie zadania
- Oba zadania będą oznaczone wizualnie w kalendarzu jako nakładające się

## 📋 Przykład użycia

1. Masz zadanie "Przygotować raport" z estymacją 2 godziny
2. Klikasz "Dodaj do planu"
3. Wybierasz:
   - Data: jutro (2026-01-05)
   - Godzina: 09:00
   - Czas trwania: 2h 0min (domyślnie z estymacji)
4. Klikasz "Dodaj do planu"
5. Zadanie pojawia się w kalendarzu na jutro od 09:00 do 11:00

## 🔐 Uprawnienia

- **Zwykły użytkownik**: może dodawać zadania tylko do swojego planu
- **Manager/Admin**: może dodawać zadania do planów innych użytkowników (funkcja dostępna w widoku zespołu)

## 🐛 Rozwiązywanie problemów

### Problem: Przycisk "Dodaj do planu" nie jest widoczny

**Możliwe przyczyny:**
1. Nie jesteś zalogowany - zaloguj się ponownie
2. Zadanie jest już ukończone (status: "done") - ukończone zadania nie mogą być planowane

### Problem: "Plan slot overlaps with existing slot"

**Rozwiązanie:**
1. Wybierz inną godzinę, która nie nakłada się z istniejącym zadaniem
2. LUB zaznacz "Pozwól na nakładanie" aby wymusić dodanie

### Problem: "Plan slot times must be aligned to 15-minute intervals"

**Rozwiązanie:**
- Upewnij się, że wybrana godzina jest wyrównana do 15 minut (np. 09:00, 09:15, 09:30)
- System powinien automatycznie oferować tylko poprawne godziny w liście rozwijanej

## 🎨 Interfejs użytkownika

### Przycisk "Dodaj do planu"
- Znajduje się na dole każdej karty zadania
- Ma ikonę kalendarza z plusem
- Jest widoczny tylko dla zadań, które nie są ukończone
- Jest nieaktywny dla niezalogowanych użytkowników

### Modal planowania
- Responsywny design (dostosowuje się do rozmiaru ekranu)
- Intuicyjne pola formularza
- Walidacja w czasie rzeczywistym
- Komunikaty o błędach są czytelne i pomocne

## 🚀 Integracja z innymi funkcjami

### Kalendarz
Po dodaniu zadania do planu:
- Automatycznie pojawi się w widoku `/plan`
- Można je przesuwać metodą drag & drop
- Można je edytować lub usunąć

### ETA (Estimated Time of Arrival)
- System automatycznie oblicza ETA zadania na podstawie zaplanowanych slotów
- ETA jest widoczne na karcie zadania (zielony tekst)
- ETA aktualizuje się automatycznie po dodaniu/usunięciu slotów

### Raporty
- Zaplanowane zadania są uwzględniane w raportach
- Możesz zobaczyć statystyki planowania w widoku raportów

## 📊 API Endpoints

Jeśli chcesz zintegrować się z API:

### POST /api/plan-slots
Tworzy nowy slot planowania.

**Body:**
```json
{
  "task_id": "uuid-zadania",
  "user_id": "uuid-użytkownika",
  "period": "[2026-01-05T09:00:00Z, 2026-01-05T11:00:00Z)",
  "allow_overlap": false
}
```

**Response:** 201 Created
```json
{
  "id": "123",
  "message": "Plan slot created successfully"
}
```

### GET /api/plan-slots
Pobiera sloty planowania dla użytkownika.

**Query params:**
- `user_id` (required)
- `start_date` (required, format: YYYY-MM-DD)
- `end_date` (required, format: YYYY-MM-DD)

**Response:** 200 OK
```json
[
  {
    "id": "123",
    "task_id": "uuid",
    "user_id": "uuid",
    "period": "[2026-01-05T09:00:00Z, 2026-01-05T11:00:00Z)",
    "allow_overlap": false
  }
]
```

## ✅ Checklist testowania

Przetestuj następujące scenariusze:

- [ ] Dodanie zadania do planu na dzisiaj
- [ ] Dodanie zadania do planu na przyszły dzień
- [ ] Próba dodania zadania w czasie, który nakłada się z innym
- [ ] Dodanie zadania z opcją "Pozwól na nakładanie"
- [ ] Sprawdzenie czy zadanie pojawia się w kalendarzu
- [ ] Sprawdzenie czy ETA zadania się aktualizuje
- [ ] Anulowanie dodawania zadania (przycisk "Anuluj")
- [ ] Zamknięcie modalu przez kliknięcie X
- [ ] Zmiana czasu trwania zadania
- [ ] Dodanie zadania z różnymi estymacjami (15min, 1h, 4h, 8h)

## 🎓 Dalsze kroki

Po opanowaniu podstaw możesz:
1. Eksperymentować z różnymi czasami trwania
2. Planować zadania na cały tydzień
3. Używać funkcji drag & drop w kalendarzu do przesuwania zadań
4. Sprawdzać raporty aby zobaczyć statystyki planowania

---

**Powodzenia w planowaniu! 🎯**


