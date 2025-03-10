import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

export const load = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!session) {
        throw redirect(303, '/auth');
    }
    return { session };
};
