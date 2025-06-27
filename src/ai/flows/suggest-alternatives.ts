'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting safer alternatives to a food or drug item.
 *
 * - suggestAlternatives - A function that suggests alternatives.
 * - SuggestAlternativesInput - The input type for the suggestAlternatives function.
 * - SuggestAlternativesOutput - The return type for the suggestAlternatives function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAlternativesInputSchema = z.object({
  userProfile: z
    .object({
      allergies: z.array(z.string()).describe("The user's allergies."),
      medications: z.array(z.string()).describe("The user's current medications."),
      conditions: z.array(z.string()).describe("The user's pre-existing medical conditions."),
    })
    .describe("The user's health profile."),
  itemName: z.string().describe('The name of the item that poses a risk.'),
});

export type SuggestAlternativesInput = z.infer<typeof SuggestAlternativesInputSchema>;

const SuggestAlternativesOutputSchema = z.object({
  alternatives: z
    .array(
      z.object({
        name: z.string().describe('The name of the alternative item.'),
        reason: z.string().describe('Why this alternative is likely safer for the user.'),
      })
    )
    .describe('A list of suggested safer alternatives.'),
});

export type SuggestAlternativesOutput = z.infer<typeof SuggestAlternativesOutputSchema>;

export async function suggestAlternatives(input: SuggestAlternativesInput): Promise<SuggestAlternativesOutput> {
  return suggestAlternativesFlow(input);
}

const suggestAlternativesPrompt = ai.definePrompt({
  name: 'suggestAlternativesPrompt',
  input: {schema: SuggestAlternativesInputSchema},
  output: {schema: SuggestAlternativesOutputSchema},
  prompt: `**Alternative Suggestion Request**

An AI analysis has identified a potential risk for a user with the following health profile who wants to take "{{itemName}}".

**User Health Profile:**
- Allergies: {{{userProfile.allergies}}}
- Current Medications: {{{userProfile.medications}}}
- Pre-existing Medical Conditions: {{{userProfile.conditions}}}

**Task:**
1.  Act as a helpful medical information AI.
2.  Based on the user's profile and the problematic item "{{itemName}}", suggest 2-3 safer alternatives.
3.  For each alternative, provide the name and a brief, clear reason why it is a safer choice for this specific user, considering their profile.
4.  Focus on common, accessible alternatives. If "{{itemName}}" is a medication, suggest alternative medications or classes of medications. If it's a food, suggest alternative foods.
5.  Crucially, frame your suggestions with a disclaimer that the user must consult a healthcare professional before making any changes.
  `,
});

const suggestAlternativesFlow = ai.defineFlow(
  {
    name: 'suggestAlternativesFlow',
    inputSchema: SuggestAlternativesInputSchema,
    outputSchema: SuggestAlternativesOutputSchema,
  },
  async input => {
    const {output} = await suggestAlternativesPrompt(input);
    return output!;
  }
);
