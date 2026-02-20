import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeShortText } from './sanitize';

describe('sanitizeText', () => {
  it('strips HTML tags', () => {
    expect(sanitizeText('Hello <script>alert("xss")</script> world')).toBe(
      'Hello alert("xss") world'
    );
  });

  it('strips nested HTML', () => {
    expect(sanitizeText('<div><p>Text</p></div>')).toBe('Text');
  });

  it('removes control characters but keeps newlines and tabs', () => {
    expect(sanitizeText('Hello\x00\x01\nWorld\t!')).toBe('Hello\nWorld\t!');
  });

  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('enforces max length', () => {
    const long = 'a'.repeat(200);
    expect(sanitizeText(long, 100)).toHaveLength(100);
  });

  it('handles empty string', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('uses default max length of 100000', () => {
    const long = 'x'.repeat(100_010);
    expect(sanitizeText(long)).toHaveLength(100_000);
  });
});

describe('sanitizeShortText', () => {
  it('strips HTML tags', () => {
    expect(sanitizeShortText('<b>Bold</b>')).toBe('Bold');
  });

  it('replaces newlines with spaces', () => {
    expect(sanitizeShortText('line1\nline2\rline3')).toBe('line1 line2 line3');
  });

  it('enforces default max length of 500', () => {
    const long = 'z'.repeat(600);
    expect(sanitizeShortText(long)).toHaveLength(500);
  });

  it('enforces custom max length', () => {
    expect(sanitizeShortText('hello world', 5)).toBe('hello');
  });
});
