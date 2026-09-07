"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProdukByToko, getTransaksiByToko } from "@/lib/firestore";
import { formatRupiah, formatShortDate } from "@/lib/utils";
import { Produk, Transaksi } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [produk, setProduk] = useState<Produk[]>([]);
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.tokoId) return;
    Promise.all([getProdukByToko(user.tokoId), getTransaksiByToko(user.tokoId)])
      .then(([p, t]) => { setProduk(p); setTransaksi(t); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const transaksiHariIni = transaksi.filter((t) => {
    const d = new Date(t.createdAt); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const totalPenjualanHariIni = transaksiHariIni.reduce((s, t) => s + t.totalHarga, 0);
  const totalTransaksiHariIni = transaksiHariIni.length;
  const totalProduk = produk.length;
  const stokMenipis = produk.filter((p) => p.stok <= p.stokMinimal).length;

  const grafikData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - i)); date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date); nextDate.setDate(nextDate.getDate() + 1);
    const penjualan = transaksi.filter((t) => {
      const tgl = new Date(t.createdAt); return tgl >= date && tgl < nextDate;
    }).reduce((s, t) => s + t.totalHarga, 0);
    return { name: formatShortDate(date), total: penjualan };
  });

  const kategoriData = Object.entries(
    produk.reduce((acc, p) => { acc[p.kategori] = (acc[p.kategori] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const topProduk = Object.entries(
    transaksiHariIni.flatMap((t) => t.items).reduce((acc, item) => { acc[item.nama] = (acc[item.nama] || 0) + item.jumlah; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Selamat datang, {user?.name}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Penjualan Hari Ini", value: formatRupiah(totalPenjualanHariIni), color: "from-blue-500 to-blue-600", shadow: "shadow-blue-500/20", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Transaksi Hari Ini", value: totalTransaksiHariIni, color: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/20", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          { label: "Total Produk", value: totalProduk, color: "from-violet-500 to-violet-600", shadow: "shadow-violet-500/20", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
          { label: "Stok Menipis", value: stokMenipis, color: stokMenipis > 0 ? "from-red-500 to-red-600" : "from-amber-500 to-amber-600", shadow: stokMenipis > 0 ? "shadow-red-500/20" : "shadow-amber-500/20", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-white shadow-xl ${stat.shadow} hover:scale-[1.02] transition-transform`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black mt-1.5">{stat.value}</p>
              </div>
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} /></svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">Penjualan 7 Hari Terakhir</h3>
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
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-300 text-sm">Belum ada data penjualan</div>
          )}
        </div>

        {/* Pie */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">Kategori Produk</h3>
          {kategoriData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={kategoriData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={5} dataKey="value">
                    {kategoriData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {kategoriData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-[11px]">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-500">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-[180px] flex items-center justify-center text-gray-300 text-sm">Belum ada produk</div>}
        </div>
      </div>

      {/* Top Produk */}
      {topProduk.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">Top Produk Hari Ini</h3>
          <div className="space-y-3">
            {topProduk.map(([nama, jumlah], i) => (
              <div key={nama} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-xs font-bold text-blue-600">{i + 1}</div>
                <span className="text-sm text-gray-700 flex-1 font-medium">{nama}</span>
                <div className="w-24 bg-gray-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: `${(jumlah / topProduk[0][1]) * 100}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-900 w-16 text-right">{jumlah}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
