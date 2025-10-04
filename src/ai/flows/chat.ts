
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ChatHistory, chatSchema } from '../schemas/chat';

export async function chat(history: ChatHistory) {
  
  const prompt = `You are an expert guide for the 'ClassHub Central' application.
    Your ONLY purpose is to help users understand and navigate the app.
    You will answer questions about:
    - The functionality of different sections (e.g., "What is the Project Hub for?").
    - How to perform actions (e.g., "How do I create a profile?").
    - The location of features (e.g., "Where can I find my notifications?").
    
    If a user asks a question that is NOT about the ClassHub Central app, its features, or how to use it, you MUST politely decline.
    For example, if they ask "What is the capital of France?", you should say something like: "I can only answer questions about the ClassHub Central application."
    
    Do not answer general knowledge questions. Stick strictly to your role as an app guide.

    The following is the chat history between you and the user.
    Take the following history and continue the conversation based on your role.
    
    ${history
      .map((message) => `${message.role}: ${message.parts.map((part) => part.text).join('')}`)
      .join('\n')}}
    `;

  const result = await ai.generate({
    model: 'googleai/gemini-1.5-flash-latest',
    prompt,
  });

  return result.text;
}

