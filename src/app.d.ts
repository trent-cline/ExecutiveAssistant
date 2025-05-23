/// <reference types="svelte" />
import type { Session, User, SupabaseClient } from '@supabase/supabase-js';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			session: Session | null;
			user: User | null;
			supabase: SupabaseClient;
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		webkitSpeechRecognition: any;
	}
}

export {};
