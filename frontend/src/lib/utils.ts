import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BANNER_URL_ARRAY, ICON_URL_ARRAY } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ImageCategory = "avatar" | "banner";
export async function compressImage(
  file: File,
  category: ImageCategory
): Promise<File> {
  const targetSize = category === "avatar" ? 5 * 1024 : 15 * 1024;
  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  let width = imageBitmap.width;
  let height = imageBitmap.height;
  let quality = 0.7;
  const MAX_ATTEMPTS = 10;
  let attempts = 0;

  async function attemptCompression(): Promise<File> {
    attempts++;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get 2d context");
    }
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, file.type, quality)
    );

    if (!blob) {
      throw new Error("Failed to compress image");
    }

    const currentSize = blob.size;

    if (
      Math.abs(currentSize - targetSize) / targetSize < 0.1 ||
      attempts >= MAX_ATTEMPTS
    ) {
      console.log(
        `Compressed ${category} image to ${currentSize} bytes (target: ${targetSize}) with quality ${quality.toFixed(2)}`
      );
      return new File([blob], file.name, { type: blob.type });
    }

    if (currentSize > targetSize) {
      if (quality > 0.2) {
        quality = Math.max(0.1, quality - 0.1);
      } else {
        const scaleFactor = Math.sqrt(targetSize / currentSize);
        width = Math.max(50, Math.floor(width * scaleFactor));
        height = Math.max(50, Math.floor(height * scaleFactor));
      }
    } else {
      if (quality < 0.9) {
        quality = Math.min(0.9, quality + 0.05);
      } else {
        const scaleFactor = Math.sqrt(targetSize / currentSize);
        width = Math.floor(width * scaleFactor);
        height = Math.floor(height * scaleFactor);
      }
    }

    return attemptCompression();
  }

  return attemptCompression();
}

export function getTimeAgo(createdAt: string) {
  const createdAtDate = new Date(createdAt);
  const diffInMinutes = Math.floor(
    (Date.now() - createdAtDate.getTime()) / 1000 / 60
  );
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays >= 1) {
    return createdAtDate.toLocaleDateString();
  }
  if (diffInHours >= 1) {
    return `${diffInHours}h`;
  }
  return `${diffInMinutes}m`;
}

export function getRandomIcon() {
  return ICON_URL_ARRAY[Math.floor(Math.random() * ICON_URL_ARRAY.length)];
}

export function getRandomBanner() {
  return BANNER_URL_ARRAY[Math.floor(Math.random() * BANNER_URL_ARRAY.length)];
}
