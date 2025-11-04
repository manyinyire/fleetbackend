/**
 * Input Sanitization Utilities
 *
 * Provides functions to sanitize user input and prevent XSS attacks.
 * Uses DOMPurify for HTML sanitization and custom validators for other inputs.
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * Note: For full XSS protection, install isomorphic-dompurify:
 * npm install isomorphic-dompurify
 *
 * This basic implementation provides simple HTML escaping.
 * For production, consider using DOMPurify or similar libraries.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  // Basic HTML entity encoding
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize text for safe display
 * Removes potentially dangerous characters and scripts
 */
export function sanitizeText(input: string): string {
  if (!input) return '';

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  return sanitized.trim();
}

/**
 * Sanitize URL to prevent XSS via URLs
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  // Remove potentially dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
  ];

  const lowerUrl = url.toLowerCase().trim();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }

  // Only allow http, https, mailto, tel
  if (!/^(https?:|mailto:|tel:|\/|#)/i.test(url)) {
    return '';
  }

  return url.trim();
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  // Basic email validation and sanitization
  const sanitized = email.toLowerCase().trim();

  // Simple email regex (not comprehensive but good enough for sanitization)
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  if (!emailRegex.test(sanitized)) {
    return '';
  }

  return sanitized;
}

/**
 * Sanitize phone number
 * Removes all non-numeric characters except + and -
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';

  // Remove all characters except digits, +, -, and spaces
  return phone.replace(/[^\d+\-\s]/g, '').trim();
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';

  // Remove path separators and null bytes
  let sanitized = filename.replace(/[/\\]/g, '');
  sanitized = sanitized.replace(/\0/g, '');

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '');

  // Limit filename length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, 255 - (ext?.length || 0) - 1);
    sanitized = ext ? `${name}.${ext}` : name;
  }

  return sanitized.trim();
}

/**
 * Sanitize SQL-like input (basic protection, Prisma handles this better)
 */
export function sanitizeSqlInput(input: string): string {
  if (!input) return '';

  // Remove potentially dangerous SQL characters
  // Note: Prisma/ORMs handle SQL injection prevention
  // This is just an additional layer of defense
  return input
    .replace(/[;'"\\]/g, '')
    .trim();
}

/**
 * Sanitize search query
 * Removes special characters that could cause issues in search
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';

  // Remove special regex characters
  return query
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .trim();
}

/**
 * Sanitize number input
 */
export function sanitizeNumber(input: string | number): number | null {
  if (input === null || input === undefined || input === '') return null;

  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  return num;
}

/**
 * Sanitize integer input
 */
export function sanitizeInteger(input: string | number): number | null {
  const num = sanitizeNumber(input);

  if (num === null) return null;

  return Math.floor(num);
}

/**
 * Sanitize boolean input
 */
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    const lower = input.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  if (typeof input === 'number') return input !== 0;
  return false;
}

/**
 * Sanitize object by recursively sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeText(value) as any;
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item =>
        typeof item === 'string' ? sanitizeText(item) : item
      ) as any;
    } else if (value && typeof value === 'object') {
      sanitized[key as keyof T] = sanitizeObject(value) as any;
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize JSON input
 */
export function sanitizeJson(input: string): any | null {
  if (!input) return null;

  try {
    const parsed = JSON.parse(input);
    return sanitizeObject(parsed);
  } catch {
    return null;
  }
}

/**
 * Strip HTML tags completely (for plain text extraction)
 */
export function stripHtmlTags(input: string): string {
  if (!input) return '';

  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();
}

/**
 * Truncate string to maximum length
 */
export function truncateString(
  input: string,
  maxLength: number,
  ellipsis: string = '...'
): string {
  if (!input || input.length <= maxLength) return input;

  return input.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Escape special characters for use in regex
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
