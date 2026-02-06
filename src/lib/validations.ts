import { z } from 'zod';

export const createChatSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  model: z.string().min(1).default('gpt-4.1-mini'),
  style: z
    .enum([
      'default',
      'concise',
      'detailed',
      'creative',
      'technical',
      'friendly',
      'professional',
      'teacher',
    ])
    .default('default'),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(50000),
  model: z.string().min(1).optional(),
  attachments: z
    .array(
      z.object({
        type: z.enum(['image', 'file']),
        url: z.string().url(),
        name: z.string(),
        mimeType: z.string(),
        size: z.number().optional(),
      })
    )
    .optional(),
  tools: z.array(z.string()).optional(),
  style: z.string().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
