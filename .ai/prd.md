# Dokument wymagań produktu (PRD) - DailyPatch (MVP)

## 1. Przegląd produktu

DailyPatch to aplikacja webowa wspierająca codzienne planowanie pracy, priorytetyzację i rozliczanie czasu przez pracowników oraz szybki podgląd planów i przydzielanie zadań przez przełożonych. MVP koncentruje się na prostym, skutecznym planowaniu dnia/tygodnia w slotach 15‑minutowych, ręcznym logowaniu czasu i podstawowych raportach dziennych/miesięcznych z eksportem do CSV.

Zakres MVP:
- Dwie główne role produktowe: Pracownik, Przełożony oraz techniczne konto Admin do provisioningu i nadawania uprawnień (w tym międzydziałowego podglądu).
- Jedno-członkostwo użytkownika w dziale (z datowaniem od–do), pełna widoczność planów w obrębie działu; znacznik Prywatne (widoczny dla właściciela i przełożonego), zadania prywatne pojawiają się w raportach menedżerskich.
- Model zadania: nazwa, opis, priorytet L/M/H, wymagany szacowany czas, opcjonalna data docelowa, status To Do / In Progress / Blocked / Done; przypisanie do użytkownika lub działu; widoczny autor przypisania.
- Plan dnia: planowanie 24/7 w slotach 15 min w widokach dzień/tydzień, drag&drop, kontrola konfliktów i możliwość świadomego dopuszczenia overlapa z wizualnym oznaczeniem; tylko przełożony planuje dzień innych.
- Rejestrowanie czasu: ręczne wpisy z zaokrąglaniem do 15 min, edycja do 7 dni wstecz; logi >150% estymacji flagowane do wglądu przełożonego.
- ETA i zamykanie: ETA pokazywana, gdy zaplanowano 100% estymacji; wcześniejsze zakończenie natychmiast zamyka zadanie (status Done, ETA = czas zamknięcia).
- Raporty: dzienny i miesięczny oparte na rzeczywistym czasie (data, zadanie, dział, wykonawca, łączny czas, status przy zamknięciu); eksport CSV (PDF poza MVP).
- Analityka: plan_filled_% (liczone względem skonfigurowanych godzin pracy, bez overlapa), daily_active_update (pierwszy log czasu lub edycja planu danego dnia), manager_view_time.

Założone platformy i operacje:
- Aplikacja webowa/desktopowa (przeglądarka), hosting w UE, minimalne PII (imię, e‑mail), zaproszenia e‑mail, kreator pierwszego dnia.
- Obsługa stref czasowych, dzienny backup, polityka retencji (parametry do doprecyzowania), audit trail zmian przełożonego.

Definicje kluczowe:
- plan_filled_%: odsetek godzin pracy użytkownika (wg jego konfiguracji) wypełniony zaplanowanymi slotami bez podwójnego liczenia overlapa.
- daily_active_update: pierwszy zapis czasu lub pierwsza edycja planu w danym dniu kalendarzowym użytkownika.
- manager_view_time: czas od wejścia przełożonego do sekcji podglądu do wyświetlenia planu wybranego pracownika.

## 2. Problem użytkownika

Pracownicy często tracą czas na doraźną organizację dnia, rozpraszają się, nie mają jasnej listy priorytetów i nie ewidencjonują rzetelnie czasu. Przełożeni mają utrudniony wgląd w plany i postęp prac zespołu oraz potrzebują szybkiego sposobu na przydzielanie zadań i identyfikację blokad.

DailyPatch rozwiązuje te problemy poprzez:
- Proste, wizualne planowanie dnia/tygodnia z drag&drop i slotami 15 min.
- Jasny model zadań z priorytetem, estymacją i statusem.
- Ręczne logowanie czasu i automatyczne podsumowania.
- Szybki podgląd planu pracownika i możliwość świadomego dopuszczania konfliktów przez przełożonego.
- Raporty dzienne/miesięczne i metryki wspierające decyzje operacyjne.

## 3. Wymagania funkcjonalne

3.1 Konta i role
- Role: Pracownik, Przełożony; techniczne konto Admin do provisioningu i nadawania uprawnień (w tym międzydziałowego podglądu).
- Rejestracja przez zaproszenia e‑mail; logowanie; reset hasła; wylogowanie.
- Autoryzacja dostępu per rola; tylko przełożony może planować dzień innych; Admin nadaje podgląd międzydziałowy wybranym przełożonym.

