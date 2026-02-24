'use server';
/**
 * @fileOverview Generates health suggestions based on user data.
 * - getHealthSuggestions - A function that handles the health suggestion process.
 * - HealthSuggestionRequest - The input type for the getHealthSuggestions function.
 * - HealthSuggestionResponse - The return type for the getHealthSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const HealthSuggestionRequestSchema = z.object({
  userProfile: z.object({
    goal: z.string(),
    weight: z.number(),
    height: z.number(),
    age: z.number(),
    gender: z.string(),
  }),
  dailySummary: z.object({
    caloriesConsumed: z.number(),
    caloriesBurned: z.number(),
    sleepHours: z.number(),
  }),
  recentActivities: z.array(z.string()),
});
export type HealthSuggestionRequest = z.infer<
  typeof HealthSuggestionRequestSchema
>;

const MealSuggestionSchema = z.object({
  name: z.string().describe('Name of the meal.'),
  recipe: z
    .string()
    .describe(
      'A simple recipe or preparation instructions for the meal, written in markdown format.'
    ),
  calories: z.number().describe('Estimated calories for the meal.'),
});

const ExerciseSuggestionSchema = z.object({
  name: z.string().describe('Name of the exercise or activity.'),
  description: z
    .string()
    .describe(
      'Description of the exercise and why it is suggested, written in markdown format.'
    ),
});

const HealthSuggestionResponseSchema = z.object({
  mealSuggestions: z
    .array(MealSuggestionSchema)
    .describe(
      'A list of 3 meal suggestions for the day (breakfast, lunch, dinner).'
    ),
  workoutSuggestion: z
    .array(ExerciseSuggestionSchema)
    .describe('A list of 2-3 suggested exercises or a workout routine.'),
  generalTip: z
    .string()
    .describe("A general, encouraging health tip for the day."),
});
export type HealthSuggestionResponse = z.infer<
  typeof HealthSuggestionResponseSchema
>;

const suggestionPrompt = ai.definePrompt({
  name: 'healthSuggestionPrompt',
  input: { schema: HealthSuggestionRequestSchema },
  output: { schema: HealthSuggestionResponseSchema },
  model: googleAI.model('gemini-pro'),
  prompt: `You are a friendly and encouraging AI health assistant. Your goal is to provide personalized, actionable, and safe health suggestions based on the user's data.

Analyze the following user data:
- **User Profile:**
  - Health Goal: {{{userProfile.goal}}}
  - Current Weight: {{{userProfile.weight}}} kg
  - Height: {{{userProfile.height}}} cm
  - Age: {{{userProfile.age}}}
  - Gender: {{{userProfile.gender}}}
- **Today's Summary:**
  - Calories Consumed: {{{dailySummary.caloriesConsumed}}} kcal
  - Calories Burned: {{{dailySummary.caloriesBurned}}} kcal
  - Hours Slept: {{{dailySummary.sleepHours}}} hours
- **Recent Activities:**
{{#each recentActivities}}
- {{{this}}}
{{/each}}

Based on this data, provide a set of suggestions.

Your suggestions should be:
1.  **Meal Suggestions:** Provide 3 meal ideas (one for breakfast, one for lunch, one for dinner) that align with the user's goals and today's calorie intake. Include a simple recipe for each.
2.  **Workout Suggestion:** Recommend 2 or 3 exercises or a short workout routine. The suggestions should be appropriate for the user's recent activities and goals.
3.  **General Tip:** Provide one general, encouraging tip for the day.

Generate the response in the required JSON format. The response should be in English.
`,
});

const suggestionFlow = ai.defineFlow(
  {
    name: 'suggestionFlow',
    inputSchema: HealthSuggestionRequestSchema,
    outputSchema: HealthSuggestionResponseSchema,
  },
  async (input) => {
    const { output } = await suggestionPrompt(input);
    if (!output) {
      throw new Error('Failed to get a response from the AI model.');
    }
    return output;
  }
);

export async function getHealthSuggestions(
  input: HealthSuggestionRequest
): Promise<HealthSuggestionResponse> {
  return await suggestionFlow(input);
}
