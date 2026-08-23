import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// The publishable (anon) key is safe to ship in the client — all data access
// is enforced server-side by the row-level security policies in
// supabase/schema.sql, not by secrecy of this key.
const SUPABASE_URL = 'https://zmbnvzjatdqqpmbsplre.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_g1H0GBXoKCeFWUB4yL6Xjw_ahQ99DWC';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
