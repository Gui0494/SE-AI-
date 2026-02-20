import { ChatMessage } from './types';

const APPROX_CHARS_PER_TOKEN = 4;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / APPROX_CHARS_PER_TOKEN);
}

function estimateMessageTokens(messages: ChatMessage[]): number {
  return messages.reduce((sum, msg) => {
    return sum + estimateTokens(msg.content) + 4; // 4 tokens overhead per message
  }, 0);
}

export interface ContextManagerOptions {
  maxContextTokens: number;
  reserveTokens?: number; // tokens to reserve for response
  maxRecentMessages?: number;
  summary?: string | null;
}

export interface ManagedContext {
  messages: ChatMessage[];
  wasTruncated: boolean;
  estimatedTokens: number;
}

/**
 * Manages conversation context by:
 * 1. Always keeping the system prompt
 * 2. Keeping the most recent N messages in full
 * 3. If there's a summary, injecting it before recent messages
 * 4. Truncating if total tokens exceed the limit
 */
export function manageContext(
  allMessages: ChatMessage[],
  options: ContextManagerOptions
): ManagedContext {
  const {
    maxContextTokens,
    reserveTokens = 2048,
    maxRecentMessages = 30,
  } = options;

  const availableTokens = maxContextTokens - reserveTokens;

  // Separate system messages from conversation
  const systemMessages = allMessages.filter((m) => m.role === 'system');
  const conversationMessages = allMessages.filter((m) => m.role !== 'system');

  const systemTokens = estimateMessageTokens(systemMessages);
  const remainingTokens = availableTokens - systemTokens;

  // Take the most recent messages
  const recentMessages = conversationMessages.slice(-maxRecentMessages);
  let recentTokens = estimateMessageTokens(recentMessages);

  // If recent messages fit, return them
  if (recentTokens <= remainingTokens) {
    const messages = [...systemMessages, ...recentMessages];
    return {
      messages,
      wasTruncated: recentMessages.length < conversationMessages.length,
      estimatedTokens: systemTokens + recentTokens,
    };
  }

  // Truncate by removing oldest messages until we fit
  const truncatedRecent = [...recentMessages];
  while (truncatedRecent.length > 2 && recentTokens > remainingTokens) {
    const removed = truncatedRecent.shift()!;
    recentTokens -= estimateTokens(removed.content) + 4;
  }

  // If we have a summary, inject it
  if (options.summary) {
    const summaryMessage: ChatMessage = {
      role: 'system',
      content: `Summary of earlier conversation:\n${options.summary}`,
    };
    const messages = [...systemMessages, summaryMessage, ...truncatedRecent];
    return {
      messages,
      wasTruncated: true,
      estimatedTokens: systemTokens + estimateTokens(options.summary) + recentTokens,
    };
  }

  const messages = [...systemMessages, ...truncatedRecent];
  return {
    messages,
    wasTruncated: true,
    estimatedTokens: systemTokens + recentTokens,
  };
}

/**
 * Generates a prompt for summarizing conversation history.
 */
export function buildSummaryPrompt(messages: ChatMessage[]): string {
  const conversation = messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role}: ${m.content.substring(0, 500)}`)
    .join('\n');

  return `Summarize the following conversation in 2-3 paragraphs, capturing the key topics, decisions, and any important details mentioned:\n\n${conversation}`;
}
