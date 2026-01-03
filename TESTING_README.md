# 🧪 Quick Start: Testing GET /api/tasks

**Backend API jest gotowy!** Wykonaj 3 proste kroki aby przetestować:

---

## ⚡ Szybki Start (10 minut)

### Krok 1: Utwórz użytkowników testowych
1. Otwórz **Supabase Studio**: http://127.0.0.1:54323
2. Przejdź do **Authentication → Users**
3. Kliknij **Add User** (6 razy):

| Email | Password | App Metadata |
|-------|----------|--------------|
| `admin@test.com` | `test123test` | `{"app_role":"admin"}` |
| `manager1@test.com` | `test123test` | `{"app_role":"manager"}` |
| `employee1@test.com` | `test123test` | `{"app_role":"employee"}` |

> **Tip**: Zaznacz **Auto Confirm User** dla każdego!

---

### Krok 2: Zaaplikuj dane testowe
1. W **Supabase Studio** przejdź do **SQL Editor**
2. Kliknij **New Query**
3. Skopiuj całą zawartość z: `supabase/seed.sql`
4. Wklej i kliknij **Run**

✅ Powinieneś zobaczyć: "Success. No rows returned"

---

### Krok 3: Uruchom testy
```powershell
# Uruchom PowerShell test script
.\test-examples.ps1
```

**Lub** otwórz `test-api.http` w VS Code (REST Client extension)

---

## 📚 Szczegółowa dokumentacja

- **Manual Setup**: `.ai/manual-setup-guide.md`
- **Test Guide**: `.ai/api-test-guide.md`
- **Final Summary**: `.ai/FINAL_SUMMARY.md`

---

## 🎯 Czego oczekiwać

### Test 1: ✅ Już działa
```bash
GET http://localhost:3000/api/tasks
# → 401 Unauthorized (expected)
```

### Test 2-10: Po wykonaniu kroków 1-2
```bash
GET http://localhost:3000/api/tasks
Authorization: Bearer <YOUR_TOKEN>
# → 200 OK with task list
```

---

## 🆘 Problemy?

### "User not found"
→ Upewnij się że zaaplikowałeś `supabase/seed.sql`

### "Invalid token"
→ Token musi być z zalogowanego użytkownika (nie anon key)

### "No tasks returned"
→ Sprawdź RLS policies i seed data w Table Editor

---

## ✅ Checklist

- [ ] Utworzone 3+ użytkow testowych w Auth
- [ ] Zaaplikowane dane z `supabase/seed.sql`
- [ ] Uzyskane JWT tokens (przez login)
- [ ] Uruchomione testy (`test-examples.ps1`)
- [ ] Wszystkie testy przechodzą ✅

---

**Gotowe!** 🎉 Backend API w pełni przetestowany i gotowy do użycia!

