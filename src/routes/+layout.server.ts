import type { LayoutServerLoad } from './$types';

// Use locals from hooks.server.ts instead of making another Supabase call
export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
    // Get auth data from locals (set in hooks.server.ts)
    const { session, user, supabase } = locals;
    
    // Double-check the session using the server client
    // This ensures we always have the most up-to-date session state
    const { data } = await supabase.auth.getSession();
    const currentSession = data.session;
    
    // Pass the current path to the client for navigation handling
    const currentPath = url.pathname;
    
    return {
        session: currentSession || session,
        user: currentSession?.user || user,
        currentPath
    };
};
