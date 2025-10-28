import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get initials from a user's full name
 * Examples:
 * - "John Doe" -> "JD"
 * - "John" -> "JO"
 * - "John Michael Doe" -> "JD"
 * - "jane" -> "JA"
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return "??";
  }

  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    // Single word: return first 2 letters
    return name.substring(0, 2).toUpperCase();
  }
  
  // Multiple words: return first letter of first and last word
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}
