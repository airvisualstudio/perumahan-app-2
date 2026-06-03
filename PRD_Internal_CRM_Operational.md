# Product Requirements Document (PRD)
## Internal Platform — Developer Perumahan (PWA)
> CRM Properti · Operasional · HR · Dokumen Resmi

| | |
|---|---|
| **Status** | Draft v3.0 |
| **Versi** | 3.0 |
| **Tanggal** | Juni 2025 |
| **Target Launch** | < 1 bulan (MVP) |
| **Tipe Produk** | Web App (PWA) — Internal |
| **Author** | [Nama PM] |
| **Reviewer** | [Dev Lead, Designer, Stakeholder] |

---

## 1. Overview & Problem Statement

### 1.1 Latar Belakang

Perusahaan bergerak di bidang **pengembangan perumahan (developer properti)**. Tim marketing dan sales mengelola ratusan prospek calon pembeli unit rumah, dari berbagai cluster dan tipe unit. Saat ini proses follow-up prospek masih manual via WhatsApp dan spreadsheet, rekap kehadiran karyawan menggunakan mesin fingerprint fisik, dan dokumen seperti Invoice DP, Kwitansi, serta Surat Tugas dibuat manual di Word.

Tidak ada satu platform yang menghubungkan data prospek, status unit, riwayat follow-up, alur approval, dan penerbitan dokumen secara terintegrasi — sehingga data sering hilang, follow-up terlambat, dan manajemen tidak bisa memonitor progress penjualan secara real-time.

### 1.2 Problem Statement

> **"Bagaimana tim marketing & sales developer perumahan dapat mengelola prospek, unit properti, riwayat follow-up, dan dokumen resmi dalam satu platform — dengan approval berjenjang dan verifikasi dokumen via QR Code?"**

### 1.3 Tujuan Produk

- Menyediakan **single source of truth** untuk data pelanggan, operasional, kehadiran, dan dokumen
- Dapat diakses seperti **native app** di smartphone via PWA (tanpa App Store)
- Meningkatkan **visibilitas** aktivitas tim melalui dashboard terpusat
- Mendukung **absensi digital** berbasis GPS langsung dari HP karyawan
- Mengotomasi **pembuatan Invoice, Kwitansi, dan Surat** berdasar data yang diinput
- Menegakkan **approval berjenjang** yang dapat dikonfigurasi per tipe dokumen dan departemen
- Menerbitkan **QR Code** pada setiap dokumen yang approved sebagai bukti keaslian
- Menyediakan **portal verifikasi publik** agar pihak eksternal bisa cek keabsahan dokumen

---

## 2. Target Pengguna

| Role | Deskripsi | Kebutuhan Utama |
|------|-----------|-----------------|
| **Marketing / Sales Agent** | Mengelola prospek & follow-up lapangan | Input prospek, catat follow-up + bukti foto, update status unit |
| **Sales Supervisor** | Monitor tim sales & pipeline | Lihat progress prospek tim, approval level 1 |
| **Manajer Pemasaran** | Strategi & target penjualan | Dashboard pipeline, laporan konversi, approval level 2 |
| **Direktur / Owner** | Final decision & approval dokumen besar | Approval akhir, laporan eksekutif |
| **Finance** | Kelola Invoice DP, KPR, Kwitansi | Buat & approve dokumen keuangan properti |
| **Karyawan Umum** | Semua staf non-sales | Absensi clock-in/out, rekap kehadiran, pengajuan cuti |
| **Admin / HR** | Kelola akun, karyawan, konfigurasi sistem | User management, rekap absensi, approval chain config |

---

## 3. Goals & Non-Goals

### ✅ Goals (MVP)
- PWA: installable, offline-ready (khususnya absensi), push notification
- Autentikasi & manajemen user dengan role-based access
- Modul CRM: kelola kontak, perusahaan, dan pipeline deal
- Modul Operasional: task/ticket management berbasis status
- Modul Absensi: clock-in/out berbasis GPS, rekap, pengajuan cuti
- **Modul Approval Hierarchy: alur persetujuan berjenjang yang dapat dikonfigurasi**
- **Modul Dokumen: buat Invoice, Kwitansi, Surat dari template + data input, export PDF**
- **QR Code otomatis pada dokumen yang approved + Portal Verifikasi publik**
- Dashboard & reporting real-time
- Notifikasi via email dan push notification
- Integrasi Slack dan Google Workspace
- Backoffice Panel untuk Admin/HR

### ❌ Non-Goals (MVP — defer ke iterasi berikutnya)
- Native app (iOS/Android via App Store)
- Face recognition / biometric authentication
- Payroll & penggajian otomatis
- Multi-tenant / multi-company support
- AI/ML features (prediksi churn, lead scoring)
- Custom workflow builder dengan drag-drop logic
- Shift management & jadwal kerja kompleks
- Integrasi HRIS pihak ketiga (Talenta, Gadjian, dll)
- E-signature dengan kekuatan hukum (e.g. Privy, PERURI)
- Integrasi e-meterai
- Template builder visual (drag-drop) — MVP pakai template code-based

---

## 4. PWA Requirements

Platform ini harus memenuhi standar **Progressive Web App** penuh agar dapat diinstal di HP karyawan tanpa App Store.

### 4.1 Kriteria PWA

| Kriteria | Requirement | Detail |
|----------|-------------|--------|
| **Installable** | Web App Manifest lengkap | Nama, ikon (192px & 512px), theme color, `display: standalone` |
| **Offline Support** | Service Worker (Workbox) | Cache shell + critical assets; absensi dapat dilakukan offline |
| **Offline Sync** | Background Sync API | Clock-in/out yang dilakukan offline disinkron saat online kembali |
| **Push Notification** | Web Push API | Notifikasi reminder absensi, task assignment tanpa buka browser |
| **Responsive** | Mobile-first design | Breakpoint: 375px, 768px, 1024px, 1280px |
| **HTTPS** | Wajib | PWA hanya berjalan di HTTPS |
| **Lighthouse Score** | ≥ 90 (PWA & Performance) | Diukur sebelum launch |
| **Fast Load** | FCP < 2 detik, TTI < 3.5 detik | Di jaringan 4G simulasi |

### 4.2 Strategi Caching (Service Worker)

| Asset | Strategi | Keterangan |
|-------|----------|------------|
| App Shell (HTML/CSS/JS) | Cache First | Update saat deploy baru |
| API: GET kontak/task | Network First, fallback cache | Data terbaru diutamakan |
| API: POST absensi | Background Sync | Simpan di IndexedDB, kirim saat online |
| Gambar & font | Cache First | Long cache TTL |
| Halaman auth | Network Only | Tidak di-cache, keamanan |

### 4.3 Web App Manifest

```json
{
  "name": "Internal Platform",
  "short_name": "InternalApp",
  "description": "CRM, Operasional & Absensi Internal",
  "start_url": "/dashboard",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#2563EB",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "Absensi", "url": "/absensi", "icons": [{ "src": "/icons/clock.png", "sizes": "96x96" }] },
    { "name": "Task Saya", "url": "/tasks/me", "icons": [{ "src": "/icons/task.png", "sizes": "96x96" }] }
  ]
}
```

---

## 5. Fitur & Scope

### 5.1 Prioritas Fitur (MoSCoW)

