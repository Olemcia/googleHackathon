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
  userProfile: z
    .object({
      allergies: z.array(z.string()).describe("The user's allergies."),
      medications: z.array(z.string()).describe("The user's current medications."),
      conditions: z.array(z.string()).describe("The user's pre-existing medical conditions."),
    })
    .describe("The user's health profile."),
  itemName: z.string().describe('The name of the drug or food item to check for compatibility.'),
  photoDataUris: z
    .array(z.string())
    .optional()
    .describe(
      "Optional photos of the item, as data URIs that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type CheckItemCompatibilityInput = z.infer<typeof CheckItemCompatibilityInputSchema>;

const CheckItemCompatibilityOutputSchema = z.object({
  isValidItem: z.boolean().describe('Whether the provided item name/photo appears to be a valid drug, supplement, or food item. It should be false for gibberish or non-consumable items.'),
  riskLevel: z
    .enum(['None', 'Low', 'Moderate', 'High'])
    .optional()
    .describe('The assessed risk level for the user. "None" if it appears safe, "Low" for minor considerations, "Moderate" for notable interactions, "High" for significant contraindications.'),
  analysis: z.string().optional().describe("The AI-generated analysis of the item's compatibility with the user's health profile."),
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

**Item to Evaluate:**
- Name: {{{itemName}}}
{{#if photoDataUris}}
- Photos:
{{#each photoDataUris}}
- {{media url=this}}
{{/each}}
{{/if}}

**User Health Profile:**
- Allergies: {{{userProfile.allergies}}}
- Current Medications: {{{userProfile.medications}}}
- Pre-existing Medical Conditions: {{{userProfile.conditions}}}

**Task:**
1.  **First, validate the item.** Determine if "{{itemName}}" and/or the provided photos represent a plausible drug, supplement, or food item. If it is nonsensical (e.g., "asdfgh"), irrelevant (e.g., "a car"), or clearly not a consumable item, set 'isValidItem' to false and stop. Do not generate an analysis or risk level.
2.  If the item is valid, set 'isValidItem' to true and proceed.
3.  Act as a cautious medical information AI.
4.  Analyze potential interactions, contraindications, and risks for the user based on their specific health profile and the validated item.
5.  If photos are provided, use them as the primary source for identifying the item. If the "Name" field seems to contradict the photos, prioritize the visual information from the photos.
6.  Based on your analysis, determine a risk level and set the 'riskLevel' field to one of the following: "None", "Low", "Moderate", or "High".
7.  Provide a clear, easy-to-understand explanation in the 'analysis' field. Start with a direct safety conclusion (e.g., "High Risk Identified," "Appears Safe," "Use with Caution") and then explain the reasoning in detail.
8.  Do not provide medical advice, but explain the known biological and chemical interactions.
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
      isValidItem: output!.isValidItem,
      riskLevel: output!.riskLevel,
      analysis: output!.analysis,
      disclaimer: 'This app is not a substitute for medical advice. Always consult with a qualified healthcare professional before making any decisions about your health, medication, or diet.',
    };
  }
);
