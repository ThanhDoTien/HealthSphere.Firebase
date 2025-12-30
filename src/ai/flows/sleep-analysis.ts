'use server';

/**
 * @fileOverview A sleep analysis AI agent.
 *
 * - getSleepAnalysis - A function that provides an analysis of sleep patterns.
 * - SleepAnalysisInput - The input type for the getSleepAnalysis function.
 * - SleepAnalysisOutput - The return type for the getSleepAnalysis function.
 */

import {ai, geminiModel} from '@/ai/genkit';
import {z} from 'genkit';

const SleepAnalysisInputSchema = z.object({
  sleepData: z
    .string()
    .describe(
      'The last 7 days of sleep data, formatted as a string. e.g., "Monday: 7.5 hours, Tuesday: 6 hours, ..."'
    ),
});
export type SleepAnalysisInput = z.infer<typeof SleepAnalysisInputSchema>;

const SleepAnalysisOutputSchema = z.object({
  analysis: z
    .string()
    .describe(
      'An analysis of the sleep pattern and suggestions for improvement.'
    ),
});
export type SleepAnalysisOutput = z.infer<typeof SleepAnalysisOutputSchema>;

export async function getSleepAnalysis(
  input: SleepAnalysisInput
): Promise<SleepAnalysisOutput> {
  return sleepAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sleepAnalysisPrompt',
  model: geminiModel,
  input: {schema: SleepAnalysisInputSchema},
  output: {schema: SleepAnalysisOutputSchema},
  prompt: `You are a sleep analysis expert. Analyze the user's sleep data for the last 7 days and provide insights and suggestions for improving sleep quality.

Sleep Data: {{{sleepData}}}

Provide a concise analysis and actionable tips. If sleep quality is good, commend the user.
`,
});

const sleepAnalysisFlow = ai.defineFlow(
  {
    name: 'sleepAnalysisFlow',
    inputSchema: SleepAnalysisInputSchema,
    outputSchema: SleepAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
