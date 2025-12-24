'use server';
/**
 * @fileOverview Nutrition logging with image recognition flow.
 *
 * This flow allows users to log nutrition by taking a photo of their meal.
 * It uses AI to identify the food items and estimate their nutritional content.
 *
 * @interface NutritionLoggingInput - The input type for the nutrition logging flow.
 * @interface NutritionLoggingOutput - The output type for the nutrition logging flow.
 * @function nutritionLoggingWithImageRecognition - The main function to start the flow.
 */

import {ai, geminiModel} from '@/ai/genkit';
import {z} from 'genkit';

const NutritionLoggingInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type NutritionLoggingInput = z.infer<typeof NutritionLoggingInputSchema>;

const NutritionLoggingOutputSchema = z.object({
  foodItems: z
    .array(z.string())
    .describe('A list of food items identified in the photo.'),
  estimatedNutritionalContent: z.string().describe('Estimated nutritional content of the meal.'),
});

export type NutritionLoggingOutput = z.infer<typeof NutritionLoggingOutputSchema>;

export async function nutritionLoggingWithImageRecognition(
  input: NutritionLoggingInput
): Promise<NutritionLoggingOutput> {
  return nutritionLoggingFlow(input);
}

const nutritionLoggingPrompt = ai.definePrompt({
  name: 'nutritionLoggingPrompt',
  model: geminiModel,
  input: {schema: NutritionLoggingInputSchema},
  output: {schema: NutritionLoggingOutputSchema},
  prompt: `You are a nutrition expert. You will analyze the image of the meal and identify the food items. Then you will estimate the nutritional content of the meal.

    Photo: {{media url=photoDataUri}}
    
    Respond in the following format:
    Food Items: <list of food items identified in the photo>
    Estimated Nutritional Content: <estimated nutritional content of the meal>
    `,
});

const nutritionLoggingFlow = ai.defineFlow(
  {
    name: 'nutritionLoggingFlow',
    inputSchema: NutritionLoggingInputSchema,
    outputSchema: NutritionLoggingOutputSchema,
  },
  async input => {
    const {output} = await nutritionLoggingPrompt(input);
    return output!;
  }
);
