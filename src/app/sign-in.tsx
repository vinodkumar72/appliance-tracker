import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { PageHero, PublicPage } from '@/components/public-page';
import { SignInForm } from '@/components/sign-in-form';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const router = useRouter();

  // Already signed in? This page has nothing to offer — go to the app.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PublicPage>
      <Stack.Screen options={{ title: 'Sign in' }} />
      <PageHero
        emoji="🔑"
        title="Sign in"
        subtitle="Welcome back — your data syncs to this device once you're in."
      />
      <SignInForm />
    </PublicPage>
  );
}
