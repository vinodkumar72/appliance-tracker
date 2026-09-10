import { FunctionsHttpError } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { supabase } from './supabase';

/**
 * Sends an invitation email via the invite-member edge function.
 * Returns null on success, or an error message.
 */
export async function sendInvite(email: string, orgId?: string): Promise<string | null> {
  const redirectTo =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin
      : undefined;
  const { data, error } = await supabase.functions.invoke('invite-member', {
    body: { email: email.trim(), orgId, redirectTo },
  });
  if (error) {
    // Pull the real reason out of the response body instead of the generic
    // "non-2xx status code" message.
    if (error instanceof FunctionsHttpError) {
      try {
        const body = (await error.context.json()) as { error?: string };
        if (body?.error) return body.error;
      } catch {
        // fall through to the generic message
      }
    }
    return error.message;
  }
  const result = data as { ok?: boolean; error?: string };
  return result?.error ?? null;
}
