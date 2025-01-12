import { Client } from '@notionhq/client';
import { env } from '$env/dynamic/private';

const notion = new Client({ auth: env.NOTION_API_KEY });

interface NotionNote {
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
        console.log('Attempting to add note to Notion with database ID:', env.NOTION_DATABASE_ID);
        console.log('Note data:', JSON.stringify(note, null, 2));
        
        const response = await notion.pages.create({
            parent: { database_id: env.NOTION_DATABASE_ID },
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: new Date(note.timestamp).toLocaleString()
                            }
                        }
                    ]
                },
                Transcription: {
                    rich_text: [
                        {
                            text: {
                                content: note.transcription
                            }
                        }
                    ]
                },
                LocalStorageKey: {
                    rich_text: [
                        {
                            text: {
                                content: note.localStorageKey
                            }
                        }
                    ]
                },
                Timestamp: {
                    date: {
                        start: note.timestamp
                    }
                },
                Category: note.category ? {
                    select: {
                        name: note.category
                    }
                } : undefined,
                Priority: note.priority ? {
                    select: {
                        name: note.priority
                    }
                } : undefined,
                "Due Date": note.dueDate ? {
                    date: {
                        start: note.dueDate
                    }
                } : undefined,
                Summary: note.summary ? {
                    rich_text: [
                        {
                            text: {
                                content: note.summary
                            }
                        }
                    ]
                } : undefined
            }
        });

        console.log('Successfully created Notion page:', response.id);
        return response.id;
    } catch (error: any) {
        console.error('Detailed Notion API error:', {
            error: error.message,
            code: error.code,
            status: error.status,
            details: error.body
        });
        throw error;
    }
}