| Prioritas | Fitur | Keterangan |
|-----------|-------|------------|
| 🔴 Must Have | PWA (manifest, service worker, installable) | Aksesibilitas mobile |
| 🔴 Must Have | Autentikasi (login, logout, SSO Google) | Fondasi utama |
| 🔴 Must Have | Role & Permission (Admin/HR, Manager, Finance, Staff) | Keamanan akses |
| 🔴 Must Have | Manajemen Kontak & Perusahaan | Inti CRM |
| 🔴 Must Have | Pipeline Deal (Kanban/List) | Tracking sales |
| 🔴 Must Have | Task & Ticket Operasional | Tracking kerja harian |
| 🔴 Must Have | Absensi: Clock-in/out + GPS verify | Kehadiran karyawan |
| 🔴 Must Have | Absensi: Rekap & Riwayat Kehadiran | Laporan HR |
| 🔴 Must Have | **Approval Hierarchy: konfigurasi level & chain per tipe dokumen** | Alur persetujuan |
| 🔴 Must Have | **Approval: notifikasi per level, history trail lengkap** | Transparansi proses |
| 🔴 Must Have | **Dokumen: buat Invoice dari data CRM** | Otomasi billing |
| 🔴 Must Have | **Dokumen: buat Kwitansi (receipt)** | Bukti pembayaran |
| 🔴 Must Have | **Dokumen: buat Surat (letter) dari template** | Korespondensi resmi |
| 🔴 Must Have | **Dokumen: export PDF siap cetak/kirim** | Output formal |
| 🔴 Must Have | **QR Code otomatis saat dokumen approved** | Anti-pemalsuan |
| 🔴 Must Have | **Portal Verifikasi publik (tanpa login)** | Cek keaslian dokumen |
| 🔴 Must Have | Dashboard Overview | Visibility manajemen |
| 🔴 Must Have | Backoffice Panel (user mgmt, audit log, config approval) | Kontrol sistem |
| 🟠 Should Have | Absensi: Pengajuan & Approval Cuti (via approval chain) | Self-service HR |
| 🟠 Should Have | Offline clock-in (Background Sync) | Absensi tanpa sinyal |
| 🟠 Should Have | Notifikasi Email & Web Push | Produktivitas |
| 🟠 Should Have | Integrasi Slack | Workflow tim |
| 🟠 Should Have | Integrasi Google Calendar | Scheduling |
| 🟠 Should Have | **Dokumen: nomor surat/invoice otomatis & sequential** | Penomoran resmi |
| 🟠 Should Have | **Approval: delegasi saat approver tidak tersedia** | Business continuity |
| 🟡 Could Have | Absensi: WFH mode | Fleksibilitas kerja |
| 🟡 Could Have | Laporan export (CSV/PDF) | Pelaporan |
| 🟡 Could Have | Integrasi Gmail | CRM enrichment |
| 🟡 Could Have | **Dokumen: template builder visual (drag-drop)** | Kustomisasi mandiri |
| 🟡 Could Have | **Dokumen: watermark "LUNAS" / "DIBATALKAN" otomatis** | Status visual |
| 🟡 Could Have | **Verifikasi portal: log siapa saja yang scan QR** | Audit trail eksternal |
| ⚪ Won't Have | Native app, payroll, e-meterai, e-signature legal, multi-tenant | Post-MVP |

---

### 5.2 Detail Fitur per Modul

#### 🔐 Modul 1: Autentikasi & User Management

**User Stories:**
- Sebagai **Admin**, saya bisa mengundang anggota tim via email.
- Sebagai **User**, saya bisa login via Google SSO.
- Sebagai **User** di HP, saya bisa install platform sebagai app dan login sekali tanpa perlu login ulang.
- Sebagai **Admin**, saya bisa mengatur role setiap user.

**Acceptance Criteria:**
- Login: email+password dan Google OAuth 2.0
- Role: Admin/HR, Manager, Staff — permission berbeda per modul
- Session: expired 8 jam idle; remember me 30 hari via refresh token
- Saat dibuka di mobile: muncul prompt "Add to Home Screen" setelah 2x kunjungan
- Audit log setiap perubahan akun

---

#### 👥 Modul 2: CRM Properti — Prospek, Unit & Follow-up History

CRM ini dirancang khusus untuk **developer perumahan**: mengelola calon pembeli (prospek), ketersediaan unit per cluster, pipeline penjualan properti, dan **riwayat follow-up lengkap dengan bukti gambar**. Setiap perubahan status apapun otomatis masuk ke history log yang tidak bisa dihapus.

---

##### 2A. Cluster & Unit Properti

**Acceptance Criteria:**

*Cluster:* nama, lokasi, deskripsi, foto, total unit, status (Pre-Launch / Active / Sold Out)

*Tipe Unit:* nama tipe (36/72, 45/90, 54/120), luas bangunan & tanah (m²), harga dasar, spesifikasi kamar, foto multiple

*Unit / Kavling:*
- Nomor blok/kavling (misal: A-01, B-12), cluster & tipe, harga jual final, orientasi (hook/tengah/pojok)
- Status unit dengan warna:

| Status | Warna | Keterangan |
|--------|-------|------------|
| Available | 🟢 | Siap ditawarkan |
| Reserved | 🟡 | Sedang diproses/ditawarkan |
| Booking | 🔵 | Sudah bayar booking fee |
| Proses KPR/Cash | 🟠 | Sedang proses pembayaran |
| Terjual (Akad) | 🔴 | Sudah akad kredit |
| Tidak Tersedia | ⚫ | Hold atau tidak dijual |

- Setiap perubahan status unit otomatis masuk **Unit History Log**
- Tampilan grid unit per cluster dengan warna status; filter per cluster, tipe, status, harga

---

##### 2B. Manajemen Prospek (Calon Pembeli)

**Acceptance Criteria:**

*Data Prospek:*
- Nama, NIK (opsional), telepon, email
- Pekerjaan, instansi, estimasi penghasilan (untuk KPR)
- Sumber lead: Walk-in / Referral / Instagram / Facebook Ads / Brosur / Website / Pameran / dll (dikonfigurasi Admin)
- Nama referral (jika sumber referral)
- Unit yang diminati: cluster + tipe (bisa lebih dari satu preferensi)
- Assigned sales agent
- **Tanggal follow-up terakhir** — otomatis update setiap ada follow-up baru
- Status prospek (lihat pipeline)
- Tags bebas (misal: "urgent", "KPR BCA", "cash keras")

*Indikator Follow-up di List Prospek:*
- 🟢 ≤ 3 hari — 🟡 4–7 hari — 🔴 > 7 hari — ⚫ Belum pernah di-follow-up

---

##### 2C. Pipeline Penjualan Properti

| Stage | Keterangan |
|-------|-----------|
| 🔵 Prospect Baru | Lead masuk, belum dihubungi |
| 📞 Dihubungi | Sudah kontak pertama |
| 🏠 Survei Lokasi | Prospek berkunjung ke lokasi |
| 📋 Penawaran | Harga & unit sudah ditawarkan formal |
| 💰 Booking Fee | Prospek bayar booking fee |
| 🏦 Proses KPR / Cash Keras | Pengajuan KPR atau pelunasan cash |
| ✍️ Akad Kredit / PPJB | Penandatanganan akad jual beli |
| 🔑 Serah Terima Kunci (STK) | Unit diserahkan ke pembeli |
| ❌ Batal | Prospek batal — unit kembali available |

- Setiap perpindahan stage **otomatis dicatat di History** beserta user & timestamp
- Sales Agent bisa pindah stage; perpindahan ke Akad membutuhkan approval Supervisor
- View: Kanban (per stage) dan List (semua stage, sortable)

---

##### 2D. Follow-up History & Bukti Gambar ⭐

Setiap interaksi dengan prospek dicatat secara lengkap dan **tidak bisa diubah** setelah disimpan (immutable).

**User Stories:**
- Sebagai **Sales**, saya bisa catat hasil follow-up beserta foto bukti kunjungan atau screenshot chat.
- Sebagai **Supervisor**, saya bisa lihat seluruh riwayat follow-up seorang prospek dari awal sampai sekarang.
- Setiap kali status prospek/unit berubah, sistem otomatis buat entri di history.

**Acceptance Criteria:**

*Form Input Follow-up Baru:*
- Tipe: Telepon / WhatsApp / Kunjungan Langsung / Email / Meeting Kantor / Video Call
- Tanggal & jam (default: sekarang, bisa diubah ke belakang)
- Catatan/hasil follow-up: wajib diisi
- Respon prospek: Sangat Tertarik / Tertarik / Masih Pikir-pikir / Tidak Berminat
- **Upload bukti gambar** (multiple, max 5 file, max 5MB/file):
  - Format: JPG, PNG, WEBP, PDF
  - Contoh: foto kunjungan, screenshot chat WA, foto dokumen
  - Kompresi otomatis di sisi client sebelum upload
  - Tampil sebagai thumbnail; klik → lightbox fullscreen
- Rencana follow-up berikutnya: tanggal + catatan → jadi reminder otomatis

*Timeline History (halaman detail prospek):*

```
RIWAYAT AKTIVITAS
──────────────────────────────────────────────
[🔄] Stage berubah: Dihubungi → Survei Lokasi
     3 Jun 2025, 14:22 · oleh Rina (Sales)

[📸] Follow-up: Kunjungan Langsung
     3 Jun 2025, 11:00 · Rina
     "Bapak survei unit B-08, suka karena hook."
     Respon: Sangat Tertarik
     [🖼 foto-1.jpg] [🖼 foto-2.jpg]
     Rencana FU: 5 Jun → kirim simulasi KPR BCA

[📞] Follow-up: Telepon
     1 Jun 2025, 09:15 · Rina
     "Sudah dihubungi, mau survei hari Senin."
     Respon: Tertarik

[🔵] Unit B-08 di-reserve untuk prospek ini
     1 Jun 2025, 09:20 · sistem

[📄] Invoice DP dibuat & diapprove
     5 Jun 2025, 10:00 · Finance

[🟢] Prospek dibuat · Sumber: Instagram Ads
     30 Mei 2025, 16:00 · Dendi (Marketing)
──────────────────────────────────────────────
```

