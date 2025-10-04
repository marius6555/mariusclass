
import { z } from 'zod';

export const chatSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({ text: z.string() })),
});

export type ChatMessage = z.infer<typeof chatSchema>;
export type ChatHistory = ChatMessage[];
