import { createClient } from '@supabase/supabase-js'
import { env } from '$env/dynamic/public'

// Initialize Supabase client with proper typing
const supabaseUrl = env.PUBLIC_SUPABASE_URL
const supabaseKey = env.PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
}

console.log('Initializing Supabase client with URL:', supabaseUrl)

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
})

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
    } catch (error: any) {
        console.error('Supabase error details:', {
            name: error.name,
            code: error?.code,
            message: error?.message,
            details: error?.details,
            stack: error?.stack
        });
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
        throw new Error(`Database delete failed: ${error.message}`);
    }
}
