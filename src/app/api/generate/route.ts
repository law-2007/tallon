
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const maxDuration = 60;

const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return new Response('Missing text', { status: 400 });
        }

        const prompt = `
        You are an educational AI. Your goal is to create flashcards.
        
        Generate 10 effective flashcards from the text provided below. 
        Focus on key concepts, definitions, and important facts.
        
        Output valid JSON in the following format:
        {
          "flashcards": [
            { "front": "Question 1", "back": "Answer 1" },
            { "front": "Question 2", "back": "Answer 2" }
          ]
        }
        
        Do not include markdown blocks (like \`\`\`json). Return raw JSON only.

        Text to process:
        ${text}
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
        console.error('Generation error:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate flashcards' }), { status: 500 });
    }
}
