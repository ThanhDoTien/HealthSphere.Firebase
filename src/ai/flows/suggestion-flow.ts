'use server';
/**
 * @fileOverview Generates health suggestions by calling an external backend API.
 * 
 * - getHealthSuggestions - A function that proxies the request to the external health AI backend.
 * - HealthSuggestionRequest - The schema for the input data.
 * - HealthSuggestionResponse - The schema for the expected AI suggestions.
 */

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
  language: z.string().optional(),
});
export type HealthSuggestionRequest = z.infer<typeof HealthSuggestionRequestSchema>;

const MealSuggestionSchema = z.object({
  name: z.string(),
  recipe: z.string(),
  calories: z.number(),
  imageUrl: z.string().optional().describe('Direct link to a high-quality food image from Unsplash.'),
});

const ExerciseSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().optional().describe('Direct link to a high-quality exercise or fitness image from Unsplash.'),
});

const HealthSuggestionResponseSchema = z.object({
  mealSuggestions: z.array(MealSuggestionSchema),
  workoutSuggestion: z.array(ExerciseSuggestionSchema),
  generalTip: z.string(),
});
export type HealthSuggestionResponse = z.infer<typeof HealthSuggestionResponseSchema>;

export async function getHealthSuggestions(
  input: HealthSuggestionRequest
): Promise<HealthSuggestionResponse> {
  const prompt = `
    Context:
    User Goal: ${input.userProfile.goal}
    Current Stats: ${input.userProfile.weight}kg, ${input.userProfile.height}cm, ${input.userProfile.age}yo, ${input.userProfile.gender}
    Today's Progress: In: ${input.dailySummary.caloriesConsumed}kcal, Out: ${input.dailySummary.caloriesBurned}kcal, Sleep: ${input.dailySummary.sleepHours}h
    Recent Activities: ${input.recentActivities.join(', ') || 'None'}
    Language: ${input.language || 'en'}

    Task: Provide health tips, 3 meal suggestions, and 3 exercise suggestions. 
    
    IMPORTANT RULES:
    1. Suggestions must be CONCISE (max 2 sentences each).
    2. For each suggestion, you MUST provide a REAL, WORKING direct image URL from Unsplash. 
       Use the format: https://images.unsplash.com/photo-[ID]?auto=format&fit=crop&w=800&q=80
       Search for specific keywords like "healthy salad", "yoga workout", "running shoes", etc.
    3. Return ONLY valid JSON with this exact structure:
    {
      "generalTip": "string",
      "mealSuggestions": [{"name": "string", "calories": number, "recipe": "string", "imageUrl": "string"}],
      "workoutSuggestion": [{"name": "string", "description": "string", "imageUrl": "string"}]
    }
  `;

  try {
    const res = await fetch(
      "https://healthspherebackend--studio-8164753205-5553c.asia-southeast1.hosted.app/ai",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt }),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Backend error: ${res.status}`);
    }

    const data = await res.json();
    
    let rawResult;
    // Flexible parsing for various AI backend response formats
    if (typeof data === 'string') {
      rawResult = JSON.parse(data.replace(/```json|```/g, "").trim());
    } else if (data.message && typeof data.message === 'string') {
      rawResult = JSON.parse(data.message.replace(/```json|```/g, "").trim());
    } else if (data.output && typeof data.output === 'string') {
       rawResult = JSON.parse(data.output.replace(/```json|```/g, "").trim());
    } else if (data.result && typeof data.result === 'string') {
       rawResult = JSON.parse(data.result.replace(/```json|```/g, "").trim());
    } else if (data.output) {
       rawResult = data.output;
    } else {
      rawResult = data;
    }

    return HealthSuggestionResponseSchema.parse(rawResult);

  } catch (e: any) {
    console.error('AI Proxy Error:', e);
    throw new Error(e.message || 'Failed to generate suggestions.');
  }
}