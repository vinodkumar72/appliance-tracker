import type { Session } from '@supabase/supabase-js';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Badge, Button, Card, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore, usePendingChanges } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { syncNow } from '@/lib/sync';

export default function AccountScreen() {
  const theme = useTheme();
  const pendingChanges = usePendingChanges();
  const lastSyncAt = useAppStore((s) => s.lastSyncAt);

  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const runSync = async () => {
    setBusy(true);
    setMessage('Syncing…');
    const result = await syncNow();
    setMessage(
      result.ok
        ? `Synced — pushed ${result.pushed}, pulled ${result.pulled} records.`
        : `Sync failed: ${result.error}`,
    );
    setBusy(false);
  };

  const signIn = async () => {
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    setMessage('Signed in. Syncing…');
    const result = await syncNow();
    setMessage(
      result.ok
        ? `Signed in and synced — pushed ${result.pushed}, pulled ${result.pulled} records.`
        : `Signed in, but sync failed: ${result.error}`,
    );
    setBusy(false);
  };

  const signUp = async () => {
    setBusy(true);
    setMessage('');
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) {
      setMessage(error.message);
    } else if (!data.session) {
      setMessage(
        'Account created — check your email for a confirmation link, then come back and sign in. (To skip confirmation during testing: Supabase dashboard → Authentication → Sign In / Up → disable "Confirm email".)',
      );
    } else {
      setMessage('Account created and signed in. Tap "Sync now" to upload your data.');
    }
    setBusy(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMessage('Signed out. The app keeps working offline; sign in again to sync.');
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Account & sync' }} />

      {session ? (
        <>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <Badge label="signed in" tone="success" />
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600', flex: 1 }}>
                {session.user.email}
              </Text>
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              {pendingChanges} change{pendingChanges === 1 ? '' : 's'} pending ·{' '}
              {lastSyncAt ? `last synced ${new Date(lastSyncAt).toLocaleString()}` : 'never synced'}
            </Text>
          </Card>
          <Button title={busy ? 'Working…' : 'Sync now'} onPress={busy ? () => {} : runSync} />
          <Button title="Sign out" variant="secondary" onPress={signOut} />
        </>
      ) : (
        <>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
            Sign in to sync this device's data with the cloud database. Everything keeps working
            offline — syncing just backs it up and shares it across devices.
          </Text>
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
          />
          <View style={{ gap: Spacing.two }}>
            <Button title={busy ? 'Working…' : 'Sign in'} onPress={busy ? () => {} : signIn} />
            <Button
              title="Create account"
              variant="secondary"
              onPress={busy ? () => {} : signUp}
            />
          </View>
        </>
      )}

      {message ? (
        <Card>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{message}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
