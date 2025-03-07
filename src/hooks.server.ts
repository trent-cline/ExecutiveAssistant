import { sequence } from '@sveltejs/kit/hooks';
import { supabase } from '$lib/supabase';
import type { Handle } from '@sveltejs/kit';

const handleAuth: Handle = async ({ event, resolve }) => {
    try {
        // Get session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Add session to event.locals
        event.locals.session = session;
        event.locals.user = session?.user ?? null;

        // Continue with response
        const response = await resolve(event);
        return response;
    } catch (err) {
        console.error('Auth error:', err);
        event.locals.session = null;
        event.locals.user = null;
        return resolve(event);
    }
};

export const handle = sequence(handleAuth);
