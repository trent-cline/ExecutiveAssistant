import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

console.log('PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey?.slice(0, 8) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