*Event yang Auto-masuk History (semua dicatat otomatis):*
- ✅ Prospek baru dibuat (siapa, sumber mana)
- ✅ Perubahan assigned sales agent
- ✅ Perpindahan stage pipeline (dari → ke, oleh siapa)
- ✅ Perubahan status unit terkait (reserved, booking, terjual)
- ✅ Follow-up baru ditambahkan
- ✅ Dokumen dibuat / disubmit / approved / rejected untuk prospek ini
- ✅ Approval request dibuat atau diputuskan (siapa approver, hasilnya)
- ✅ Tags ditambah atau dihapus
- ✅ Unit di-booking atau di-release

*Notifikasi Reminder:*
- Push notif + email ke sales H-0 jika ada rencana follow-up yang dijadwalkan
- Supervisor mendapat notifikasi harian: daftar prospek yang belum di-follow-up > 7 hari

*Storage Gambar:*
- Supabase Storage / S3 dengan signed URL (private — hanya bisa diakses oleh user yang login)
- Thumbnail otomatis 200×200px untuk tampilan timeline

---

#### ⚙️ Modul 3: Operasional — Task & Ticket

**User Stories:**
- Sebagai **Staff**, saya bisa membuat dan assign task ke anggota lain.
- Sebagai **Manager**, saya bisa memantau semua task tim beserta status dan deadline.

**Acceptance Criteria:**
- Task: judul, deskripsi, assignee, deadline, prioritas, status (Open/In Progress/Done)
- View: List dan Kanban board
- Komentar per task; notifikasi saat di-assign atau deadline H-1

---

#### 🕐 Modul 4: Absensi Karyawan

Panel absensi dirancang **mobile-first** dan berfungsi penuh sebagai PWA di HP karyawan.

**User Stories:**
- Sebagai **Karyawan**, saya bisa clock-in dari HP saya dengan verifikasi lokasi GPS.
- Sebagai **Karyawan**, saya bisa clock-out dan melihat total jam kerja hari ini.
- Sebagai **Karyawan**, saya bisa melihat riwayat kehadiran dan rekap bulanan saya.
- Sebagai **Karyawan**, saya bisa mengajukan cuti/izin dan melihat statusnya.
- Sebagai **Manager**, saya bisa menyetujui atau menolak pengajuan cuti tim saya.
- Sebagai **Admin/HR**, saya bisa melihat rekap kehadiran semua karyawan dan export.
- Sebagai **Karyawan** di area tanpa sinyal, saya tetap bisa clock-in (disinkron saat online).

**Acceptance Criteria:**

*Clock-in / Clock-out:*
- Tombol besar Clock-In dan Clock-Out di halaman utama absensi (mobile-friendly)
- Verifikasi GPS: koordinat karyawan dibandingkan radius lokasi kantor yang dikonfigurasi Admin
- Toleransi radius default: 100 meter (dapat diubah di Backoffice)
- Tampilkan status: di dalam / di luar radius, dengan jarak ke kantor
- Catat: timestamp, koordinat, IP, device info
- Cegah double clock-in di hari yang sama
- Offline mode: jika tidak ada koneksi, data clock-in disimpan di IndexedDB dan disinkron otomatis via Background Sync API saat online. User melihat indikator "Tersimpan, akan disinkron"

*Status Kehadiran:*
- Hadir, Terlambat (>15 menit dari jam kerja), Tidak Hadir, Cuti, Izin, Sakit
- Jam kerja default: 09.00–18.00 (dapat dikustomisasi per tim di Backoffice)

*Riwayat & Rekap:*
- Karyawan lihat kalender kehadiran bulan ini
- Detail per hari: jam masuk, jam keluar, durasi, status, catatan
- Rekap bulanan: total hadir, terlambat, absen, cuti, total jam kerja
- Manager/HR: lihat rekap seluruh tim; export CSV per bulan

*Pengajuan Cuti/Izin:*
- Tipe: Cuti Tahunan, Izin, Sakit, Cuti Khusus
- Form: tipe, tanggal mulai-selesai, alasan, lampiran (opsional)
- Workflow: Pending → Approved/Rejected oleh Manager
- Notifikasi push/email ke Manager saat ada pengajuan baru
- Notifikasi ke Karyawan saat cuti disetujui/ditolak
- Saldo cuti tahunan ditampilkan (default 12 hari/tahun, dapat diubah)

*WFH Mode (Could Have):*
- Karyawan pilih "WFH" saat clock-in
- Tidak ada verifikasi GPS; hanya selfie sebagai konfirmasi

---

#### 📊 Modul 5: Dashboard & Reporting

**Acceptance Criteria:**
- Dashboard utama: total kontak, deal by stage, task by status, aktivitas terkini
- **Widget Absensi HR**: kehadiran hari ini, yang terlambat, yang belum absen, pengajuan cuti pending
- Filter berdasarkan periode (7 hari, 30 hari, custom range)
- Laporan deal pipeline: nilai total per stage, win rate
- Laporan task: completion rate per user, overdue
- Laporan absensi: rekap per karyawan, per departemen, per bulan
- Export CSV; PDF (Could Have)

---

#### 🔔 Modul 6: Notifikasi

**Acceptance Criteria:**
- **Web Push Notification** (via VAPID / Web Push API): berfungsi bahkan saat browser ditutup di HP
- Push reminder: "Kamu belum clock-in hari ini" — dikirim pukul 09.30 jika belum absen
- Push reminder clock-out: jam 18.15 jika belum clock-out
- Email + Push: task assignment, deadline H-1, approval cuti, deal stage change
- User atur preferensi notifikasi sendiri

---

#### 🔗 Modul 7: Integrasi

**Acceptance Criteria:**
- **Slack:** notifikasi ke channel saat deal Won, task overdue, dan pengajuan cuti baru
- **Google Calendar:** sync meeting ke timeline kontak
- **Gmail (Could Have):** log email ke activity kontak
- Konfigurasi integrasi via Backoffice

---

#### 🛠️ Modul 8: Backoffice Panel

Akses khusus Admin/HR via `/backoffice`. Guard NestJS `AdminOnly` di semua route.

**Acceptance Criteria:**

*User Management:* invite, suspend, hapus, ubah role, reset password

*Konfigurasi Absensi:*
- Setting lokasi kantor (nama, koordinat GPS, radius toleransi)
- Multi-lokasi: bisa tambah beberapa kantor/cabang
- Jam kerja default per tim/departemen
- Jenis cuti dan saldo default

*Audit Log:* setiap aksi penting dicatat dengan timestamp, user, action, IP; export CSV; retensi 90 hari

*System Config:* nama org, logo, timezone, integrasi tokens

*System Health (Could Have):* status integrasi, queue monitor, error log ringkasan

---

#### 🏛️ Modul 9: Approval Hierarchy

Sistem persetujuan berjenjang yang dapat dikonfigurasi per **tipe dokumen** dan/atau **departemen**. Setiap request approval mengikuti chain yang telah ditetapkan dari level terendah hingga final approver.

**User Stories:**
- Sebagai **Admin**, saya bisa mengkonfigurasi chain approval: misal Invoice harus disetujui Manager Finance → Direktur.
- Sebagai **Staff**, saya bisa submit dokumen untuk approval dan melihat status di setiap level.
- Sebagai **Manager**, saya menerima notifikasi saat ada dokumen menunggu approval saya, lalu approve atau reject dengan catatan.
- Sebagai **Pemohon**, saya bisa lihat history approval: siapa yang approve/reject di setiap step, kapan, dan catatan apa yang ditulis.
- Sebagai **Manager**, saya bisa mendelegasikan approval saya ke orang lain saat saya tidak tersedia (cuti/sakit).

**Acceptance Criteria:**

*Konfigurasi Chain (di Backoffice):*
- Admin bisa buat **Approval Template** dengan nama, tipe dokumen, dan urutan approver
- Setiap level dalam chain: pilih approver berdasarkan **role** atau **user spesifik**
- Level bisa: wajib (semua harus approve), atau **any-of** (salah satu dari grup cukup)
- Contoh chain Invoice:
  ```
  Level 1 → Role: Finance Manager   (wajib)
  Level 2 → Role: Direktur Keuangan (wajib)
  Level 3 → User: CEO               (wajib, jika nilai > Rp 50jt)
  ```
- Bisa set **kondisi bersyarat**: level tertentu hanya aktif jika nilai dokumen melampaui threshold
- Approval Template bisa diassign ke: semua dokumen tipe X, atau departemen tertentu

*Alur Approval:*
- Dokumen dibuat → status `DRAFT`
- Pemohon submit → status berubah `PENDING_APPROVAL`, approval request dibuat mengikuti chain
- Notifikasi push + email ke approver Level 1
- Approver Level 1 **Approve** → notifikasi ke Level 2 (dst), status `IN_REVIEW`
- Approver **Reject** di level manapun → dokumen kembali ke `REJECTED`, pemohon dinotifikasi beserta catatan penolakan
- Semua level approve → dokumen `APPROVED`, QR Code diterbitkan otomatis
- Pemohon bisa **revisi dan resubmit** dokumen yang rejected

