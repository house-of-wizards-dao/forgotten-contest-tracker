import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Wrapper around fetch that injects the API key header for mutating requests.
 * Reads the key from the NEXT_PUBLIC_API_KEY env var at runtime.
 */
export async function apiFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const headers = new Headers(options?.headers);
  const apiKey =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_KEY
      : undefined;
  if (apiKey) {
    headers.set("X-API-Key", apiKey);
  }
  return fetch(url, { ...options, headers });
}