3.2 Działy i członkostwo
- Użytkownik należy do jednego działu w danym czasie; członkostwo datowane od–do dla poprawnej historii i raportowania.
- Przełożony może tworzyć/edytować/usuwać działy oraz przypisywać pracowników do działu; Admin może nadawać rozszerzone uprawnienia.
- Pełna widoczność planów w obrębie działu; znacznik Prywatne widoczny dla właściciela i przełożonego.

3.3 Zadania
- Pola: nazwa, opis, priorytet L/M/H, estymacja czasu (wymagane), data docelowa (opcjonalna), status To Do / In Progress / Blocked / Done.
- Przypisanie do użytkownika lub działu; widoczne źródło przypisania (kto przypisał).
- Tworzenie, edycja, usuwanie przez właściciela zadania lub przełożonego; współpracownicy w dziale mogą przypisać zadanie innemu bez akceptacji.
- Filtrowanie po grupie/dziale i priorytecie.

3.4 Plan dnia
- Widoki dzień i tydzień; przeciąganie zadań (drag&drop); slot 15‑min; planowanie 24/7.
- Domyślna blokada overlapa z możliwością świadomego dopuszczenia; konflikt oznaczony wizualnie.
- Tylko przełożony może dodawać/edytować sloty w planie innych użytkowników.

3.5 Rejestrowanie czasu
- Ręczne wpisy czasu pracy powiązane z zadaniami; zaokrąglanie do 15 min.
- Edycja wpisów do 7 dni wstecz; logi przekraczające 150% estymacji flagowane do wglądu przełożonego.

3.6 ETA i zamykanie zadań
- Jeśli zaplanowano 100% estymacji, prezentuj przewidywany koniec = koniec ostatniego slotu.
- Wcześniejsze zakończenie ustawia status Done i zamyka zadanie; ETA = czas zamknięcia.

3.7 Raporty
- Raport dzienny i miesięczny oparte na rzeczywistym czasie: data, zadanie, dział, wykonawca, łączny czas, status przy zamknięciu.
- Eksport do CSV (PDF poza MVP); filtracja po dziale, użytkowniku, priorytecie, statusie, dacie.

3.8 Analityka i metryki
- plan_filled_%: liczony względem godzin pracy użytkownika, bez podwójnego liczenia overlapa.
- daily_active_update: wyzwalany przy pierwszym logu czasu lub pierwszej edycji planu danego dnia.
- manager_view_time: mierzony od wejścia do modułu podglądu do pełnego renderu planu wybranego pracownika.

3.9 Onboarding i NFR
- Zaproszenia e‑mail (przez przełożonego/Admina); kreator pierwszego dnia (konfiguracja godzin pracy, strefy czasowej, podstawowych preferencji).
- Minimalne PII (imię, e‑mail); hosting w UE; dzienny backup; obsługa stref czasowych.
- Polityka retencji (parametry do doprecyzowania); audit trail zmian przełożonego (lista „aktualizacje od przełożonego”).

3.10 Dostępność i UX
- Responsywne widoki dzień/tydzień; czytelne kolory priorytetu/grupy; dostępna na klawiaturę obsługa drag&drop alternatywą (np. przyciski przenieś w górę/dół/zmień godzinę).

## 4. Granice produktu

W zakresie MVP:
- Web/desktop (przeglądarka), planowanie 24/7, sloty 15 min, ręczne logowanie czasu, podstawowe raporty z eksportem CSV, podstawowa analityka.

Poza zakresem MVP:
- Integracje z zewnętrznymi systemami (Outlook, Google Calendar, Slack, Teams).
- Rozbudowany system powiadomień i przypomnień.
- Funkcje oceny efektywności/KPI, dashboardy zespołowe.
- Historia wersji zadań i śledzenie zmian poza audytem działań przełożonego.
- Automatyczne planowanie dnia (algorytmiczne).
- Aplikacje mobilne natywne; wielojęzyczność.
- Zaawansowane uprawnienia poza rolami Pracownik/Przełożony oraz Admin techniczny.

