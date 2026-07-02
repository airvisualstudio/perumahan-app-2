# Dokumentasi Tech Stack - Domus CRM & Operasional

Dokumen ini menjelaskan secara rinci arsitektur perangkat lunak, teknologi, struktur data, dan pustaka (libraries) yang digunakan dalam aplikasi **Domus CRM & Operasional** (Developer Perumahan).

---

## 1. Core Framework & Language

Aplikasi ini dibangun menggunakan framework React modern berbasis SSR/PWA:

*   **Framework Utama**: [Next.js v16.2.7](https://nextjs.org/) (App Router). Folder routing diatur dalam direktori `src/app` dengan pemisahan Route Handlers (`src/app/api/...`) dan halaman frontend.
*   **Library UI**: [React v19.2.4](https://react.dev/) & **React DOM v19.2.4**.
*   **Bahasa Pemrograman**: [TypeScript v5.x](https://www.typescriptlang.org/) dengan konfigurasi strict type checking untuk keamanan kode.

---

## 2. Styling, Desain Sistem, & Animasi

Desain UI difokuskan pada aspek estetika premium, responsif, dan performa tinggi:

*   **Utility CSS**: [Tailwind CSS v4](https://tailwindcss.com/) dengan integrasi PostCSS (`@tailwindcss/postcss`). Konfigurasi scan compiler diarahkan ke folder tema HeroUI untuk efisiensi loading style.
*   **Komponen UI**: [@HeroUI React v3.1.0](https://heroui.com/) (sebelumnya NextUI). Pustaka komponen berbasis React yang menyediakan desain modern dengan fitur aksesibilitas penuh.
*   **Mesin Animasi**: [Framer Motion v12.40.0](https://www.framer.com/motion/) untuk interaksi micro-animations, transisi transparan, dan efek hover dinamis.
*   **Ikonografi**: [Lucide React v1.17.0](https://lucide.dev/) untuk pustaka ikon SVG yang ringan dan konsisten.
*   **Tipografi**: Menggunakan font **Google Sans** yang dimuat secara eksternal melalui Google Fonts CDN di `globals.css` dengan variasi ketebalan 300 hingga 800.
*   **Efek Desain Khusus** (`globals.css`):
    *   `.glass-panel`: Utilitas CSS untuk efek *glassmorphism* (latar belakang transparan blur + border semi-transparan).
    *   `.premium-card`: Efek hover transisi 3D melayang halus dengan shadow dinamis (`box-shadow` biru indigo).
    *   Sistem penyembunyian scrollbar kustom (`.no-scrollbar`).

---

## 3. Database & Manajemen Data

Aplikasi menggunakan pendekatan database berkas lokal (Local File Database) untuk mempermudah portabilitas dan portabilitas pengembangan offline:

*   **Penyimpanan**: Berkas JSON lokal di `data/db.json`.
*   **Database Engine**: Utilitas backend di [db.ts](file:///home/nygma/domus-somnia/perumahan-app-2/src/lib/db.ts) yang mengimplementasikan operasi pembacaan (`fs.readFileSync`) dan penyimpanan data sinkron (`fs.writeFileSync`) terbungkus dalam class `db` dengan metode `db.get()` dan `db.save(data)`.
*   **Fitur Database**: Mendukung otomatisasi penyemaian data awal (*seeding*) dengan data simulasi yang kaya jika berkas `db.json` belum terbentuk.

### Entitas & Skema Data Utama:
1.  **`User`**: Data staf operasional dengan peran (`role`: 'admin', 'manager', 'staff'), departemen, dan saldo cuti tahunan (`annual_leave_balance`).
2.  **`Cluster`**: Data proyek perumahan, deskripsi, lokasi, total unit, status pemasaran, serta data peta wilayah (`svg_content`).
3.  **`UnitType`**: Spesifikasi tipe rumah (luas bangunan, luas tanah, harga dasar, jumlah kamar tidur/mandi, fasilitas carport, dan foto unit).
4.  **`PropertyUnit`**: Unit fisik spesifik per blok perumahan dengan status pemasaran terintegrasi (`available`, `reserved`, `booking`, `kpr_process`, `sold`).
5.  **`Prospect`**: Sistem pipa penjualan (sales pipeline) CRM dari prospek baru hingga akad/serah terima kunci (STK).
6.  **`FollowupRecord` & `FollowupComment`**: Log interaksi follow-up (WhatsApp, Kunjungan Lokasi, Telepon, Video Call) beserta feedback klien.
7.  **`Task`**: Manajemen to-do list/tugas dengan prioritas dan penetapan PIC (*assignee*).
8.  **`AttendanceRecord`**: Absensi harian staf operasional (jam clock-in/out, koordinat GPS, status WFH/Onsite, alasan terlambat, dan perhitungan lembur).
9.  **`LeaveRequest`**: Pengajuan cuti tahunan (*leave*) atau izin sakit (*permission*) terintegrasi dengan saldo cuti otomatis.
10. **`DocumentTemplate` & `Document`**: Sistem generator dokumen resmi menggunakan editor blok kustom (PKS, SPK, Invoice, Kwitansi) yang terintegrasi dengan sistem persetujuan berantai (*Approval Chain*).
11. **`AuditLog`**: Rekam jejak seluruh operasi sistem yang dilakukan oleh pengguna untuk keamanan.
12. **`SystemSettings`**: Pengaturan global (nama organisasi, koordinat lokasi kantor, radius geofencing, toleransi terlambat, jam operasional).

---

## 4. Fitur Fungsional Unggulan & Integrasi Pihak Ketiga

### A. Geofencing GPS Absensi & Pemetaan Interaktif
*   **Peta Frontend**: Memanfaatkan pustaka **Leaflet.js v1.9.4** dan peta **OpenStreetMap (OSM)** untuk merender peta interaktif di komponen [MapPicker.tsx](file:///home/nygma/domus-somnia/perumahan-app-2/src/components/MapPicker.tsx). Berkas Leaflet (.js & .css) dimuat secara asinkron dari CDN unpkg demi menjaga performa *initial load*.
*   **Logika Jarak Geofence (Haversine Formula)**:
    *   Jarak antara koordinat pengguna (latitude/longitude) dan titik kantor dihitung di server ([route.ts](file:///home/nygma/domus-somnia/perumahan-app-2/src/app/api/attendance/route.ts)) menggunakan rumus **Haversine**:
        $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
        *Di mana $R$ adalah jari-jari bumi (6.371.000 meter).*
    *   Jika pengguna memilih opsi kerja *onsite* dan posisinya berada di luar radius geofence kantor (default: `100 meter` dari koordinat target), sistem menolak proses *Clock-In*.
*   **Offline Absensi & Sync**: Mendukung fungsionalitas pengiriman absensi offline via endpoint `/api/attendance` dengan aksi `sync_offline` yang mensinkronisasi data lokal saat perangkat kembali online.

### B. Mesin Cetak PDF & Dokumen A4 (Pure CSS)
*   Aplikasi memiliki implementasi cetak PDF langsung lewat browser tanpa library eksternal yang berat.
*   Logika styling `@media print` di `globals.css` mengunci dimensi elemen `.print-container` secara ketat pada ukuran fisik kertas **A4 standar** (lebar $210\text{mm}$, tinggi $297\text{mm}$) dengan padding margin $15\text{mm}$.
*   Menggunakan manipulasi visibilitas CSS untuk menyembunyikan navigasi dashboard, footer, dan tombol interaktif, sehingga hasil simpan ke PDF/cetak printer hanya memuat lembar dokumen secara presisi.

### C. Progressive Web App (PWA)
*   Aplikasi dikonfigurasi sebagai PWA mandiri melalui berkas [manifest.json](file:///home/nygma/domus-somnia/perumahan-app-2/public/manifest.json).
*   Mendukung mode tampilan `standalone` dengan orientasi terkunci pada `portrait` dan tema warna utama `#2563EB` (Blue).
*   Menyediakan pintasan di homescreen perangkat seluler agar staf sales dan operasional di lapangan dapat mengakses sistem seperti aplikasi native.

### D. Autentikasi Simulasi (Role-based Access)
*   Mekanisme sesi dikelola melalui React Context API di [AuthContext.tsx](file:///home/nygma/domus-somnia/perumahan-app-2/src/context/AuthContext.tsx).
*   Menyediakan antarmuka "Role Switcher" di header dashboard untuk mensimulasikan login pengguna di lingkungan internal.
*   Data sesi simulasi di-persist menggunakan `localStorage` browser sehingga status login tidak hilang saat halaman di-refresh.

---

## 5. Ringkasan File Konfigurasi Utama

| Nama File | Peran / Deskripsi |
| :--- | :--- |
| `package.json` | Deklarasi versi dependensi framework (Next.js 16, React 19, Tailwind v4, HeroUI, Framer Motion, Lucide). |
| `postcss.config.mjs` | Konfigurasi PostCSS untuk parsing Tailwind CSS v4. |
| `tsconfig.json` | Konfigurasi compiler TypeScript dengan path alias `@/*` mengarah ke `./src/*`. |
| `next.config.ts` | Konfigurasi build Next.js. |
| `public/manifest.json` | Manifest PWA untuk meta-data aplikasi di Android/iOS homescreen. |
| `src/app/globals.css` | Impor Tailwind, Google Sans font, variabel tema, class glassmorphism, dan mesin cetak PDF A4. |
| `src/lib/db.ts` | Skema database terpusat, seeding data simulasi, dan backend database I/O. |
| `src/context/AuthContext.tsx` | Provider sesi simulasi dan penanganan role switcher lokal. |
