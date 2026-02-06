import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString();
}

export function groupChatsByDate<T extends { updatedAt: string | Date }>(
  chats: T[]
): { label: string; chats: T[] }[] {
  const groups: Record<string, T[]> = {};

  for (const chat of chats) {
    const label = formatDate(chat.updatedAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(chat);
  }

  return Object.entries(groups).map(([label, chats]) => ({ label, chats }));
}
