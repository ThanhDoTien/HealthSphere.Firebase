import {genkit, GenerationCommon} from 'genkit';
import {googleAI, GoogleAIGenerativeAI} from '@genkit-ai/google-genai';
import {config} from 'dotenv';

config({path: '.env'});

const plugins: any[] = [];
let geminiModel: GenerationCommon<GoogleAIGenerativeAI, any> | undefined = undefined;

if (process.env.GEMINI_API_KEY) {
  const googleAiPlugin = googleAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  plugins.push(googleAiPlugin);
  geminiModel = googleAI.model('gemini-pro');
} else {
  console.warn(
    'GEMINI_API_KEY is not set. GenAI features will be disabled. Please add it to your .env file.'
  );
}

export const ai = genkit({
  plugins,
});

export {geminiModel};
