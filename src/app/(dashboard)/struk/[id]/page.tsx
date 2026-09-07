"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getTransaksiById, getTokoById } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import { Transaksi, Toko } from "@/types";
import { getPaymentChannelName } from "@/lib/paymentLabels";
import Button from "@/components/ui/Button";

export default function StrukPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [transaksi, setTransaksi] = useState<Transaksi | null>(null);
  const [toko, setToko] = useState<Toko | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const t = await getTransaksiById(id as string);
        setTransaksi(t);
        if (t) { const tk = await getTokoById(t.tokoId); setToko(tk); }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!transaksi) return <div className="text-center py-12"><p className="text-gray-500">Transaksi tidak ditemukan</p><Link href="/transaksi"><Button className="mt-4" variant="secondary">Kembali</Button></Link></div>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between no-print">
        <h1 className="text-2xl font-bold text-gray-900">Struk Pembelian</h1>
        <Button variant="secondary" onClick={() => window.print()}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Cetak
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm" id="struk">
        <div className="text-center border-b border-dashed border-gray-300 pb-5 mb-5">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="text-xl font-black text-gray-900">{toko?.nama || "Toko Saya"}</h2>
          {toko?.alamat && <p className="text-sm text-gray-500 mt-0.5">{toko.alamat}</p>}
          {toko?.telepon && <p className="text-sm text-gray-500">Telp: {toko.telepon}</p>}
        </div>

        <div className="text-sm text-gray-600 space-y-1.5 mb-5">
          <div className="flex justify-between"><span className="text-gray-500">No. Transaksi</span><span className="font-mono text-gray-900 font-medium">{transaksi.id.slice(0, 12).toUpperCase()}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Tanggal</span><span className="text-gray-900">{formatDateTime(transaksi.createdAt)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Kasir</span><span className="text-gray-900">{user?.name}</span></div>
        </div>

        <div className="border-t border-dashed border-gray-300 pt-5 mb-5">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-400 text-xs uppercase"><th className="text-left pb-2">Item</th><th className="text-center pb-2">Qty</th><th className="text-right pb-2">Harga</th><th className="text-right pb-2">Subtotal</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {transaksi.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2.5 text-gray-900 font-medium">{item.nama}</td>
                  <td className="py-2.5 text-center text-gray-600">{item.jumlah}</td>
                  <td className="py-2.5 text-right text-gray-600">{formatRupiah(item.harga)}</td>
                  <td className="py-2.5 text-right font-bold text-gray-900">{formatRupiah(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-dashed border-gray-300 pt-5 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total</span>
            <span className="text-2xl font-black text-gray-900">{formatRupiah(transaksi.totalHarga)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Bayar ({getPaymentChannelName(transaksi.metodePembayaran, transaksi.pembayaranDetail)})</span>
            <span className="text-gray-900 font-medium">{formatRupiah(transaksi.bayar)}</span>
          </div>
          {transaksi.pembayaranDetail?.noRekening && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">No. Rekening</span>
              <span className="text-gray-900 font-medium font-mono">{transaksi.pembayaranDetail.noRekening}</span>
            </div>
          )}
          {transaksi.pembayaranDetail?.noTujuan && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">No. Tujuan</span>
              <span className="text-gray-900 font-medium">{transaksi.pembayaranDetail.noTujuan}</span>
            </div>
          )}
          {transaksi.pembayaranDetail?.qrisMerchantName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Merchant QRIS</span>
              <span className="text-gray-900 font-medium">{transaksi.pembayaranDetail.qrisMerchantName}</span>
            </div>
          )}
          {transaksi.kembali > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Kembali</span>
              <span className="text-green-600 font-bold">{formatRupiah(transaksi.kembali)}</span>
            </div>
          )}
        </div>

        <div className="text-center mt-8 pt-5 border-t border-dashed border-gray-300">
          <p className="text-xs text-gray-400 font-medium">Terima kasih atas kunjungan Anda!</p>
          <p className="text-xs text-gray-400">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
        </div>
      </div>

      <div className="flex gap-3 no-print">
        <Link href="/kasir" className="flex-1"><Button className="w-full h-12 font-bold">Kembali ke Kasir</Button></Link>
        <Link href="/transaksi" className="flex-1"><Button variant="secondary" className="w-full h-12">Semua Transaksi</Button></Link>
      </div>
    </div>
  );
}
