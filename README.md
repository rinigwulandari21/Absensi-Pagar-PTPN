# 🏢 SIA-MAGANG PTPN IV Regional 3

Sistem Informasi Absensi Mahasiswa Magang / PKL berbasis **React.js**, **Kamera Selfie (Tampak Muka)**, **Validasi GPS Geofencing Area PTPN IV Regional 3**, serta dilengkapi **Panel Admin Pembimbing**.

---

## 🎨 Tema Desain
- **Latar Belakang:** Putih Bersih (`#FFFFFF` & `#F8FAFC`)
- **Warna Utama & Aksen:** Biru Tua Elegan (*Deep Navy* `#1E3A8A` & *Royal Blue* `#2563EB`)

---

## 🔑 Akses Akun & Login

### 1. Akun Admin / Pembimbing Lapangan
Digunakan untuk memantau siapa saja anak magangnya dan memeriksa seluruh rekap kehadiran:
- **Username:** `admin`
- **Password:** `123`

### 2. Akun Mahasiswa Magang
Digunakan mahasiswa untuk melakukan presensi harian dengan kamera selfie dan deteksi lokasi:
- **Username:** `rini`
- **Password:** `123`
- *(Atau bisa mendaftar akun baru melalui tombol **Daftar Akun**)*

---

## ✨ Fitur-Fitur Utama

### 👑 1. Panel Admin (Admin Dashboard)
- **Daftar Seluruh Anak Magang:**
  - Mengetahui siapa saja mahasiswa magang yang terdaftar.
  - Rincian: Nama Lengkap, Username, Jurusan, Tempat Bagian Magang, Nama Mentor, serta Total Hari Kehadirannya.
- **Rekapitulasi Kehadiran Mahasiswa:**
  - Melihat kapan saja anak magang masuk (Hari, Tanggal, dan Jam Masuk).
  - Status validasi lokasi GPS riil di area Kantor PTPN IV Regional 3 (Jl. Rambutan No. 43 Pekanbaru).
  - Tombol **Lihat Foto** untuk memeriksa foto selfie ber-watermark digital resmi masing-masing anak magang.
  - **Filter & Pencarian:** Dapat memfilter data berdasarkan nama mahasiswa magang tertentu atau mencari tanggal kehadiran.
  - **Ekspor CSV (Excel):** Mengunduh rekap kehadiran lengkap dalam format CSV/Excel.

### 👤 2. Halaman Presensi Mahasiswa Magang
- **Presensi Pagi (Masuk) & Sore (Pulang):**
  - **🌅 Absen Masuk (Pagi):** Pencatatan kedatangan di kantor PTPN IV Regional 3.
  - **🌇 Absen Pulang (Sore):** Pencatatan kepulangan saat jam kerja magang berakhir.
  - Dilengkapi kartu status harian interaktif dan deteksi otomatis mode aktif.
- **Tampak Muka (Kamera Selfie):** Kamera aktif otomatis dengan panduan siluet wajah oval & watermark digital resmi (*[ABSEN MASUK (PAGI)]* / *[ABSEN PULANG (SORE)]*).
- **Deteksi GPS Otomatis:** Membaca titik koordinat satelit GPS perangkat riil pengguna (radius batas kantor 250m).
- **Riwayat Presensi:** Tabel rekapitulasi kehadiran dengan filter *Semua*, *Masuk*, dan *Pulang*.

---

## 🚀 Cara Menjalankan

Aplikasi berjalan di server lokal:
👉 **[http://localhost:5173/](http://localhost:5173/)**
