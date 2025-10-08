import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {defineDotprompt} from 'genkit/dotprompt';

defineDotprompt({
  name: 'studentOnboarding',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {
    schema: {
      type: 'object',
      properties: {
        major: {type: 'string'},
        interests: {type: 'string'},
      },
    },
  },
  output: {
    format: 'json',
    schema: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: {type: 'string'},
              reason: {type: 'string'},
            },
          },
        },
      },
    },
  },
});

export const ai = genkit({
  plugins: [googleAI()],
});
