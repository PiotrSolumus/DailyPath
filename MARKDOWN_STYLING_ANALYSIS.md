# Analiza stylowania Markdown w projekcie DailyPath

## Obecny stan

### 1. Brak implementacji markdown

**Wnioski:**
- Markdown **nie jest obecnie używany** w aplikacji
- Opisy zadań są przechowywane i wyświetlane jako **zwykły tekst (plain text)**
- Nie ma żadnych bibliotek do renderowania markdown (np. `marked`, `remark`, `react-markdown`)
- Astro ma wbudowaną obsługę markdown (`@astrojs/markdown-remark`), ale nie jest wykorzystywana

### 2. Miejsca, gdzie markdown mógłby być użyty

#### 2.1. Opisy zadań (`task.description`)

**Obecna implementacja:**
```96:96:src/components/tasks/TaskCard.tsx
          <CardDescription className="line-clamp-2">{task.description}</CardDescription>
```

```78:80:src/components/calendar/TaskSlot.tsx
            {task.description && !task.is_private && (
              <p className="line-clamp-2 text-xs opacity-80">{task.description}</p>
            )}
```

**Charakterystyka:**
- Opisy są renderowane jako zwykły tekst w elementach `<p>` i `<CardDescription>`
- Używane są klasy Tailwind: `line-clamp-2`, `text-xs`, `opacity-80`
- Brak parsowania i renderowania składni markdown
- Brak escape'owania HTML (potencjalne ryzyko XSS, jeśli markdown zostałby wprowadzony)

#### 2.2. Formularze edycji/tworzenia zadań

**Obecna implementacja:**
```144:152:src/components/tasks/EditTaskForm.tsx
          <textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            maxLength={5000}
            rows={4}
            placeholder="Szczegółowy opis zadania"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
```

**Charakterystyka:**
- Zwykły `<textarea>` bez obsługi markdown
- Brak podglądu markdown (preview)
- Brak edytora WYSIWYG lub markdown editor
- Stylowanie zgodne z systemem designu (shadcn/ui + Tailwind)

### 3. Stylowanie globalne

**Analiza `src/styles/global.css`:**

```1:134:src/styles/global.css
@import "tailwindcss";

@layer components {
  /* Stripes pattern for overlapping slots */
  .bg-stripes-red {
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(239, 68, 68, 0.1) 10px,
      rgba(239, 68, 68, 0.1) 20px
    );
  }
}
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 10%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Wnioski:**
- **Brak stylów dla markdown** - nie ma klas typu `.prose`, `.markdown`, `.md-content`
- System kolorów oparty na **CSS custom properties** (OKLCH color space)
- Obsługa **dark mode** przez klasę `.dark`
- Użycie **Tailwind 4** z `@layer` directive
- Brak biblioteki typography (np. `@tailwindcss/typography`)

## Kluczowe wnioski

### 1. **Brak infrastruktury markdown**

**Obecny stan:**
- ❌ Brak bibliotek do renderowania markdown
- ❌ Brak stylów typograficznych dla markdown
- ❌ Brak komponentów do wyświetlania markdown
- ❌ Opisy zadań są traktowane jako plain text

**Konsekwencje:**
- Użytkownicy nie mogą używać formatowania markdown w opisach zadań
- Markdown wprowadzony przez użytkownika będzie wyświetlany jako zwykły tekst (np. `**bold**` zamiast **bold**)
- Brak możliwości tworzenia list, linków, nagłówków w opisach

### 2. **Potencjalne ryzyko bezpieczeństwa**

**Problem:**
- Obecnie opisy są renderowane bez escape'owania HTML
- Jeśli markdown zostałby wprowadzony, a następnie renderowany jako HTML bez sanitizacji, istnieje ryzyko XSS

**Przykład:**
```tsx
// Obecna implementacja (ryzykowna, jeśli markdown zostałby dodany)
<CardDescription>{task.description}</CardDescription>

