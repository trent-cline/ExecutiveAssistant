import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { env } from '$env/dynamic/private';

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY
});

export interface AIAnalysis {
    category: string;
    priority: 'Low' | 'Medium' | 'High';
    due_date?: string;
    summary: string;
    status?: string;
}

function parseAnalysisContent(content: string): AIAnalysis {
    const lines = content.split('\n').map(line => line.trim());
    const analysis: AIAnalysis = {
        category: 'Note', // default value
        priority: 'Low',  // default value
        summary: '',
        status: 'Not Started' // default value
    };

    try {
        for (const line of lines) {
            if (line.startsWith('Category:')) {
                const category = line.replace('Category:', '').trim();
                // Match database enum values exactly
                if (['Note', 'Task', 'Reminder'].includes(category)) {
                    analysis.category = category;
                }
            } else if (line.startsWith('Priority:')) {
                const priority = line.replace('Priority:', '').trim();
                if (['Low', 'Medium', 'High'].includes(priority)) {
                    analysis.priority = priority;
                }
            } else if (line.startsWith('Due Date:')) {
                const dateStr = line.replace('Due Date:', '').trim();
                if (dateStr && dateStr !== 'N/A') {
                    try {
                        const date = new Date(dateStr);
                        if (!isNaN(date.getTime())) {
                            analysis.due_date = date.toISOString();
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
                category: 'Note',
                priority: 'Low',
                summary: 'No transcription available',
                status: 'Not Started'
            });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a personal assistant that analyzes voice notes. Extract key information and categorize the note. Categories must be exactly 'Note', 'Task', or 'Reminder'. Priority must be exactly 'Low', 'Medium', or 'High'. If a due date is mentioned, format it as YYYY-MM-DD."
                },
                {
                    role: "user",
                    content: `Analyze this voice note and provide in this exact format:
                    Category: [Note/Task/Reminder]
                    Priority: [Low/Medium/High]
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
