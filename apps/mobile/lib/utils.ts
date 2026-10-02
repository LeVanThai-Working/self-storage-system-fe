import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class names, resolving conflicts correctly.
 * Mirrors the `cn` utility used in the web app.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
