# Design System SSOT — Domus CRM & Operasional

Dokumen ini adalah **Single Source of Truth (SSOT)** untuk desain antarmuka (UI) dan pengalaman pengguna (UX) aplikasi **Domus CRM & Operasional**. Semua pengembangan komponen dan halaman baru **wajib** mengikuti aturan ketat (*strict rules*) yang tertuang dalam dokumen ini.

---

## 1. Tech Stack & Ecosystem

| Kategori | Teknologi / Library | Versi | Catatan Integrasi |
| :--- | :--- | :--- | :--- |
| **Core Framework** | [Next.js](https://nextjs.org/) (App Router) | `16.2.7` | Client & Server Components di `src/app/` |
| **UI Library** | [React](https://react.dev/) / React DOM | `19.2.4` | Strictly typed dengan React 19 hooks |
| **Styling Library** | [Tailwind CSS v4](https://tailwindcss.com/) | `^4.0.0` | `@import "tailwindcss";` & `@tailwindcss/postcss` |
| **UI Component Engine** | [@HeroUI React](https://heroui.com/) | `^3.1.0` | Import theme via `@source "../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}";` |
| **Animation Engine** | [Framer Motion](https://www.framer.com/motion/) | `^12.40.0` | Digunakan untuk micro-animations, drawer, & transisi modal |
| **Icons** | [Lucide React](https://lucide.dev/) | `^1.17.0` | Pustaka ikon SVG konsisten |
| **GIS & Pemetaan** | [Leaflet.js](https://leafletjs.com/) | `1.9.4` | Peta interaktif geofence & SVG kavling |
| **Tipografi Utama** | Google Sans | Font CDN | Import via Google Fonts CDN di `globals.css` |

---

## 2. Design Tokens (Strict Rules)

Dilarang keras menggunakan nilai warna, spacing, radius, atau ukuran font arbitrer (misal: `text-[13.5px]`, `bg-[#123456]`, `p-[17px]`). Semua komponen harus tunduk pada token standar berikut:

### 2.1 Color Palette Tokens

#### Light Mode (Default)
- **App Background**: `--background` = `#f8f9fc` (`bg-[#f8f9fc]`)
- **Primary Text**: `--foreground` = `#0f172a` (Slate 900)
- **Surface / Card**: `#ffffff` (`bg-white`)
- **Border Default**: `rgba(226, 232, 240, 0.8)` (`border-slate-200/80`)
- **Muted Text**: `#64748b` (Slate 500) / `#94a3b8` (Slate 400)

#### Dark Mode (`html.dark`)
- **App Background**: `#090d16` (Obsidian Slate)
- **Primary Text**: `#f8fafc` (Slate 50)
- **Surface / Card**: `#0f172a` (Slate 900)
- **Secondary Surface**: `#1e293b` (Slate 800)
- **Border Default**: `#334155` (Slate 700)
- **Muted Text**: `#94a3b8` (Slate 400)

#### Brand & Accent Colors
- **Purple Brand**: `--purple-brand` = `#7c3aed` (`bg-[#7c3aed]`, `text-[#7c3aed]`)
- **Purple Brand Hover**: `--purple-brand-hover` = `#6d28d9`
- **Primary Indigo Accent**: `#4f46e5` / `#2563eb`
- **Brand Glow Shadow**: `rgba(124, 58, 237, 0.15)`

#### Semantic Status Tokens
| Status | Background Token | Text Token | Border Token | Pengunaan |
| :--- | :--- | :--- | :--- | :--- |
| **Success / Available** | `bg-green-100 dark:bg-green-950/40` | `text-green-700 dark:text-green-400` | `border-green-200 dark:border-green-800` | Unit tersedia, Doc approved, Attendance valid |
| **Warning / Process** | `bg-amber-100 dark:bg-amber-950/40` | `text-amber-700 dark:text-amber-400` | `border-amber-200 dark:border-amber-800` | KPR process, Follow-up pending, Leave pending |
| **Info / Booking** | `bg-blue-100 dark:bg-blue-950/40` | `text-blue-700 dark:text-blue-400` | `border-blue-200 dark:border-blue-800` | Booking unit, System info, Onsite status |
| **Danger / Sold / Rejected** | `bg-red-100 dark:bg-red-950/40` | `text-red-700 dark:text-red-400` | `border-red-200 dark:border-red-800` | Unit terjual, Doc rejected, Late attendance |
| **Special / VIP** | `bg-purple-100 dark:bg-purple-950/40` | `text-purple-700 dark:text-purple-400` | `border-purple-200 dark:border-purple-800` | Hot prospect, Executive summary |

---

### 2.2 Typography Tokens

- **Font Family**:
  - Body: `var(--font-sans)` (`'Google Sans', system-ui, sans-serif`)
  - Heading: `var(--font-heading)` (`'Google Sans', sans-serif`)
- **Base Body Settings**: `font-size: 13px; line-height: 1.5; -webkit-font-smoothing: antialiased;`
- **Heading Hierarchy**:
  - `h1`: `text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50` (`letter-spacing: -0.025em`)
  - `h2`: `text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50`
  - `h3`: `text-lg font-semibold text-slate-900 dark:text-slate-100`
  - `h4`: `text-base font-medium text-slate-800 dark:text-slate-200`
- **Special SaaS Classes**:
  - `.text-subtle`: `font-size: 11px; font-weight: 500; letter-spacing: 0.03em; text-transform: uppercase; color: #9ca3af;`
  - `.badge-pill`: `font-size: 11px; font-weight: 500; letter-spacing: 0.01em; padding: 2px 8px; border-radius: 6px;`
  - `.table-compact th`: `font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; padding: 10px 14px;`
  - `.table-compact td`: `font-size: 13px; color: #374151; padding: 10px 14px;`

---

### 2.3 Border Radius Tokens

- **Small (`rounded-md`)**: `6px` (Badge, Chip, Small Button)
- **Medium (`rounded-lg`)**: `8px` (Standard Button, Form Input, Dropdown Item)
- **Large (`rounded-xl`)**: `12px` (Modal Box, Action Drawer, Inner Card Container)
- **Extra Large (`rounded-2xl`)**: `16px` (Main SaaS Card `.salesx-card`, Hero Card, Panel)
- **Pill (`rounded-full`)**: `9999px` (Avatar, Status Dot, Toggle Switch)

---

### 2.4 Elevation & Surface Effects

- **Standard Card (`.salesx-card`)**:
  - Light: `bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]`
  - Hover: `border-slate-300/90 shadow-[0_4px_12px_-2px_rgba(124,58,237,0.05)]`
- **Interactive Card (`.premium-card`)**:
  - Normal: `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid rgba(229, 231, 235, 0.7);`
  - Hover: `transform: translateY(-1px); box-shadow: 0 8px 16px -6px rgba(15, 23, 42, 0.06);`
- **Glassmorphism (`.glass-panel`)**:
  - Light: `background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(229, 231, 235, 0.8);`
  - Dark: `background: rgba(17, 24, 39, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08);`

---

## 3. UI/UX Principles

### 3.1 Reusability & Component Structure
- **Global Layout Wrapper**: Semua halaman utama wajib dibungkus oleh komponen [`AppShell.tsx`](file:///home/nygma/domus-somnia/perumahan-app-2/src/components/AppShell.tsx) yang mengelola sidebar, header, role switcher, dan notifikasi.
- **State Management Modals**: Modals interaktif CRUD yang repetitif harus dikelola secara terpusat via [`CrudModalContext.tsx`](file:///home/nygma/domus-somnia/perumahan-app-2/src/context/CrudModalContext.tsx) daripada membuat state modal terisolasi di setiap file page.
- **Standarisasi Komponen Modal**:
  - [`EditProfileModal.tsx`](file:///home/nygma/domus-somnia/perumahan-app-2/src/components/EditProfileModal.tsx) untuk profil.
  - [`GlobalSearchModal.tsx`](file:///home/nygma/domus-somnia/perumahan-app-2/src/components/GlobalSearchModal.tsx) untuk quick search (`Ctrl+K`).
  - [`MapPicker.tsx`](file:///home/nygma/domus-somnia/perumahan-app-2/src/components/MapPicker.tsx) untuk penentuan koordinat GPS.
  - [`PrintDocumentModal.tsx`](file:///home/nygma/domus-somnia/perumahan-app-2/src/components/PrintDocumentModal.tsx) untuk pratinjau & cetak PDF A4.

### 3.2 Mobile-First Responsiveness
- **Breakpoint Standards**:
  - `xs`: `< 640px` (Mobile Screen - Single column layout, full-screen drawer, bottom action bar).
  - `sm`: `640px` (Small Tablet - 2 column metric grid).
  - `md`: `768px` (Tablet - Collapsible sidebar navigation).
  - `lg`: `1024px` (Desktop - Full sidebar, multi-column dashboard).
  - `xl`: `1280px` (Large Desktop - Split view map + detail panel).
- **Mobile Interaction**: Tombol aksi di layar seluler harus memiliki *touch target* minimal $44 \times 44\text{px}$.

### 3.3 State Handling Guidelines
- **Hover State**: Semua elemen interaktif (`button`, `card`, `table row`) wajib memiliki visual feedback transisi halus (`transition-all duration-200`).
- **Focus State**: Penggunaan ring fokus wajib tampak jelas:
  `focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600`
- **Disabled State**: Elemen non-aktif wajib secara konsisten menggunakan:
  `disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none`
- **Loading State**:
  - Untuk aksi tombol: Gunakan Spinner bawaan HeroUI dan disable pointer.
  - Untuk konten halaman: Gunakan skeleton pulse (`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg`).

---

## 4. Layout & Spacing

### 4.1 Spacing Scale & Container Rules

```
Outer Page Container:
  max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6

Card Internal Padding:
  Compact Card : p-3 sm:p-4
  Standard Card: p-5 sm:p-6
  Header Section: pb-4 border-b border-slate-100 dark:border-slate-800

Grid Spacing:
  Dashboard Metrics Grid : grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6
  Form Columns Grid      : grid grid-cols-1 md:grid-cols-2 gap-4
  Actions & Badges Row   : flex items-center gap-2 sm:gap-3
```

### 4.2 Print Layout Engine (A4 PDF Standard)

Aplikasi memiliki aturan ketat cetak PDF tanpa menggunakan library eksternal:
- **Kertas Target**: A4 Standar ($210\text{mm} \times 297\text{mm}$).
- **Margin Fisik**: $15\text{mm}$ di semua sisi.
- **Implementasi CSS (`globals.css`)**:
  - Container cetak wajib dibungkus dengan class `.print-container`.
  - Semua elemen lain otomatis disembunyikan menggunakan `visibility: hidden` pada `@media print`.

---

## 5. Accessibility (a11y)

1. **Keyboard Accessibility**:
   - Semua modal harus dapat ditutup dengan menekan tombol `Esc`.
   - Modul pencarian global wajib dibuka dengan shortcut keyboard `Ctrl + K` (atau `Cmd + K` pada macOS).
2. **Form Input Labeling**:
   - Setiap elemen `<input>`, `<select>`, dan `<textarea>` **wajib** memiliki `<label>` terikat melalui `htmlFor` atau menyertakan atribut `aria-label`.
3. **Contrast Ratio**:
   - Teks utama harus memenuhi standar WCAG AA dengan rasio kontras minimal 4.5:1 terhadap background.
4. **Semantic Elements**:
   - Hindari penggunaan `<div onClick=...>` untuk tombol interaktif. Gunakan elemen `<button type="button">` atau `<a href="...">` untuk navigasi.
   - Sertakan atribut `aria-expanded` untuk dropdown/collapsible menu dan `aria-current="page"` untuk item navigasi aktif.
