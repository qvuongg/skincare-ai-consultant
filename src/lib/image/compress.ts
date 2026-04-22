"use client";

export type CompressedImage = {
  mimeType: "image/jpeg";
  /** Bare Base64 (no `data:` prefix). */
  base64: string;
  /** Decoded (binary) byte length of the encoded JPEG. */
  byteLength: number;
  width: number;
  height: number;
};

export type CompressOptions = {
  /** Max output width in px. Aspect ratio is preserved; height is derived. */
  maxWidth?: number;
  /** JPEG quality 0..1. */
  quality?: number;
};

/**
 * Resize+recompress a browser `File` to JPEG using canvas.
 * Won't upscale images smaller than `maxWidth`. EXIF orientation honored
 * via `createImageBitmap({ imageOrientation: "from-image" })` with an
 * HTMLImageElement fallback for browsers/formats that `createImageBitmap`
 * can't decode.
 */
export async function compressImage(
  file: File,
  opts: CompressOptions = {}
): Promise<CompressedImage> {
  const maxWidth = opts.maxWidth ?? 2560;
  const quality = opts.quality ?? 0.9;

  if (!file.type.startsWith("image/")) {
    throw new Error("File is not an image.");
  }

  const decoded = await decode(file);

  const scale = Math.min(1, maxWidth / decoded.width);
  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    decoded.cleanup();
    throw new Error("Canvas 2D context unavailable.");
  }

  // Paint white first so transparent PNGs don't become black under JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(decoded.source, 0, 0, width, height);
  decoded.cleanup();

  const blob = await canvasToBlob(canvas, quality);
  const base64 = await blobToBase64(blob);

  return {
    mimeType: "image/jpeg",
    base64,
    byteLength: blob.size,
    width,
    height,
  };
}

type Decoded = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // fall through to HTMLImageElement
    }
  }

  const url = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("Cannot decode image (unsupported format?).");
  }
  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    cleanup: () => URL.revokeObjectURL(url),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
      "image/jpeg",
      quality
    );
  });
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  // Chunk to avoid "Maximum call stack size exceeded" from spread of huge arrays.
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + CHUNK) as unknown as number[]
    );
  }
  return btoa(binary);
}
