import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Button, Card, FormField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { syncNow } from '@/lib/sync';

/**
 * Set this to the marketing site's address once it has its final domain —
 * the mobile login screen links prospects there.
 */
const MARKETING_SITE_URL = '';

/**
 * The sign-in form, shared by the web /sign-in page and the native app's
 * login screen. On native ("credentials-only"), self-registration and demo
 * mode are hidden: users get credentials from their property management
 * company, and prospects are pointed at the website.
 */
export function SignInForm({ variant = 'web' }: { variant?: 'web' | 'native' }) {
  const theme = useTheme();
  const router = useRouter();
  const setDemoMode = useAppStore((s) => s.setDemoMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const signIn = async () => {
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    syncNow().catch(() => {});
    router.replace('/');
  };

  const signUp = async () => {
    setBusy(true);
    setMessage('');
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      // An invitation already creates the account, so invited users can't
      // (and don't need to) register again.
      setMessage(
        /already.*(registered|exists)/i.test(error.message)
          ? 'An account with this email already exists — if you were invited, the invitation created it for you. Sign in if you know your password, or tap "Forgot password?" to set one.'
          : error.message,
      );
    } else if (!data.session) {
      setMessage('Account created — check your email for a confirmation link, then sign in.');
    } else {
      syncNow().catch(() => {});
      router.replace('/');
    }
  };

  const forgotPassword = async () => {
    if (!email.trim()) {
      setMessage('Enter your email above first, then tap "Forgot password?" again.');
      return;
    }
    setBusy(true);
    const redirectTo =
      typeof window !== 'undefined' && window.location?.origin ? window.location.origin : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      redirectTo ? { redirectTo } : undefined,
    );
    setMessage(
      error
        ? `Could not send reset email: ${error.message}`
        : `Password reset email sent to ${email.trim()} — open the link and you'll be asked to choose a new password.`,
    );
    setBusy(false);
  };

  return (
    <>
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@company.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <FormField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
      />
      <View style={{ gap: Spacing.two }}>
        <Button title={busy ? 'Working…' : 'Sign in'} onPress={busy ? () => {} : signIn} />
        {variant === 'web' ? (
          <Button title="Create account" variant="secondary" onPress={busy ? () => {} : signUp} />
        ) : null}
        <Button
          title="Forgot password?"
          variant="secondary"
          onPress={busy ? () => {} : forgotPassword}
        />
        {variant === 'web' ? (
          <Button
            title="Continue offline (demo)"
            variant="secondary"
            onPress={() => {
              setDemoMode(true);
              router.replace('/');
            }}
          />
        ) : null}
      </View>
      {variant === 'native' ? (
        <View style={[styles.guidance, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Text style={[styles.guidanceTitle, { color: theme.text }]}>New to this?</Text>
          <Text style={[styles.guidanceBody, { color: theme.textSecondary }]}>
            Ask your property management company for your credentials — they'll send you an email
            invitation.
          </Text>
          <Text style={[styles.guidanceBody, { color: theme.textSecondary }]}>
            Are you a property management company looking to start using this system?{' '}
            {MARKETING_SITE_URL ? (
              <Text
                style={{ color: theme.tint, fontWeight: '600' }}
                onPress={() => Linking.openURL(MARKETING_SITE_URL)}>
                Visit our website to learn more.
              </Text>
            ) : (
              'Visit our website to learn more.'
            )}
          </Text>
        </View>
      ) : (
        <View style={[styles.guidance, { backgroundColor: theme.tintSoft, borderColor: theme.tint }]}>
          <Text style={[styles.guidanceTitle, { color: theme.text }]}>✉️ Invited by your company?</Text>
          <Text style={[styles.guidanceBody, { color: theme.text }]}>
            Your account already exists — use the link in your invitation email to set your
            password. Can't find the email? Enter your email above and tap "Forgot password?" to
            get a new link.
          </Text>
        </View>
      )}
      {message ? (
        <Card>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{message}</Text>
        </Card>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  guidance: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  guidanceTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  guidanceBody: {
    fontSize: 13.5,
    lineHeight: 20,
  },
});
