import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { Produk, Transaksi, Toko, User } from "@/types";

const COLLECTIONS = {
  USERS: "users",
  PRODUK: "produk",
  TRANSAKSI: "transaksi",
  TOKO: "toko",
};

// ===== TOKO =====
export async function createToko(data: Omit<Toko, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.TOKO), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getTokoById(id: string): Promise<Toko | null> {
  const docSnap = await getDoc(doc(db, COLLECTIONS.TOKO, id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data(), createdAt: docSnap.data().createdAt?.toDate() } as unknown as Toko;
}

export async function updateToko(id: string, data: Partial<Toko>): Promise<void> {
  const { id: _, createdAt: __, ...updateData } = data as DocumentData;
  await updateDoc(doc(db, COLLECTIONS.TOKO, id), updateData);
}

// ===== USER =====
export async function createUser(data: Omit<User, "createdAt">): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.USERS), {
    ...data,
    createdAt: Timestamp.now(),
  });
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
  const q = query(collection(db, COLLECTIONS.USERS), where("uid", "==", uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;
  const d = snapshot.docs[0];
  const { id: _, createdAt: __, ...updateData } = data as DocumentData;
  await updateDoc(doc(db, COLLECTIONS.USERS, d.id), updateData);
}

export async function getUserByUid(uid: string): Promise<User | null> {
  const q = query(collection(db, COLLECTIONS.USERS), where("uid", "==", uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() } as unknown as User;
}

// ===== PRODUK =====
export async function createProduk(data: Omit<Produk, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.PRODUK), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateProduk(id: string, data: Partial<Produk>): Promise<void> {
  const { id: _, createdAt: __, ...updateData } = data as DocumentData;
  await updateDoc(doc(db, COLLECTIONS.PRODUK, id), {
    ...updateData,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteProduk(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.PRODUK, id));
}

export async function getProdukByToko(tokoId: string): Promise<Produk[]> {
  const q = query(
    collection(db, COLLECTIONS.PRODUK),
    where("tokoId", "==", tokoId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate(),
      updatedAt: d.data().updatedAt?.toDate(),
    }))
    .sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    }) as Produk[];
}

export async function updateStokProduk(id: string, stokBaru: number): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.PRODUK, id), {
    stok: stokBaru,
    updatedAt: Timestamp.now(),
  });
}

// ===== TRANSAKSI =====
export async function createTransaksi(data: Omit<Transaksi, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.TRANSAKSI), {
    ...data,
    createdAt: Timestamp.now(),
  });

  for (const item of data.items) {
    const produkDoc = await getDoc(doc(db, COLLECTIONS.PRODUK, item.produkId));
    if (produkDoc.exists()) {
      const stokSaatIni = produkDoc.data().stok;
      await updateDoc(doc(db, COLLECTIONS.PRODUK, item.produkId), {
        stok: stokSaatIni - item.jumlah,
        updatedAt: Timestamp.now(),
      });
    }
  }

  return docRef.id;
}

export async function getTransaksiByToko(tokoId: string): Promise<Transaksi[]> {
  const q = query(
    collection(db, COLLECTIONS.TRANSAKSI),
    where("tokoId", "==", tokoId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate(),
    }))
    .sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    }) as Transaksi[];
}

export async function getTransaksiById(id: string): Promise<Transaksi | null> {
  const docSnap = await getDoc(doc(db, COLLECTIONS.TRANSAKSI, id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data(), createdAt: docSnap.data().createdAt?.toDate() } as unknown as Transaksi;
}

// ===== REALTIME LISTENERS =====
export function listenProdukByToko(tokoId: string, callback: (produk: Produk[]) => void) {
  const q = query(
    collection(db, COLLECTIONS.PRODUK),
    where("tokoId", "==", tokoId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const produk = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate(),
          updatedAt: d.data().updatedAt?.toDate(),
        }))
        .sort((a, b) => {
          const aName = (a as unknown as { nama?: string }).nama || "";
          const bName = (b as unknown as { nama?: string }).nama || "";
          return aName.localeCompare(bName, "id");
        }) as Produk[];
      callback(produk);
    },
    (error) => {
      console.error("Firestore listener error:", error);
      callback([]);
    }
  );
}
