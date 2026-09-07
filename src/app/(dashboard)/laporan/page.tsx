"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTransaksiByToko, getProdukByToko } from "@/lib/firestore";
import { formatRupiah, formatShortDate } from "@/lib/utils";
import { Transaksi, Produk } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4"];

export default function LaporanPage() {
  const { user } = useAuth();
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<"minggu" | "bulan" | "tahun">("minggu");

  useEffect(() => {
    if (!user?.tokoId) return;
    Promise.all([getTransaksiByToko(user.tokoId), getProdukByToko(user.tokoId)])
      .then(([t, p]) => { setTransaksiList(t); setProdukList(p); })
      .catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const getDateRange = () => {
    const now = new Date(); const start = new Date();
    if (periode === "minggu") start.setDate(now.getDate() - 7);
    else if (periode === "bulan") start.setMonth(now.getMonth() - 1);
    else start.setFullYear(now.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  };

  const { start, end } = getDateRange();
  const filtered = transaksiList.filter((t) => { const d = new Date(t.createdAt); return d >= start && d <= end; });
  const totalPenjualan = filtered.reduce((s, t) => s + t.totalHarga, 0);
  const totalTransaksi = filtered.length;
  const rataRataPerTransaksi = totalTransaksi > 0 ? totalPenjualan / totalTransaksi : 0;

  const days = periode === "minggu" ? 7 : periode === "bulan" ? 30 : 12;
  const grafikData = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    if (periode === "tahun") { date.setMonth(date.getMonth() - (days - 1 - i)); date.setDate(1); }
    else { date.setDate(date.getDate() - (days - 1 - i)); }
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    if (periode === "tahun") nextDate.setMonth(nextDate.getMonth() + 1); else nextDate.setDate(nextDate.getDate() + 1);
    const penjualan = transaksiList.filter((t) => { const tgl = new Date(t.createdAt); return tgl >= date && tgl < nextDate; }).reduce((s, t) => s + t.totalHarga, 0);
    return { name: periode === "tahun" ? new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date) : formatShortDate(date), total: penjualan };
  });

  const kategoriPenjualan = Object.entries(
    filtered.flatMap((t) => t.items).reduce((acc, item) => {
      const produk = produkList.find((p) => p.id === item.produkId);
      const kategori = produk?.kategori || "Lainnya";
      acc[kategori] = (acc[kategori] || 0) + item.subtotal;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const topProduk = Object.entries(
    filtered.flatMap((t) => t.items).reduce((acc, item) => { acc[item.nama] = (acc[item.nama] || 0) + item.jumlah; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const metodeData = Object.entries(
    filtered.reduce((acc, t) => {
      const key = t.pembayaranDetail?.channel || t.metodePembayaran;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan & Analitik</h1>
          <p className="text-gray-500 text-sm mt-0.5">Analisis penjualan toko</p>
        </div>
        <div className="flex gap-1.5 bg-white rounded-xl p-1 border border-gray-200">
          {(["minggu", "bulan", "tahun"] as const).map((p) => (
            <button key={p} onClick={() => setPeriode(p)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${periode === p ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}>
              {p === "minggu" ? "7 Hari" : p === "bulan" ? "30 Hari" : "1 Tahun"}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Penjualan", value: formatRupiah(totalPenjualan), gradient: "from-blue-600 to-indigo-600" },
          { label: "Total Transaksi", value: totalTransaksi, gradient: "from-emerald-500 to-emerald-600" },
          { label: "Rata-rata/Transaksi", value: formatRupiah(rataRataPerTransaksi), gradient: "from-violet-500 to-violet-600" },
        ].map((s) => (
          <div key={s.label} className={`bg-gradient-to-r ${s.gradient} rounded-2xl p-5 text-white shadow-lg`}>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-black mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">Grafik Penjualan</h3>
          {grafikData.some((d) => d.total > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={grafikData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                <Bar dataKey="total" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[280px] flex items-center justify-center text-gray-300 text-sm">Tidak ada data</div>}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">Metode Pembayaran</h3>
          {metodeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={metodeData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={5} dataKey="value">
                  {metodeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center text-gray-300 text-sm">Tidak ada data</div>}
          <div className="flex flex-wrap gap-2 mt-2">
            {metodeData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-[11px]">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-gray-500">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">Penjualan per Kategori</h3>
          {kategoriPenjualan.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={kategoriPenjualan} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                <Bar dataKey="value" fill="#16a34a" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[250px] flex items-center justify-center text-gray-300 text-sm">Tidak ada data</div>}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">Top 10 Produk Terlaris</h3>
          {topProduk.length > 0 ? (
            <div className="space-y-3">
              {topProduk.map(([nama, jumlah], i) => (
                <div key={nama} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-xs font-bold text-blue-600">{i + 1}</div>
                  <span className="text-sm text-gray-700 flex-1 font-medium truncate">{nama}</span>
                  <div className="w-24 bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: `${(jumlah / topProduk[0][1]) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-14 text-right">{jumlah}</span>
                </div>
              ))}
            </div>
          ) : <div className="h-[250px] flex items-center justify-center text-gray-300 text-sm">Tidak ada data</div>}
        </div>
      </div>
    </div>
  );
}
