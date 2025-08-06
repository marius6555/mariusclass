
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { chatRequestSchema } from '@/ai/schemas/chat';


export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: chatRequestSchema,
    outputSchema: z.string(),
  },
  async ({message, history}) => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-pro',
      prompt: {
        messages: [
            ...history,
            {role: 'user' as const, content: [{text: message}]},
        ],
      },
      config: {
        temperature: 0.5,
      },
    });

    return llmResponse.text;
  }
);
