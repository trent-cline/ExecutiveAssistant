import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { env } from '$env/dynamic/private';

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY
});

export interface AIAnalysis {
    category: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    summary: string;
}

function parseDate(dateStr: string): string | undefined {
    try {
        // Remove any leading/trailing whitespace
        dateStr = dateStr.trim();
        
        // If it's N/A or empty, return undefined
        if (!dateStr || dateStr.toLowerCase() === 'n/a') {
            return undefined;
        }

        // Try parsing with Date.parse
        const parsed = Date.parse(dateStr);
        if (!isNaN(parsed)) {
            return new Date(parsed).toISOString();
        }

        // If we can't parse it, return undefined
        return undefined;
    } catch (error) {
        console.warn('Failed to parse date:', dateStr, error);
        return undefined;
    }
}

async function analyzeNote(transcription: string): Promise<AIAnalysis> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a personal assistant that analyzes voice notes. Extract key information and categorize the note. If a due date is mentioned, format it as YYYY-MM-DD."
                },
                {
                    role: "user",
                    content: `Analyze this voice note and provide in this exact format:
                    Category: [task/reminder/idea/note]
                    Priority: [low/medium/high]
                    Due Date: [YYYY-MM-DD or N/A]
                    Summary: [brief summary]
                    
                    Voice note: "${transcription}"`
                }
            ],
            temperature: 0.7,
            max_tokens: 200
        });

        console.log('OpenAI response:', response.choices[0].message.content);
        
        const content = response.choices[0].message.content;
        const lines = content.split('\n').map(line => line.trim());
        const analysis: AIAnalysis = {
            category: 'task', // default values
            priority: 'medium',
            summary: ''
        };

        for (const line of lines) {
            if (line.toLowerCase().includes('category:')) {
                analysis.category = line.split(':')[1].trim();
            } else if (line.toLowerCase().includes('priority:')) {
                const priority = line.split(':')[1].trim().toLowerCase();
                analysis.priority = priority as 'low' | 'medium' | 'high';
            } else if (line.toLowerCase().includes('due date:')) {
                const dateStr = line.split(':')[1].trim();
                const parsedDate = parseDate(dateStr);
                if (parsedDate) {
                    analysis.dueDate = parsedDate;
                }
            } else if (line.toLowerCase().includes('summary:')) {
                analysis.summary = line.split(':')[1].trim();
            }
        }

        console.log('Parsed analysis:', analysis);
        return analysis;
    } catch (error) {
        console.error('Error analyzing note with AI:', error);
        throw error;
    }
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { transcription } = await request.json();
        const analysis = await analyzeNote(transcription);
        return json(analysis);
    } catch (error) {
        console.error('Error in AI analysis endpoint:', error);
        return new Response(JSON.stringify({ error: 'Failed to analyze note' }), { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};
