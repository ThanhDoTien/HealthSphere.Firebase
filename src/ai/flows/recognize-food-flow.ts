'use server';
/**
 * @fileOverview Identifies food items from an image and estimates their nutritional value.
 * - recognizeFood - A function that handles the food recognition process.
 * - RecognizeFoodRequest - The input type for the recognizeFood function.
 * - RecognizeFoodResponse - The return type for the recognizeFood function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const RecognizeFoodRequestSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeFoodRequest = z.infer<typeof RecognizeFoodRequestSchema>;

const FoodItemSchema = z.object({
  name: z.string().describe('The name of the identified food item.'),
  calories: z
    .number()
    .describe('The estimated calorie count for the food item.'),
});

const RecognizeFoodResponseSchema = z.object({
  identifiedFoods: z
    .array(FoodItemSchema)
    .describe(
      'An array of food items identified in the image. Returns an empty array if no food is found.'
    ),
  totalCalories: z
    .number()
    .describe('The sum of calories for all identified food items.'),
});
export type RecognizeFoodResponse = z.infer<typeof RecognizeFoodResponseSchema>;

const foodRecognitionPrompt = ai.definePrompt({
  name: 'foodRecognitionPrompt',
  input: { schema: RecognizeFoodRequestSchema },
  output: { schema: RecognizeFoodResponseSchema },
  model: 'gemini-pro-vision',
  prompt: `You are an expert nutritionist. Your task is to analyze the image of a meal provided by the user and identify all the food items present.

For each food item you identify, provide its name and an estimated calorie count for a standard serving size shown in the picture.

Combine the calories of all items to provide a total calorie count for the meal.

If the image does not appear to contain any food, please return an empty array for 'identifiedFoods' and a 'totalCalories' of 0.

User's photo: {{media url=photoDataUri}}`,
});

const recognizeFoodFlow = ai.defineFlow(
  {
    name: 'recognizeFoodFlow',
    inputSchema: RecognizeFoodRequestSchema,
    outputSchema: RecognizeFoodResponseSchema,
  },
  async (input) => {
    const { output } = await foodRecognitionPrompt(input);
    if (!output) {
      throw new Error('Failed to get a response from the AI model.');
    }
    return output;
  }
);

export async function recognizeFood(
  input: RecognizeFoodRequest
): Promise<RecognizeFoodResponse> {
  return await recognizeFoodFlow(input);
}
