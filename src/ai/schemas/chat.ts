import {z} from 'zod';

export const chatHistorySchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({text: z.string()})),
});

export const chatRequestSchema = z.object({
  message: z.string(),
  history: z.array(chatHistorySchema),
});

export type ChatHistory = z.infer<typeof chatHistorySchema>;
