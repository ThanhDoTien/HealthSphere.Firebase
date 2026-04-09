// ==========================================
// FILE: src/ai/flows/recognize-food-flow.ts
// MỤC ĐÍCH: Nhận diện Thực phẩm từ Hình ảnh (Food Recognition via Computer Vision)
// TỔNG QUAN: Nhận ảnh chụp bữa ăn (Base64), gửi tới Google Gemini AI để nhận diện
// từng món ăn trong ảnh và ước tính lượng calo tương ứng. Trả về danh sách món + tổng calo.
// ==========================================

'use server';
/**
 * @fileOverview Identifies food items from an image and estimates their nutritional value using Google AI.
 * - recognizeFood - a function that handles the food recognition process.
 * - RecognizeFoodRequest - The input type for the recognizeFood function.
 * - RecognizeFoodResponse - The return type for the recognizeFood function.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// Helper to convert data URI to a format Google AI can understand
function dataUriToGenerativePart(uri: string) {
  const [header, data] = uri.split(',');
  const mimeTypeMatch = header.match(/:(.*?);/);
  if (!mimeTypeMatch || !mimeTypeMatch[1]) {
    throw new Error('Invalid data URI');
  }
  const mimeType = mimeTypeMatch[1];
  return {
    inlineData: {
      data,
      mimeType,
    },
  };
}

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

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

const prompt = `You are an expert nutritionist. Your task is to analyze the image of a meal provided by the user and identify all the food items present.

For each food item you identify, provide its name and an estimated calorie count for a standard serving size shown in the picture.

Combine the calories of all items to provide a total calorie count for the meal.

If the image does not appear to contain any food, please return a JSON object with an empty 'identifiedFoods' array and a 'totalCalories' of 0.

Generate the response as a single, valid JSON object. Do not include any text, markdown formatting, or code fences before or after the JSON object. The JSON object must have the following structure: { identifiedFoods: [{ name: string, calories: number }], totalCalories: number }.`;

export async function recognizeFood(
  input: RecognizeFoodRequest
): Promise<RecognizeFoodResponse> {
  const imagePart = dataUriToGenerativePart(input.photoDataUri);

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const textResponse = response.text();

    if (!textResponse) {
      throw new Error('Failed to get a response from the AI model.');
    }

    const parsed = JSON.parse(textResponse);
    return RecognizeFoodResponseSchema.parse(parsed);

  } catch (e) {
    console.error(
      'Failed to parse or validate JSON response from AI:',
      e
    );
    throw new Error('The AI returned an invalid response format.');
  }
}
