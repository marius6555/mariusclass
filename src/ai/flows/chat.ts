
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ChatHistory, chatSchema } from '../schemas/chat';

export async function chat(history: ChatHistory) {
  
  const prompt = `You are a helpful assistant for the ClassHub Central application.
    The following is the chat history between you and the user.
    Take the following history and continue the conversation.
    If you don't know an answer, just say "I'm not sure."
    
    ${history
      .map((message) => `${message.role}: ${message.parts.map((part) => part.text).join('')}`)
      .join('\n')}}
    `;

  const result = await ai.generate({
    model: 'googleai/gemini-pro',
    prompt,
  });

  return result.text;
}