Założenia i ograniczenia:
- Jedno-członkostwo w dziale w danym czasie (datowane); pełna widoczność w obrębie działu.
- Zadania Prywatne widoczne dla właściciela i przełożonego; uwzględniane w raportach menedżerskich.
- Tylko przełożony planuje dzień innych; współpracownik może przypisać zadanie innemu bez akceptacji.

## 5. Historyjki użytkowników

US-001
Tytuł: Rejestracja przez zaproszenie e‑mail
Opis: Jako pracownik chcę aktywować konto z zaproszenia e‑mail, aby uzyskać dostęp do aplikacji.
Kryteria akceptacji:
- Otrzymuję e‑mail z bezpiecznym linkiem ważnym czasowo.
- Po ustawieniu hasła i potwierdzeniu widzę kreator pierwszego dnia.
- Link jednorazowy; po użyciu traci ważność.

US-002
Tytuł: Logowanie
Opis: Jako użytkownik chcę zalogować się e‑mailem i hasłem, aby korzystać z aplikacji.
Kryteria akceptacji:
- Poprawne dane logują; błędne wyświetlają komunikat bez ujawniania, czy e‑mail istnieje.
- Po zalogowaniu widzę swój widok planu dnia.
- Sesja wygasa po okresie bezczynności (konfigurowalne, np. 12 h).

US-003
Tytuł: Reset hasła
Opis: Jako użytkownik chcę zresetować hasło e‑mailowo, aby odzyskać dostęp.
Kryteria akceptacji:
- Mogę poprosić o link resetu; link jest czasowy i jednorazowy.
- Po ustawieniu nowego hasła mogę się zalogować.

US-004
Tytuł: Wylogowanie
Opis: Jako użytkownik chcę się wylogować, aby zakończyć sesję.
Kryteria akceptacji:
- Wylogowanie unieważnia sesję i przekierowuje do ekranu logowania.

US-005
Tytuł: Autoryzacja ról
Opis: Jako system chcę ograniczyć funkcje wg ról, aby chronić dane.
Kryteria akceptacji:
- Pracownik nie może planować dnia innych.
- Przełożony ma dostęp do planów działu i nadanego podglądu międzydziałowego.
- Próby dostępu poza rolą są odrzucane (403) i logowane.

US-006
Tytuł: Tworzenie działu
Opis: Jako przełożony chcę utworzyć dział, aby grupować użytkowników.
Kryteria akceptacji:
- Mogę dodać nazwę działu; unikalność nazwy w organizacji.
- Dział pojawia się na liście i jest dostępny do przypisań.

US-007
Tytuł: Członkostwo w dziale z datami
Opis: Jako przełożony chcę przypisać pracownika do działu z datami od–do.
Kryteria akceptacji:
- Mogę ustawić datę startu i (opcjonalnie) końca.
- System uniemożliwia jednoczesne członkostwo w dwóch działach.
- Zmiany są widoczne w historii członkostwa i raportach.

US-008
Tytuł: Podgląd międzydziałowy
Opis: Jako Admin chcę nadać przełożonemu podgląd planów wybranych działów.
Kryteria akceptacji:
- Mogę dodać/odjąć uprawnienie dla konkretnego działu.
- Przełożony widzi dodatkowe działy w podglądzie; brak możliwości edycji, jeśli nie jest przełożonym danego działu.

US-009
Tytuł: Dezaktywacja konta
Opis: Jako Admin chcę dezaktywować konto, aby odebrać dostęp.
Kryteria akceptacji:
- Użytkownik nie może się zalogować po dezaktywacji.
- Dane pozostają w raportach historycznych.

US-010
Tytuł: Zapraszanie użytkowników
Opis: Jako przełożony chcę zaprosić pracownika e‑mailowo.
Kryteria akceptacji:
- Wysyłam zaproszenie; status oczekujące widoczny na liście.
- Przypisuję dział w zaproszeniu lub później.

US-011
Tytuł: Tworzenie i edycja zadań
Opis: Jako przełożony chcę tworzyć/edytować/usuwać zadania dla pracowników.
Kryteria akceptacji:
- Wymagam nazwy, priorytetu i estymacji.
- Mogę przypisać do użytkownika lub działu.
- Edycje są widoczne dla wykonawcy; działania przełożonego trafiają do audytu.

US-012
Tytuł: Planowanie dnia pracownika
Opis: Jako przełożony chcę dodać sloty zadań w planie pracownika.
Kryteria akceptacji:
- Mogę dodać/zmienić/usunąć sloty 15‑min w widoku dzień/tydzień.
- System sygnalizuje konflikty; mogę je świadomie dopuścić.

