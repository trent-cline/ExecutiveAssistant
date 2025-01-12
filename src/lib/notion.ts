import { Client } from '@notionhq/client';
import { env } from '$env/dynamic/private';

const notion = new Client({
    auth: env.NOTION_API_KEY
});

export interface NotionNote {
    timestamp: string;
    transcription: string;
    localStorageKey: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    summary?: string;
}

export async function addNoteToNotion(note: NotionNote) {
    try {
        const properties: any = {
            Name: {
                title: [{
                    type: 'text',
                    text: {
                        content: note.transcription.slice(0, 100)
                    }
                }]
            },
            Transcription: {
                rich_text: [{
                    type: 'text',
                    text: {
                        content: note.transcription
                    }
                }]
            },
            Timestamp: {
                date: {
                    start: note.timestamp
                }
            },
            LocalStorageKey: {
                rich_text: [{
                    type: 'text',
                    text: {
                        content: note.localStorageKey
                    }
                }]
            }
        };

        // Only add optional properties if they exist
        if (note.category) {
            properties.Category = {
                select: {
                    name: note.category
                }
            };
        }

        if (note.priority) {
            properties.Priority = {
                select: {
                    name: note.priority
                }
            };
        }

        if (note.dueDate) {
            properties["Due Date"] = {
                date: {
                    start: note.dueDate
                }
            };
        }

        if (note.summary) {
            properties.Summary = {
                rich_text: [{
                    type: 'text',
                    text: {
                        content: note.summary
                    }
                }]
            };
        }

        console.log('Attempting to add note to Notion with database ID:', env.NOTION_DATABASE_ID);
        console.log('Note data:', JSON.stringify(note, null, 2));

        const response = await notion.pages.create({
            parent: { database_id: env.NOTION_DATABASE_ID },
            properties
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
