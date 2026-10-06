import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { PageHero, PublicPage } from '@/components/public-page';
import { SignInForm } from '@/components/sign-in-form';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const signUp = mode === 'signup';

  // Already signed in? This page has nothing to offer — go to the app.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PublicPage
      title={signUp ? 'Start free' : 'Sign in'}
      description={
        signUp
          ? 'Create your PropsLane account, name your company, and start tracking appliances free — no credit card required.'
          : 'Sign in to your PropsLane company account. Your data syncs to this device once you are in.'
      }
      path="/sign-in">
      <Stack.Screen options={{ title: signUp ? 'Start free' : 'Sign in' }} />
      <PageHero
        emoji={signUp ? '🚀' : '🔑'}
        title={signUp ? 'Start free' : 'Sign in'}
        subtitle={
          signUp
            ? 'Create your account, name your company, and start tracking — free, in minutes. No credit card required.'
            : "Welcome back — your data syncs to this device once you're in."
        }
      />
      <SignInForm startInSignUp={signUp} />
    </PublicPage>
  );
}
