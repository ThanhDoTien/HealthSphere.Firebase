'use server';
/**
 * @fileOverview Generates health suggestions by calling an external backend API.
 * This file acts as a server-side bridge to avoid CORS issues and provides robust error handling.
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
});

const ExerciseSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
});

const HealthSuggestionResponseSchema = z.object({
  mealSuggestions: z.array(MealSuggestionSchema),
  workoutSuggestion: z.array(ExerciseSuggestionSchema),
  generalTip: z.string(),
});
export type HealthSuggestionResponse = z.infer<typeof HealthSuggestionResponseSchema>;

/**
 * Calls the external backend to generate health suggestions.
 * Handles various response formats (raw JSON, stringified JSON, or wrapped messages).
 */
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
    Return ONLY valid JSON with this exact structure:
    {
      "generalTip": "string",
      "mealSuggestions": [{"name": "string", "calories": number, "recipe": "string"}],
      "workoutSuggestion": [{"name": "string", "description": "string"}]
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
        body: JSON.stringify({
          message: prompt,
        }),
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      let errorDetail = '';
      try {
        errorDetail = await res.text();
      } catch (e) {}
      throw new Error(`Backend server error: HTTP ${res.status} ${errorDetail.slice(0, 100)}`);
    }

    const data = await res.json();
    
    // Attempt to find the result in various common response fields
    let rawResult;
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
