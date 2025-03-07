import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { supabase } from '$lib/supabase';

export const ssr = false;
export const prerender = false;

export const load: PageLoad = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
        throw redirect(303, '/auth');
    }
};
