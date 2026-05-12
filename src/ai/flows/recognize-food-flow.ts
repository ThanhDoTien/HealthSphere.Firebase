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

/**
 * Chuyển đổi chuỗi dữ liệu URI (Data URI) của hình ảnh thành định dạng GenerativePart 
 * mà Google Gemini AI API có thể đọc hiểu.
 * @param uri Chuỗi Base64 Data URI của hình ảnh.
 * @returns Đối tượng chứa inlineData (mimeType và dữ liệu base64 thô).
 */
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
const genAI = new GoogleGenerativeAI('AIzaSyBKqU7wBv58ZGE501N8ydSTbLXGNolOdC4');
const model = genAI.getGenerativeModel({ model: 'gemini-3.1-pro-preview' });

const prompt = `You are an expert nutritionist. Your task is to analyze the image of a meal provided by the user and identify all the food items present.

For each food item you identify, provide its name and an estimated calorie count for a standard serving size shown in the picture.

Combine the calories of all items to provide a total calorie count for the meal.

If the image does not appear to contain any food, please return a JSON object with an empty 'identifiedFoods' array and a 'totalCalories' of 0.

Generate the response as a single, valid JSON object. Do not include any text, markdown formatting, or code fences before or after the JSON object. The JSON object must have the following structure: { identifiedFoods: [{ name: string, calories: number }], totalCalories: number }.`;

/**
 * Nhận diện món ăn từ ảnh và trả về danh sách calo.
 * Luồng hoạt động:
 * 1. Nhận Data URI của ảnh, chuyển đổi định dạng.
 * 2. Gọi Google Gemini AI (Mô hình Vision) với prompt chỉ định trả về JSON.
 * 3. Parse và Validate kết quả JSON trả về bằng Zod để đảm bảo đúng cấu trúc.
 * 
 * @param input Chứa photoDataUri (Base64 của ảnh).
 * @returns RecognizeFoodResponse (danh sách món ăn và tổng calo).
 */
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
