"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listenProdukByToko, createProduk, updateProduk, deleteProduk } from "@/lib/firestore";
import { compressImageToBase64 } from "@/lib/imageToBase64";
import { formatRupiah } from "@/lib/utils";
import { Produk } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ImageUpload from "@/components/ImageUpload";

const KATEGORI_OPTIONS = [
  { value: "Makanan", label: "Makanan" },
  { value: "Minuman", label: "Minuman" },
  { value: "Sembako", label: "Sembako" },
  { value: "Rokok", label: "Rokok" },
  { value: "Kebutuhan Rumah", label: "Kebutuhan Rumah" },
  { value: "Lainnya", label: "Lainnya" },
];

export default function ProdukPage() {
  const { user } = useAuth();
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showModal, setShowModal] = useState(false);
  const [editProduk, setEditProduk] = useState<Produk | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formNama, setFormNama] = useState("");
  const [formHarga, setFormHarga] = useState("");
  const [formStok, setFormStok] = useState("");
  const [formStokMinimal, setFormStokMinimal] = useState("5");
  const [formKategori, setFormKategori] = useState("Makanan");
  const [formBarcode, setFormBarcode] = useState("");
  const [formGambar, setFormGambar] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.tokoId) return;
    const unsub = listenProdukByToko(user.tokoId, (data) => {
      setProdukList(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filteredProduk = produkList.filter((p) => {
    const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    const matchKategori = filterKategori === "Semua" || p.kategori === filterKategori;
    return matchSearch && matchKategori;
  });

  const kategoriList = ["Semua", ...new Set(produkList.map((p) => p.kategori))];

  const openAdd = () => {
    setEditProduk(null);
    setFormNama(""); setFormHarga(""); setFormStok(""); setFormStokMinimal("5");
    setFormKategori("Makanan"); setFormBarcode(""); setFormGambar("");
    setShowModal(true);
  };

  const openEdit = (p: Produk) => {
    setEditProduk(p);
    setFormNama(p.nama); setFormHarga(p.harga.toString()); setFormStok(p.stok.toString());
    setFormStokMinimal(p.stokMinimal.toString()); setFormKategori(p.kategori);
    setFormBarcode(p.barcode); setFormGambar(p.gambar);
    setShowModal(true);
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const url = await compressImageToBase64(file);
      setFormGambar(url);
      return url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal upload gambar";
      console.error("Gagal upload gambar:", msg);
      throw new Error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tokoId) return;
    setSaving(true);
    try {
      const data = {
        nama: formNama,
        harga: parseInt(formHarga) || 0,
        stok: parseInt(formStok) || 0,
        stokMinimal: parseInt(formStokMinimal) || 5,
        kategori: formKategori,
        barcode: formBarcode,
        gambar: formGambar,
        tokoId: user.tokoId,
      };
      if (editProduk) {
        await updateProduk(editProduk.id, data);
      } else {
        await createProduk(data);
      }
      setShowModal(false);
    } catch (err) {
      console.error("Gagal menyimpan:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProduk(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kelola produk dan inventaris toko</p>
        </div>
        <Button onClick={openAdd}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tambah Produk
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              placeholder="Cari nama produk atau barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {kategoriList.map((k) => (
              <button
                key={k}
                onClick={() => setFilterKategori(k)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filterKategori === k
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-400"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-400"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredProduk.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <p className="text-gray-500 font-medium">
            {search || filterKategori !== "Semua" ? "Produk tidak ditemukan" : "Belum ada produk"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {!search && filterKategori === "Semua" && "Klik tombol \"Tambah Produk\" untuk menambah produk baru"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProduk.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 group">
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                {p.gambar ? (
                  <img src={p.gambar} alt={p.nama} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  </div>
                )}
                {p.stok <= p.stokMinimal && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">Stok Menipis</div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-sm transition-colors">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-sm transition-colors">
                    <svg className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.nama}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.kategori}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-bold text-blue-600">{formatRupiah(p.harga)}</p>
                  <p className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.stok <= p.stokMinimal ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                    {p.stok}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-left">
                <tr>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Produk</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Kategori</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Harga</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Stok</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Barcode</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProduk.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          {p.gambar ? (
                            <img src={p.gambar} alt={p.nama} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{p.nama}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">{p.kategori}</span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{formatRupiah(p.harga)}</td>
                    <td className="px-5 py-3">
                      <span className={`font-bold ${p.stok <= p.stokMinimal ? "text-red-600" : "text-gray-700"}`}>{p.stok}</span>
                      {p.stok <= p.stokMinimal && <span className="ml-1 text-[10px] text-red-500 font-medium">Menipis</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-400 font-mono text-xs">{p.barcode || "-"}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setDeleteConfirm(p.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editProduk ? "Edit Produk" : "Tambah Produk"} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Foto Produk</label>
              <ImageUpload
                currentImage={formGambar}
                onUpload={handleImageUpload}
                onRemove={() => setFormGambar("")}
                uploading={uploading}
              />
            </div>
            <div className="md:col-span-2 space-y-4">
              <Input label="Nama Produk" value={formNama} onChange={(e) => setFormNama(e.target.value)} required placeholder="Masukkan nama produk" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Harga</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rp</span>
                    <input type="number" value={formHarga} onChange={(e) => setFormHarga(e.target.value)} required placeholder="0"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Stok</label>
                  <input type="number" value={formStok} onChange={(e) => setFormStok(e.target.value)} required placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Stok Minimum</label>
                  <input type="number" value={formStokMinimal} onChange={(e) => setFormStokMinimal(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori</label>
                  <select value={formKategori} onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white">
                    {KATEGORI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <Input label="Barcode" value={formBarcode} onChange={(e) => setFormBarcode(e.target.value)} placeholder="Opsional" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button type="submit" loading={saving} disabled={uploading}>{editProduk ? "Simpan Perubahan" : "Tambah Produk"}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Delete */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hapus Produk" size="sm">
        <p className="text-sm text-gray-600 mb-5">Yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Batal</Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
