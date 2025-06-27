'use server';
/**
 * @fileOverview This file defines a Genkit flow for validating a user profile item.
 *
 * - validateProfileItem - A function that validates if an item is a real medical term.
 * - ValidateProfileItemInput - The input type for the function.
 * - ValidateProfileItemOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateProfileItemInputSchema = z.object({
  category: z.enum(['allergies', 'medications', 'conditions']).describe('The category of the item.'),
  itemName: z.string().describe('The name of the item to validate.'),
});
export type ValidateProfileItemInput = z.infer<typeof ValidateProfileItemInputSchema>;

const ValidateProfileItemOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the item is a valid, real term for the given category.'),
});
export type ValidateProfileItemOutput = z.infer<typeof ValidateProfileItemOutputSchema>;


export async function validateProfileItem(input: ValidateProfileItemInput): Promise<ValidateProfileItemOutput> {
  return validateProfileItemFlow(input);
}

const validateProfileItemPrompt = ai.definePrompt({
  name: 'validateProfileItemPrompt',
  input: {schema: ValidateProfileItemInputSchema},
  output: {schema: ValidateProfileItemOutputSchema},
  prompt: `You are a medical information AI that validates user input.
The user is adding an item to their health profile.
Category: "{{category}}"
Item Name: "{{itemName}}"

Task: Determine if "{{itemName}}" is a plausible, real-world medical term for the specified category.
- For "allergies", it should be a known allergen (e.g., "Peanuts", "Pollen", "Sulfa drugs").
- For "medications", it should be a known drug name (brand or generic) or supplement (e.g., "Lisinopril", "Tylenol", "Vitamin D").
- For "conditions", it should be a known medical condition or disease (e.g., "Hypertension", "Asthma").

If it is a plausible term, set 'isValid' to true.
If it is gibberish (e.g., "asdfgh"), a non-medical item (e.g., "a car"), or clearly not relevant to the category, set 'isValid' to false. Be strict.
`,
});


const validateProfileItemFlow = ai.defineFlow(
  {
    name: 'validateProfileItemFlow',
    inputSchema: ValidateProfileItemInputSchema,
    outputSchema: ValidateProfileItemOutputSchema,
  },
  async (input) => {
    if (input.itemName.trim().length < 2) {
      return {isValid: false};
    }
    const {output} = await validateProfileItemPrompt(input);
    return output!;
  }
);
