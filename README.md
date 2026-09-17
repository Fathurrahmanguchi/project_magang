# Sistem Pencarian Kode Barang Inventaris — BPKAD Kota Bekasi

Aplikasi web modern untuk pencarian dan penelusuran Kode Barang Milik Daerah (BMD) di lingkungan Badan Pengelolaan Keuangan dan Aset Daerah (BPKAD) Kota Bekasi. Aplikasi ini dirancang untuk memudahkan aparatur sipil negara dan pengelola aset dalam mengidentifikasi kodefikasi barang inventaris secara cepat, akurat, dan terstruktur.

---

## Daftar Isi

- [Project Overview](#project-overview)
- [Main Features](#main-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation / Clone Repository](#installation--clone-repository)
- [Environment Configuration](#environment-configuration)
- [Running with Docker (Direkomendasikan)](#running-with-docker-direkomendasikan)
- [Database Initialization & Seeding](#database-initialization--seeding)
- [Accessing the Application](#accessing-the-application)
- [API Information](#api-information)
- [Running Without Docker (Pengembangan Lokal)](#running-without-docker-pengembangan-lokal)
- [Koneksi Database GUI (DBeaver)](#koneksi-database-gui-dbeaver)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

Sistem ini membantu pengelolaan aset daerah dengan menyediakan mesin pencari kode barang inventaris standar pemerintah. Berdasarkan master data inventaris (`data/kode_barang.csv`), sistem memetakan hierarki kode 7 tingkat (Golongan, Bidang, Kelompok, Sub Kelompok, hingga Rincian Objek) serta menyediakan antarmuka responsif yang memudahkan pencarian bahkan dengan kata kunci tidak baku maupun singkatan populer.

---

## Main Features

1. **Pencarian Cepat & Autocomplete**:
   - Menampilkan saran pencarian instan saat pengguna mengetik nama atau kode barang.
   - Menggunakan pencarian berbasis teks penuh (*full-text/fuzzy search*) dengan ekstensi PostgreSQL `pg_trgm`.

2. **Mesin Sinonim Cerdas (*Synonym Matching*)**:
   - Mampu mengenali istilah umum dan singkatan teknis (contoh: pencarian `pc`, `pc unit`, `laptop`, `komputer`, `ac`, `pendingin ruangan`, `printer`, dll.) dan menempatkan hasil paling relevan di urutan teratas.

3. **Hierarki Klasifikasi Aset Lengkap**:
   - Menampilkan struktur pohon klasifikasi barang: Golongan → Bidang → Kelompok → Sub Kelompok → Rincian Objek.
   - Menyajikan informasi kode induk (*parent*) dan sub-kode turunan (*children*).

4. **Kategori Populer Aset Daerah (KIB)**:
   - Kartu akses cepat untuk kelompok aset utama seperti Peralatan & Mesin, Gedung & Bangunan, Tanah, Jalan/Jaringan, dan Aset Lainnya.

5. **Modal Detail Interaktif**:
   - Menampilkan spesifikasi lengkap kode barang, status aktif, satuan, serta daftar sub-kode barang di bawahnya.

6. **Quick Copy Kode Barang**:
   - Tombol salin satu klik untuk menyalin format kodefikasi standar ke clipboard, dilengkapi animasi toast notification.

7. **Paginasi Data Efisien**:
   - Navigasi halaman cepat dengan batas penampilan data optimal untuk kenyamanan pengguna.

---

## Technology Stack

| Layer | Komponen / Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 5 | SPA responsif dengan Vanilla CSS modern |
| **Backend** | Node.js 20, Express 4 | RESTful API arsitektur modular (Service-Controller) |
| **Database** | PostgreSQL 16 (Alpine) | Database relasional dengan ekstensi `pg_trgm` |
| **Web Server / Proxy** | Nginx (Alpine) | Reverse proxy untuk melayani static build dan meneruskan `/api/` |
| **Containerization** | Docker, Docker Compose | Orkestrasi multi-container mandiri |
| **Testing & Quality** | Jest, Supertest, ESLint | Pengujian otomatis unit & integration endpoint |
| **CI/CD** | GitHub Actions | Automated build & test pipeline (`.github/workflows/ci.yml`) |

---

## Project Structure

```text
project_magang/
├── .github/
│   └── workflows/
│       └── ci.yml             # Pipeline CI/CD GitHub Actions
├── backend/
│   ├── src/
│   │   ├── controllers/       # Controller request-response handler
│   │   ├── middleware/        # Middleware error handling & validasi
│   │   ├── routes/            # Rute endpoint REST API
│   │   ├── services/          # Logika bisnis pencarian & kueri database
│   │   ├── app.js             # Konfigurasi instance Express & middleware
│   │   ├── db.js              # Manajemen koneksi pool PostgreSQL
│   │   └── server.js          # Entry point server backend
│   ├── tests/                 # Unit & integration testing
│   ├── .env.example           # Template environment variable backend
│   ├── Dockerfile             # Spesifikasi image container backend
│   └── package.json           # Dependensi & skrip backend
├── data/
│   └── kode_barang.csv        # Master data CSV kode barang inventaris
├── database/
│   ├── migrate.js             # Skrip eksekusi migrasi skema via Node.js
│   ├── schema.sql             # Skema DDL tabel, indeks GIN trgm, & trigger
│   └── seed.js                # Skrip parsing data CSV dan database seeder
├── frontend/
│   ├── src/
│   │   ├── components/        # Komponen UI (Navbar, SearchBar, CategoryCards, ResultTable, DetailModal)
│   │   ├── api.js             # Klien fetch API
│   │   ├── App.jsx            # Komponen root aplikasi & manajemen state
│   │   ├── main.jsx           # Entry point React
│   │   └── styles.css         # Styling antarmuka sistem
│   ├── Dockerfile             # Multi-stage Docker build frontend (Node + Nginx)
│   ├── nginx.conf             # Konfigurasi reverse proxy Nginx
│   ├── package.json           # Dependensi & skrip frontend
│   └── vite.config.js         # Konfigurasi Vite & dev proxy server
├── .gitignore                 # Pengabaian berkas sensitif dan build
├── docker-compose.yml         # Konfigurasi orkestrasi service container
├── package.json               # Skrip pembantu di root project
└── README.md                  # Dokumentasi project
```

---

## Requirements

Untuk menjalankan aplikasi ini dengan Docker (alur termudah):
- **Docker Desktop** (versi 24.0+ dengan dukungan `docker compose`)
- RAM minimal 4 GB
- Koneksi internet (untuk download image pertama kali)

Jika ingin menjalankan manual tanpa Docker:
- **Node.js** (v18.x atau v20.x LTS) & **npm**
- **PostgreSQL** 16 (dengan ekstensi `pg_trgm`)

---

## Installation / Clone Repository

Kloning repositori ini ke komputer lokal Anda:

```bash
git clone https://github.com/Fathurrahmanguchi/project_magang.git
cd project_magang
```

---

## Environment Configuration

Aplikasi ini sudah dirancang **siap jalan** (*zero-config*) menggunakan Docker Compose tanpa mewajibkan pembuatan file `.env` manual untuk deployment standar.

Variabel lingkungan yang digunakan oleh backend didefinisikan pada `backend/.env.example`:

| Variabel | Default Docker | Default Dev Lokal | Keterangan |
| :--- | :--- | :--- | :--- |
| `PORT` | `4000` | `4001` | Port HTTP backend |
| `DATABASE_URL` | `postgresql://bkpad_user:bkpad_pass@db:5432/bkpad_inventaris` | `postgresql://bkpad_user:bkpad_pass@localhost:5433/bkpad_inventaris` | Format connection string PostgreSQL |
| `DATABASE_SSL` | `false` | `false` | Penggunaan enkripsi SSL database |

> **Catatan Keamanan**: Jangan pernah melakukan commit file `.env` yang memuat kredensial rahasia ke Git. File `.env` sudah diabaikan secara otomatis di `.gitignore`.

---

## Running with Docker (Direkomendasikan)

Alur berikut merupakan langkah termudah untuk menjalankan seluruh ekosistem aplikasi (Database, Backend, dan Frontend) sekaligus:

### 1. Bangun dan Jalankan Semua Container

```bash
docker compose up --build -d
```

Command ini akan mengunduh image, membangun image frontend dan backend, serta menjalankan 3 service:
- `bkpad_db` (PostgreSQL 16)
- `bkpad_backend` (Express API)
- `bkpad_frontend` (Nginx + React)

*Catatan: Skema database (`database/schema.sql`) akan langsung dieksekusi secara otomatis saat container database pertama kali dibuat.*

### 2. Jalankan Seeding Data Master Barang

Setelah container berjalan dengan status *healthy*, lakukan pengisian data master kode barang dari file CSV ke database dengan command:

```bash
docker compose exec backend node database/seed.js
```

Proses ini akan membaca `data/kode_barang.csv`, memasukkan kategori unik, memetakan hierarki 7 level kode barang, dan mengisi rincian klasifikasi. Script ini bersifat **idempoten** (`ON CONFLICT DO UPDATE`), sehingga aman dijalankan kembali tanpa menduplikasi data.

### 3. Selesai & Buka Aplikasi

Buka browser Anda dan akses aplikasi di:
```text
http://localhost:8080
```

---

## Database Initialization & Seeding

1. **Inisialisasi Skema Tabel (`database/schema.sql`)**:
   - Dieksekusi otomatis oleh PostgreSQL saat inisialisasi awal container melalui volume `/docker-entrypoint-initdb.d/01-schema.sql`.
   - Mengaktifkan ekstensi `pg_trgm`, membuat tabel `kategori` dan `kode_barang`, serta menyusun indeks GIN dan B-Tree untuk performa query optimal.

2. **Seeding Data Barang (`database/seed.js`)**:
   - Memproses data dari `data/kode_barang.csv`.
   - Mengelompokkan kategori barang secara otomatis.
   - Memperbaiki data klasifikasi hierarkis (*Golongan, Bidang, Kelompok, Sub Kelompok, Rincian Objek*).

Untuk mereset database dari nol (jika diperlukan):
```bash
docker compose down -v
docker compose up --build -d
docker compose exec backend node database/seed.js
```

---

## Accessing the Application

| Layanan | URL / Host | Keterangan |
| :--- | :--- | :--- |
| **Frontend Web** | `http://localhost:8080` | Antarmuka utama pencarian kode barang |
| **Backend Health Check** | `http://localhost:4000/api/health` | Cek status server Express |
| **Backend API Base** | `http://localhost:4000/api` | Akses langsung endpoint backend |
| **PostgreSQL Database** | `localhost:5433` | Port PostgreSQL di host (internal container: 5432) |

---

## API Information

Backend menyediakan endpoint RESTful API berbasis JSON:

| Method | Endpoint | Query Parameter | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | - | Mengembalikan status kesehatan layanan backend |
| `GET` | `/api/kategori` | - | Mengambil seluruh daftar kategori inventaris |
| `GET` | `/api/kode-barang` | `q` (string)<br>`kategori_id` (int)<br>`page` (int, default: 1)<br>`limit` (int, default: 20) | Mencari kode barang dengan pencarian teks, sinonim, filter kategori, dan paginasi |
| `GET` | `/api/kode-barang/:kode` | `:kode` (kodefikasi barang, mis. `1.3.2.05.01.03.001`) | Mengambil detail spesifikasi kode barang beserta daftar kode anak (*sub-codes*) |

#### Contoh Request:
```bash
# Cek server
curl http://localhost:4000/api/health

# Cari barang dengan kata kunci 'komputer'
curl "http://localhost:4000/api/kode-barang?q=komputer&page=1&limit=10"
```

---

## Running Without Docker (Pengembangan Lokal)

Jika Anda ingin menjalankan frontend dan backend secara native tanpa container:

### 1. Jalankan PostgreSQL
Pastikan instance PostgreSQL aktif di komputer lokal Anda (atau jalankan service database saja lewat Docker):
```bash
docker compose up db -d
```
*(Database akan terbuka di port `localhost:5433`)*

### 2. Setup & Jalankan Backend
```bash
cd backend

# Buat file konfigurasi .env
copy .env.example .env

# Install dependensi
npm install

# Jalankan migrasi dan seeding data
npm run migrate
npm run seed

# Jalankan server backend (mode dev dengan nodemon di port 4001)
npm run dev
```

### 3. Setup & Jalankan Frontend
Buka terminal baru:
```bash
cd frontend

# Install dependensi
npm install

# Jalankan server frontend Vite (di port 5173)
npm run dev
```

Buka `http://localhost:5173` di browser Anda. Dev server Vite akan otomatis meneruskan request `/api/*` ke backend di port `4001`.

---

## Koneksi Database GUI (DBeaver)

Untuk mengelola database secara visual menggunakan DBeaver atau database client lainnya:

1. Buka DBeaver dan buat koneksi baru bertipe **PostgreSQL**.
2. Masukkan parameter koneksi berikut:

| Parameter | Nilai |
| :--- | :--- |
| **Host** | `localhost` |
| **Port** | `5433` *(Perhatian: port 5433, bukan 5432)* |
| **Database** | `bkpad_inventaris` |
| **Username** | `bkpad_user` |
| **Password** | `bkpad_pass` |

3. Klik **Test Connection** untuk memverifikasi, lalu klik **Finish**.

---

## Troubleshooting

1. **Port Bentrok (`bind: address already in use`)**:
   - Jika port `8080`, `4000`, atau `5433` sudah digunakan aplikasi lain di komputer Anda, ubah pemetaan port host di file `docker-compose.yml` (misal ubah `"8080:80"` menjadi `"8081:80"`).

2. **Data Pencarian Masih Kosong**:
   - Pastikan Anda sudah menjalankan perintah seed data:
     ```bash
     docker compose exec backend node database/seed.js
     ```

3. **Status Database Belum Sehat saat Backend Naik**:
   - Konfigurasi `docker-compose.yml` sudah dilengkapi dengan `healthcheck` otomatis pada service `db`. Backend akan menunggu hingga database siap menerima koneksi sebelum berjalan.

4. **Koneksi DBeaver Ditolak (*Connection Refused*)**:
   - Pastikan container database sedang berjalan (`docker compose ps`).
   - Pastikan port yang dituju adalah port host **`5433`**, bukan port internal container `5432`.
