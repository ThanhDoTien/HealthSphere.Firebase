'use server';

/**
 * @fileOverview A recipe recommendation AI agent based on user's dietary preferences and logged foods.
 *
 * - recipeRecommendationsBasedOnLoggedFoods - A function that handles the recipe recommendation process.
 * - RecipeRecommendationsBasedOnLoggedFoodsInput - The input type for the recipeRecommendationsBasedOnLoggedFoods function.
 * - RecipeRecommendationsBasedOnLoggedFoodsOutput - The return type for the recipeRecommendationsBasedOnLoggedFoods function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecipeRecommendationsBasedOnLoggedFoodsInputSchema = z.object({
  dietaryPreferences: z.string().describe('The user dietary preferences.'),
  loggedFoods: z.string().describe('The foods the user has logged.'),
});
export type RecipeRecommendationsBasedOnLoggedFoodsInput = z.infer<
  typeof RecipeRecommendationsBasedOnLoggedFoodsInputSchema
>;

const RecipeRecommendationsBasedOnLoggedFoodsOutputSchema = z.object({
  recipeRecommendations: z
    .string()
    .describe('The recommended recipes based on dietary preferences and logged foods.'),
});
export type RecipeRecommendationsBasedOnLoggedFoodsOutput = z.infer<
  typeof RecipeRecommendationsBasedOnLoggedFoodsOutputSchema
>;

export async function recipeRecommendationsBasedOnLoggedFoods(
  input: RecipeRecommendationsBasedOnLoggedFoodsInput
): Promise<RecipeRecommendationsBasedOnLoggedFoodsOutput> {
  return recipeRecommendationsBasedOnLoggedFoodsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recipeRecommendationsBasedOnLoggedFoodsPrompt',
  input: {schema: RecipeRecommendationsBasedOnLoggedFoodsInputSchema},
  output: {schema: RecipeRecommendationsBasedOnLoggedFoodsOutputSchema},
  prompt: `You are a recipe recommendation expert.

You will use the user's dietary preferences and logged foods to recommend recipes that align with their nutritional goals.

Dietary Preferences: {{{dietaryPreferences}}}
Logged Foods: {{{loggedFoods}}}

Recommend recipes based on the above information.
`,
});

const recipeRecommendationsBasedOnLoggedFoodsFlow = ai.defineFlow(
  {
    name: 'recipeRecommendationsBasedOnLoggedFoodsFlow',
    inputSchema: RecipeRecommendationsBasedOnLoggedFoodsInputSchema,
    outputSchema: RecipeRecommendationsBasedOnLoggedFoodsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
