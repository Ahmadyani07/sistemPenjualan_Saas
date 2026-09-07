"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { getUserByUid, createUser, createToko } from "@/lib/firestore";
import { User } from "@/types";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        let userData = await getUserByUid(fbUser.uid);
        if (!userData) {
          try {
            const tokoId = await createToko({
              nama: "Toko Saya",
              alamat: "",
              telepon: "",
              ownerUid: fbUser.uid,
            });
            await createUser({
              uid: fbUser.uid,
              email: fbUser.email || "",
              name: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
              role: "admin",
              tokoId,
              noHp: "",
            });
            userData = await getUserByUid(fbUser.uid);
          } catch (err) {
            console.error("Gagal membuat data awal:", err);
          }
        }
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const tokoId = await createToko({
      nama: "Toko Saya",
      alamat: "",
      telepon: "",
      ownerUid: cred.user.uid,
    });
    await createUser({
      uid: cred.user.uid,
      email,
      name,
      role: "admin",
      tokoId,
      noHp: "",
    });
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const existing = await getUserByUid(cred.user.uid);
    if (!existing) {
      const tokoId = await createToko({
        nama: "Toko Saya",
        alamat: "",
        telepon: "",
        ownerUid: cred.user.uid,
      });
      await createUser({
        uid: cred.user.uid,
        email: cred.user.email || "",
        name: cred.user.displayName || "User",
        role: "admin",
        tokoId,
        noHp: "",
      });
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const refreshUser = async () => {
    if (!firebaseUser) return;
    const userData = await getUserByUid(firebaseUser.uid);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading, login, register, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
