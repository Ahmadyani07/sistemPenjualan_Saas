import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

const DEFAULT_TIMEOUT = 30000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Upload timeout setelah ${ms / 1000} detik. Periksa Firebase Storage rules & koneksi.`));
    }, ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

export async function uploadProdukImage(file: File, tokoId: string): Promise<string> {
  const fileName = `${tokoId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const storageRef = ref(storage, `produk-images/${fileName}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return withTimeout(
    new Promise((resolve, reject) => {
      let resolved = false;

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          if (!resolved) {
            resolved = true;
            reject(error instanceof Error ? error : new Error(`Upload gagal: ${String(error)}`));
          }
        },
        async () => {
          if (!resolved) {
            resolved = true;
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            } catch (err) {
              reject(err instanceof Error ? err : new Error("Gagal mendapatkan URL download"));
            }
          }
        }
      );
    }),
    DEFAULT_TIMEOUT
  );
}
