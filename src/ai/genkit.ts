import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {config} from 'dotenv';

config();

const plugins = [];
let model;

if (process.env.GEMINI_API_KEY) {
  plugins.push(googleAI());
  model = googleAI('gemini-1.5-flash-latest');
} else {
  console.warn(
    'GEMINI_API_KEY is not set. GenAI features will be disabled. Please add it to your .env file.'
  );
}

export const ai = genkit({
  plugins,
  model,
});