*History & Transparansi:*
- Setiap aksi approval dicatat: approver, timestamp, action (approve/reject/delegate), catatan
- Timeline visual di halaman dokumen: chip per level (⏳ pending, ✅ approved, ❌ rejected)
- Semua history tersimpan dan tidak dapat dihapus (immutable log)

*Delegasi:*
- Approver bisa set delegasi dengan tanggal mulai-selesai dan pengganti spesifik
- Sistem otomatis routing ke delegatee selama periode delegasi aktif
- Admin bisa set delegasi dari Backoffice jika approver tidak bisa akses sistem

---

#### 📄 Modul 10: Document Generation (Invoice, Kwitansi, Surat)

Platform menghasilkan dokumen resmi berformat PDF dari data yang diinput user, dengan nomor surat otomatis, header organisasi, dan tanda tangan digital berupa QR code (setelah approved).

**User Stories:**
- Sebagai **Finance/Sales**, saya bisa buat Invoice baru dengan memilih klien dari CRM dan mengisi item-item tagihan.
- Sebagai **Finance**, saya bisa buat Kwitansi dari Invoice yang sudah lunas dengan satu klik.
- Sebagai **Staff**, saya bisa buat Surat Resmi dari template yang tersedia, isi variabelnya, preview, lalu submit untuk approval.
- Sebagai **Manager**, saya bisa preview dokumen sebelum approve.
- Sistem otomatis menerbitkan PDF final + QR Code saat dokumen approved.

**Acceptance Criteria:**

*Tipe Dokumen & Fields:*

**Invoice:**
- Nomor invoice otomatis & sequential: `INV/[YYYY]/[MM]/[XXXX]`
- Data klien: tarik dari CRM (kontak/perusahaan) atau input manual
- Line items: nama item, qty, satuan, harga satuan → subtotal otomatis
- Pajak: PPN 11% (toggle), diskon (nominal atau %)
- Total: subtotal, diskon, pajak, **total akhir** — semua dihitung otomatis
- Payment terms: tanggal jatuh tempo, metode pembayaran, nomor rekening
- Catatan/notes tambahan
- Status: Draft → Pending Approval → Approved → Sent → **Paid** / Overdue

**Kwitansi (Receipt):**
- Nomor kwitansi: `KWT/[YYYY]/[MM]/[XXXX]`
- Bisa dibuat dari Invoice (otomatis tarik data) atau standalone
- Data: penerima, jumlah uang (dalam angka + terbilang otomatis), keterangan pembayaran, tanggal
- "Terbilang" dalam Bahasa Indonesia digenerate otomatis dari nominal
- Status: Draft → Pending Approval → Approved

**Surat Resmi:**
- Nomor surat: `[KODE-DEPT]/[YYYY]/[BULAN-ROMAWI]/[XXXX]` — format konfigurabel
- Template tersedia (dikonfigurasi Admin): Surat Tugas, Surat Keterangan Kerja, Surat Pengantar, Surat Perjanjian, Surat Undangan, dan lainnya
- Setiap template punya **variabel** yang diisi user: `{{nama_penerima}}`, `{{jabatan}}`, `{{tanggal_berlaku}}`, dll
- Editor form sederhana (bukan rich text) — setiap variabel diisi via input field
- Preview real-time sebelum submit
- Status: Draft → Pending Approval → Approved

*Output PDF:*
- Template PDF mencakup: header organisasi (logo, nama, alamat), konten dokumen, footer, dan area QR Code
- PDF digenerate via **Puppeteer** (server-side rendering HTML → PDF)
- Kualitas cetak: A4, 96dpi, margin standar
- Font: menggunakan font yang didefinisikan di Design System
- Setelah approved: QR Code disisipkan otomatis di sudut kanan bawah dokumen
- PDF final tersimpan di storage (tidak bisa dimodifikasi setelah approved)

*Penomoran Otomatis:*
- Nomor dokumen di-generate server-side saat pertama kali dokumen di-submit (bukan saat draft)
- Sequential per tipe per tahun per bulan — tidak bisa ada nomor yang sama
- Format nomor dapat dikonfigurasi per tipe di Backoffice

*Template Management (Backoffice):*
- Admin bisa tambah/edit template Surat beserta daftar variabelnya
- Template disimpan sebagai HTML dengan placeholder `{{variable}}`
- Preview template sebelum disimpan

---

#### 🔐 Modul 11: QR Code & Portal Verifikasi

Setiap dokumen yang sudah **APPROVED** otomatis mendapat QR Code unik yang tertanam di PDF. QR Code mengarah ke portal verifikasi publik yang bisa diakses siapapun tanpa login.

**User Stories:**
- Sebagai **Pihak Eksternal** (klien, mitra, instansi), saya bisa scan QR Code di dokumen dan langsung tahu apakah dokumen tersebut asli dan valid.
- Sebagai **Pihak Eksternal**, saya bisa lihat informasi dasar dokumen di portal (bukan isi lengkap).
- Sebagai **Admin**, saya bisa membatalkan (revoke) dokumen yang sudah approved, sehingga verifikasi akan menunjukkan status "TIDAK BERLAKU".
- Sebagai **Admin**, saya bisa lihat log siapa saja yang pernah scan/verifikasi suatu dokumen.

**Acceptance Criteria:**

*QR Code Generation:*
- QR Code digenerate saat dokumen berpindah status ke `APPROVED`
- Konten QR Code: URL ke portal verifikasi `https://verify.internal.company.com/[doc_token]`
- `doc_token`: string unik 32 karakter (UUID v4 + HMAC signature) — tidak bisa ditebak/dipalsukan
- QR Code dirender sebagai gambar PNG, disematkan di pojok kanan bawah PDF
- Ukuran QR Code: 80×80px di PDF, cukup jelas saat dicetak ukuran A4
- QR Code juga bisa ditampilkan di halaman detail dokumen untuk di-scan langsung dari layar

*Portal Verifikasi (Publik):*
- URL: `https://verify.[domain-perusahaan].com/:token`
- **Tidak memerlukan login** — bisa diakses siapapun
- Tampilkan informasi:
  - ✅ / ❌ Status dokumen (VALID / TIDAK BERLAKU / TIDAK DITEMUKAN)
  - Tipe dokumen (Invoice / Kwitansi / Surat Tugas / dll)
  - Nomor dokumen
  - Nama penerbit (nama perusahaan)
  - Tanggal diterbitkan & tanggal approved
  - Nama approver final (level terakhir)
  - **Tidak menampilkan** isi detail dokumen, nilai uang, atau data sensitif lainnya
- Halaman portal: **desain minimal, mobile-friendly**, bisa diakses dari browser HP setelah scan QR
- Response time portal: < 1 detik

*Status Dokumen di Portal:*

| Status Internal | Tampilan di Portal |
|----------------|--------------------|
| `APPROVED` | ✅ **DOKUMEN VALID** — Diterbitkan pada [tanggal] |
| `REVOKED` | ❌ **DOKUMEN TIDAK BERLAKU** — Dicabut pada [tanggal] |
| Token tidak ditemukan | ⚠️ **DOKUMEN TIDAK DITEMUKAN** — QR Code mungkin dipalsukan |
| `DRAFT` / `PENDING` | ⚠️ **DOKUMEN BELUM AKTIF** — Belum melalui proses approval |

*Keamanan:*
- `doc_token` di-sign dengan HMAC-SHA256 menggunakan secret key server — tidak bisa di-forge
- Rate limiting di portal: max 60 request/menit per IP
- Log setiap verifikasi: timestamp, token, IP, user-agent (untuk audit)
- Revoke dokumen: Admin bisa revoke dari Backoffice, status langsung berubah di portal
- Token tidak pernah expire kecuali di-revoke manual

*Revoke Dokumen (Backoffice):*
- Admin pilih dokumen → klik "Cabut Dokumen"
- Wajib isi alasan pencabutan
- Status dokumen berubah ke `REVOKED`, tercatat di audit log
- Portal langsung menampilkan "TIDAK BERLAKU" dengan tanggal pencabutan

### 6.1 Tech Stack

| Layer | Pilihan | Alasan |
|-------|---------|--------|
| **Frontend** | Next.js 14 (App Router) + TypeScript | SSR/SSG, PWA-friendly, performa tinggi |
| **PWA** | next-pwa (Workbox) | Service Worker, caching strategy, manifest |
| **UI Library** | shadcn/ui + Tailwind CSS | Komponen siap pakai, mobile-first |
| **Backend** | **NestJS** + TypeScript | Modular, DI built-in, Guards/Pipes/Interceptors |
| **Database** | PostgreSQL | Relasional, solid untuk CRM + HR data |
| **ORM** | Prisma | Type-safe, migration mudah |
| **Auth** | NestJS + Passport.js (JWT + Google OAuth) | Fleksibel, guard-based |
| **Real-time / Push** | Web Push API (VAPID) + Socket.io | Push notif PWA + real-time updates |
| **Background Jobs** | BullMQ + Redis | Queue email, push notif, sync absensi |
| **Offline Sync** | IndexedDB (Dexie.js) + Background Sync API | Simpan absensi offline, sync otomatis |
| **Email** | Resend | Transactional email, developer-friendly |
| **Maps / GPS** | Browser Geolocation API + Leaflet.js | Verifikasi lokasi absensi |
| **Deployment** | Vercel (FE) + Railway (BE) | Fast deploy, cost-effective |
| **CI/CD** | GitHub Actions | Test + deploy otomatis |
| **Monitoring** | Sentry (error) + Better Uptime | Error tracking & uptime |

