'use server';

/**
 * @fileOverview Flow for providing personalized health insights based on user data.
 *
 * - getPersonalizedInsights - A function that generates personalized health insights.
 * - PersonalizedInsightsInput - The input type for the getPersonalizedInsights function.
 * - PersonalizedInsightsOutput - The return type for the getPersonalizedInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedInsightsInputSchema = z.object({
  calorieIntake: z.number().describe('The user\u0027s daily calorie intake.'),
  activityLevel: z.string().describe('The user\u0027s activity level (e.g., sedentary, moderate, active).'),
  dietaryPreferences: z.string().describe('The user\u0027s dietary preferences (e.g., vegetarian, vegan, gluten-free).'),
  loggedFoods: z.string().describe('A list of foods the user has logged.'),
});
export type PersonalizedInsightsInput = z.infer<typeof PersonalizedInsightsInputSchema>;

const PersonalizedInsightsOutputSchema = z.object({
  insights: z.string().describe('Personalized health insights and recommendations based on the user\u0027s data.'),
});
export type PersonalizedInsightsOutput = z.infer<typeof PersonalizedInsightsOutputSchema>;

export async function getPersonalizedInsights(input: PersonalizedInsightsInput): Promise<PersonalizedInsightsOutput> {
  return personalizedInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedInsightsPrompt',
  input: {schema: PersonalizedInsightsInputSchema},
  output: {schema: PersonalizedInsightsOutputSchema},
  prompt: `You are a personal health and nutrition advisor. Based on the following information about the user, provide personalized health insights and recommendations. Focus on their calorie intake, activity level and dietary preferences. Also, suggest healthy changes they can make to their current diet.

Calorie Intake: {{{calorieIntake}}}
Activity Level: {{{activityLevel}}}
Dietary Preferences: {{{dietaryPreferences}}}
Logged Foods: {{{loggedFoods}}}`,
});

const personalizedInsightsFlow = ai.defineFlow(
  {
    name: 'personalizedInsightsFlow',
    inputSchema: PersonalizedInsightsInputSchema,
    outputSchema: PersonalizedInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