// Potencjalnie niebezpieczne, jeśli description zawiera:
// <script>alert('XSS')</script>
// lub markdown z HTML: <img src=x onerror=alert('XSS')>
```

### 3. **Brak spójności stylistycznej dla markdown**

**Problem:**
- Jeśli markdown zostałby wprowadzony, nie ma zdefiniowanych stylów dla:
  - Nagłówków (`h1`, `h2`, `h3`, etc.)
  - List (`ul`, `ol`, `li`)
  - Linków (`a`)
  - Kodów inline i bloków (`code`, `pre`)
  - Cytatów (`blockquote`)
  - Tabel (`table`, `thead`, `tbody`, `tr`, `td`, `th`)
  - Separatorów (`hr`)

**Obecne style:**
- System używa **shadcn/ui** + **Tailwind 4**
- Kolory zdefiniowane przez CSS variables
- Brak typography plugin dla Tailwind

### 4. **Możliwości implementacji markdown**

#### Opcja A: Tailwind Typography Plugin
```bash
npm install @tailwindcss/typography
```

**Zalety:**
- Gotowe style dla markdown (klasa `.prose`)
- Integracja z Tailwind
- Obsługa dark mode
- Łatwa konfiguracja

**Wady:**
- Dodatkowa zależność
- Może wymagać dostosowania do obecnego systemu kolorów

#### Opcja B: React Markdown
```bash
npm install react-markdown remark-gfm rehype-raw rehype-sanitize
```

**Zalety:**
- Pełna kontrola nad renderowaniem
- Możliwość sanitizacji HTML
- Obsługa GitHub Flavored Markdown (GFM)
- Elastyczność w stylowaniu

**Wady:**
- Wymaga ręcznego stylowania wszystkich elementów
- Więcej kodu do utrzymania

#### Opcja C: Astro Markdown (dla stron dokumentacji)
- Astro ma wbudowaną obsługę markdown dla plików `.md` w `src/pages/`
- Nie jest używane w obecnym projekcie
- Przydatne dla dokumentacji, nie dla treści użytkownika

### 5. **Rekomendacje**

#### Krótkoterminowe (jeśli markdown nie jest priorytetem):
1. ✅ **Zachować obecny stan** - plain text dla opisów zadań
2. ✅ **Dodać sanitizację HTML** - zabezpieczyć przed XSS, nawet jeśli markdown nie jest używany
3. ✅ **Dokumentować** - jasno określić, że opisy są plain text

#### Długoterminowe (jeśli markdown jest potrzebny):
1. 📦 **Zainstalować `react-markdown`** + `remark-gfm` + `rehype-sanitize`
2. 🎨 **Dodać Tailwind Typography** lub stworzyć własne style markdown
3. 🔧 **Utworzyć komponent `MarkdownRenderer`**:
   ```tsx
   // src/components/ui/markdown-renderer.tsx
   import ReactMarkdown from 'react-markdown';
   import remarkGfm from 'remark-gfm';
   import rehypeSanitize from 'rehype-sanitize';
   
   export function MarkdownRenderer({ content }: { content: string }) {
     return (
       <div className="prose prose-sm dark:prose-invert max-w-none">
         <ReactMarkdown
           remarkPlugins={[remarkGfm]}
           rehypePlugins={[rehypeSanitize]}
         >
           {content}
         </ReactMarkdown>
       </div>
     );
   }
   ```
4. 🔄 **Zaktualizować komponenty** - użyć `MarkdownRenderer` zamiast zwykłego tekstu
5. ✏️ **Dodać edytor markdown** - opcjonalnie, dla lepszego UX (np. `react-simplemde-editor`)

### 6. **Style dla markdown (propozycja)**

Jeśli markdown zostałby wprowadzony, poniższe style powinny być zdefiniowane:

```css
/* Przykładowe style dla markdown */
.markdown-content {
  /* Nagłówki */
  h1 { @apply text-3xl font-bold mt-8 mb-4; }
  h2 { @apply text-2xl font-bold mt-6 mb-3; }
  h3 { @apply text-xl font-semibold mt-4 mb-2; }
  
  /* Paragrafy */
  p { @apply mb-4 text-foreground; }
  
  /* Listy */
  ul, ol { @apply mb-4 ml-6; }
  li { @apply mb-2; }
  
  /* Linki */
  a { @apply text-primary underline hover:text-primary/80; }
  
  /* Kod */
  code { @apply bg-muted px-1.5 py-0.5 rounded text-sm font-mono; }
  pre { @apply bg-muted p-4 rounded-lg overflow-x-auto mb-4; }
  pre code { @apply bg-transparent p-0; }
  
  /* Cytaty */
  blockquote { @apply border-l-4 border-primary pl-4 italic my-4; }
  
  /* Tabele */
  table { @apply w-full border-collapse mb-4; }
  th, td { @apply border border-border px-4 py-2; }
  th { @apply bg-muted font-semibold; }
  
  /* Separatory */
  hr { @apply my-8 border-border; }
  
  /* Obrazy */
  img { @apply max-w-full rounded-lg my-4; }
}
```

## Podsumowanie

### Obecny stan:
- ✅ **Prosty i bezpieczny** - plain text bez komplikacji
- ❌ **Ograniczony** - brak formatowania w opisach zadań
- ❌ **Brak stylów markdown** - nie ma infrastruktury do renderowania

### Jeśli markdown zostałby wprowadzony:
- 📦 Wymaga biblioteki do renderowania (`react-markdown`)
- 🎨 Wymaga stylów typograficznych (Tailwind Typography lub własne)
- 🔒 Wymaga sanitizacji HTML (zabezpieczenie przed XSS)
- 🔄 Wymaga aktualizacji komponentów wyświetlających opisy
- ✏️ Opcjonalnie: edytor markdown dla lepszego UX

### Decyzja projektowa:
**Czy markdown jest potrzebny w opisach zadań?**
- Jeśli **TAK** → wdrożyć pełną obsługę markdown (biblioteka + style + sanitizacja)
- Jeśli **NIE** → zachować obecny stan, ale dodać sanitizację HTML dla bezpieczeństwa
