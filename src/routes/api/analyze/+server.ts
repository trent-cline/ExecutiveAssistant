import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { env } from '$env/dynamic/private';

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY
});

export interface AIAnalysis {
    categories: string[];
    title: string;
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
    summary: string;
    status?: string;
    tags: string[];
    is_private?: boolean;
    recipient?: string;
    source: 'local' | 'public' | 'private';
    shopping_items?: Array<{
        name: string;
        quantity?: number;
        notes?: string;
        urgency?: 'low' | 'medium' | 'high';
    }>;
    dlltw_notes?: Array<{
        title: string;
        content: string;
        chapter?: string;
        key_points?: string[];
        book_section?: string;
    }>;
    project_references?: Array<{
        title: string;
        type: 'static_website' | 'mentor_to_launch' | 'other';
        description?: string;
        estimated_time?: string;
        priority?: 'low' | 'medium' | 'high';
        status?: 'planning' | 'in_progress' | 'review' | 'completed';
    }>;
    goals?: Array<{
        title: string;
        description?: string;
        target_date?: string;
        success_criteria?: string[];
        category?: 'personal' | 'business';
        milestones?: Array<{
            title: string;
            due_date?: string;
        }>;
    }>;
}

function parseAnalysisContent(content: string): AIAnalysis {
    const lines = content.split('\n').map(line => line.trim());
    const analysis: AIAnalysis = {
        categories: ['note'],
        title: '',
        priority: 'low',
        summary: '',
        status: 'new',
        tags: [],
        source: 'local',
        shopping_items: [],
        dlltw_notes: [],
        project_references: [],
        goals: []
    };

    try {
        let currentSection = '';
        let currentItem: any = {};
        let currentMilestone: any = {};

        for (const line of lines) {
            if (line.startsWith('Title:')) {
                analysis.title = line.replace('Title:', '').trim();
            } else if (line.startsWith('Categories:')) {
                const categories = line.replace('Categories:', '').trim()
                    .split(',')
                    .map(c => c.trim().toLowerCase())
                    .filter(c => ['note', 'task', 'reminder', 'shopping', 'dlltw', 'project', 'goal'].includes(c));
                if (categories.length > 0) {
                    analysis.categories = categories;
                }
            } else if (line.startsWith('Privacy:')) {
                const privacy = line.replace('Privacy:', '').trim().toLowerCase();
                analysis.is_private = privacy === 'private';
                analysis.source = privacy as 'local' | 'public' | 'private';
            } else if (line.startsWith('Recipient:')) {
                analysis.recipient = line.replace('Recipient:', '').trim();
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
                            analysis.due_date = date.toISOString();
                        }
                    } catch (error) {
                        console.warn('Failed to parse date:', dateStr);
                    }
                }
            } else if (line.startsWith('Tags:')) {
                analysis.tags = line.replace('Tags:', '')
                    .trim()
                    .split(',')
                    .map(tag => tag.trim().toLowerCase())
                    .filter(tag => tag.length > 0);
            } else if (line === 'Shopping Items:') {
                currentSection = 'shopping';
                currentItem = {};
            } else if (line === 'DLLTW Notes:') {
                currentSection = 'dlltw';
                currentItem = {};
            } else if (line === 'Project References:') {
                currentSection = 'projects';
                currentItem = {};
            } else if (line === 'Goals:') {
                currentSection = 'goals';
                currentItem = {};
            } else if (line === 'Milestones:') {
                if (currentSection === 'goals' && currentItem.title) {
                    currentItem.milestones = currentItem.milestones || [];
                    currentMilestone = {};
                }
            } else if (line.startsWith('Summary:')) {
                analysis.summary = line.replace('Summary:', '').trim();
            } else if (line.trim() && currentSection) {
                switch (currentSection) {
                    case 'shopping':
                        if (line.startsWith('- ')) {
                            if (currentItem.name) {
                                analysis.shopping_items?.push(currentItem);
                                currentItem = {};
                            }
                            currentItem.name = line.replace('- ', '').trim();
                        } else if (line.startsWith('Quantity:')) {
                            currentItem.quantity = parseInt(line.replace('Quantity:', '').trim()) || 1;
                        } else if (line.startsWith('Notes:')) {
                            currentItem.notes = line.replace('Notes:', '').trim();
                        } else if (line.startsWith('Urgency:')) {
                            currentItem.urgency = line.replace('Urgency:', '').trim().toLowerCase() as 'low' | 'medium' | 'high';
                        }
                        break;

                    case 'dlltw':
                        if (line.startsWith('Title:')) {
                            if (currentItem.title) {
                                analysis.dlltw_notes?.push(currentItem);
                                currentItem = {};
                            }
                            currentItem.title = line.replace('Title:', '').trim();
                        } else if (line.startsWith('Chapter:')) {
                            currentItem.chapter = line.replace('Chapter:', '').trim();
                        } else if (line.startsWith('Content:')) {
                            currentItem.content = line.replace('Content:', '').trim();
                        } else if (line.startsWith('Key Points:')) {
                            currentItem.key_points = line.replace('Key Points:', '')
                                .trim()
                                .split(';')
                                .map(point => point.trim());
                        } else if (line.startsWith('Book Section:')) {
                            currentItem.book_section = line.replace('Book Section:', '').trim();
                        }
                        break;

                    case 'projects':
                        if (line.startsWith('Title:')) {
                            if (currentItem.title) {
                                analysis.project_references?.push(currentItem);
                                currentItem = {};
                            }
                            currentItem.title = line.replace('Title:', '').trim();
                        } else if (line.startsWith('Type:')) {
                            currentItem.type = line.replace('Type:', '').trim() as 'static_website' | 'mentor_to_launch' | 'other';
                        } else if (line.startsWith('Description:')) {
                            currentItem.description = line.replace('Description:', '').trim();
                        } else if (line.startsWith('Estimated Time:')) {
                            currentItem.estimated_time = line.replace('Estimated Time:', '').trim();
                        } else if (line.startsWith('Priority:')) {
                            currentItem.priority = line.replace('Priority:', '').trim() as 'low' | 'medium' | 'high';
                        } else if (line.startsWith('Status:')) {
                            currentItem.status = line.replace('Status:', '').trim() as 'planning' | 'in_progress' | 'review' | 'completed';
                        }
                        break;

                    case 'goals':
                        if (line.startsWith('Title:')) {
                            if (currentItem.title) {
                                analysis.goals?.push(currentItem);
                                currentItem = {};
                            }
                            currentItem.title = line.replace('Title:', '').trim();
                        } else if (line.startsWith('Description:')) {
                            currentItem.description = line.replace('Description:', '').trim();
                        } else if (line.startsWith('Target Date:')) {
                            currentItem.target_date = line.replace('Target Date:', '').trim();
                        } else if (line.startsWith('Success Criteria:')) {
                            currentItem.success_criteria = line.replace('Success Criteria:', '')
                                .trim()
                                .split(';')
                                .map(criteria => criteria.trim());
                        } else if (line.startsWith('Category:')) {
                            currentItem.category = line.replace('Category:', '').trim() as 'personal' | 'business';
                        } else if (line.startsWith('Milestone:')) {
                            if (currentMilestone.title) {
                                currentItem.milestones = currentItem.milestones || [];
                                currentItem.milestones.push(currentMilestone);
                                currentMilestone = {};
                            }
                            currentMilestone.title = line.replace('Milestone:', '').trim();
                        } else if (line.startsWith('Milestone Due:')) {
                            currentMilestone.due_date = line.replace('Milestone Due:', '').trim();
                        }
                        break;
                }
            }
        }

        // Push any remaining items
        if (currentSection === 'shopping' && currentItem.name) {
            analysis.shopping_items?.push(currentItem);
        } else if (currentSection === 'dlltw' && currentItem.title) {
            analysis.dlltw_notes?.push(currentItem);
        } else if (currentSection === 'projects' && currentItem.title) {
            analysis.project_references?.push(currentItem);
        } else if (currentSection === 'goals' && currentItem.title) {
            if (currentMilestone.title) {
                currentItem.milestones = currentItem.milestones || [];
                currentItem.milestones.push(currentMilestone);
            }
            analysis.goals?.push(currentItem);
        }

    } catch (error) {
        console.error('Error parsing analysis content:', error);
    }

    return analysis;
}

