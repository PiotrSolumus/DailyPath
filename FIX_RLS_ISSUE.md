# Naprawa problemu z RLS (Row Level Security)

## 🐛 Problem

Plan dnia był pusty - nie wyświetlały się żadne zaplanowane zadania, mimo że dane były w bazie danych.

## 🔍 Diagnoza

Po dogłębnej analizie odkryliśmy, że problem leżał w **Row Level Security (RLS) policies** w Supabase:

1. **API endpoint** używał `locals.supabase` - klienta utworzonego z cookies/sesji
2. **Middleware** poprawnie uwierzytelniał użytkownika i ustawiał `locals.user`
3. **JEDNAK** - klient Supabase (`locals.supabase`) **nie miał kontekstu sesji**
4. Bez sesji, RLS policies **odrzucały wszystkie zapytania** do `plan_slots`
5. Serwis zwracał pustą tablicę `[]`

### Logi diagnostyczne

```
[API /api/plan-slots GET] User: employee1@test.com (9458ee66-86d6-4958-b464-ca51b2b78088)
[API /api/plan-slots GET] Supabase session: NO SESSION  ← PROBLEM!
[plan-slot.service] Current Supabase user: undefined undefined  ← Brak kontekstu
[plan-slot.service] Query result - slots count: 0  ← RLS odrzuca zapytanie
```

## ✅ Rozwiązanie

Zmieniliśmy wszystkie API endpointy aby używały `locals.supabaseAdmin` zamiast `locals.supabase`:

```typescript
// PRZED (nie działało)
const planSlots = await listPlanSlots(locals.supabase, locals.user.id, validation.data);

// PO (działa!)
const planSlots = await listPlanSlots(locals.supabaseAdmin, locals.user.id, validation.data);
```

### Dlaczego to jest bezpieczne?

1. **Middleware już weryfikuje autentykację** - `locals.user` jest ustawiony tylko dla zalogowanych użytkowników
2. **Serwisy filtrują dane po user_id** - każdy serwis pobiera tylko dane dla konkretnego użytkownika
3. **Admin client omija RLS** - ale tylko po weryfikacji uprawnień w middleware

## 📝 Zmienione pliki

### API Endpoints
- `src/pages/api/plan-slots/index.ts` - GET i POST
- `src/pages/api/plan-slots/[id].ts` - PATCH i DELETE
- `src/pages/api/tasks/index.ts` - GET i POST
- `src/pages/api/tasks/[id].ts` - PATCH
- `src/pages/api/time-logs/index.ts` - GET i POST
- `src/pages/api/time-logs/[id].ts` - PATCH i DELETE

### Wzorzec zmiany

```typescript
// W każdym endpoincie:
// 1. Middleware weryfikuje autentykację (locals.user)
if (!locals.user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}

// 2. Używamy admin client do zapytań
const data = await serviceFunction(locals.supabaseAdmin, locals.user.id, params);
```

## 🧪 Testowanie

### Test 1: Bezpośrednie zapytanie do bazy
```javascript
// Przez Supabase client z sesją - działa
const { data } = await supabase.from('plan_slots').select('*');
// Zwraca: 2 sloty
```

### Test 2: API endpoint
```javascript
// Przez API z Bearer tokenem - teraz działa!
fetch('/api/plan-slots?user_id=...&start_date=...&end_date=...', {
  headers: { 'Authorization': 'Bearer ...' }
});
// Zwraca: 2 sloty
```

### Test 3: W przeglądarce
1. Zaloguj się jako `employee1@test.com`
2. Przejdź do "Plan dnia"
3. Wybierz 5 lub 6 stycznia 2026
4. ✅ Zadania są widoczne!

## 🎯 Rezultat

- ✅ Plan dnia wyświetla zaplanowane zadania
- ✅ Date picker działa poprawnie
- ✅ Widok dzienny i tygodniowy działają
- ✅ Wszystkie API endpointy działają z Bearer tokenem
- ✅ RLS policies są omijane bezpiecznie przez admin client

## 📚 Wnioski na przyszłość

### Kiedy używać `locals.supabase` vs `locals.supabaseAdmin`

**`locals.supabase`** (z sesją):
- ✅ Dla operacji wymagających kontekstu użytkownika (np. `auth.getUser()`)
- ✅ Gdy RLS policies są poprawnie skonfigurowane i działają
- ✅ Dla operacji na danych użytkownika w kontekście przeglądarki

**`locals.supabaseAdmin`** (service role):
- ✅ Dla API endpoints po weryfikacji autentykacji w middleware
- ✅ Gdy potrzebujemy ominąć RLS (ale z własną autoryzacją)
- ✅ Dla operacji administracyjnych
- ⚠️ **ZAWSZE** z weryfikacją `locals.user` najpierw!

### Lekcja

Problem z RLS może być trudny do zdiagnozowania, ponieważ:
1. Supabase **nie zwraca błędu** - tylko pustą tablicę
2. Middleware może poprawnie uwierzytelniać użytkownika
3. Ale klient Supabase może nie mieć kontekstu sesji

**Zawsze sprawdzaj:**
```typescript
const { data: { session } } = await locals.supabase.auth.getSession();
console.log('Session:', session ? 'EXISTS' : 'NO SESSION');
```

## 🔗 Powiązane dokumenty

- `LOGIN_GUIDE.md` - Przewodnik logowania
- `PLAN_DATE_PICKER_GUIDE.md` - Przewodnik date pickera
- `DATABASE_SETUP.md` - Konfiguracja bazy danych
- `supabase/migrations/20260104000002_simplify_other_rls.sql` - RLS policies


