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

function parseAnalysisContent(content: string): AIAnalysis {
    const lines = content.split('\n').map(line => line.trim());
    const analysis: AIAnalysis = {
        category: 'note', // default value
        priority: 'low',  // default value
        summary: '',
    };

    try {
        for (const line of lines) {
            if (line.startsWith('Category:')) {
                analysis.category = line.replace('Category:', '').trim().toLowerCase();
            } else if (line.startsWith('Priority:')) {
                const priority = line.replace('Priority:', '').trim().toLowerCase();
                if (['low', 'medium', 'high'].includes(priority)) {
                    analysis.priority = priority as 'low' | 'medium' | 'high';
                }
            } else if (line.startsWith('Due Date:')) {
                const dateStr = line.replace('Due Date:', '').trim();
                if (dateStr && dateStr !== 'N/A') {
                    try {
                        const date = new Date(dateStr);
                        if (!isNaN(date.getTime())) {
                            analysis.dueDate = date.toISOString();
                        }
                    } catch (error) {
                        console.warn('Failed to parse date:', dateStr);
                    }
                }
            } else if (line.startsWith('Summary:')) {
                analysis.summary = line.replace('Summary:', '').trim();
            }
        }

        // Validate required fields
        if (!analysis.summary) {
            throw new Error('No summary found in analysis');
        }

        // Ensure category is one of the expected values
        if (!['task', 'reminder', 'idea', 'note'].includes(analysis.category)) {
            analysis.category = 'note'; // Default to 'note' if invalid
        }

        return analysis;
    } catch (error) {
        console.error('Error parsing analysis:', error);
        throw new Error('Failed to parse analysis content');
    }
}

export const POST = (async ({ request }) => {
    try {
        const { transcription } = await request.json();
        
        // Check for empty or "Processing..." transcription
        if (!transcription || transcription === 'Processing...' || transcription.trim().length === 0) {
            return json({
                category: 'note',
                priority: 'low',
                summary: 'No transcription available'
            });
        }

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

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content in OpenAI response');
        }

        console.log('OpenAI response:', content);

        const analysis = parseAnalysisContent(content);
        console.log('Parsed analysis:', analysis);
        
        return json(analysis);
    } catch (error) {
        console.error('Error in analyze endpoint:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to analyze note',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500
        });
    }
}) satisfies RequestHandler;