US-013
Tytuł: Dopuszczenie overlapa
Opis: Jako przełożony chcę nadpisać konflikt w planie pracownika.
Kryteria akceptacji:
- Przy konflikcie widzę ostrzeżenie i wybór „Dopuść overlap”.
- Po dopuszczeniu sloty oznaczone są wizualnie jako konflikt.

US-014
Tytuł: Szybki podgląd planu pracownika
Opis: Jako przełożony chcę zobaczyć plan dowolnego pracownika w <5 min.
Kryteria akceptacji:
- Lista pracowników z wyszukiwaniem/filtrami.
- Po wyborze pracownika plan renderuje się w jednym widoku.
- Zdarzenie manager_view_time rejestruje czas otwarcia.

US-015
Tytuł: Flagi przekroczeń estymacji
Opis: Jako przełożony chcę widzieć logi >150% estymacji.
Kryteria akceptacji:
- Lista zadań przekroczonych z filtrem po użytkowniku i dacie.
- Każdy wpis pokazuje estymację, zarejestrowany czas i różnicę.

US-016
Tytuł: Raport menedżerski dzienny/miesięczny
Opis: Jako przełożony chcę generować raporty czasu pracy.
Kryteria akceptacji:
- Kolumny: data, zadanie, dział, wykonawca, łączny czas, status przy zamknięciu.
- Filtry: dział, użytkownik, priorytet, status, przedział dat.
- Eksport CSV dostępny.

US-017
Tytuł: Audit trail działań przełożonego
Opis: Jako system chcę rejestrować zmiany wprowadzane przez przełożonego.
Kryteria akceptacji:
- Lista „aktualizacje od przełożonego” z czasem, autorem, zakresem zmiany.
- Zapisy nieusuwalne; dostępne dla Admina i przełożonych.

US-018
Tytuł: Konfiguracja godzin pracy
Opis: Jako pracownik chcę ustawić swoje godziny pracy w onboardingzie.
Kryteria akceptacji:
- Mogę ustawić dni i zakres godzin; strefę czasową.
- plan_filled_% liczy się względem tych godzin.

US-019
Tytuł: Tworzenie własnego zadania
Opis: Jako pracownik chcę tworzyć zadania dla siebie.
Kryteria akceptacji:
- Wymagam nazwy, priorytetu, estymacji.
- Mogę dodać opcjonalną datę docelową i znacznik Prywatne.

US-020
Tytuł: Przypisanie przez współpracownika
Opis: Jako pracownik chcę przypisać zadanie współpracownikowi w moim dziale.
Kryteria akceptacji:
- Mogę przypisać bez akceptacji; przypisanie widoczne u odbiorcy.
- System zapisuje i wyświetla, kto przypisał zadanie.

US-021
Tytuł: Widoczność autora przypisania
Opis: Jako użytkownik chcę widzieć, kto przypisał zadanie.
Kryteria akceptacji:
- Pole „Przypisane przez” widoczne w szczegółach zadania i listach.

US-022
Tytuł: Zadanie Prywatne
Opis: Jako pracownik chcę oznaczyć zadanie jako Prywatne.
Kryteria akceptacji:
- Zadanie Prywatne widoczne tylko dla mnie i przełożonego.
- Zadanie uwzględnia się w raportach menedżerskich bez ujawniania szczegółów opisu (tytuł widoczny, opis ukryty lub zanonimizowany zgodnie z polityką).

US-023
Tytuł: Planowanie swojego dnia (drag&drop)
Opis: Jako pracownik chcę planować zadania w kalendarzu dziennym/tygodniowym.
Kryteria akceptacji:
- Mogę przeciągać zadania na oś czasu w slotach 15 min.
- System blokuje overlapy domyślnie i oznacza konflikty.

US-024
Tytuł: Świadome dopuszczenie overlapa przez użytkownika
Opis: Jako pracownik chcę móc świadomie zostawić konflikt w swoim planie.
Kryteria akceptacji:
- Mogę zapisać plan z overlapem po potwierdzeniu.
- Sloty w konflikcie są oznaczone wizualnie.

