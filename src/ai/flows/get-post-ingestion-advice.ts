'use server';
/**
 * @fileOverview This file defines a Genkit flow for providing general advice if a user has already taken a potentially risky item.
 *
 * - getPostIngestionAdvice - A function that provides the advice.
 * - GetPostIngestionAdviceInput - The input type for the function.
 * - GetPostIngestionAdviceOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetPostIngestionAdviceInputSchema = z.object({
  userProfile: z
    .object({
      allergies: z.array(z.string()).describe("The user's allergies."),
      medications: z.array(z.string()).describe("The user's current medications."),
      conditions: z.array(z.string()).describe("The user's pre-existing medical conditions."),
    })
    .describe("The user's health profile."),
  itemName: z.string().describe('The name of the item that was taken.'),
});

export type GetPostIngestionAdviceInput = z.infer<typeof GetPostIngestionAdviceInputSchema>;

const GetPostIngestionAdviceOutputSchema = z.object({
  advice: z
    .string()
    .describe(
      'General guidance on what to monitor for and when to seek immediate medical attention. This is not medical advice.'
    ),
  disclaimer: z.string().describe('A mandatory, urgent medical disclaimer.'),
});

export type GetPostIngestionAdviceOutput = z.infer<typeof GetPostIngestionAdviceOutputSchema>;

export async function getPostIngestionAdvice(
  input: GetPostIngestionAdviceInput
): Promise<GetPostIngestionAdviceOutput> {
  return getPostIngestionAdviceFlow(input);
}

const getPostIngestionAdvicePrompt = ai.definePrompt({
  name: 'getPostIngestionAdvicePrompt',
  input: {schema: GetPostIngestionAdviceInputSchema},
  output: {schema: GetPostIngestionAdviceOutputSchema},
  prompt: `**URGENT: Post-Ingestion Information Request**

A user has already taken an item named "{{itemName}}" which was identified as potentially risky given their health profile.

**User Health Profile:**
- Allergies: {{{userProfile.allergies}}}
- Current Medications: {{{userProfile.medications}}}
- Pre-existing Medical Conditions: {{{userProfile.conditions}}}

**Task:**
1.  Act as a highly cautious AI providing general safety information, not medical advice.
2.  Provide a general list of symptoms the user should monitor for, based on potential interactions between "{{itemName}}" and their profile. Be generic (e.g., "difficulty breathing, rash, unusual swelling, dizziness") rather than diagnosing specific reactions.
3.  Emphasize that the absence of immediate symptoms does not mean a risk is not present.
4.  Conclude with a very clear, direct instruction to contact a healthcare professional or emergency services immediately for personalized medical advice.
5.  Your entire response must be framed as safety information, not a diagnosis or treatment plan.
  `,
});

const getPostIngestionAdviceFlow = ai.defineFlow(
  {
    name: 'getPostIngestionAdviceFlow',
    inputSchema: GetPostIngestionAdviceInputSchema,
    outputSchema: GetPostIngestionAdviceOutputSchema,
  },
  async input => {
    const {output} = await getPostIngestionAdvicePrompt(input);
    return {
      advice: output!.advice,
      disclaimer:
        'This is NOT medical advice. If you have taken something you are concerned about, contact your doctor, pharmacist, or local emergency services immediately.',
    };
  }
);
