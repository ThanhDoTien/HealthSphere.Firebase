'use server';
/**
 * @fileOverview Generates health suggestions by calling an external backend API.
 * This file acts as a server-side bridge to avoid CORS issues.
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

export async function getHealthSuggestions(
  input: HealthSuggestionRequest
): Promise<HealthSuggestionResponse> {
  const prompt = `
    You are a health assistant AI. 
    User Profile: Goal: ${input.userProfile.goal}, Weight: ${input.userProfile.weight}, Height: ${input.userProfile.height}, Age: ${input.userProfile.age}, Gender: ${input.userProfile.gender}.
    Daily summary: Calories in: ${input.dailySummary.caloriesConsumed}, Calories out: ${input.dailySummary.caloriesBurned}, Sleep: ${input.dailySummary.sleepHours}.
    Recent activities: ${input.recentActivities.join(', ') || 'None'}.
    Language: ${input.language || 'en'}.

    Return ONLY valid JSON (no markdown).
    Schema: { "generalTip": string, "mealSuggestions": [{ "name": string, "calories": number, "recipe": string }], "workoutSuggestion": [{ "name": string, "description": string }] }
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
        // Server-side fetch avoids CORS issues
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      throw new Error(`Backend server responded with status: ${res.status}`);
    }

    const data = await res.json();
    
    // Attempt to parse JSON if the backend returns a string or an object with a message string
    let rawResult;
    if (typeof data === 'string') {
      rawResult = JSON.parse(data.replace(/```json|```/g, "").trim());
    } else if (data.message && typeof data.message === 'string') {
      rawResult = JSON.parse(data.message.replace(/```json|```/g, "").trim());
    } else if (data.output && typeof data.output === 'string') {
       rawResult = JSON.parse(data.output.replace(/```json|```/g, "").trim());
    } else {
      rawResult = data;
    }

    return HealthSuggestionResponseSchema.parse(rawResult);

  } catch (e) {
    console.error('Failed to get suggestions from external backend:', e);
    throw new Error('Failed to connect to AI backend. Please check your backend logs.');
  }
}
