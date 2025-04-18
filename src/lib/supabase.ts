// Import Supabase client and SSR helpers
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';
import { goto } from '$app/navigation';

// Since this is a personal app with just you as the user, we can simplify the authentication
// These values should be your actual Supabase project details from your .env file

// Use environment variables for Supabase credentials
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseKey = PUBLIC_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. This is a critical error.');
}

// Browser client - used for client-side operations
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

/**
 * Create a Supabase client for server-side operations with cookie handling
 */
export function createServerSupabaseClient(cookies: Cookies) {
    return createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            get: (key) => {
                const cookie = cookies.get(key);
                return cookie || '';
            },
            set: (key, value, options) => {
                cookies.set(key, value, {
                    path: '/',
                    ...options
                });
            },
            remove: (key, options) => {
                cookies.delete(key, {
                    path: '/',
                    ...options
                });
            }
        }
    });
}

// Re-export types for use in other files
export type { User, Session, SupabaseClient } from '@supabase/supabase-js';

export interface BrainDump {
    id?: string;
    created_at?: string;
    name: string;
    due_date?: string;
    status?: string;
    localid: string;
    summary?: string;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
}

export async function addNoteToSupabase(note: BrainDump) {
    try {
        console.log('Attempting to add note to Supabase:', JSON.stringify(note, null, 2));

        // Validate required fields
        if (!note.name || !note.localid) {
            throw new Error('Missing required fields: name and localid are required');
        }

        // Create the insert payload
        const insertData = {
            name: note.name,
            due_date: note.due_date,
            status: note.status || 'active',
            localid: note.localid,
            summary: note.summary,
            priority: note.priority,
            category: note.category,
            created_at: note.created_at || new Date().toISOString()
        };

        console.log('Insert payload:', JSON.stringify(insertData, null, 2));

        // Test Supabase connection
        const { data: testData, error: testError } = await supabase
            .from('brain_dump_database')
            .select('count')
            .limit(1);

        if (testError) {
            console.error('Supabase connection test failed:', testError);
            throw new Error(`Database connection failed: ${testError.message}`);
        }

        console.log('Supabase connection test successful');

        // Perform the insert
        const { data, error } = await supabase
            .from('brain_dump_database')
            .insert([insertData])
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            throw new Error(`Database insert failed: ${error.message}`);
        }
        
        if (!data) {
            throw new Error('No data returned from Supabase');
        }
        
        console.log('Successfully created Supabase entry:', data);
        return data.id;
    } catch (error) {
        // Handle authentication errors
        if (typeof error === 'object' && error !== null) {
            // Check if it's an error with status property
            if ('status' in error && (error as any).status === 401) {
                // Redirect to login page for unauthorized errors
                goto('/login');
                return;
            }
            
            // Check if it has a message property that includes 'not authenticated'
            if ('message' in error && 
                typeof (error as any).message === 'string' && 
                (error as any).message.includes('not authenticated')) {
                goto('/login');
                return;
            }
            
            // Log error details if available
            const errorObj = error as any;
            console.error('Supabase error details:', {
                name: errorObj.name,
                code: errorObj.code,
                message: errorObj.message,
                details: errorObj.details,
                stack: errorObj.stack
            });
        } else {
            // Log generic error
            console.error('Auth error:', error);
        }
        
        throw error;
    }
}

export async function deleteNoteFromSupabase(noteId: string) {
    try {
        const { error } = await supabase
            .from('brain_dump_database')
            .delete()
            .eq('id', noteId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting note:', error);
        
        // Safely access error message with type checking
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Database delete failed: ${errorMessage}`);
    }
}
