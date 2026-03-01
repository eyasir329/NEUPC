# Design System

Tailwind CSS v4 with a custom theme — colors, typography, animations, shadows, and global CSS utilities.

---

## Color Tokens

Defined in `tailwind.config.mjs` and exposed as CSS variables in `app/_styles/global.css`.

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#088395` | Brand teal — buttons, links, active states |
| `primary-dark` | `#065f6b` | Hover and emphasis on primary elements |
| `primary-light` | `#0aa3b7` | Light accent, borders, rings |
| `secondary` | `#7AB2B2` | Muted teal — secondary UI elements |
| `bg-light` | `#EBF4F6` | Page background (light mode) |
| `bg-dark` | `#05161A` | Page background (dark mode) |

### Usage in Tailwind classes

```html
<button class="bg-primary text-white hover:bg-primary-dark">
  Save
</button>

<div class="bg-bg-light dark:bg-bg-dark">…</div>
```

### CSS variables

```css
/* app/_styles/global.css */
:root {
  --color-primary:       #088395;
  --color-primary-dark:  #065f6b;
  --color-primary-light: #0aa3b7;
  --color-secondary:     #7AB2B2;
  --color-bg-light:      #EBF4F6;
  --color-bg-dark:       #05161A;
}
```

---

## Typography

Three `next/font/google` fonts, `fontDisplay: 'swap'` on all.

| Font | CSS Variable | Used for |
|---|---|---|
| **Inter** | `--font-inter` | Body text, UI labels, navigation, tables |
| **Space Grotesk** | `--font-space-grotesk` | Headings, hero copy, display text |
| **JetBrains Mono** | `--font-jetbrains-mono` | Code blocks, inline code, monospace |

Fonts are applied via `className` on the `<html>` element in `app/layout.js` and consumed as CSS variables in Tailwind:

```js
// tailwind.config.mjs
fontFamily: {
  sans:  ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
  display: ['var(--font-space-grotesk)', ...],
  mono:  ['var(--font-jetbrains-mono)', ...],
}
```

---

## Animations

Eight custom keyframe animations defined in `tailwind.config.mjs`, each available as a `animate-*` utility:

| Class | Effect | Use |
|---|---|---|
| `animate-fade-in` | opacity 0 → 1 | Page section reveals |
| `animate-zoom-in` | scale 0.95 → 1 + fade | Modal / card entrances |
| `animate-slide-up` | translateY 20px → 0 + fade | Content panels |
| `animate-slide-down` | translateY -20px → 0 + fade | Dropdowns, alerts |
| `animate-slide-left` | translateX 20px → 0 + fade | Sidebar drawers |
| `animate-slide-right` | translateX -20px → 0 + fade | Pull-out panels |
| `animate-scale-in` | scale 0.9 → 1 + fade | Toast notifications |
| `animate-float` | subtle Y oscillation | Hero illustrations |

---

## Shadows

| Class | Value | Use |
|---|---|---|
| `shadow-glow` | `0 0 15px rgba(8, 131, 149, 0.3)` | Focus rings, active cards |
| `shadow-soft` | `0 2px 15px rgba(0, 0, 0, 0.08)` | Card elevation |

---

## Global CSS Utilities (`app/_styles/global.css`)

### Component classes

```css
.btn-primary {
  @apply bg-primary text-white px-4 py-2 rounded-lg
         hover:bg-primary-dark transition-colors duration-200
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply border border-primary text-primary px-4 py-2 rounded-lg
         hover:bg-primary hover:text-white transition-colors duration-200;
}
```

### Spinner

```html
<div class="spinner" />                <!-- default size -->
<div class="spinner spinner-sm" />     <!-- small -->
<div class="spinner spinner-lg" />     <!-- large -->
```

### Scrollbar

Custom thin scrollbar applied globally on webkit browsers:

```css
::-webkit-scrollbar       { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-primary); border-radius: 4px; }
```

### Prose overrides

`.prose` (from `@tailwindcss/typography`) is extended to use brand teal links and JetBrains Mono for code blocks.

---

## Tailwind v4 Notes

This project uses **Tailwind CSS v4** with `@tailwindcss/postcss` (not the standard v3 CLI).

Key differences from v3:

- Config in `tailwind.config.mjs` (ESM)
- PostCSS plugin: `@tailwindcss/postcss` (not `tailwindcss`)
- CSS import: `@import 'tailwindcss'` instead of `@tailwind base/components/utilities`

Lint warnings: Tailwind v4 reports unknown utility classes via ESLint. If you add new custom classes, ensure they are defined in `global.css` with `@layer utilities` or as theme extensions in `tailwind.config.mjs`.

---

## Adding New Tokens

1. Add to `tailwind.config.mjs` under `theme.extend.colors` (or other category)
2. Add the corresponding CSS variable to `:root` in `global.css`
3. Use as `text-<token>`, `bg-<token>`, `border-<token>` in Tailwind classes
