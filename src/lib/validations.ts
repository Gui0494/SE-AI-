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

// Memory schemas
export const upsertMemorySchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, 'Key must be snake_case'),
  value: z.string().min(1).max(5000),
  category: z.enum(['personal', 'preferences', 'work', 'technical', 'projects', 'general']).default('general'),
});

export const deleteMemorySchema = z.object({
  memoryId: z.string().min(1),
});

// Upload schemas
export const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  size: z.number().positive(),
});

// Chat edit/regenerate schemas
export const regenerateSchema = z.object({
  messageId: z.string().min(1),
});

export const editMessageSchema = z.object({
  messageId: z.string().min(1),
  newContent: z.string().min(1).max(50000),
});

// Checkout schema
export const checkoutSchema = z.object({
  plan: z.enum(['PRO', 'ENTERPRISE']),
});

// Share schema
export const exportQuerySchema = z.object({
  format: z.enum(['md', 'json', 'txt']).default('md'),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpsertMemoryInput = z.infer<typeof upsertMemorySchema>;
export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;
export type RegenerateInput = z.infer<typeof regenerateSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
