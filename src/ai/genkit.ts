
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialisation de l'Omni-Engine Genkit pour JOJO Studio (v1.x).
 * Configuré pour le plan gratuit Gemini 1.5 Flash.
 */
export const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey: process.env.GOOGLE_GENAI_API_KEY 
    })
  ],
});