### 6.2 Arsitektur High-Level

```
┌──────────────────────────────────────────────────────────┐
│              Browser / PWA (Mobile & Desktop)             │
│   ┌─────────────┐  ┌──────────────┐  ┌───────────────┐   │
│   │  App Shell  │  │ Service Work │  │  IndexedDB    │   │
│   │  (cached)   │  │ er (Workbox) │  │ (offline sync)│   │
│   └─────────────┘  └──────────────┘  └───────────────┘   │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS / WebSocket
┌────────────────────────▼─────────────────────────────────┐
│              Next.js Frontend (Vercel)                    │
│     User App  │  Backoffice Panel  │  PWA Manifest        │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API
┌────────────────────────▼─────────────────────────────────┐
│                  NestJS Backend (Railway)                  │
│  ┌──────┬──────┬──────┬──────────┬──────┬─────────────┐  │
│  │ Auth │ CRM  │ Task │ Absensi  │Notif │ Backoffice  │  │
│  │      │      │      │ + GPS    │      │             │  │
│  └──────┴──────┴──────┴──────────┴──────┴─────────────┘  │
│         Guards │ Interceptors │ Pipes │ BullMQ            │
└──────┬──────────────┬─────────────────┬───────────────────┘
       │              │                 │
  ┌────▼───┐    ┌─────▼──┐    ┌────────▼────────────┐
  │Postgres│    │ Redis  │    │   External APIs      │
  │(Prisma)│    │(Queue/ │    │ Slack, Google,       │
  │        │    │ cache) │    │ Resend, Web Push     │
  └────────┘    └────────┘    └─────────────────────┘
```

### 6.3 Struktur NestJS Modules

```
src/
├── auth/               # JWT, Google OAuth, Passport strategies
├── users/              # User CRUD, role management
├── crm/
│   ├── clusters/       # Cluster perumahan
│   ├── unit-types/     # Tipe unit + foto
│   ├── units/          # Unit/kavling + status history
│   ├── prospects/      # Calon pembeli + pipeline stage
│   ├── followups/      # Follow-up records + attachments (immutable)
│   └── history/        # Prospect history log (immutable, append-only)
├── operations/
│   └── tasks/          # Task & ticket + komentar
├── attendance/         # Clock-in/out, GPS verify, rekap
│   ├── records/
│   ├── leaves/
│   └── locations/
├── approvals/          # Approval hierarchy, chains, delegation
│   ├── templates/      # Approval chain templates
│   ├── requests/       # Approval request instances
│   └── delegations/
├── documents/          # Invoice, Kwitansi, Surat
│   ├── invoices/
│   ├── receipts/
│   ├── letters/
│   ├── templates/      # Handlebars HTML templates
│   └── pdf/            # Puppeteer PDF generation service
├── verification/       # Public QR verification portal (no auth)
├── notifications/      # Email, Web Push, BullMQ jobs
├── integrations/
│   ├── slack/
│   └── google/
├── backoffice/         # Admin-only routes
│   ├── guards/
│   ├── audit-log/
│   └── settings/
└── common/             # DTOs, decorators, interceptors, pipes, storage
```

### 6.4 Keputusan Arsitektur

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| **Monorepo** | Turborepo | Shared types FE-BE, atomic deploy |
| **REST vs GraphQL** | REST via NestJS Controllers | Lebih simpel, cukup untuk MVP |
| **Auth** | JWT + Refresh Token | Stateless, scalable |
| **Push Notif** | Web Push API (VAPID) | Native-like push tanpa App Store |
| **Offline Sync** | Background Sync API + IndexedDB | Absensi offline → sync otomatis |
| **GPS Verify** | Browser Geolocation API | No hardware cost, cukup akurat |
| **State FE** | Zustand + React Query (TanStack) | Ringan, cache-first data fetching |

---

## 7. Database Schema

### 7.1 Entity Relationship Overview

```
users ──< attendance_records
users ──< leave_requests
users ──< tasks (assignee)
users ──< deal_activities
contacts >── companies
contacts ──< deal_activities
deals >── deal_stages
deals >── contacts
tasks >── users
leave_requests >── leave_types
attendance_records >── office_locations
audit_logs >── users
```

### 7.2 Schema Detail

#### `users`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           VARCHAR(255) UNIQUE NOT NULL
name            VARCHAR(255) NOT NULL
avatar_url      TEXT
role            ENUM('admin', 'manager', 'staff') DEFAULT 'staff'
department      VARCHAR(100)
employee_id     VARCHAR(50) UNIQUE          -- ID karyawan
join_date       DATE
annual_leave_balance  INT DEFAULT 12       -- saldo cuti tahunan
is_active       BOOLEAN DEFAULT true
google_id       VARCHAR(255)               -- untuk Google SSO
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `sessions`
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
refresh_token   TEXT NOT NULL
device_info     TEXT
ip_address      INET
expires_at      TIMESTAMP NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
```

#### `clusters`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(255) NOT NULL        -- "Cluster Melati", "Cluster Anggrek"
location        TEXT
description     TEXT
total_units     INT DEFAULT 0
status          ENUM('pre_launch','active','sold_out') DEFAULT 'pre_launch'
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `unit_types`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
cluster_id      UUID REFERENCES clusters(id) ON DELETE CASCADE
name            VARCHAR(100) NOT NULL        -- "Tipe 36/72", "Tipe 45/90"
building_area   DECIMAL(8,2)                 -- luas bangunan m²
land_area       DECIMAL(8,2)                 -- luas tanah m²
base_price      DECIMAL(15,2) NOT NULL
bedrooms        INT DEFAULT 2
bathrooms       INT DEFAULT 1
has_carport     BOOLEAN DEFAULT true
description     TEXT
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `unit_type_photos`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
unit_type_id    UUID REFERENCES unit_types(id) ON DELETE CASCADE
url             TEXT NOT NULL
thumbnail_url   TEXT
order_index     INT DEFAULT 0
uploaded_by     UUID REFERENCES users(id)
created_at      TIMESTAMP DEFAULT NOW()
```

#### `property_units`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
cluster_id      UUID REFERENCES clusters(id)
unit_type_id    UUID REFERENCES unit_types(id)
block_number    VARCHAR(20) NOT NULL         -- "A-01", "B-12"
sell_price      DECIMAL(15,2)                -- bisa override dari base_price
orientation     ENUM('hook','middle','corner') DEFAULT 'middle'
status          ENUM('available','reserved','booking','kpr_process','sold','unavailable')
                DEFAULT 'available'
reserved_for    UUID REFERENCES prospects(id)  -- prospek yang sedang reserve
notes           TEXT
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
UNIQUE(cluster_id, block_number)
```

#### `unit_status_history`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
unit_id         UUID REFERENCES property_units(id) ON DELETE CASCADE
old_status      TEXT
new_status      TEXT NOT NULL
changed_by      UUID REFERENCES users(id)
prospect_id     UUID REFERENCES prospects(id)
notes           TEXT
created_at      TIMESTAMP DEFAULT NOW()
```

#### `prospects`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
full_name       VARCHAR(255) NOT NULL
nik             VARCHAR(16)
phone           VARCHAR(20) NOT NULL
email           VARCHAR(255)
occupation      VARCHAR(100)
company_name    VARCHAR(255)
estimated_income DECIMAL(15,2)               -- estimasi penghasilan untuk KPR
lead_source     VARCHAR(100)                 -- 'instagram', 'walk_in', 'referral', dll
referral_name   VARCHAR(255)                 -- nama orang yang mereferral
pipeline_stage  VARCHAR(50) DEFAULT 'prospect_baru'
                -- prospect_baru|dihubungi|survei|penawaran|booking|
                --   kpr_process|akad|stk|batal
