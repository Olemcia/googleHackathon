'use server';
/**
 * @fileOverview This file defines a Genkit flow for providing autocomplete suggestions.
 *
 * - getSuggestions - A function that returns autocomplete suggestions.
 * - GetSuggestionsInput - The input type for the getSuggestions function.
 * - GetSuggestionsOutput - The return type for the getSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetSuggestionsInputSchema = z.object({
  category: z.enum(['allergies', 'medications', 'conditions']).describe('The category for which to get suggestions.'),
  query: z.string().describe('The partial text to get suggestions for.'),
});

export type GetSuggestionsInput = z.infer<typeof GetSuggestionsInputSchema>;

const GetSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of autocomplete suggestions.'),
});

export type GetSuggestionsOutput = z.infer<typeof GetSuggestionsOutputSchema>;

export async function getSuggestions(input: GetSuggestionsInput): Promise<GetSuggestionsOutput> {
  return getSuggestionsFlow(input);
}

const getSuggestionsPrompt = ai.definePrompt({
  name: 'getSuggestionsPrompt',
  input: {schema: GetSuggestionsInputSchema},
  output: {schema: GetSuggestionsOutputSchema},
  prompt: `You are a medical information AI that provides autocomplete suggestions.
Given the category "{{category}}" and the user's query "{{query}}", provide a list of up to 5 relevant and common medical terms.
Only return suggestions that start with the query text.
Do not provide any explanation, just the list of suggestions.
If the query is empty or too short, return an empty list.
`,
});

const getSuggestionsFlow = ai.defineFlow(
  {
    name: 'getSuggestionsFlow',
    inputSchema: GetSuggestionsInputSchema,
    outputSchema: GetSuggestionsOutputSchema,
  },
  async (input) => {
    if (input.query.length < 2) {
      return {suggestions: []};
    }
    const {output} = await getSuggestionsPrompt(input);
    return output!;
  }
);
