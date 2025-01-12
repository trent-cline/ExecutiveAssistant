import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

export interface AIAnalysis {
    category: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    summary: string;
}

export async function analyzeNote(transcription: string): Promise<AIAnalysis> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a personal assistant that analyzes voice notes. Extract key information and categorize the note."
                },
                {
                    role: "user",
                    content: `Analyze this voice note and provide: 
                    1. A category (e.g., task, reminder, idea, note)
                    2. Priority level (low, medium, high)
                    3. Due date if applicable (in ISO format)
                    4. A brief summary
                    
                    Voice note: "${transcription}"`
                }
            ],
            temperature: 0.7,
            max_tokens: 200
        });

        const content = response.choices[0].message.content;
        // Parse the AI response into structured data
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
                const date = line.split(':')[1].trim();
                if (date && date !== 'N/A') {
                    analysis.dueDate = new Date(date).toISOString();
                }
            } else if (line.toLowerCase().includes('summary:')) {
                analysis.summary = line.split(':')[1].trim();
            }
        }

        return analysis;
    } catch (error) {
        console.error('Error analyzing note with AI:', error);
        throw error;
    }
}