assigned_to     UUID REFERENCES users(id)    -- sales agent
interested_cluster_id UUID REFERENCES clusters(id)
interested_type_id    UUID REFERENCES unit_types(id)
booked_unit_id  UUID REFERENCES property_units(id)
tags            TEXT[]
notes           TEXT
last_followup_at TIMESTAMP                   -- otomatis update saat ada followup baru
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `followup_records`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
prospect_id     UUID REFERENCES prospects(id) ON DELETE CASCADE
conducted_by    UUID REFERENCES users(id)    -- sales yang follow-up
followup_type   ENUM('telepon','whatsapp','kunjungan','email','meeting','video_call')
followup_at     TIMESTAMP NOT NULL           -- waktu follow-up (bisa di-set manual)
notes           TEXT NOT NULL                -- wajib diisi
prospect_response ENUM('very_interested','interested','considering','not_interested')
next_followup_at  TIMESTAMP                  -- rencana follow-up berikutnya
next_followup_note TEXT
created_at      TIMESTAMP DEFAULT NOW()
-- IMMUTABLE: tidak boleh ada UPDATE atau DELETE pada tabel ini
```

#### `followup_attachments`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
followup_id     UUID REFERENCES followup_records(id) ON DELETE CASCADE
url             TEXT NOT NULL                -- signed URL ke storage
thumbnail_url   TEXT                         -- thumbnail 200x200
file_type       ENUM('image','pdf')
file_name       VARCHAR(255)
file_size_bytes INT
uploaded_by     UUID REFERENCES users(id)
created_at      TIMESTAMP DEFAULT NOW()
```

#### `prospect_history`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
prospect_id     UUID REFERENCES prospects(id) ON DELETE CASCADE
event_type      VARCHAR(50) NOT NULL
-- Nilai event_type:
-- 'prospect_created' | 'stage_changed' | 'assigned_changed'
-- 'followup_added' | 'unit_reserved' | 'unit_released'
-- 'unit_booked' | 'document_created' | 'document_approved'
-- 'approval_requested' | 'approval_decided' | 'tag_changed'
actor_id        UUID REFERENCES users(id)    -- siapa yang melakukan (NULL jika sistem)
metadata        JSONB                         -- detail event (from/to stage, unit_id, dll)
description     TEXT NOT NULL                -- deskripsi human-readable
created_at      TIMESTAMP DEFAULT NOW()
-- IMMUTABLE: append-only, tidak boleh UPDATE atau DELETE
```

#### `tasks`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
title           VARCHAR(255) NOT NULL
description     TEXT
assignee_id     UUID REFERENCES users(id)
created_by      UUID REFERENCES users(id)
priority        ENUM('low','medium','high') DEFAULT 'medium'
status          ENUM('open','in_progress','done') DEFAULT 'open'
due_date        DATE
related_deal_id UUID REFERENCES deals(id)     -- opsional
related_contact UUID REFERENCES contacts(id)  -- opsional
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `task_comments`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
task_id         UUID REFERENCES tasks(id) ON DELETE CASCADE
user_id         UUID REFERENCES users(id)
content         TEXT NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
```

#### `office_locations`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(255) NOT NULL        -- "Kantor Pusat", "Cabang Bandung"
latitude        DECIMAL(10,8) NOT NULL
longitude       DECIMAL(11,8) NOT NULL
radius_meters   INT DEFAULT 100
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP DEFAULT NOW()
```

#### `attendance_records`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id)
date            DATE NOT NULL
clock_in_at     TIMESTAMP
clock_out_at    TIMESTAMP
clock_in_lat    DECIMAL(10,8)
clock_in_lng    DECIMAL(11,8)
clock_out_lat   DECIMAL(10,8)
clock_out_lng   DECIMAL(11,8)
office_id       UUID REFERENCES office_locations(id)
status          ENUM('present','late','absent','leave','permission','sick')
work_mode       ENUM('onsite','wfh') DEFAULT 'onsite'
is_offline_sync BOOLEAN DEFAULT false        -- clock-in via offline
notes           TEXT
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, date)
```

#### `leave_types`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(100) NOT NULL        -- "Cuti Tahunan", "Sakit", dll
requires_approval BOOLEAN DEFAULT true
max_days        INT                          -- NULL = unlimited
created_at      TIMESTAMP DEFAULT NOW()
```

#### `leave_requests`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id)
leave_type_id   UUID REFERENCES leave_types(id)
start_date      DATE NOT NULL
end_date        DATE NOT NULL
total_days      INT NOT NULL
reason          TEXT
attachment_url  TEXT
status          ENUM('pending','approved','rejected') DEFAULT 'pending'
reviewed_by     UUID REFERENCES users(id)
reviewed_at     TIMESTAMP
review_notes    TEXT
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `push_subscriptions`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
endpoint        TEXT NOT NULL
p256dh          TEXT NOT NULL
auth            TEXT NOT NULL
device_name     TEXT
created_at      TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, endpoint)
```

#### `notification_preferences`
```sql
user_id         UUID REFERENCES users(id) PRIMARY KEY
task_assigned   BOOLEAN DEFAULT true
task_due        BOOLEAN DEFAULT true
leave_status    BOOLEAN DEFAULT true
attendance_reminder BOOLEAN DEFAULT true
deal_update     BOOLEAN DEFAULT true
via_email       BOOLEAN DEFAULT true
via_push        BOOLEAN DEFAULT true
via_slack       BOOLEAN DEFAULT false
```

#### `audit_logs`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id)
action          VARCHAR(100) NOT NULL        -- 'user.invite', 'deal.delete', dll
entity_type     VARCHAR(50)                 -- 'user', 'deal', 'contact', dll
entity_id       UUID
old_value       JSONB
new_value       JSONB
ip_address      INET
user_agent      TEXT
created_at      TIMESTAMP DEFAULT NOW()
```

#### `system_settings`
```sql
key             VARCHAR(100) PRIMARY KEY
value           JSONB NOT NULL
updated_by      UUID REFERENCES users(id)
updated_at      TIMESTAMP DEFAULT NOW()
-- Contoh keys: 'org.name', 'org.logo', 'work_hours.start', 'work_hours.end',
--              'slack.webhook_url', 'google.client_id', 'attendance.late_threshold'
```

---

## 8. API Endpoint List

Base URL: `https://api.internal.company.com/v1`

Auth: `Authorization: Bearer <JWT>` di semua endpoint kecuali `/auth/*`

### 8.1 Auth

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| POST | `/auth/login` | Login email + password | Public |
| POST | `/auth/google` | Login via Google OAuth | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/logout` | Logout & revoke refresh token | All |
| POST | `/auth/forgot-password` | Kirim email reset password | Public |
| POST | `/auth/reset-password` | Reset password via token | Public |

### 8.2 Users

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/users/me` | Profil user saat ini | All |
| PATCH | `/users/me` | Update profil sendiri | All |
| GET | `/users` | List semua user | Admin, Manager |
| POST | `/users/invite` | Undang user baru via email | Admin |
| PATCH | `/users/:id/role` | Ubah role user | Admin |
| PATCH | `/users/:id/status` | Suspend / aktifkan user | Admin |
| DELETE | `/users/:id` | Hapus user | Admin |

### 8.3 CRM Properti — Cluster, Unit & Prospek

#### Cluster & Unit

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/clusters` | List semua cluster | All |
| POST | `/clusters` | Tambah cluster baru | Admin |
| GET | `/clusters/:id` | Detail cluster + unit summary | All |
| PATCH | `/clusters/:id` | Update cluster | Admin |
| GET | `/unit-types` | List tipe unit | All |
| POST | `/unit-types` | Tambah tipe unit | Admin |
| PATCH | `/unit-types/:id` | Update tipe unit | Admin |
| POST | `/unit-types/:id/photos` | Upload foto tipe unit | Admin |
| DELETE | `/unit-types/:id/photos/:pid` | Hapus foto tipe | Admin |
| GET | `/units` | List semua unit (filter cluster/tipe/status) | All |
| POST | `/units` | Tambah unit/kavling | Admin |
| GET | `/units/:id` | Detail unit + status history | All |
| PATCH | `/units/:id/status` | Update status unit | Manager, Admin |
| GET | `/units/:id/history` | Riwayat perubahan status unit | All |

#### Prospek & Follow-up

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/prospects` | List prospek (filter stage, sales, FU status) | All |
| POST | `/prospects` | Tambah prospek baru | All |
| GET | `/prospects/:id` | Detail prospek + history timeline | All |
| PATCH | `/prospects/:id` | Update data prospek | All |
| PATCH | `/prospects/:id/stage` | Pindah stage pipeline | All |
| PATCH | `/prospects/:id/assign` | Reassign ke sales lain | Manager, Admin |
| DELETE | `/prospects/:id` | Hapus prospek (soft delete) | Admin |
| GET | `/prospects/:id/history` | History timeline lengkap (immutable) | All |
| GET | `/prospects/overdue-followup` | Prospek > 7 hari tidak di-follow-up | Manager, Admin |
| GET | `/prospects/:id/followups` | List follow-up records | All |
| POST | `/prospects/:id/followups` | Tambah follow-up baru | All |
| POST | `/prospects/:id/followups/:fid/attachments` | Upload bukti gambar | All |
| DELETE | `/prospects/:id/followups/:fid/attachments/:aid` | Hapus attachment | Admin |
| GET | `/followups/reminders/today` | Follow-up jadwal hari ini | All (own) |

