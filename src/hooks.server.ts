import { sequence } from '@sveltejs/kit/hooks';
import { createServerSupabaseClient, supabase } from '$lib/supabase';
import { redirect, type Handle } from '@sveltejs/kit';

// Define protected routes that require authentication
const protectedRoutes = [
    '/table',
    '/goals',
    '/shopping',
    '/active-projects',
    '/dlltw-notes',
    '/private-notes',
    '/company',
    '/prm',
    '/voice-nav',
    '/lists'
];

// Public routes that don't require authentication
const publicRoutes = [
    '/',
    '/login'
];

// For a personal app, we can use a simpler authentication approach
const handleAuth: Handle = async ({ event, resolve }) => {
    try {
        // Get the path being requested
        const path = event.url.pathname;
        
        // Create a server-side Supabase client with cookie handling
        const supabaseServer = createServerSupabaseClient(event.cookies);
        
        // Try to get session from cookies
        let { data: { session } } = await supabaseServer.auth.getSession();
        
        // Add session and Supabase client to event.locals
        event.locals.session = session;
        event.locals.user = session?.user ?? null;
        event.locals.supabase = supabaseServer;

        // For a personal app, we can implement a simpler authentication flow
        // If this is a protected route and user is not authenticated
        if (protectedRoutes.some(route => path.startsWith(route)) && !session && path !== '/login') {
            throw redirect(303, '/login');
        }
        // If user is authenticated and trying to access login page, redirect to dashboard (only log if not already on /table)
        if (session && path === '/login') {
            if (path !== '/table') {
                console.log('Redirecting authenticated user from login page');
            }
            throw redirect(303, '/table');
        }

        // Continue with response
        const response = await resolve(event);
        return response;
    } catch (err) {
        if (err instanceof Response) {
            return err; // This handles redirects
        }
        
        console.error('Auth error:', err);
        event.locals.session = null;
        event.locals.user = null;
        return resolve(event);
    }
};

export const handle = sequence(handleAuth);
