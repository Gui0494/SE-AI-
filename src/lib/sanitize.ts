/**
 * Input sanitization utilities for user-submitted text.
 * These run at API boundaries before data enters the system.
 */

const HTML_TAG_RE = /<[^>]*>/g;
const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Sanitize user text input:
 * - Remove HTML tags
 * - Remove control characters (keep \n, \t, \r)
 * - Trim whitespace
 * - Enforce max length
 */
export function sanitizeText(input: string, maxLength = 100_000): string {
  return input
    .replace(HTML_TAG_RE, '')
    .replace(CONTROL_CHAR_RE, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize a short text field (names, titles, etc.)
 * Stricter: no newlines, shorter limit
 */
export function sanitizeShortText(input: string, maxLength = 500): string {
  return input
    .replace(HTML_TAG_RE, '')
    .replace(CONTROL_CHAR_RE, '')
    .replace(/[\n\r]/g, ' ')
    .trim()
    .slice(0, maxLength);
}
