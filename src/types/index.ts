export interface User {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "kasir";
  tokoId: string;
  noHp: string;
  createdAt: Date;
}

export interface Produk {
  id: string;
  nama: string;
  harga: number;
  stok: number;
  stokMinimal: number;
  kategori: string;
  gambar: string;
  barcode: string;
  tokoId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransaksiItem {
  produkId: string;
  nama: string;
  harga: number;
  jumlah: number;
  subtotal: number;
}

export type MetodePembayaran =
  | "tunai"
  | "qris"
  | "va_bca"
  | "va_bri"
  | "va_mandiri"
  | "va_bni"
  | "ewallet_gopay"
  | "ewallet_ovo"
  | "ewallet_dana"
  | "ewallet_linkaja";

export interface Transaksi {
  id: string;
  items: TransaksiItem[];
  totalHarga: number;
  bayar: number;
  kembali: number;
  metodePembayaran: MetodePembayaran;
  pembayaranDetail?: {
    channel: string;
    noRekening?: string;
    atasNama?: string;
    merchantId?: string;
    qrisMerchantName?: string;
    ewalletProvider?: string;
    noTujuan?: string;
  };
  kasirId: string;
  tokoId: string;
  createdAt: Date;
}

export interface Toko {
  id: string;
  nama: string;
  alamat: string;
  telepon: string;
  ownerUid: string;
  createdAt: Date;
}

export interface CartItem {
  produkId: string;
  nama: string;
  harga: number;
  jumlah: number;
  stok: number;
  gambar: string;
}

export interface PaymentMethod {
  id: MetodePembayaran;
  label: string;
  group: "tunai" | "qris" | "va" | "ewallet";
  groupLabel: string;
  icon?: string;
  color?: string;
}
