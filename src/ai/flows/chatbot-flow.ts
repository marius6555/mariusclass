
'use server';
/**
 * @fileOverview A chatbot flow for the ClassHub Central website.
 *
 * - chat - A function that handles the chatbot conversation.
 * - ChatbotInput - The input type for the chat function.
 * - ChatbotOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ChatbotInputSchema = z.string();
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.string();
export type ChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

export async function chat(query: ChatbotInput): Promise<ChatbotOutput> {
  return chatbotFlow(query);
}

const prompt = ai.definePrompt({
  name: 'chatbotPrompt',
  input: {schema: ChatbotInputSchema},
  output: {schema: ChatbotOutputSchema},
  prompt: `You are a helpful assistant for a website called "ClassHub Central". 
  Your goal is to answer user questions about the website, its features, and how to navigate it.
  
  Here is a summary of the website's pages:
  - **Home**: The landing page. It has a welcoming message and a new chatbot (that's you!).
  - **Login/Sign Up**: Where users can create an account or log in. This is necessary to create a student profile or add projects.
  - **Student Profiles**: A page where students can create and view profiles. You can see classmates' majors, interests, and social links. You can edit or delete your own profile here.
  - **Project Hub**: A gallery of student projects. Users can add their own projects and browse projects created by others.
  - **Events/Updates**: A timeline of important dates, deadlines, and announcements. Admins can add new events.
  - **Resources**: A collection of useful links and files, like study materials and tools, organized by category. Admins can add new resources.
  - **Contact/Join Us**: A page with a form to send a message to the site administrator.
  - **Admin**: A private dashboard for the site administrator to manage messages, view student rosters, and customize the home page background.

  When answering, be friendly, concise, and helpful. If you don't know the answer, say that you can't help with that question.

  User's question: {{{query}}}`,
});

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async (query) => {
    const {output} = await prompt(query);
    return output!;
  }
);
