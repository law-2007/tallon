
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
});

const flashcardSchema = z.object({
    flashcards: z.array(z.object({
        front: z.string().describe('The question or concept on the front of the card'),
        back: z.string().describe('The answer or definition on the back of the card'),
    })).describe('A list of flashcards generated from the text'),
});

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return new Response('Missing text', { status: 400 });
        }

        const result = await generateObject({
            model: groq('llama-3.3-70b-versatile'),
            schema: flashcardSchema,
            prompt: `Generate 10 effective flashcards from the following text. Focus on key concepts and definitions suitable for studying: \n\n${text}`,
        });

        return Response.json(result.object);
    } catch (error) {
        console.error('Generation error:', error);
        return new Response('Failed to generate flashcards', { status: 500 });
    }
}
