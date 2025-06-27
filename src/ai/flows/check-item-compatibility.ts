'use server';

/**
 * @fileOverview This file defines a Genkit flow for checking the compatibility of a drug or food item with a user's health profile.
 *
 * - checkItemCompatibility - A function that handles the item compatibility check process.
 * - CheckItemCompatibilityInput - The input type for the checkItemCompatibility function.
 * - CheckItemCompatibilityOutput - The return type for the checkItemCompatibility function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckItemCompatibilityInputSchema = z.object({
  userProfile: z.object({
    allergies: z.array(z.string()).describe('The user\s allergies.'),
    medications: z.array(z.string()).describe('The user\s current medications.'),
    conditions: z.array(z.string()).describe('The user\s pre-existing medical conditions.'),
  }).describe('The user\s health profile.'),
  itemName: z.string().describe('The name of the drug or food item to check for compatibility.'),
});

export type CheckItemCompatibilityInput = z.infer<typeof CheckItemCompatibilityInputSchema>;

const CheckItemCompatibilityOutputSchema = z.object({
  analysis: z.string().describe('The AI-generated analysis of the item\s compatibility with the user\s health profile.'),
  disclaimer: z.string().describe('A mandatory medical disclaimer.'),
});

export type CheckItemCompatibilityOutput = z.infer<typeof CheckItemCompatibilityOutputSchema>;

export async function checkItemCompatibility(input: CheckItemCompatibilityInput): Promise<CheckItemCompatibilityOutput> {
  return checkItemCompatibilityFlow(input);
}

const checkItemCompatibilityPrompt = ai.definePrompt({
  name: 'checkItemCompatibilityPrompt',
  input: {schema: CheckItemCompatibilityInputSchema},
  output: {schema: CheckItemCompatibilityOutputSchema},
  prompt: `**Strict Safety Analysis Request**

**User Health Profile:**
- Allergies: {{{userProfile.allergies}}}
- Current Medications: {{{userProfile.medications}}}
- Pre-existing Medical Conditions: {{{userProfile.conditions}}}

**Item to Evaluate:**
- {{{itemName}}}

**Task:**
Acting as a cautious medical information AI, analyze potential interactions, contraindications, and risks for the user based on their specific health profile and the item they want to take. Provide a clear, easy-to-understand explanation. Start with a direct safety conclusion (e.g., \"Potential Risk Identified,\" \"Appears Safe,\" \"Use with Caution\") and then explain the reasoning in detail. Do not provide medical advice, but explain the known biological and chemical interactions.
  `,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const checkItemCompatibilityFlow = ai.defineFlow(
  {
    name: 'checkItemCompatibilityFlow',
    inputSchema: CheckItemCompatibilityInputSchema,
    outputSchema: CheckItemCompatibilityOutputSchema,
  },
  async input => {
    const {output} = await checkItemCompatibilityPrompt(input);
    return {
      analysis: output!.analysis,
      disclaimer: 'This app is not a substitute for medical advice. Always consult with a qualified healthcare professional before making any decisions about your health, medication, or diet.',
    };
  }
);
