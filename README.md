# StrayDex

StrayDex adalah aplikasi web ensiklopedia dan pendokumentasian kucing liar (*stray cats*). Aplikasi ini memungkinkan pengguna memotret kucing langsung dari kamera, memisahkan latar belakang otomatis menggunakan kecerdasan buatan di sisi peramban (*client-side AI*), serta mencatat lokasi GPS dan waktu perjumpaan secara otomatis.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Instalasi dan Menjalankan Proyek](#instalasi-dan-menjalankan-proyek)
- [Konfigurasi Supabase](#konfigurasi-supabase)
- [Skema Basis Data](#skema-basis-data)
- [Variabel Lingkungan](#variabel-lingkungan)
- [Perintah Development](#perintah-development)
- [Catatan Arsitektur](#catatan-arsitektur)

---

## Fitur Utama

### 1. Kamera Langsung
- Tombol navigasi tambah (`+`) langsung membuka antarmuka kamera in-app secara otomatis.
- Pengguna dapat langsung mengambil gambar tanpa harus membuka form input manual terlebih dahulu.
- Tersedia opsi beralih kamera (depan/belakang) dan opsi fallback untuk memilih berkas dari galeri perangkat.

### 2. Hapus Latar Belakang Otomatis (Client-Side AI)
- Memisahkan tubuh kucing dari latar belakang secara otomatis tepat setelah foto diambil atau dipilih.
- Berjalan langsung di peramban menggunakan model terkuantisasi `isnet_quint8` via ONNX Runtime Web.
- Pre-scaling gambar otomatis ke resolusi optimal (maksimal 1200px) sebelum inferensi guna menghemat penggunaan memori RAM.
- Menyimpan dua versi foto ke Supabase Storage: foto asli lengkap (`photo_url`) dan potongan tubuh kucing berformat PNG transparan (`photo_no_bg_url`).
- Pratinjau interaktif: Pengguna dapat memilih tampilan kartu antara "Tubuh Kucing Saja (Bersih)" atau "Foto Asli Lengkap".

### 3. Pencatatan Lokasi GPS & Waktu Otomatis
- Koordinat lintang dan bujur serta stempel waktu diambil secara otomatis saat pengguna menekan tombol Simpan.
- Reverse geocoding otomatis via OpenStreetMap Nominatim untuk mendeteksi alamat dan nama daerah.
- Tautan langsung ke Google Maps berdasarkan titik koordinat yang tersimpan.

### 4. Dashboard Koleksi (Dex Cards)
- Kartu anabul bergaya ensiklopedia (*Dex Cards*) dengan efek stiker pop-out melayang untuk potongan tubuh kucing tanpa latar belakang.
- Sorotan Anabul Hari Ini (*Spotlight*): Menampilkan satu anabul secara acak setiap sesi, dilengkapi tombol acak ulang.
- Pencarian berdasarkan nama anabul.
- Filter berdasarkan jenis ras/kategori dan pengurutan berdasarkan tanggal atau nama.
- Modal detail lengkap dan konfirmasi penghapusan data.

### 5. Akun & Manajemen Profil
- Autentikasi lengkap: Masuk, pendaftaran akun baru, reset kata sandi, dan pembaruan kata sandi.
- Halaman profil pengguna dengan ringkasan statistik total kucing terdata, variasi jenis, dan jumlah lokasi yang dikunjungi.
- Pengaturan profil: Ubah nama lengkap, nama pengguna, dan bio.

### 6. Desain Antarmuka Responsif
- Palet warna matcha susu hangat dengan kontras tinggi (memenuhi standar WCAG AA).
- Tipografi Montserrat proporsional dengan target sentuh tombol minimal 44px.
- Bilah navigasi samping untuk desktop dan dock mengambang dengan tombol kamera aksi cepat untuk perangkat seluler.
- Dukungan tema terang dan gelap.

---

## Tech Stack

| Kategori | Teknologi | Deskripsi |
| --- | --- | --- |
| **Framework UI** | React 19 | Pustaka antarmuka komponen |
| **Bahasa** | TypeScript | Type safety dan kejelasan kontrak data |
| **Build Tool** | Vite 8 | Bundler berkecepatan tinggi dengan HMR |
| **Backend & Auth** | Supabase | PostgreSQL, Auth, dan Object Storage |
| **Routing** | React Router 7 | Navigasi halaman sisi klien |
| **AI Inference** | @imgly/background-removal | Penghapusan latar belakang berbasis WebAssembly |
| **AI Runtime** | onnxruntime-web 1.21.0 | Runtime eksekusi neural network di peramban |
| **Ikon** | Lucide React | Koleksi ikon SVG modern |
| **Format Tanggal** | date-fns | Pustaka format tanggal dengan lokalisasi Indonesia |
| **Geocoding** | OpenStreetMap Nominatim | Layanan reverse geocoding koordinat ke teks alamat |

---

## Struktur Proyek

```
StrayDex-App/
├── public/                         # Aset publik statis
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Skrip migrasi SQL Supabase
├── src/
│   ├── assets/                     # Gambar dan grafik statis
│   ├── components/
│   │   ├── camera/
│   │   │   ├── CameraModal.tsx     # Komponen kamera live in-app
│   │   │   └── CameraModal.css
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx       # Shell aplikasi (Sidebar & Mobile Dock)
│   │   │   └── Layout.css
│   │   └── ui/
│   │       ├── Button.tsx          # Komponen tombol reusable
│   │       ├── Button.css
│   │       ├── Input.tsx           # Komponen input form reusable
│   │       ├── Input.css
│   │       ├── LoadingSpinner.tsx  # Indikator pemuatan
│   │       ├── Modal.tsx           # Dialog modal reusable
│   │       └── Modal.css
│   ├── contexts/
│   │   └── AuthContext.tsx         # State manajemen autentikasi Supabase
│   ├── hooks/
│   │   ├── useAnimals.ts           # Operasi CRUD data anabul
│   │   ├── useAnimalTypes.ts       # Manajemen master kategori anabul
│   │   ├── useGeolocation.ts       # Koordinat GPS & reverse geocoding
│   │   └── useProfile.ts           # Manajemen profil pengguna
│   ├── lib/
│   │   ├── backgroundRemoval.ts    # Helper inferensi AI hapus background
│   │   ├── storage.ts              # Fungsi unggah dan hapus file foto
│   │   └── supabase.ts             # Inisialisasi klien Supabase
│   ├── pages/
│   │   ├── add/
│   │   │   ├── AddAnimalPage.tsx   # Formulir tambah dan edit anabul
│   │   │   └── AddAnimal.css
│   │   ├── auth/
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── UpdatePasswordPage.tsx
│   │   │   └── Auth.css
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx   # Tampilan utama kartu koleksi
│   │   │   └── Dashboard.css
│   │   └── profile/
│   │       ├── ProfilePage.tsx     # Tampilan statistik dan edit profil
│   │       └── Profile.css
│   ├── routes/
│   │   └── index.tsx               # Konfigurasi rute dan proteksi auth
│   ├── types/
│   │   ├── database.ts             # Definisi skema tabel Supabase
│   │   └── index.ts                # Tipe entitas aplikasi
│   ├── App.tsx                     # Root component aplikasi
│   ├── index.css                   # Variabel token desain dan gaya global
│   └── main.tsx                    # Titik masuk aplikasi
├── .env.example                    # Template variabel lingkungan
├── package.json                    # Konfigurasi dependensi dan skrip proyek
├── tsconfig.json                   # Konfigurasi kompilator TypeScript
└── vite.config.ts                  # Konfigurasi bundler Vite dan header server
```

---

## Instalasi dan Menjalankan Proyek

### Prasyarat
- Node.js versi 18 ke atas
- npm versi 9 ke atas
- Akun Supabase aktif (dapat dibuat gratis di [supabase.com](https://supabase.com))

### Langkah Pemasangan

1. Clone repositori:
   ```bash
   git clone https://github.com/HasyaRayyan/StrayDex-App.git
   cd StrayDex-App
   ```

2. Pasang dependensi:
   ```bash
   npm install
   ```

3. Salin file template lingkungan:
   ```bash
   cp .env.example .env
   ```
   Isi berkas `.env` dengan kredensial Supabase URL dan Anon Key proyek Anda.

4. Jalankan development server:
   ```bash
   npm run dev
   ```
   Buka peramban di `http://localhost:5173/`.

---

## Konfigurasi Supabase

### 1. Eksekusi Skrip Migrasi
Buka tab **SQL Editor** pada dashboard Supabase, kemudian salin dan jalankan seluruh isi file `supabase/migrations/001_initial_schema.sql`.

Skrip ini mencakup:
- Pembuatan tabel `profiles`, `animal_types`, dan `animals`.
- Penambahan kolom `photo_no_bg_url` pada tabel `animals`.
- Pengaktifan Row Level Security (RLS) di seluruh tabel agar tiap pengguna hanya dapat memodifikasi datanya sendiri.
- Pembuatan bucket penyimpanan `animal-photos` untuk penampungan foto publik.
- Pembuatan fungsi trigger untuk sinkronisasi profil saat registrasi dan pembaruan kolom waktu `updated_at`.

### 2. Pengaturan Redirect URL Auth
Pada dashboard Supabase masuk ke menu **Authentication** > **URL Configuration**:
- **Site URL**: Masukkan `http://localhost:5173` (lokal) atau domain deployment Anda.
- **Redirect URLs**: Tambahkan `http://localhost:5173/update-password`.

---

## Skema Basis Data

```
┌─────────────────────┐       ┌─────────────────────┐
│      profiles       │       │    animal_types     │
├─────────────────────┤       ├─────────────────────┤
│ id (PK, FK auth)    │       │ id (PK, uuid)       │
│ username (unique)   │       │ name (unique)       │
│ full_name           │       │ icon                │
│ avatar_url          │       │ created_at          │
│ bio                 │       │ user_id (FK auth)   │
│ created_at          │       └──────────┬──────────┘
│ updated_at          │                  │
└─────────────────────┘                  │
                                         │
┌────────────────────────────────────────┘
│
│  ┌──────────────────────────┐
│  │        animals           │
│  ├──────────────────────────┤
│  │ id (PK, uuid)            │
│  │ user_id (FK auth)        │
│  │ name                     │
├──│ type_id (FK animal_types)│
   │ description              │
   │ photo_url                │
   │ photo_no_bg_url          │
   │ latitude                 │
   │ longitude                │
   │ location_name            │
   │ captured_at              │
   │ created_at               │
   │ updated_at               │
   └──────────────────────────┘
```

---

## Variabel Lingkungan

Pastikan berkas `.env` memiliki variabel berikut:

| Variabel | Deskripsi | Status |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | URL endpoint instans proyek Supabase | Wajib |
| `VITE_SUPABASE_ANON_KEY` | Kunci otentikasi publik anon Supabase | Wajib |

---

## Perintah Development

```bash
# Menjalankan development server lokal
npm run dev

# Memeriksa tipe data dengan kompilator TypeScript
npm run build

# Menjalankan linter oxlint
npm run lint

# Pratinjau hasil build produksi secara lokal
npm run preview
```

---

## Catatan Arsitektur

### Isolasi Lintas Asal (Cross-Origin Isolation)
Modul WebAssembly inferensi neural network membutuhkan akses memori `SharedArrayBuffer` pada peramban berbasis Chromium. File `vite.config.ts` telah dikonfigurasi dengan header HTTP khusus pada server lokal:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: credentialless`

Header `credentialless` memastikan peramban mengaktifkan multithreading WebAssembly tanpa memblokir pemuatan gambar eksternal (seperti file CDN Supabase Storage dan peta OpenStreetMap).

---

## Lisensi

Didistribusikan di bawah Lisensi MIT. Bebas dimodifikasi dan dikembangkan untuk keperluan non-komersial maupun komersial.
