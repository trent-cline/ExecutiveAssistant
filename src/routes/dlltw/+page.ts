import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

export const ssr = false;
export const prerender = false;

export async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        throw redirect(303, '/');
    }
    
    return {
        user: session.user
    };
}