US-025
Tytuł: Kolorowanie zadań
Opis: Jako użytkownik chcę widzieć kolory wg priorytetu lub działu.
Kryteria akceptacji:
- Kolory są spójne w całej aplikacji i dostępne w legendzie.

US-026
Tytuł: Filtrowanie zadań
Opis: Jako użytkownik chcę filtrować zadania po dziale i priorytecie.
Kryteria akceptacji:
- Filtrowanie działa w listach zadań i w raportach.

US-027
Tytuł: Ręczne logowanie czasu
Opis: Jako pracownik chcę ręcznie logować czas pracy do zadań.
Kryteria akceptacji:
- Wpisy zaokrąglane do 15 min wg reguły .5 w górę.
- Wpis wymaga powiązania z zadaniem i datą.

US-028
Tytuł: Edycja logów do 7 dni
Opis: Jako pracownik chcę edytować logi czasu do 7 dni wstecz.
Kryteria akceptacji:
- Nie mogę edytować wpisów starszych niż 7 dni.
- Edycje aktualizują raporty.

US-029
Tytuł: Zamknięcie zadania
Opis: Jako pracownik chcę oznaczyć zadanie jako Done.
Kryteria akceptacji:
- Zmiana statusu na Done zamyka zadanie i ustawia ETA = czas zamknięcia.
- Zadanie pojawia się w raportach ze statusem przy zamknięciu.

US-030
Tytuł: ETA przy 100% planu
Opis: Jako użytkownik chcę widzieć przewidywany koniec zadania.
Kryteria akceptacji:
- Gdy zaplanowano 100% estymacji, ETA = koniec ostatniego slotu.
- Przy niedoplanowaniu ETA nie jest pokazywana.

US-031
Tytuł: Raport osobisty
Opis: Jako pracownik chcę zobaczyć mój raport dzienny/miesięczny.
Kryteria akceptacji:
- Widzę łączny czas per zadanie i per dzień/miesiąc.
- Mogę eksportować do CSV.

US-032
Tytuł: Eksport CSV
Opis: Jako użytkownik chcę eksportować raport do CSV.
Kryteria akceptacji:
- Plik CSV zawiera widoczne kolumny i odzwierciedla filtry.

US-033
Tytuł: Zadanie przypisane do działu
Opis: Jako przełożony chcę przypisać zadanie do działu.
Kryteria akceptacji:
- Zadanie widoczne dla członków działu do wzięcia/planowania.
- Raporty przypisują czas do działu.

US-034
Tytuł: Strefy czasowe i DST
Opis: Jako użytkownik chcę poprawnego działania planu w mojej strefie czasowej.
Kryteria akceptacji:
- Sloty i raporty uwzględniają strefę czasową użytkownika.
- Zmiany czasu (DST) nie dublują ani nie gubią slotów.

US-035
Tytuł: plan_filled_%
Opis: Jako system chcę liczyć plan_filled_% względem godzin pracy bez overlapa.
Kryteria akceptacji:
- Metryka ignoruje nakładające się sloty.
- Prawidłowo działa dla różnych konfiguracji godzin pracy.

US-036
Tytuł: daily_active_update
Opis: Jako system chcę emitować zdarzenie aktywności dziennej.
Kryteria akceptacji:
- Pierwszy log czasu lub edycja planu danego dnia emituje zdarzenie.
- Kolejne czynności tego dnia nie duplikują zdarzenia.

US-037
Tytuł: manager_view_time
Opis: Jako system chcę mierzyć czas do podglądu planu pracownika.
Kryteria akceptacji:
- Zdarzenie mierzy czas od wejścia do modułu do renderu planu.
- Prezentujemy agregaty w analityce (średnia, percentyle).

US-038
Tytuł: Data docelowa zadania
Opis: Jako użytkownik chcę ustawić opcjonalną datę docelową zadania.
Kryteria akceptacji:
- Pole nieobowiązkowe; widoczne w listach i filtrach.

US-039
Tytuł: Reasignacja zadania
Opis: Jako przełożony chcę zmienić przypisanego wykonawcę.
Kryteria akceptacji:
- Zmiana zachowuje historię autora przypisania; aktualny wykonawca widoczny.

US-040
Tytuł: Widoczność w obrębie działu
Opis: Jako członek działu chcę widzieć plany współpracowników mojego działu.
Kryteria akceptacji:
- Mam pełny podgląd planów działu, zgodnie z rolą.

