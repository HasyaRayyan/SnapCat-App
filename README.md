# 🐾 StrayDex - Koleksi Anabul yang Kamu Temui

<p align="center">
  <strong>StrayDex</strong> adalah aplikasi web untuk mengoleksi dan mendokumentasikan hewan peliharaan liar (anabul) yang kamu temui di berbagai tempat. Foto, beri nama, dan simpan lokasi setiap anabul yang kamu jumpai!
</p>

---

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Tech Stack](#-tech-stack)
- [Struktur Project](#-struktur-project)
- [Setup & Instalasi](#-setup--instalasi)
- [Konfigurasi Supabase](#-konfigurasi-supabase)
- [Database Schema](#-database-schema)
- [Fitur Detail](#-fitur-detail)
- [Environment Variables](#-environment-variables)
- [Development](#-development)
- [Deployment](#-deployment)

---

## ✨ Fitur

### 🔐 Autentikasi
- **Login** - Masuk dengan email dan password
- **Register** - Daftar akun baru dengan username, nama lengkap, email, dan password
- **Reset Password** - Kirim link reset password via email
- **Update Password** - Ubah password melalui link dari email

### 📊 Dashboard
- **Random Anabul Spotlight** - Tampilkan anabul random yang pernah kamu foto
- **Lokasi Anabul** - Lihat di mana anabul tersebut difoto (dengan link ke Google Maps)
- **Grid Koleksi** - Tampilkan semua anabul dalam grid card yang responsif
- **Filter & Pencarian**:
  - Cari berdasarkan nama anabul
  - Filter berdasarkan jenis (Kucing, Anjing, dll)
  - Urutkan berdasarkan tanggal atau nama (ascending/descending)
- **Detail View** - Lihat detail lengkap anabul di modal
- **Hapus Anabul** - Hapus data anabul dengan konfirmasi

### 📸 Tambah Anabul
- **Foto Anabul** - Ambil foto langsung dari kamera atau pilih dari galeri
- **Crop Foto** - Crop foto untuk fokus ke anabul (built-in canvas crop tool)
- **Beri Nama** - Kasih nama untuk setiap anabul
- **Pilih Jenis** - Pilih jenis anabul (Kucing, Anjing, Kelinci, Hamster, Burung, Ikan, Kura-kura, dll)
- **Tambah Jenis Baru** - Tambah jenis anabul custom dengan emoji icon
- **Tanggal & Waktu** - Otomatis ambil tanggal dan jam saat ini (bisa diedit)
- **Deskripsi** - Tambah catatan/cerita tentang anabul
- **Lokasi Otomatis** - Ambil koordinat GPS dan nama lokasi otomatis (reverse geocoding via OpenStreetMap)
- **Edit Data** - Edit semua data anabul yang sudah disimpan

### 👤 Profil
- **Data Diri** - Lihat dan edit nama, username, dan bio
- **Statistik** - Jumlah anabul, jenis, dan lokasi yang pernah dikunjungi
- **Ganti Password** - Ubah password langsung dari halaman profil
- **Info Aplikasi** - Lihat versi aplikasi dan tech stack yang digunakan
- **Logout** - Keluar dari akun

---

## 🛠 Tech Stack

| Teknologi | Kegunaan |
|-----------|----------|
| **React 19** | UI Library |
| **TypeScript** | Type Safety |
| **Vite 8** | Build Tool & Dev Server |
| **Supabase** | Backend-as-a-Service (Auth, Database, Storage) |
| **React Router 7** | Client-side Routing |
| **Lucide React** | Icon Library |
| **date-fns** | Date Formatting |
| **OpenStreetMap Nominatim** | Reverse Geocoding |

---

## 📁 Struktur Project

```
StrayDex-App/
├── public/                         # Static assets
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database migration SQL
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx       # Sidebar + Mobile nav layout
│   │   │   └── Layout.css
│   │   └── ui/
│   │       ├── Button.tsx          # Reusable button component
│   │       ├── Button.css
│   │       ├── Input.tsx           # Reusable input component
│   │       ├── Input.css
│   │       ├── LoadingSpinner.tsx   # Loading indicator
│   │       ├── Modal.tsx           # Modal dialog component
│   │       └── Modal.css
│   ├── contexts/
│   │   └── AuthContext.tsx         # Auth context & provider
│   ├── hooks/
│   │   ├── useAnimals.ts           # CRUD operations for animals
│   │   ├── useAnimalTypes.ts       # Animal types management
│   │   ├── useGeolocation.ts       # GPS + reverse geocoding
│   │   └── useProfile.ts           # User profile management
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client initialization
│   │   └── storage.ts              # Photo upload/delete utilities
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── UpdatePasswordPage.tsx
│   │   │   └── Auth.css
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   └── Dashboard.css
│   │   ├── add/
│   │   │   ├── AddAnimalPage.tsx    # Tambah & Edit anabul
│   │   │   └── AddAnimal.css
│   │   └── profile/
│   │       ├── ProfilePage.tsx
│   │       └── Profile.css
│   ├── routes/
│   │   └── index.tsx               # Route configuration
│   ├── types/
│   │   ├── database.ts             # Supabase Database types
│   │   └── index.ts                # Type aliases
│   ├── App.tsx                     # Root component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
├── .env                            # Environment variables (git-ignored)
├── .env.example                    # Environment template
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Setup & Instalasi

### Prerequisites
- **Node.js** >= 18
- **npm** >= 9
- Akun **Supabase** (gratis di [supabase.com](https://supabase.com))

### Langkah Instalasi

```bash
# 1. Clone repository
git clone https://github.com/HasyaRayyan/StrayDex-App.git
cd StrayDex-App

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env dan isi dengan kredensial Supabase kamu

# 4. Jalankan development server
npm run dev
```

---

## 🔧 Konfigurasi Supabase

### 1. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) dan buat project baru
2. Catat **Project URL** dan **anon/public key** dari Settings > API

### 2. Jalankan Migration

Buka **SQL Editor** di Supabase Dashboard, lalu copy-paste isi file `supabase/migrations/001_initial_schema.sql` dan jalankan.

Migration ini akan:
- ✅ Membuat tabel `profiles`, `animal_types`, dan `animals`
- ✅ Mengaktifkan Row Level Security (RLS) di semua tabel
- ✅ Membuat policy agar user hanya bisa akses data miliknya
- ✅ Membuat index untuk performa query
- ✅ Insert data default jenis anabul (Kucing, Anjing, Kelinci, dll)
- ✅ Membuat trigger otomatis untuk:
  - Auto-create profile saat user baru register
  - Auto-update `updated_at` saat data diubah
- ✅ Membuat storage bucket `animal-photos` untuk foto anabul

### 3. Konfigurasi Auth

Di Supabase Dashboard > Authentication > Settings:
- **Site URL**: `http://localhost:5173` (development) atau URL production kamu
- **Redirect URLs**: Tambahkan `http://localhost:5173/update-password`

### 4. Isi Environment Variables

Edit file `.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

---

## 🗄 Database Schema

```
┌─────────────────────┐     ┌─────────────────────┐
│      profiles       │     │    animal_types      │
├─────────────────────┤     ├─────────────────────┤
│ id (PK, FK users)   │     │ id (PK, uuid)       │
│ username (unique)   │     │ name (unique)        │
│ full_name           │     │ icon                 │
│ avatar_url          │     │ created_at           │
│ bio                 │     │ user_id (FK users)   │
│ created_at          │     └──────────┬──────────┘
│ updated_at          │                │
└─────────────────────┘                │
                                       │
┌──────────────────────────────────────┘
│
│  ┌──────────────────────────┐
│  │        animals           │
│  ├──────────────────────────┤
│  │ id (PK, uuid)            │
│  │ user_id (FK users)       │
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

### Row Level Security (RLS)

Semua tabel dilindungi RLS:
- **profiles**: User hanya bisa lihat & edit profilnya sendiri
- **animal_types**: Semua user bisa lihat, tapi hanya bisa tambah/edit/hapus milik sendiri
- **animals**: User hanya bisa CRUD data anabul miliknya sendiri

---

## 📖 Fitur Detail

### Autentikasi Flow

```
Register → Email Konfirmasi → Login → Dashboard
                                ↓
                         Lupa Password → Email Reset → Update Password
```

### Tambah Anabul Flow

```
Pilih/Foto Anabul → (Opsional) Crop Foto → Isi Nama & Jenis
       ↓
Auto Get Tanggal/Jam → Isi Deskripsi → Get Lokasi GPS → Simpan
```

### Fitur Lokasi

- Menggunakan **Geolocation API** browser untuk mendapatkan koordinat GPS
- **Reverse geocoding** via OpenStreetMap Nominatim API untuk mendapatkan nama lokasi dalam Bahasa Indonesia
- Link langsung ke **Google Maps** untuk navigasi ke lokasi foto

### Fitur Crop Foto

- Built-in canvas-based crop tool (tanpa library eksternal)
- Drag untuk memilih area crop
- Preview real-time sebelum diterapkan

---

## 🔐 Environment Variables

| Variable | Deskripsi | Wajib |
|----------|-----------|-------|
| `VITE_SUPABASE_URL` | URL project Supabase kamu | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key Supabase | ✅ |

---

## 💻 Development

```bash
# Jalankan dev server
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build untuk production
npm run build

# Preview build result
npm run preview
```

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push project ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Tambahkan Environment Variables di Vercel Dashboard
4. Deploy!

### Netlify

1. Push project ke GitHub
2. Connect repository di [netlify.com](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Tambahkan `_redirects` file di `public/`:
   ```
   /*    /index.html   200
   ```

---

## 📝 Lisensi

MIT License - Dibuat dengan ❤️ untuk para pecinta anabul

---

## 🐾 Credits

- Ikon oleh [Lucide](https://lucide.dev)
- Backend oleh [Supabase](https://supabase.com)
- Geocoding oleh [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org)
