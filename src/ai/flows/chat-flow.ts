'use server';
/**
 * @fileOverview A simple chatbot flow.
 */

import {ai} from '@/ai/genkit';
import {Message, Role} from '@genkit-ai/ai';
import {z} from 'zod';

const ChatInputSchema = z.object({
  history: z.array(z.any()),
  prompt: z.string(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.string();
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async input => {
    const {history, prompt} = input;
    const messages: Message[] = history.map(h => ({
      role: h.role,
      content: [{text: h.prompt}],
    }));
    messages.push({role: 'user', content: [{text: prompt}]});
    const {output} = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      messages,
    });
    return output?.text || '';
  }
);