### 8.5 Tasks

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/tasks` | List tasks (filter status, assignee, priority) | All |
| POST | `/tasks` | Buat task baru | All |
| GET | `/tasks/:id` | Detail task + komentar | All |
| PATCH | `/tasks/:id` | Update task (status, assignee, dll) | All |
| DELETE | `/tasks/:id` | Hapus task | Admin, Manager |
| POST | `/tasks/:id/comments` | Tambah komentar | All |
| DELETE | `/tasks/:id/comments/:cid` | Hapus komentar | Admin, pemilik |

### 8.6 Absensi

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| POST | `/attendance/clock-in` | Clock-in dengan koordinat GPS | All |
| POST | `/attendance/clock-out` | Clock-out dengan koordinat GPS | All |
| POST | `/attendance/sync` | Sync clock-in offline (batch) | All |
| GET | `/attendance/today` | Status absensi hari ini (user sendiri) | All |
| GET | `/attendance/me` | Riwayat absensi user sendiri (paginate) | All |
| GET | `/attendance/me/summary` | Rekap bulanan user sendiri | All |
| GET | `/attendance` | Semua rekap absensi tim | Admin, Manager, HR |
| GET | `/attendance/export` | Export CSV rekap absensi | Admin, HR |
| GET | `/attendance/locations` | List lokasi kantor | All |
| POST | `/attendance/locations` | Tambah lokasi kantor | Admin |
| PATCH | `/attendance/locations/:id` | Update lokasi kantor | Admin |
| DELETE | `/attendance/locations/:id` | Hapus lokasi | Admin |
| GET | `/attendance/leaves` | List pengajuan cuti (user sendiri / tim) | All |
| POST | `/attendance/leaves` | Ajukan cuti/izin | All |
| GET | `/attendance/leaves/:id` | Detail pengajuan | All |
| PATCH | `/attendance/leaves/:id/approve` | Setujui cuti | Manager, Admin |
| PATCH | `/attendance/leaves/:id/reject` | Tolak cuti | Manager, Admin |
| GET | `/attendance/leave-types` | List jenis cuti | All |
| POST | `/attendance/leave-types` | Tambah jenis cuti | Admin |

### 8.7 Notifikasi

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/notifications` | List notifikasi user | All |
| PATCH | `/notifications/:id/read` | Tandai sudah dibaca | All |
| PATCH | `/notifications/read-all` | Tandai semua dibaca | All |
| GET | `/notifications/preferences` | Preferensi notifikasi | All |
| PATCH | `/notifications/preferences` | Update preferensi | All |
| POST | `/notifications/push/subscribe` | Daftar push subscription | All |
| DELETE | `/notifications/push/unsubscribe` | Hapus push subscription | All |

### 8.8 Backoffice

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/backoffice/audit-logs` | List audit log (filter, paginate) | Admin |
| GET | `/backoffice/audit-logs/export` | Export CSV audit log | Admin |
| GET | `/backoffice/settings` | Semua system settings | Admin |
| PATCH | `/backoffice/settings` | Update system settings | Admin |
| GET | `/backoffice/health` | Status integrasi & queue | Admin |

### 8.9 Dashboard & Reporting

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/dashboard/overview` | Widget utama (CRM, task, absensi) | All |
| GET | `/reports/pipeline` | Laporan pipeline deals | Manager, Admin |
| GET | `/reports/tasks` | Laporan task completion per user | Manager, Admin |
| GET | `/reports/attendance` | Laporan absensi per periode | Admin, HR |
| GET | `/reports/attendance/export` | Export CSV laporan absensi | Admin, HR |

---

## 9. Design System Guidelines

### 9.1 Filosofi

> **"Mobile-first, clarity-first."** Karena platform ini digunakan karyawan di HP untuk absensi dan di desktop untuk CRM, setiap komponen harus nyaman di kedua konteks. Tidak ada informasi yang tersembunyi, tidak ada aksi yang ambigu.

### 9.2 Color Palette

| Token | Hex | Penggunaan |
|-------|-----|------------|
| `primary-500` | `#2563EB` | CTA utama, link, fokus aktif |
| `primary-600` | `#1D4ED8` | Hover state CTA |
| `primary-50` | `#EFF6FF` | Background highlight ringan |
| `success-500` | `#16A34A` | Status hadir, deal Won, approved |
| `success-50` | `#F0FDF4` | Background success alert |
| `warning-500` | `#D97706` | Terlambat, deadline dekat |
| `warning-50` | `#FFFBEB` | Background warning |
| `danger-500` | `#DC2626` | Error, tidak hadir, rejected |
| `danger-50` | `#FEF2F2` | Background error/danger |
| `neutral-900` | `#111827` | Teks utama |
| `neutral-500` | `#6B7280` | Teks sekunder, placeholder |
| `neutral-200` | `#E5E7EB` | Border, divider |
| `neutral-50` | `#F9FAFB` | Background halaman |
| `white` | `#FFFFFF` | Background card |

**Dark Mode:** Semua token punya pasangan dark mode via Tailwind `dark:` prefix. Diaktifkan berdasarkan system preference.

### 9.3 Typography

Font: **Inter** (Google Fonts) — clean, readable di semua ukuran.

| Nama | Size | Weight | Line Height | Penggunaan |
|------|------|--------|-------------|------------|
| `display-lg` | 30px | 700 | 1.2 | Judul halaman utama |
| `display-sm` | 24px | 700 | 1.3 | Judul section |
| `heading-lg` | 20px | 600 | 1.4 | Card title, modal heading |
| `heading-sm` | 16px | 600 | 1.4 | Sub-heading, label grup |
| `body-lg` | 16px | 400 | 1.6 | Paragraf, form label |
| `body-sm` | 14px | 400 | 1.5 | Konten tabel, deskripsi |
| `caption` | 12px | 400 | 1.4 | Timestamp, meta info |
| `label` | 12px | 500 | 1 | Badge, chip, tag |

### 9.4 Spacing System

Berbasis 4px grid. Gunakan kelipatan 4:

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`

| Token | Value | Contoh Penggunaan |
|-------|-------|-------------------|
| `space-1` | 4px | Gap antara icon dan label |
| `space-2` | 8px | Padding chip/badge |
| `space-3` | 12px | Gap dalam form field |
| `space-4` | 16px | Padding card, gap antar item list |
| `space-6` | 24px | Padding halaman mobile |
| `space-8` | 32px | Gap antar section |
| `space-12` | 48px | Margin antar halaman section |

### 9.5 Breakpoints (Mobile-First)

| Nama | Min-width | Target Device |
|------|-----------|---------------|
| `xs` (default) | 0px | HP kecil (320–374px) |
| `sm` | 375px | HP standar |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Wide desktop |

### 9.6 Component Library (shadcn/ui based)

Semua komponen dibangun di atas **shadcn/ui** + **Radix UI** + **Tailwind**. Tidak membuat komponen dari nol kecuali sangat spesifik.

| Komponen | Variant | Catatan |
|----------|---------|---------|
| `Button` | primary, secondary, ghost, danger, icon-only | Min touch target 44×44px di mobile |
| `Input` | default, error, disabled | Label selalu di atas (bukan floating) |
| `Select` | single, searchable | Gunakan `cmdk` untuk searchable |
| `Badge` | success, warning, danger, neutral | Dipakai untuk status absensi, deal stage |
| `Card` | default, interactive (clickable) | Shadow subtle: `shadow-sm` |
| `Modal / Dialog` | sm, md, lg | Full-screen di mobile |
| `Sheet / Drawer` | bottom (mobile), right (desktop) | Untuk form edit di mobile |
| `Table` | default, compact | Horizontal scroll di mobile |
| `Kanban Board` | draggable via dnd-kit | Pipeline deals |
| `Calendar` | bulan view | Riwayat absensi |
| `Toast` | success, error, warning | Konfirmasi aksi |
| `Skeleton` | default | Loading state semua komponen |
| `Avatar` | image + fallback initials | User profile |
| `GPS Map** | Leaflet.js embed | Tampilkan pin lokasi absensi |

### 9.7 Komponen Absensi (Khusus)

Dirancang mobile-first, aksi utama harus bisa dilakukan dengan satu tangan:

```
┌──────────────────────────┐
│   Selasa, 3 Juni 2025    │  ← Tanggal hari ini
│                          │
│  📍 Dalam radius kantor  │  ← Status GPS (hijau/merah)
│     Jarak: 45m           │
│                          │
│  ┌────────────────────┐  │
│  │   CLOCK IN         │  │  ← Tombol besar, min 80px height
│  │   09:00            │  │
│  └────────────────────┘  │
│                          │
│  Kemarin: Hadir 08:58    │  ← Info hari sebelumnya
└──────────────────────────┘
```

