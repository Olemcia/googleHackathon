import { config } from 'dotenv';
config();

import '@/ai/flows/check-item-compatibility.ts';
import '@/ai/flows/suggest-alternatives.ts';
import '@/ai/flows/get-post-ingestion-advice.ts';
import '@/ai/flows/get-suggestions.ts';
