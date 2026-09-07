"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getTransaksiByToko } from "@/lib/firestore";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import { Transaksi } from "@/types";
import { getPaymentChannelName } from "@/lib/paymentLabels";

export default function TransaksiPage() {
  const { user } = useAuth();
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?.tokoId) return;
    getTransaksiByToko(user.tokoId).then(setTransaksiList).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const filtered = transaksiList.filter((t) => t.id.toLowerCase().includes(search.toLowerCase()));
  const totalPenjualan = filtered.reduce((sum, t) => sum + t.totalHarga, 0);

  const metodeColors: Record<string, string> = {
    tunai: "bg-green-50 text-green-700",
    qris: "bg-blue-50 text-blue-700",
    va_bca: "bg-sky-50 text-sky-700",
    va_bri: "bg-cyan-50 text-cyan-700",
    va_mandiri: "bg-amber-50 text-amber-700",
    va_bni: "bg-orange-50 text-orange-700",
    ewallet_gopay: "bg-sky-50 text-sky-700",
    ewallet_ovo: "bg-purple-50 text-purple-700",
    ewallet_dana: "bg-blue-50 text-blue-700",
    ewallet_linkaja: "bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
        <p className="text-gray-500 text-sm mt-0.5">Semua transaksi yang pernah dilakukan</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="w-full sm:w-72 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input placeholder="Cari nomor transaksi..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl">
            <p className="text-xs text-white/70">Total Penjualan</p>
            <p className="text-lg font-black">{formatRupiah(totalPenjualan)}</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">{search ? "Transaksi tidak ditemukan" : "Belum ada transaksi"}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-left">
                <tr>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">No. Transaksi</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Tanggal</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Item</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Metode</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Bayar</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-700 font-medium">{t.id.slice(0, 12).toUpperCase()}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{formatDateTime(t.createdAt)}</td>
                    <td className="px-5 py-3 text-gray-600">{t.items.length} produk</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${metodeColors[t.metodePembayaran] || "bg-gray-100 text-gray-600"}`}>{getPaymentChannelName(t.metodePembayaran, t.pembayaranDetail)}</span>
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-900">{formatRupiah(t.totalHarga)}</td>
                    <td className="px-5 py-3 text-gray-600">{formatRupiah(t.bayar)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/struk/${t.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                        Struk
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