- Tombol Clock-In/Out: `h-20`, full-width, warna berbeda (biru/merah)
- Status GPS: indikator warna real-time sebelum tombol aktif
- Feedback: loading spinner saat proses, lalu toast konfirmasi
- Offline indicator: banner kuning "Mode Offline — akan disinkron saat ada koneksi"

### 9.8 Ikonografi

Library: **Lucide React** (konsisten dengan shadcn/ui)

| Ikon | Konteks |
|------|---------|
| `Clock` | Absensi, jam |
| `MapPin` | Lokasi GPS |
| `Users` | Tim, karyawan |
| `BarChart2` | Dashboard, laporan |
| `CheckSquare` | Task selesai |
| `Bell` | Notifikasi |
| `Settings` | Backoffice, konfigurasi |
| `Building2` | Perusahaan |
| `CalendarDays` | Cuti, kalender |
| `Wifi` / `WifiOff` | Status koneksi |

### 9.9 Animasi & Motion

- Prinsip: **Subtle, functional** — animasi ada tujuan, bukan dekorasi
- Duration: `150ms` (micro-interaction), `250ms` (transisi halaman), `300ms` (modal)
- Easing: `ease-out` untuk masuk, `ease-in` untuk keluar
- Gunakan `framer-motion` untuk: page transition, modal, drag kanban
- Respek `prefers-reduced-motion`: semua animasi dimatikan jika user set reduced motion

---

## 10. Timeline & Milestones

Target MVP selesai dalam **4 minggu**.

| Minggu | Sprint | Output |
|--------|--------|--------|
| **Minggu 1** | Setup & Foundation | Monorepo + Turborepo, NestJS scaffold, Prisma schema + migrasi, Auth (JWT + Google SSO), PWA manifest + service worker dasar, Layout Next.js + Design tokens |
| **Minggu 2** | CRM + Absensi Core | Modul Kontak, Perusahaan, Pipeline Deal; **Modul Absensi: clock-in/out + GPS verify + rekap**; Backoffice: User Management + Audit Log |
| **Minggu 3** | Task + Notifikasi + Integrasi | Task management, **Cuti & approval workflow**, Web Push notifikasi, Offline sync (Background Sync), Slack integration, Backoffice: System Config |
| **Minggu 4** | Dashboard + PWA Polish + QA | Dashboard & reporting (CRM + Absensi), **PWA install prompt + Lighthouse audit**, Bug fixing, UAT internal (3 role berbeda), Deploy production |

### Definisi "Done" untuk MVP

- Semua fitur Must Have berjalan tanpa critical bug
- PWA: Lighthouse PWA score ≥ 90, installable di Android & iOS (via "Add to Home Screen")
- Offline clock-in berfungsi dan sync otomatis
- Diuji oleh minimal 5 internal user dari role berbeda
- Deployed ke environment production dengan HTTPS
- Monitoring aktif: Sentry + Better Uptime

---

## 11. Risiko & Mitigasi

| Risiko | Kemungkinan | Dampak | Mitigasi |
|--------|-------------|--------|----------|
| Scope creep (fitur absensi meluas) | Tinggi | Timeline meleset | Freeze scope; cuti & rekap masuk Minggu 3 bukan lebih awal |
| GPS tidak akurat di dalam gedung | Sedang | Karyawan tidak bisa absen | Tambah toleransi radius; fallback manual approval oleh manager |
| Background Sync tidak didukung browser lama | Sedang | Offline sync tidak jalan | Polyfill + fallback: simpan di localStorage, user klik "Sync Manual" |
| iOS PWA: Web Push tidak didukung (< iOS 16.4) | Sedang | Push notif absen di iPhone lama | Informasikan user; fallback ke email notif |
| Integrasi Google/Slack lebih lama dari estimasi | Sedang | Delay notif | OAuth flow mulai Minggu 1 paralel dengan CRM |
| Tim kekurangan kapasitas | Rendah | Fitur terpotong | Prioritaskan Must Have; Should Have bisa digeser ke sprint berikutnya |

---

## 12. Metrics Keberhasilan

| Metrik | Target (30 hari post-launch) |
|--------|------------------------------|
| Adopsi absensi | ≥ 90% karyawan clock-in via platform (bukan manual) |
| PWA install rate | ≥ 60% karyawan install di HP |
| Adopsi CRM | ≥ 80% sales aktif input kontak/deal per minggu |
| Offline sync success rate | ≥ 99% clock-in offline berhasil disinkron |
| Bug critical | 0 dalam 2 minggu post-launch |
| Lighthouse PWA score | ≥ 90 |
| NPS internal | ≥ 7/10 dari survey user |

---

## 13. Open Questions

**CRM Properti:**
- [ ] Apakah satu prospek bisa diassign ke lebih dari satu sales agent (co-assignment)?
- [ ] Apakah ada komisi/referral fee yang perlu dicatat per transaksi?
- [ ] Bagaimana handle unit yang sama diminati lebih dari satu prospek — siapa yang dapat priority?
- [ ] Apakah ada integrasi dengan sistem KPR bank tertentu (BCA, BTN, Mandiri)?
- [ ] Sumber lead apa saja yang paling relevan? (untuk konfigurasi dropdown)
- [ ] Apakah foto follow-up perlu di-watermark dengan nama sales & timestamp otomatis?

**Approval & Dokumen:**
- [ ] Berapa level maksimum approval yang dibutuhkan? (umumnya 2–3 level)
- [ ] Apakah approval cuti dan approval dokumen menggunakan chain yang sama atau terpisah?
- [ ] Format nomor surat yang digunakan perusahaan saat ini seperti apa? (untuk konfigurasi)
- [ ] Apakah Invoice perlu menyertakan simulasi KPR atau hanya tagihan langsung?
- [ ] Apakah Kwitansi harus ada tanda tangan basah atau cukup QR Code?

**Absensi & HR:**
- [ ] Apakah ada karyawan lapangan (marketing event, pameran) yang perlu absensi di luar kantor?
- [ ] Jam kerja berbeda per departemen (sales vs admin vs konstruksi)?
- [ ] Apakah perlu tracking lembur?

**Infrastruktur:**
- [ ] Domain untuk portal verifikasi — `verify.namaperumahan.com` atau subdomain lain?
- [ ] iOS push notification — berapa banyak karyawan pakai iPhone? (iOS < 16.4 tidak support Web Push)
- [ ] Apakah foto prospek dan dokumen perlu backup ke storage eksternal (Google Drive)?

---

## 14. Appendix

### Glossary

| Term | Definisi |
|------|----------|
| **PWA** | Progressive Web App — web app yang bisa diinstall dan bekerja offline seperti native app |
| **Service Worker** | Script background yang mengelola cache, offline, dan push notification di browser |
| **Background Sync** | API browser untuk mengirim data yang gagal saat offline, otomatis saat kembali online |
| **Prospek** | Calon pembeli unit rumah yang sedang dalam proses follow-up dan penjualan |
| **Cluster** | Kawasan perumahan yang dikembangkan oleh developer (misal: Cluster Melati) |
| **Tipe Unit** | Spesifikasi rumah berdasarkan luas bangunan/tanah (misal: Tipe 36/72 = 36m² bangunan, 72m² tanah) |
| **Kavling** | Satu unit lahan/rumah dengan nomor blok tertentu (misal: A-01) |
| **Hook** | Posisi kavling di sudut/pojok — biasanya lebih mahal |
| **Booking Fee** | Uang tanda jadi yang dibayar prospek untuk memblokir unit |
| **KPR** | Kredit Pemilikan Rumah — pinjaman bank untuk beli rumah |
| **Cash Keras** | Pembayaran tunai penuh tanpa kredit |
| **PPJB** | Perjanjian Pengikatan Jual Beli — kontrak sebelum AJB |
| **Akad** | Penandatanganan perjanjian kredit/jual beli resmi di hadapan notaris |
| **STK** | Serah Terima Kunci — proses penyerahan fisik unit ke pembeli |
| **Follow-up** | Aktivitas menghubungi atau menemui prospek untuk mendorong keputusan beli |
| **Immutable Log** | Catatan yang tidak bisa diubah atau dihapus setelah tersimpan |
| **Approval Chain** | Urutan pihak yang harus menyetujui suatu dokumen sebelum dianggap sah |
| **VAPID** | Standar keamanan untuk Web Push API (push notifikasi browser) |
| **SSO** | Single Sign-On — login menggunakan akun yang sudah ada (Google) |
| **doc_token** | Token unik yang terenkripsi di QR Code dokumen untuk verifikasi keaslian |

### Referensi
- [Figma Design File](#) — *(link akan diisi designer)*
- [DB Schema Diagram (dbdiagram.io)](#) — *(link akan diisi dev)*
- [API Documentation (Swagger)](#) — *(link akan diisi dev)*
- [PWA Checklist — web.dev](https://web.dev/pwa-checklist/)
- [NestJS Docs](https://docs.nestjs.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Workbox (next-pwa)](https://github.com/shadowwalker/next-pwa)
