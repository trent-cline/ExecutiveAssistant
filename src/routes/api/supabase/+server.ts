import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addNoteToSupabase, deleteNoteFromSupabase } from '$lib/supabase';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const note = await request.json();

        // Ensure required fields are present
        if (!note.name || !note.localid) {
            return json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Add user_id field for RLS
        const noteWithAuth = {
            ...note,
            user_id: 'public'  // Mark as public note
        };

        const data = await addNoteToSupabase(noteWithAuth);
        return json({ noteId: data.id });
    } catch (error) {
        console.error('Error saving note:', error);
        return json(
            { error: `Database insert failed: ${error.message}` },
            { status: 500 }
        );
    }
};

export const DELETE: RequestHandler = async ({ request }) => {
    try {
        const { noteId } = await request.json();
        
        if (!noteId) {
            return json(
                { error: 'Missing note ID' },
                { status: 400 }
            );
        }

        await deleteNoteFromSupabase(noteId);
        return json({ success: true });
    } catch (error) {
        console.error('Error deleting note:', error);
        return json(
            { error: `Database delete failed: ${error.message}` },
            { status: 500 }
        );
    }
};
