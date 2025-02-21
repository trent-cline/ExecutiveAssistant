import { writable } from 'svelte/store';
import { supabase } from './supabase';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// Create a writable store for the user
export const user = writable<User | null>(null);

// Initialize the user store
supabase.auth.getSession().then(({ data: { session } }) => {
    user.set(session?.user ?? null);
});

// Subscribe to auth state changes
supabase.auth.onAuthStateChange((_event, session) => {
    user.set(session?.user ?? null);
});
