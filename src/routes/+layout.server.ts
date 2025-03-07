import type { LayoutServerLoad } from './$types';
import { supabase } from '$lib/supabase';

export const load: LayoutServerLoad = async ({ locals }) => {
    try {
        // Get session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Auth error:', error);
            return {
                session: null,
                user: null
            };
        }

        return {
            session,
            user: session?.user ?? null
        };
    } catch (err) {
        console.error('Error in layout load:', err);
        return {
            session: null,
            user: null
        };
    }
};
