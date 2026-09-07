"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listenProdukByToko, updateStokProduk } from "@/lib/firestore";
import { formatRupiah } from "@/lib/utils";
import { Produk } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

export default function StokPage() {
  const { user } = useAuth();
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedProduk, setSelectedProduk] = useState<Produk | null>(null);
  const [adjustStok, setAdjustStok] = useState("");
  const [adjustType, setAdjustType] = useState<"tambah" | "kurang">("tambah");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.tokoId) return;
    const unsub = listenProdukByToko(user.tokoId, (data) => { setProdukList(data); setLoading(false); });
    return () => unsub();
  }, [user]);

  const filteredProduk = produkList.filter((p) => p.nama.toLowerCase().includes(search.toLowerCase()));
  const produkMenipis = filteredProduk.filter((p) => p.stok <= p.stokMinimal);
  const produkNormal = filteredProduk.filter((p) => p.stok > p.stokMinimal);

  const openAdjust = (p: Produk) => { setSelectedProduk(p); setAdjustStok(""); setAdjustType("tambah"); setShowModal(true); };

  const handleAdjust = async () => {
    if (!selectedProduk || !adjustStok) return;
    setSaving(true);
    try {
      const jumlah = parseInt(adjustStok) || 0;
      const stokBaru = adjustType === "tambah" ? selectedProduk.stok + jumlah : Math.max(0, selectedProduk.stok - jumlah);
      await updateStokProduk(selectedProduk.id, stokBaru);
      setShowModal(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Stok</h1>
        <p className="text-gray-500 text-sm mt-0.5">Pantau dan atur stok produk</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
        </div>
      </div>

      {/* Stok Menipis */}
      {produkMenipis.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
            <h3 className="font-bold text-red-700 flex items-center gap-2 text-sm">
              <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              Stok Menipis ({produkMenipis.length} produk)
            </h3>
          </div>
          <div className="divide-y divide-red-50">
            {produkMenipis.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-red-50/30 transition-colors">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {p.gambar ? <img src={p.gambar} alt={p.nama} className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center"><svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{p.nama}</p>
                  <p className="text-xs text-gray-400">Min: {p.stokMinimal} | Harga: {formatRupiah(p.harga)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-black text-red-600">{p.stok}</p>
                    <p className="text-[10px] text-red-400 font-medium">tersisa</p>
                  </div>
                  <Button size="sm" onClick={() => openAdjust(p)}>Atur</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Semua Produk */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">Semua Produk</h3>
        </div>
        {loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filteredProduk.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">Belum ada produk</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {produkNormal.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {p.gambar ? <img src={p.gambar} alt={p.nama} className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center"><svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{p.nama}</p>
                  <p className="text-xs text-gray-400">{p.kategori}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Saat Ini</p>
                    <p className="text-lg font-bold text-gray-900">{p.stok}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Minimum</p>
                    <p className="text-lg font-medium text-gray-500">{p.stokMinimal}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold">Aman</span>
                  <Button size="sm" variant="ghost" onClick={() => openAdjust(p)}>Atur Stok</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Atur Stok — ${selectedProduk?.nama}`} size="sm">
        {selectedProduk && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                {selectedProduk.gambar ? <img src={selectedProduk.gambar} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center"><svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedProduk.nama}</p>
                <p className="text-2xl font-black text-gray-900">{selectedProduk.stok} <span className="text-sm font-normal text-gray-400">unit</span></p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAdjustType("tambah")}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${adjustType === "tambah" ? "bg-green-600 text-white shadow-lg shadow-green-500/25" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                + Tambah
              </button>
              <button onClick={() => setAdjustType("kurang")}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${adjustType === "kurang" ? "bg-red-600 text-white shadow-lg shadow-red-500/25" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                - Kurangi
              </button>
            </div>
            <Input label={`Jumlah ${adjustType === "tambah" ? "Penambahan" : "Pengurangan"}`} type="number" value={adjustStok} onChange={(e) => setAdjustStok(e.target.value)} placeholder="0" />
            {adjustStok && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                Stok baru: <span className="font-bold">
                  {adjustType === "tambah" ? selectedProduk.stok + (parseInt(adjustStok) || 0) : Math.max(0, selectedProduk.stok - (parseInt(adjustStok) || 0))}
                </span>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Batal</Button>
              <Button className="flex-1" loading={saving} onClick={handleAdjust}>Simpan</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
