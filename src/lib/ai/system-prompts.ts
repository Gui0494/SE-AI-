import { SystemPromptConfig } from './types';

const STYLE_PROMPTS: Record<string, string> = {
  default: `You are a helpful AI assistant. Provide clear, accurate, and well-structured responses. Use markdown formatting when appropriate.`,
  concise: `You are a helpful AI assistant. Be brief and to the point. Avoid unnecessary explanations. Use bullet points for lists.`,
  detailed: `You are a helpful AI assistant. Provide thorough, comprehensive responses with examples and explanations. Cover edge cases and related topics.`,
  creative: `You are a creative AI assistant. Think outside the box, offer unique perspectives, and use engaging language. Be imaginative while staying accurate.`,
  technical: `You are a technical AI assistant. Use precise terminology, provide code examples when relevant, and focus on implementation details. Assume the user has technical background.`,
  friendly: `You are a friendly AI assistant. Be warm, approachable, and encouraging. Use casual language while remaining helpful and accurate.`,
  professional: `You are a professional AI assistant. Maintain a formal tone, be precise, and structure your responses in a business-appropriate manner.`,
  teacher: `You are an AI teaching assistant. Explain concepts step by step, use analogies, check understanding, and encourage learning. Start from fundamentals and build up.`,
};

export function buildSystemPrompt(config: SystemPromptConfig): string {
  const parts: string[] = [];

  // Base style prompt
  parts.push(STYLE_PROMPTS[config.style] || STYLE_PROMPTS.default);

  // Context from conversation summary
  if (config.context) {
    parts.push(`\n## Previous Context\n${config.context}`);
  }

  // User memories
  if (config.memories?.length) {
    parts.push(`\n## About the User\n${config.memories.join('\n')}`);
  }

  // Available tools
  if (config.tools?.length) {
    parts.push(
      `\n## Available Tools\nYou have access to the following tools: ${config.tools.join(', ')}. Use them when appropriate to answer user questions.`
    );
  }

  // General instructions
  parts.push(`\n## Guidelines
- Use markdown formatting for structured content
- Use code blocks with language identifiers for code
- Be honest when you don't know something
- Ask for clarification when the request is ambiguous
- Current date: ${new Date().toISOString().split('T')[0]}`);

  return parts.join('\n');
}
