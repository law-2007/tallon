
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
});

const refineSchema = z.object({
    front: z.string().describe('The updated front of the card'),
    back: z.string().describe('The updated back of the card'),
});

export async function POST(req: Request) {
    try {
        const { card, instruction } = await req.json();

        if (!card || !instruction) {
            return new Response('Missing card or instruction', { status: 400 });
        }

        const result = await generateObject({
            model: groq('llama-3.3-70b-versatile'),
            schema: refineSchema,
            prompt: `
        You are an expert study assistant.
        Current Flashcard:
        Front: "${card.front}"
        Back: "${card.back}"

        Instruction: "${instruction}"

        Update the flashcard based on the instruction. Maintain the core meaning but adapt the content.
        Return the new front and back.
      `,
        });

        return Response.json(result.object);
    } catch (error) {
        console.error('Refine error:', error);
        return new Response('Failed to refine card', { status: 500 });
    }
}
