import { addNoteToNotion } from '$lib/notion';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST = (async ({ request }) => {
    try {
        const note = await request.json();
        console.log('Received request to save note:', JSON.stringify(note, null, 2));
        
        const notionId = await addNoteToNotion(note);
        console.log('Successfully saved note to Notion with ID:', notionId);
        
        return json({ notionId });
    } catch (error: any) {
        // Log the full error details
        console.error('Detailed error in Notion API route:', {
            message: error.message,
            code: error.code,
            status: error.status,
            details: error.body || error
        });
        
        // Return a more specific error message if available
        const errorMessage = error.body?.message || error.message || 'Failed to save to Notion';
        return new Response(JSON.stringify({ 
            error: errorMessage,
            code: error.code || 'UNKNOWN_ERROR'
        }), {
            status: error.status || 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}) satisfies RequestHandler;
