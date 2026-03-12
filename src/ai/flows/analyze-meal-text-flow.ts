
'use server';
/**
 * @fileOverview AI flow to analyze meal text and extract nutritional data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeMealInputSchema = z.object({
  text: z.string().describe('The user\'s description of what they ate.'),
  language: z.string().optional().default('vi'),
});
export type AnalyzeMealInput = z.infer<typeof AnalyzeMealInputSchema>;

const AnalyzeMealOutputSchema = z.object({
  name: z.string().describe('The identified name of the meal.'),
  calories: z.number().describe('Total calories in kcal.'),
  protein: z.number().describe('Protein in grams.'),
  carbs: z.number().describe('Carbohydrates in grams.'),
  fat: z.number().describe('Fat in grams.'),
  fiber: z.number().describe('Fiber in grams.'),
  explanation: z.string().describe('A brief explanation of the nutritional analysis in the requested language.'),
});
export type AnalyzeMealOutput = z.infer<typeof AnalyzeMealOutputSchema>;

const analyzeMealPrompt = ai.definePrompt({
  name: 'analyzeMealPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: AnalyzeMealInputSchema },
  output: { schema: AnalyzeMealOutputSchema },
  prompt: `
You are a professional nutritionist. A user has described what they ate: "{{{text}}}".

Your task is to:
1. Identify the meal name (or a concise summary of items).
2. Estimate the calories, protein, carbs, fat, and fiber for the portion described.
3. Provide a brief, friendly explanation of your analysis in {{language}}.

If the description is vague, provide reasonable estimates based on average serving sizes.

Respond ONLY with the structured JSON.
`,
});

export async function analyzeMealText(input: AnalyzeMealInput): Promise<AnalyzeMealOutput> {
  try {
    const { output } = await analyzeMealPrompt(input);
    if (!output) throw new Error('AI failed to provide analysis.');
    return output;
  } catch (error) {
    console.error('Analyze Meal Flow Error:', error);
    throw new Error('Could not analyze your meal. Please try describing it differently.');
  }
}
