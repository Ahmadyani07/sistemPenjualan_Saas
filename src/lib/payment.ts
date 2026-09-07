import { PaymentMethod } from "@/types";

export const KONFIG_PEMBAYARAN = {
  // Merchant QRIS dinamis - ganti dengan Merchant ID dari penyedia QRIS Anda
  qrisMerchantName: "TOKO KAS PINTAR",
  qrisMerchantCity: "JAKARTA",
  // Virtual Account bank
  bankAccounts: {
    va_bca: { bank: "BCA", noRekening: "8830 1234 5678", atasNama: "Toko Kas Pintar" },
    va_bri: { bank: "BRI", noRekening: "0022 0156 7890 123", atasNama: "Toko Kas Pintar" },
    va_mandiri: { bank: "Mandiri", noRekening: "1010 0056 7878", atasNama: "Toko Kas Pintar" },
    va_bni: { bank: "BNI", noRekening: "0702 9900 1122 33", atasNama: "Toko Kas Pintar" },
  },
  // E-wallet
  ewallet: {
    gopay: { provider: "GoPay", noTujuan: "0812-3456-7890", atasNama: "Toko Kas Pintar" },
    ovo: { provider: "OVO", noTujuan: "0812-3456-7890", atasNama: "Toko Kas Pintar" },
    dana: { provider: "DANA", noTujuan: "0812-3456-7890", atasNama: "Toko Kas Pintar" },
    linkaja: { provider: "LinkAja", noTujuan: "0812-3456-7890", atasNama: "Toko Kas Pintar" },
  },
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "tunai", label: "Tunai", group: "tunai", groupLabel: "Tunai", color: "#16a34a" },
  { id: "qris", label: "QRIS", group: "qris", groupLabel: "QRIS / Scan", color: "#0284c7" },
  { id: "va_bca", label: "BCA", group: "va", groupLabel: "Virtual Account", color: "#0060af" },
  { id: "va_bri", label: "BRI", group: "va", groupLabel: "Virtual Account", color: "#00529c" },
  { id: "va_mandiri", label: "Mandiri", group: "va", groupLabel: "Virtual Account", color: "#ffb800" },
  { id: "va_bni", label: "BNI", group: "va", groupLabel: "Virtual Account", color: "#f58220" },
  { id: "ewallet_gopay", label: "GoPay", group: "ewallet", groupLabel: "E-Wallet", color: "#00aad4" },
  { id: "ewallet_ovo", label: "OVO", group: "ewallet", groupLabel: "E-Wallet", color: "#4c2b83" },
  { id: "ewallet_dana", label: "DANA", group: "ewallet", groupLabel: "E-Wallet", color: "#1488ff" },
  { id: "ewallet_linkaja", label: "LinkAja", group: "ewallet", groupLabel: "E-Wallet", color: "#ed1c24" },
];

export function getMethodDetail(id: string) {
  const method = PAYMENT_METHODS.find((m) => m.id === id);
  if (!method) return null;

  if (id === "qris") {
    return {
      ...method,
      qrisMerchantName: KONFIG_PEMBAYARAN.qrisMerchantName,
      qrisMerchantCity: KONFIG_PEMBAYARAN.qrisMerchantCity,
    };
  }

  if (id.startsWith("va_")) {
    const bank = KONFIG_PEMBAYARAN.bankAccounts[id as keyof typeof KONFIG_PEMBAYARAN.bankAccounts];
    return { ...method, ...bank };
  }

  if (id.startsWith("ewallet_")) {
    const wallet = KONFIG_PEMBAYARAN.ewallet[id as keyof typeof KONFIG_PEMBAYARAN.ewallet];
    return { ...method, ...wallet };
  }

  return method;
}

export function generateTransactionNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TRX${yyyy}${mm}${dd}${random}`;
}
