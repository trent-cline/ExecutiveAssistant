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
        console.error('Detailed error in Notion API route:', {
            message: error.message,
            code: error.code,
            status: error.status,
            details: error.body || error
        });
        
        return new Response(JSON.stringify({ error: 'Failed to save to Notion' }), {
            status: 500
        });
    }
}) satisfies RequestHandler;