export const POST = (async ({ request }) => {
    try {
        const { transcription } = await request.json();
        
        if (!transcription || transcription === 'Processing...' || transcription.trim().length === 0) {
            return json({
                categories: ['note'],
                title: 'Empty Note',
                priority: 'low',
                summary: 'No transcription available',
                status: 'new',
                tags: [],
                source: 'local'
            });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are a personal assistant that analyzes voice notes. Extract key information and categorize the note.
                    
                    First, create a clear and concise title that summarizes the main point.
                    Then determine if this is a private note for the owner, a public note, or a local note.
                    Then categorize into multiple categories: note, task, reminder, shopping, dlltw, project, goal
                    
                    For each category, provide detailed information:
                    
                    Shopping Items:
                    - Name of item
                    - Quantity (if mentioned)
                    - Notes
                    - Urgency (low/medium/high)
                    
                    DLLTW Notes:
                    - Title of the note
                    - Chapter reference
                    - Book section
                    - Main content
                    - Key points (separated by semicolons)
                    
                    Project References:
                    - Project title
                    - Type (static_website, mentor_to_launch, other)
                    - Description
                    - Estimated time
                    - Priority level
                    - Status (planning/in_progress/review/completed)
                    
                    Goals:
                    - Goal title
                    - Description
                    - Target date
                    - Success criteria (separated by semicolons)
                    - Category (personal/business)
                    - Milestones (if any):
                      - Milestone title
                      - Milestone due date
                    
                    Also provide:
                    - Priority (low/medium/high)
                    - Due date (YYYY-MM-DD)
                    - Privacy (private/public/local)
                    - Recipient (if private note)
                    - Relevant tags
                    - Brief summary`
                },
                {
                    role: "user",
                    content: `Analyze this voice note and provide in this exact format:
                    Title: [clear, concise title]
                    Categories: [comma-separated list]
                    Priority: [low/medium/high]
                    Due Date: [YYYY-MM-DD or N/A]
                    Privacy: [private/public/local]
                    Recipient: [name or N/A]
                    Tags: [comma-separated list]
                    Summary: [brief summary]
                    
                    Shopping Items:
                    - [item name]
                    Quantity: [number]
                    Notes: [additional details]
                    Urgency: [low/medium/high]
                    
                    DLLTW Notes:
                    Title: [note title]
                    Chapter: [chapter reference]
                    Book Section: [section name]
                    Content: [main content]
                    Key Points: [semicolon-separated list]
                    
                    Project References:
                    Title: [project title]
                    Type: [static_website/mentor_to_launch/other]
                    Description: [project description]
                    Estimated Time: [time estimate]
                    Priority: [low/medium/high]
                    Status: [planning/in_progress/review/completed]
                    
                    Goals:
                    Title: [goal title]
                    Description: [goal description]
                    Target Date: [YYYY-MM-DD]
                    Success Criteria: [semicolon-separated list]
                    Category: [personal/business]
                    
                    Milestones:
                    Milestone: [milestone title]
                    Milestone Due: [YYYY-MM-DD]
                    
                    Voice note: "${transcription}"`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
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
