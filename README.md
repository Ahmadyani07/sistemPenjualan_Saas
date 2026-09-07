# Kas Pintar — Sistem POS Digital SaaS untuk UMKM

Aplikasi kasir (Point of Sale) berbasis cloud yang dirancang khusus untuk UMKM. Kelola produk, stok, transaksi, laporan penjualan, dan metode pembayaran digital Indonesia (QRIS, Virtual Account, E-Wallet) dalam satu aplikasi — gratis tanpa biaya server berbayar.

## Fitur Utama

- **Dashboard** — ringkasan penjualan, total pendapatan, dan grafik performa
- **Kasir (POS)** — transaksi cepat dari grid produk, pencarian & keranjang real-time
- **Manajemen Produk** — CRUD produk dengan upload gambar (dikompres otomatis, tanpa biaya Firebase Storage)
- **Manajemen Stok** — pantau & update stok, peringatan stok menipis
- **Riwayat Transaksi** — daftar lengkap dengan pencarian berdasarkan nomor transaksi
- **Laporan & Analitik** — grafik penjualan, produk terlaris, breakdown metode pembayaran
- **Struk Digital** — cetak struk per transaksi (support cetak browser)
- **Profil & Toko** — kelola data pengguna dan profil toko
- **Metode Pembayaran Indonesia**:
  - Tunai
  - QRIS
  - Virtual Account: BCA, BRI, Mandiri, BNI
  - E-Wallet: GoPay, OVO, DANA, LinkAja

## Teknologi

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Firebase](https://firebase.google.com): Authentication (Email + Google), Firestore, Storage (opsional)
- [Recharts](https://recharts.org) untuk visualisasi data
- [Lucide React](https://lucide.dev) untuk ikon

## Menjalankan Proyek

### Prasyarat

- Node.js 18.18+ atau 20+
- Akun Firebase (paket gratis Spark sudah cukup, tidak perlu Storage)

### 1. Clone & Install

```bash
git clone https://github.com/Ahmadyani07/sistemPenjualan_Saas.git
cd sistemPenjualan_Saas
npm install
```

### 2. Konfigurasi Firebase

1. Buat proyek di [Firebase Console](https://console.firebase.google.com).
2. Aktifkan **Authentication** (Email/Password dan Google Sign-In).
3. Aktifkan **Firestore Database** (`Create database`).
4. Salin konfigurasi web SDK Anda, lalu buat file `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Terapkan Firebase Security Rules

Di Firebase Console → **Firestore → Rules**, salin isi [`firestore.rules`](./firestore.rules). Jika menggunakan Firebase Storage, salin juga [`storage.rules`](./storage.rules).

### 4. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Konfigurasi Pembayaran

Data merchant (nomor rekening VA, nomor e-wallet, nama merchant QRIS) diatur di:

```
src/lib/payment.ts
```

Sesuaikan `KONFIG_PEMBAYARAN` dengan rekening/nomor HP asli toko Anda. Catatan: ini adalah simulasi panduan pembayaran; untuk pembayaran otomatis real-time gunakan payment gateway (Midtrans, Xendit, dll.).

## Script

| Perintah          | Fungsi                              |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Menjalankan server pengembangan     |
| `npm run build`   | Membangun versi produksi            |
| `npm run start`   | Menjalankan versi produksi          |
| `npm run lint`    | Mengecek kode dengan ESLint         |

## Struktur Proyek

```
src/
├── app/                # Halaman & routes (App Router)
│   ├── (auth)/         # Login & register
│   ├── (dashboard)/    # Dashboard, kasir, produk, stok, transaksi, laporan, struk, profil
│   └── page.tsx        # Landing page
├── components/         # Komponen UI (Navbar, Sidebar, ImageUpload, dll.)
├── contexts/           # AuthContext
├── lib/                # Firebase, Firestore, payment config, util
└── types/              # Type definitions
```

## Deploy

Dengan Firebase `.env.local` yang sudah diisi, Anda bisa deploy ke Vercel:

```bash
npx vercel
```

## Lisensi

MIT