'use server';
/**
 * @fileOverview This file defines a Genkit flow for providing lifestyle tips based on a user's health profile.
 *
 * - getLifestyleTips - A function that returns lifestyle tips.
 * - GetLifestyleTipsInput - The input type for the getLifestyleTips function.
 * - GetLifestyleTipsOutput - The return type for the getLifestyleTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetLifestyleTipsInputSchema = z.object({
  userProfile: z
    .object({
      allergies: z.array(z.string()).describe("The user's allergies."),
      medications: z.array(z.string()).optional().describe("The user's current medications."),
      conditions: z.array(z.string()).describe("The user's pre-existing medical conditions."),
    })
    .describe("The user's health profile."),
});

export type GetLifestyleTipsInput = z.infer<typeof GetLifestyleTipsInputSchema>;

const GetLifestyleTipsOutputSchema = z.object({
  tips: z
    .array(
      z.object({
        category: z.string().describe('The category of the tip (e.g., "Dietary Advice", "Exercise Recommendations", "Home Environment").'),
        tip: z.string().describe('The specific lifestyle tip.'),
      })
    )
    .describe('A list of lifestyle tips.'),
  disclaimer: z.string().describe('A mandatory medical disclaimer.'),
});

export type GetLifestyleTipsOutput = z.infer<typeof GetLifestyleTipsOutputSchema>;

export async function getLifestyleTips(input: GetLifestyleTipsInput): Promise<GetLifestyleTipsOutput> {
  return getLifestyleTipsFlow(input);
}

const getLifestyleTipsPrompt = ai.definePrompt({
  name: 'getLifestyleTipsPrompt',
  input: {schema: GetLifestyleTipsInputSchema},
  output: {schema: GetLifestyleTipsOutputSchema},
  prompt: `You are an expert AI health and wellness advisor. Your goal is to provide helpful, safe, and general lifestyle tips to users based on their health profile.

**User Health Profile:**
- Allergies: {{#if userProfile.allergies}}{{{userProfile.allergies}}}{{else}}None specified.{{/if}}
- Pre-existing Medical Conditions: {{#if userProfile.conditions}}{{{userProfile.conditions}}}{{else}}None specified.{{/if}}

**Task:**
1.  Analyze the user's allergies and medical conditions.
2.  Generate 3-5 practical and general lifestyle tips.
3.  Organize the tips into logical categories such as "Dietary Advice", "Exercise Recommendations", "Home Environment", "Stress Management", or other relevant areas.
4.  The tips must be general suggestions, not specific medical advice, prescriptions, or treatment plans.
5.  If the user profile is empty, provide general wellness tips.
6.  Phrase your tips in a supportive and encouraging tone.
7.  Crucially, you MUST NOT provide any information that could be construed as a medical diagnosis or treatment.
  `,
});

const getLifestyleTipsFlow = ai.defineFlow(
  {
    name: 'getLifestyleTipsFlow',
    inputSchema: GetLifestyleTipsInputSchema,
    outputSchema: GetLifestyleTipsOutputSchema,
  },
  async input => {
    const {output} = await getLifestyleTipsPrompt(input);
    return {
      tips: output!.tips,
      disclaimer: 'These are general tips and not medical advice. Always consult with a qualified healthcare professional for personalized guidance regarding your health and wellness.',
    };
  }
);