US-041
Tytuł: Edge – użytkownik bez działu
Opis: Jako system chcę obsłużyć użytkownika bez przypisanego działu.
Kryteria akceptacji:
- Użytkownik może skonfigurować godziny pracy i planować własne zadania.
- Nie widzi planów innych do czasu przypisania do działu.

US-042
Tytuł: Dostępność bez myszy
Opis: Jako użytkownik chcę planować bez myszy.
Kryteria akceptacji:
- Mogę dodawać/przenosić sloty klawiaturą (alternatywy dla drag&drop).

US-043
Tytuł: Bezpieczeństwo sesji
Opis: Jako użytkownik chcę, aby moja sesja była bezpieczna.
Kryteria akceptacji:
- Sesja HTTP‑only, zabezpieczona; po wylogowaniu token nieważny.
- Ochrona przed powszechnymi atakami (CSRF, XSS, brute force – ograniczenia prób).

US-044 Kolekcje reguł
- Tytuł: Kolekcje reguł
- Opis: Jako użytkownik chcę móc zapisywać i edytować zestawy reguł, aby szybko wykorzystywać sprawdzone rozwiązania w różnych projektach.
- Kryteria akceptacji:
  - Użytkownik może zapisać aktualny zestaw reguł (US-001) jako kolekcję (nazwa, opis, reguły).
  - Użytkownik może aktualizować kolekcję.
  - Użytkownik może usunąć kolekcję.
  - Użytkownik może przywrócić kolekcję do poprzedniej wersji (pending changes).
  - Funkcjonalność kolekcji nie jest dostępna bez logowania się do systemu (US-004).

US-045 Bezpieczny dostęp i uwierzytelnianie

- Tytuł: Bezpieczny dostęp
- Opis: Jako użytkownik chcę mieć możliwość rejestracji i logowania się do systemu w sposób zapewniający bezpieczeństwo moich danych.
- Kryteria akceptacji:
  - Logowanie i rejestracja odbywają się na dedykowanych stronach.
  - Logowanie wymaga podania adresu email i hasła.
  - Rejestracja wymaga podania adresu email, hasła i potwierdzenia hasła.
  - Użytkownik MOŻE korzystać z tworzenia reguł "ad-hoc" bez logowania się do systemu (US-001).
  - Użytkownik NIE MOŻE korzystać z funkcji Kolekcji bez logowania się do systemu (US-003).
  - Użytkownik może logować się do systemu poprzez przycisk w prawym górnym rogu.
  - Użytkownik może się wylogować z systemu poprzez przycisk w prawym górnym rogu w głównym @Layout.astro.
  - Nie korzystamy z zewnętrznych serwisów logowania (np. Google, GitHub).
  - Odzyskiwanie hasła powinno być możliwe.

## 6. Metryki sukcesu

Cele produktu (MVP):
- 90% użytkowników posiada w pełni wypełniony plan dnia w pierwszym tygodniu korzystania.
- Co najmniej 80% pracowników wykonuje daily_active_update przynajmniej raz dziennie.
- Przełożeni uzyskują podgląd planu dowolnego pracownika w mniej niż 5 minut (manager_view_time).
- Średnio ≥30 minut oszczędności dziennie na użytkownika (analiza plan vs. rzeczywisty + ankiety).

Definicje i pomiar:
- plan_filled_%: liczony per użytkownik per dzień względem skonfigurowanych godzin pracy; overlapy nie są liczone podwójnie; raportowany jako średnia i udział dni z wynikiem ≥70% w pierwszym tygodniu.
- daily_active_update: pierwsze zdarzenie dnia; metryka dziennej aktywności (DAU planowania/logowania czasu).
- manager_view_time: mierzony w ms; raportowane średnia i p90.
- Oszczędność czasu: triangulacja danych (różnica plan vs. realny czas na zadaniach, ankiety N tygodni po wdrożeniu, wywiady jakościowe).

Wymagania jakościowe (NFR, skrót):
- Hosting w UE, dzienny backup; minimalne PII; polityka retencji (parametry TBF) z możliwością konfiguracji.
- Dostępność kluczowych funkcji w przeglądarkach wspieranych (ostatnie 2 wersje głównych przeglądarek desktopowych).
- Czas renderu widoku planu pracownika p90 < 2 s przy typowym obciążeniu (wspiera cel manager_view_time).



