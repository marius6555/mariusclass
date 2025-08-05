
'use server';
/**
 * @fileOverview A chatbot flow for the resources page.
 *
 * - chat - A function that handles the chatbot conversation.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getAdminDetails } from '@/services/admin';

const ChatbotInputSchema = z.object({
  query: z.string().describe("The user's question about the website."),
});
export type ChatInput = z.infer<typeof ChatbotInputSchema>;

export type ChatOutput = string;


export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatbotFlow(input);
}

const getAdminContactTool = ai.defineTool(
    {
        name: 'getAdminContact',
        description: 'Use this to get the contact information for the site administrator when the user asks a question that is not about the available resources.',
        inputSchema: z.object({}),
        outputSchema: z.object({
            name: z.string(),
            email: z.string(),
            whatsapp: z.string().optional(),
        }),
    },
    async () => {
        return getAdminDetails();
    }
);


const prompt = ai.definePrompt({
  name: 'resourcesChatbotPrompt',
  input: {schema: ChatbotInputSchema},
  output: {format: 'text'},
  tools: [getAdminContactTool],
  prompt: `You are a friendly and helpful assistant for the "Resources" page of a university student hub website called ClassHub Central.

Your goal is to answer user questions about the resources available on the page. If the user asks a question that is not about the resources, you should use the getAdminContact tool to get the administrator's contact information and provide it to the user.

The available resource categories are:
- Learning Platform
- Tools You Must Try
- Project Ideas
- Upcoming Tech Challenges

Based on the user's query: "{{query}}", provide a helpful and concise answer. Be friendly and conversational. Guide them to the right category if the question is about resources. If it is not about resources, politely state that you can't answer the question and provide the admin's contact details.
`,
});

const chatbotFlow = ai.defineFlow(
  {
    name: 'resourcesChatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
