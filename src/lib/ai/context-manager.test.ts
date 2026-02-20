import { describe, it, expect } from 'vitest';
import { manageContext, buildSummaryPrompt } from './context-manager';
import { ChatMessage } from './types';

function makeMessages(count: number, contentLength = 100): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are a helpful assistant.' },
  ];
  for (let i = 0; i < count; i++) {
    messages.push({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: 'x'.repeat(contentLength),
    });
  }
  return messages;
}

describe('manageContext', () => {
  it('returns all messages when they fit in context', () => {
    const messages = makeMessages(4, 50);
    const result = manageContext(messages, {
      maxContextTokens: 10000,
      reserveTokens: 100,
    });
    expect(result.messages).toHaveLength(5); // 1 system + 4 conversation
    expect(result.wasTruncated).toBe(false);
  });

  it('truncates when messages exceed context window', () => {
    const messages = makeMessages(50, 500);
    const result = manageContext(messages, {
      maxContextTokens: 1000,
      reserveTokens: 100,
      maxRecentMessages: 30,
    });
    expect(result.wasTruncated).toBe(true);
    expect(result.messages.length).toBeLessThan(messages.length);
  });

  it('respects maxRecentMessages', () => {
    const messages = makeMessages(40, 10);
    const result = manageContext(messages, {
      maxContextTokens: 100000,
      maxRecentMessages: 5,
    });
    // system + 5 recent
    const conversationMsgs = result.messages.filter((m) => m.role !== 'system');
    expect(conversationMsgs.length).toBeLessThanOrEqual(5);
  });

  it('injects summary when truncated and summary provided', () => {
    const messages = makeMessages(50, 500);
    const result = manageContext(messages, {
      maxContextTokens: 1000,
      reserveTokens: 100,
      maxRecentMessages: 30,
      summary: 'Previous discussion about AI models.',
    });
    expect(result.wasTruncated).toBe(true);
    const summaryMsg = result.messages.find(
      (m) => m.role === 'system' && m.content.includes('Summary of earlier conversation')
    );
    expect(summaryMsg).toBeDefined();
  });

  it('always keeps at least 2 conversation messages', () => {
    const messages = makeMessages(10, 5000);
    const result = manageContext(messages, {
      maxContextTokens: 500,
      reserveTokens: 100,
    });
    const conversationMsgs = result.messages.filter((m) => m.role !== 'system');
    expect(conversationMsgs.length).toBeGreaterThanOrEqual(2);
  });
});

describe('buildSummaryPrompt', () => {
  it('generates a summary prompt from messages', () => {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'System prompt' },
      { role: 'user', content: 'What is AI?' },
      { role: 'assistant', content: 'AI is...' },
    ];
    const prompt = buildSummaryPrompt(messages);
    expect(prompt).toContain('Summarize');
    expect(prompt).toContain('user: What is AI?');
    expect(prompt).toContain('assistant: AI is...');
    expect(prompt).not.toContain('System prompt');
  });

  it('truncates long messages to 500 chars', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'a'.repeat(1000) },
    ];
    const prompt = buildSummaryPrompt(messages);
    // The message content in the prompt should be capped at 500
    const contentMatch = prompt.match(/user: (a+)/);
    expect(contentMatch?.[1].length).toBe(500);
  });
});
