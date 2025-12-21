
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const maxDuration = 60;

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { card, instruction } = await req.json();

        if (!card || !instruction) {
            return new Response('Missing card or instruction', { status: 400 });
        }

        const prompt = `
        You are an expert study assistant.
        
        Current Flashcard:
        Front: "${card.front}"
        Back: "${card.back}"

        Instruction: "${instruction}"

        Update the flashcard based on the instruction. Maintain the core meaning but adapt the content.
        
        Output valid JSON in the following format:
        {
          "front": "Updated Front",
          "back": "Updated Back"
        }
        
        Do not include markdown blocks. Return raw JSON only.
        `;

        const result = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            prompt: prompt,
        });

        // Clean up markdown if model adds it
        let cleanText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanText);

        return Response.json(data);
    } catch (error) {
        console.error('Refine error:', error);
        return new Response(JSON.stringify({ error: 'Failed to refine card' }), { status: 500 });
    }
}
