import { Client } from '@notionhq/client';
import { env } from '$env/dynamic/private';

const notion = new Client({
    auth: env.NOTION_API_KEY
});

export interface NotionNote {
    timestamp: string;
    transcription: string;
    localStorageKey: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    summary: string;
}

export async function addNoteToNotion(note: NotionNote) {
    try {
        // Validate required fields
        if (!note.category || !note.priority || !note.summary || !note.transcription) {
            throw new Error('Missing required fields in note');
        }

        // Validate priority value
        if (!['low', 'medium', 'high'].includes(note.priority)) {
            throw new Error('Invalid priority value');
        }

        console.log('Attempting to add note to Notion with database ID:', env.NOTION_DATABASE_ID);
        console.log('Note data:', JSON.stringify(note, null, 2));

        const response = await notion.pages.create({
            parent: { database_id: env.NOTION_DATABASE_ID },
            properties: {
                Name: {
                    title: [{
                        text: {
                            content: note.summary.slice(0, 100)
                        }
                    }]
                },
                Category: {
                    type: 'select',
                    select: {
                        name: note.category
                    }
                },
                Priority: {
                    type: 'select',
                    select: {
                        name: note.priority
                    }
                },
                "Due Date": note.dueDate ? {
                    type: 'date',
                    date: {
                        start: note.dueDate
                    }
                } : null,
                Summary: {
                    type: 'rich_text',
                    rich_text: [{
                        text: {
                            content: note.summary
                        }
                    }]
                },
                Transcription: {
                    type: 'rich_text',
                    rich_text: [{
                        text: {
                            content: note.transcription
                        }
                    }]
                },
                Timestamp: {
                    type: 'date',
                    date: {
                        start: note.timestamp
                    }
                },
                LocalStorageKey: {
                    type: 'rich_text',
                    rich_text: [{
                        text: {
                            content: note.localStorageKey
                        }
                    }]
                }
            }
        });

        console.log('Successfully created Notion page:', response.id);
        return response.id;
    } catch (error: any) {
        console.error('@notionhq/client error:', {
            code: error.code,
            message: error.message,
            body: error.body
        });
        throw error;
    }
}
