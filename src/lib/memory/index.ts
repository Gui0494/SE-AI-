import { db } from '@/lib/db';
import { complete } from '@/lib/ai/router';
import { ChatMessage } from '@/lib/ai/types';

const EXTRACTION_MODEL = 'gpt-4.1-nano';

export async function getMemories(userId: string) {
  return db.memory.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getMemoriesByCategory(userId: string, category: string) {
  return db.memory.findMany({
    where: { userId, category },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function upsertMemory(
  userId: string,
  key: string,
  value: string,
  category: string = 'general'
) {
  return db.memory.upsert({
    where: { userId_key: { userId, key } },
    create: { userId, key, value, category },
    update: { value, category },
  });
}

export async function deleteMemory(userId: string, memoryId: string) {
  await db.memory.deleteMany({
    where: { id: memoryId, userId },
  });
}

export async function extractMemories(
  messages: ChatMessage[]
): Promise<{ key: string; value: string; category: string }[]> {
  try {
    const conversation = messages
      .filter((m) => m.role !== 'system')
      .slice(-10)
      .map((m) => `${m.role}: ${m.content.substring(0, 500)}`)
      .join('\n');

    const response = await complete({
      model: EXTRACTION_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You extract factual information about the user from conversations. Return ONLY valid JSON arrays.',
        },
        {
          role: 'user',
          content: `Analyze this conversation and extract factual information about the user that would be useful to remember across conversations.
Return a JSON array of objects with: key (unique snake_case identifier), value (the fact), category (one of: personal, preferences, work, technical, projects).
Only extract concrete facts, not opinions or temporary states. If nothing worth remembering, return [].
Examples: {"key": "programming_language", "value": "Prefers TypeScript over JavaScript", "category": "preferences"}
{"key": "name", "value": "User name is Guilherme", "category": "personal"}

Conversation:
${conversation}`,
        },
      ],
      temperature: 0.3,
      maxTokens: 1024,
    });

    const content = response.content.trim();
    // Extract JSON array from response (may be wrapped in markdown code block)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item: unknown): item is { key: string; value: string; category: string } =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).key === 'string' &&
        typeof (item as Record<string, unknown>).value === 'string' &&
        typeof (item as Record<string, unknown>).category === 'string'
    );
  } catch (error) {
    console.error('[Memory extraction error]', error instanceof Error ? error.message : error);
    return [];
  }
}

export function formatMemoriesForPrompt(
  memories: { key: string; value: string; category: string }[]
): string[] {
  return memories.map((m) => `${m.category}: ${m.value}`);
}
