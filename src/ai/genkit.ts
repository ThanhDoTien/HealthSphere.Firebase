'use server';
import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash, // Set gemini-1.5-flash as the default model
});
