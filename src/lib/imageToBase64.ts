const MAX_BYTES = 850 * 1024;

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gambar tidak dapat diproses, file mungkin rusak."));
    img.src = src;
  });
}

function renderToDataUrl(img: HTMLImageElement, maxDim: number, quality: number, png: boolean): string {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung browser ini.");

  if (png) {
    ctx.clearRect(0, 0, w, h);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  return canvas.toDataURL(png ? "image/png" : "image/jpeg", png ? undefined : quality);
}

function dataUrlBytes(dataUrl: string): number {
  return Math.round(dataUrl.length * 0.75);
}

export async function compressImageToBase64(file: File, maxDim = 700, quality = 0.72): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar (JPG, PNG, WebP).");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Ukuran file maksimal 5MB.");
  }

  const rawDataUrl = await readAsDataURL(file);
  const img = await loadImage(rawDataUrl);
  const png = file.type === "image/png";

  const attempts = [
    { maxDim: maxDim, quality: quality },
    { maxDim: Math.round(maxDim * 0.8), quality: quality * 0.75 },
    { maxDim: Math.round(maxDim * 0.6), quality: quality * 0.55 },
    { maxDim: Math.round(maxDim * 0.5), quality: quality * 0.4 },
    { maxDim: 240, quality: 0.3 },
  ];

  for (const attempt of attempts) {
    const result = renderToDataUrl(img, attempt.maxDim, attempt.quality, png);
    if (dataUrlBytes(result) <= MAX_BYTES) return result;
  }

  throw new Error("Gambar tetap terlalu besar setelah dikompres. Gunakan gambar resolusi wajar (maks 5MB).");
}