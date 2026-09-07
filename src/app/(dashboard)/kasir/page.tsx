"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { listenProdukByToko, createTransaksi } from "@/lib/firestore";
import { formatRupiah } from "@/lib/utils";
import { Produk, CartItem, MetodePembayaran } from "@/types";
import { PAYMENT_METHODS, getMethodDetail } from "@/lib/payment";
import Button from "@/components/ui/Button";

export default function KasirPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [showBayar, setShowBayar] = useState(false);
  const [bayar, setBayar] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<MetodePembayaran>("tunai");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user?.tokoId) return;
    const unsub = listenProdukByToko(user.tokoId, (data) => setProdukList(data));
    return () => unsub();
  }, [user]);

  const filteredProduk = produkList.filter((p) => {
    const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase());
    const matchKategori = filterKategori === "Semua" || p.kategori === filterKategori;
    return matchSearch && matchKategori && p.stok > 0;
  });

  const kategoriList = ["Semua", ...new Set(produkList.map((p) => p.kategori))];

  const addToCart = (produk: Produk) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.produkId === produk.id);
      if (existing) {
        if (existing.jumlah >= produk.stok) return prev;
        return prev.map((c) => c.produkId === produk.id ? { ...c, jumlah: c.jumlah + 1 } : c);
      }
      return [...prev, { produkId: produk.id, nama: produk.nama, harga: produk.harga, jumlah: 1, stok: produk.stok, gambar: produk.gambar }];
    });
  };

  const updateCartQty = (produkId: string, qty: number) => {
    if (qty <= 0) setCart((prev) => prev.filter((c) => c.produkId !== produkId));
    else setCart((prev) => prev.map((c) => c.produkId === produkId ? { ...c, jumlah: Math.min(qty, c.stok) } : c));
  };

  const removeFromCart = (produkId: string) => setCart((prev) => prev.filter((c) => c.produkId !== produkId));
  const clearCart = () => setCart([]);

  const totalHarga = cart.reduce((sum, c) => sum + c.harga * c.jumlah, 0);
  const totalItem = cart.reduce((sum, c) => sum + c.jumlah, 0);
  const kembali = parseInt(bayar || "0") - totalHarga;

  const handleBayar = async () => {
    if (!user?.tokoId || cart.length === 0) return;
    if (selectedMethod === "tunai" && (parseInt(bayar) < totalHarga || !bayar)) return;

    setProcessing(true);
    try {
      const bayarAmount = selectedMethod === "tunai" ? parseInt(bayar) : totalHarga;
      const methodDetail = getMethodDetail(selectedMethod);

      const pembayaranDetail = selectedMethod === "qris"
        ? { channel: "QRIS", qrisMerchantName: (methodDetail as Record<string, unknown>)?.qrisMerchantName as string || "TOKO KAS PINTAR" }
        : selectedMethod.startsWith("va_")
          ? { channel: (methodDetail as Record<string, unknown>)?.bank as string || selectedMethod, noRekening: (methodDetail as Record<string, unknown>)?.noRekening as string || "", atasNama: (methodDetail as Record<string, unknown>)?.atasNama as string || "" }
          : selectedMethod.startsWith("ewallet_")
            ? { channel: (methodDetail as Record<string, unknown>)?.provider as string || selectedMethod, ewalletProvider: (methodDetail as Record<string, unknown>)?.provider as string || "", noTujuan: (methodDetail as Record<string, unknown>)?.noTujuan as string || "" }
            : undefined;

      const id = await createTransaksi({
        items: cart.map((c) => ({ produkId: c.produkId, nama: c.nama, harga: c.harga, jumlah: c.jumlah, subtotal: c.harga * c.jumlah })),
        totalHarga, bayar: bayarAmount, kembali: bayarAmount - totalHarga,
        metodePembayaran: selectedMethod,
        pembayaranDetail,
        kasirId: user.uid, tokoId: user.tokoId,
      });
      setCart([]); setShowBayar(false); setBayar("");
      router.push(`/struk/${id}`);
    } catch (err) { console.error(err); }
    finally { setProcessing(false); }
  };

  const paymentGroups = [
    { key: "tunai", label: "Tunai", icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { key: "qris", label: "QRIS", icon: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" },
    { key: "va", label: "Virtual Account", icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { key: "ewallet", label: "E-Wallet", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-7rem)]">
      {/* Produk Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-3 space-y-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input placeholder="Cari produk..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {kategoriList.map((k) => (
              <button key={k} onClick={() => setFilterKategori(k)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterKategori === k ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                }`}>{k}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProduk.map((p) => (
              <button key={p.id} onClick={() => addToCart(p)}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden text-left hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-200 group active:scale-[0.98]">
                <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                  {p.gambar ? (
                    <img src={p.gambar} alt={p.nama} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                  )}
                  {p.stok <= 5 && <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full">Sisa {p.stok}</div>}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-900 truncate">{p.nama}</p>
                  <p className="text-sm font-bold text-blue-600 mt-0.5">{formatRupiah(p.harga)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart */}
      <div className="w-full lg:w-[380px] bg-white rounded-2xl border border-gray-200 shadow-lg flex flex-col lg:sticky lg:top-20 lg:h-[calc(100vh-9rem)]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Keranjang</h3>
              <p className="text-[11px] text-gray-400">{totalItem} item</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">Kosongkan</button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-gray-300">
              <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              <p className="text-sm font-medium">Keranjang kosong</p>
              <p className="text-xs text-gray-300 mt-1">Pilih produk untuk menambahkan</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.produkId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                  {item.gambar ? (
                    <img src={item.gambar} alt={item.nama} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{item.nama}</p>
                  <p className="text-[11px] text-gray-400">{formatRupiah(item.harga)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button onClick={() => removeFromCart(item.produkId)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg">
                    <button onClick={() => updateCartQty(item.produkId, item.jumlah - 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600 text-xs font-bold">-</button>
                    <span className="text-xs font-bold text-gray-900 w-5 text-center">{item.jumlah}</span>
                    <button onClick={() => updateCartQty(item.produkId, item.jumlah + 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600 text-xs font-bold">+</button>
                  </div>
                  <p className="text-[11px] font-bold text-gray-900">{formatRupiah(item.harga * item.jumlah)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50/50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">Total</span>
            <span className="text-xl font-black text-blue-600">{formatRupiah(totalHarga)}</span>
          </div>
          <Button className="w-full h-12 text-sm font-bold" disabled={cart.length === 0} onClick={() => setShowBayar(true)}>
            Bayar Sekarang
          </Button>
        </div>
      </div>

      {/* Payment Modal */}
      {showBayar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBayar(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Pembayaran</h3>
                <p className="text-blue-100 text-sm">{totalItem} item</p>
              </div>
              <button onClick={() => setShowBayar(false)} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Total yang harus dibayar</p>
                <p className="text-3xl font-black text-gray-900">{formatRupiah(totalHarga)}</p>
              </div>

              {/* Metode Pembayaran */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">Pilih Metode Pembayaran</p>
                <div className="space-y-4">
                  {paymentGroups.map((group) => {
                    const methods = PAYMENT_METHODS.filter((m) => m.group === group.key);
                    return (
                      <div key={group.key}>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={group.icon} /></svg>
                          {group.label}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {methods.map((m) => (
                            <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                                selectedMethod === m.id
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                              }`}>
                              <span className={`w-2 h-2 rounded-full ${selectedMethod === m.id ? "bg-white" : ""}`} style={selectedMethod === m.id ? undefined : { backgroundColor: m.color }} />
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detail metode tertentu */}
              {selectedMethod !== "tunai" && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  {(() => {
                    const detail = getMethodDetail(selectedMethod);
                    if (selectedMethod === "qris") {
                      return (
                        <div className="text-center">
                          <p className="text-sm font-bold text-blue-800 mb-2">Scan QRIS untuk membayar</p>
                          <div className="bg-white p-3 rounded-2xl inline-block mb-2">
                            <svg className="w-32 h-32 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm10-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm10-2h6v6h-6v-6zm2 2v2h2v-2h-2zM13 3h2v2h-2V3zm0 8h2v2h-2v-2zm-2 0h2v2h-2v-2zm2 2h2v2h-2v-2zm0 2h2v2h-2v-2zm-6 0h2v2H7v-2zm2 2h2v2H9v-2zm2 0h2v2h-2v-2zm2 0h2v2h-2v-2zm2 0h2v2h-2v-2z" />
                            </svg>
                          </div>
                          <p className="text-xs text-blue-700">{(detail as Record<string, unknown>)?.qrisMerchantName as string || "TOKO KAS PINTAR"}</p>
                        </div>
                      );
                    }
                    const d = detail as Record<string, unknown>;
                    if (selectedMethod.startsWith("va_")) {
                      return (
                        <div className="text-sm space-y-1.5">
                          <p className="font-bold text-blue-800">Virtual Account {d?.bank as string}</p>
                          <div className="flex justify-between"><span className="text-blue-600">No. Rekening</span><span className="font-bold text-blue-900 font-mono">{d?.noRekening as string}</span></div>
                          <div className="flex justify-between"><span className="text-blue-600">Atas Nama</span><span className="font-bold text-blue-900">{d?.atasNama as string}</span></div>
                          <p className="text-xs text-blue-500 mt-2">Transfer ke rekening di atas untuk menyelesaikan pembayaran.</p>
                        </div>
                      );
                    }
                    return (
                      <div className="text-sm space-y-1.5">
                        <p className="font-bold text-blue-800">{d?.provider as string}</p>
                        <div className="flex justify-between"><span className="text-blue-600">No. Tujuan</span><span className="font-bold text-blue-900">{d?.noTujuan as string}</span></div>
                        <div className="flex justify-between"><span className="text-blue-600">Atas Nama</span><span className="font-bold text-blue-900">{d?.atasNama as string}</span></div>
                        <p className="text-xs text-blue-500 mt-2">Kirim pembayaran ke nomor di atas untuk menyelesaikan transaksi.</p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {selectedMethod === "tunai" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Jumlah Bayar</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">Rp</span>
                    <input type="number" placeholder="0" value={bayar} onChange={(e) => setBayar(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl text-lg font-bold focus:outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  {bayar && parseInt(bayar) >= totalHarga && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-sm text-green-700">Kembali: <span className="font-bold">{formatRupiah(kembali)}</span></span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1 h-12" onClick={() => setShowBayar(false)}>Batal</Button>
                <Button className="flex-1 h-12 font-bold" disabled={selectedMethod === "tunai" && (parseInt(bayar || "0") < totalHarga)} loading={processing} onClick={handleBayar}>
                  Proses
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
