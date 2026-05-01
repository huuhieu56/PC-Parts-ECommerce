import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format price in Vietnamese đồng.
 * Handles null/undefined gracefully.
 */
export function formatPrice(price: number | undefined | null): string {
  return (price ?? 0).toLocaleString("vi-VN") + " đ";
}
