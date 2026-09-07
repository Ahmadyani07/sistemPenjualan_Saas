"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateUser, updateToko, getTokoById } from "@/lib/firestore";
import { Toko } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ProfilPage() {
  const { user, firebaseUser, refreshUser } = useAuth();
  const [toko, setToko] = useState<Toko | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [profilName, setProfilName] = useState("");
  const [profilNoHp, setProfilNoHp] = useState("");
  const [tokoNama, setTokoNama] = useState("");
  const [tokoAlamat, setTokoAlamat] = useState("");
  const [tokoTelepon, setTokoTelepon] = useState("");

  useEffect(() => {
    if (!user?.tokoId) return;
    getTokoById(user.tokoId).then((t) => {
      setToko(t);
      setProfilName(user.name);
      setProfilNoHp(user.noHp || "");
      setTokoNama(t?.nama || "");
      setTokoAlamat(t?.alamat || "");
      setTokoTelepon(t?.telepon || "");
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [user]);

  const handleSaveProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccess(false);
    setError("");
    try {
      await updateUser(user.uid, { name: profilName, noHp: profilNoHp });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToko = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tokoId) return;
    setSaving(true);
    setSuccess(false);
    setError("");
    try {
      await updateToko(user.tokoId, { nama: tokoNama, alamat: tokoAlamat, telepon: tokoTelepon });
      setToko({ id: user.tokoId, nama: tokoNama, alamat: tokoAlamat, telepon: tokoTelepon, ownerUid: user.uid, createdAt: toko?.createdAt || new Date() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data toko");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
        <p className="text-gray-500 text-sm mt-0.5">Kelola informasi pribadi dan toko</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-sm text-green-700">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Data berhasil disimpan!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Kartu Profil */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-purple-500/20">
            {(profilName || user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfil} className="p-6 space-y-4">
          <h3 className="font-bold text-gray-900">Informasi Akun</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nama Lengkap" value={profilName} onChange={(e) => setProfilName(e.target.value)} required />
            <Input label="Nomor HP" value={profilNoHp} onChange={(e) => setProfilNoHp(e.target.value)} placeholder="08xxxxxxxxxx" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" value={user?.email || ""} disabled className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
              <input type="text" value={user?.role || ""} disabled className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed capitalize" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>Simpan Profil</Button>
          </div>
        </form>
      </div>

      {/* Kartu Toko */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0H3m4-12h6m-6 4h6m-6 4h6" /></svg>
          </div>
          <h3 className="font-bold text-gray-900">Informasi Toko</h3>
        </div>
        <form onSubmit={handleSaveToko} className="p-6 space-y-4">
          <Input label="Nama Toko" value={tokoNama} onChange={(e) => setTokoNama(e.target.value)} required />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat</label>
            <textarea
              value={tokoAlamat}
              onChange={(e) => setTokoAlamat(e.target.value)}
              rows={3}
              placeholder="Alamat lengkap toko"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>
          <Input label="Nomor Telepon Toko" value={tokoTelepon} onChange={(e) => setTokoTelepon(e.target.value)} placeholder="021-xxxxxxx" />
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>Simpan Toko</Button>
          </div>
        </form>
      </div>

      {/* Info akun */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Akun</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-400">UID</span>
            <span className="text-gray-700 font-mono text-xs truncate max-w-[250px]">{user?.uid}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-400">Toko ID</span>
            <span className="text-gray-700 font-mono text-xs truncate max-w-[250px]">{user?.tokoId}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-400">Terverifikasi</span>
            <span className="text-green-600 font-semibold flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {firebaseUser?.emailVerified ? "Verified" : "Belum verifikasi"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
