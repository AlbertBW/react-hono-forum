import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function resizeBase64Image(base64: string) {
  return new Promise<string>((resolve) => {
    const maxSizeInMB = 0.02;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get 2d context");
      }
      const width = img.width;
      const height = img.height;
      const aspectRatio = width / height;

      const newWidth = Math.sqrt(maxSizeInBytes * aspectRatio);
      const newHeight = Math.sqrt(maxSizeInBytes / aspectRatio);

      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      const quality = 0.8;
      const dataURL = canvas.toDataURL("image/jpeg", quality);

      resolve(dataURL);
    };
  });
}

export function getPostTime(createdAt: string) {
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
