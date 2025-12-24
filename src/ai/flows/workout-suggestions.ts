'use server';

/**
 * @fileOverview A workout suggestion AI agent.
 *
 * - getWorkoutSuggestion - A function that provides a workout suggestion.
 * - WorkoutSuggestionInput - The input type for the getWorkoutSuggestion function.
 * - WorkoutSuggestionOutput - The return type for the getWorkoutSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {geminiModel} from '@/ai/genkit';
import {z} from 'genkit';

const WorkoutSuggestionInputSchema = z.object({
  fitnessLevel: z.string().describe('The user\'s current fitness level (e.g., beginner, intermediate, advanced).'),
  availableEquipment: z.string().describe('A list of available workout equipment.'),
  workoutDuration: z.number().describe('The desired workout duration in minutes.'),
});
export type WorkoutSuggestionInput = z.infer<typeof WorkoutSuggestionInputSchema>;

const WorkoutSuggestionOutputSchema = z.object({
  suggestion: z.string().describe('A personalized workout suggestion.'),
});
export type WorkoutSuggestionOutput = z.infer<typeof WorkoutSuggestionOutputSchema>;

export async function getWorkoutSuggestion(
  input: WorkoutSuggestionInput
): Promise<WorkoutSuggestionOutput> {
  return workoutSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'workoutSuggestionPrompt',
  model: geminiModel,
  input: {schema: WorkoutSuggestionInputSchema},
  output: {schema: WorkoutSuggestionOutputSchema},
  prompt: `You are a certified personal trainer. Generate a workout suggestion based on the user's fitness level, available equipment, and desired workout duration.

Fitness Level: {{{fitnessLevel}}}
Available Equipment: {{{availableEquipment}}}
Workout Duration: {{{workoutDuration}}} minutes

Provide a concise and actionable workout plan.
`,
});

const workoutSuggestionFlow = ai.defineFlow(
  {
    name: 'workoutSuggestionFlow',
    inputSchema: WorkoutSuggestionInputSchema,
    outputSchema: WorkoutSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
