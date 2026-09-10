import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// The publishable (anon) key is safe to ship in the client — all data access
// is enforced server-side by the row-level security policies in
// supabase/schema.sql, not by secrecy of this key.
//
// Which database the app talks to comes from the environment files:
//   .env.development → `npx expo start` (your dev database)
//   .env.production  → `npx expo export` (the testers' database)
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://zmbnvzjatdqqpmbsplre.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_g1H0GBXoKCeFWUB4yL6Xjw_ahQ99DWC';

/**
 * What kind of auth link opened this page ("invite", "recovery", …), captured
 * BEFORE createClient consumes and strips the URL hash. Used to prompt
 * invited users to set a password on arrival.
 */
export const initialAuthLinkType: string | null =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? (window.location.hash.match(/[#&]type=([a-z_]+)/)?.[1] ?? null)
    : null;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // On web, pick up the session from invitation/confirmation links.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
