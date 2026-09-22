/**
 * Supabase server-side client (Service Role — bypasses RLS).
 * Used exclusively in api/chat.ts (Node/Express context).
 * Auth is enforced at the Express middleware layer.
 *
 * REQUIRED ENV VARS:
 *   SUPABASE_URL              = https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
 */
import { createClient } from '@supabase/supabase-js';

const url  = process.env.SUPABASE_URL;
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn(
    '[chat] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. ' +
    'Chat endpoints will return 503 until these are configured.'
  );
}

export const supabaseAdmin = url && key
  ? createClient(url, key, { auth: { persistSession: false } })
  : null;

/** Returns true when the Supabase client is ready */
export function isSupabaseReady(): boolean {
  return supabaseAdmin !== null;
}
