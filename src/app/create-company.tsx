import { FunctionsHttpError } from '@supabase/supabase-js';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { Button, Card, EmptyState, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { syncNow } from '@/lib/sync';

/**
 * Self-serve signup, step 2: a signed-in user without a company creates their
 * own and becomes its owner (free tier, upgradeable in-app). Company creation
 * is web-only; team members are then added by invitation.
 */
export default function CreateCompanyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  if (Platform.OS !== 'web') {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Create your company' }} />
        <EmptyState
          emoji="🏢"
          title="Create your company on the web"
          message="Open PropsLane in a browser, sign in with this account, and set up your company there — then this app syncs it automatically."
        />
      </Screen>
    );
  }

  const create = async () => {
    if (!name.trim()) {
      setMessage('Company name is required.');
      return;
    }
    setBusy(true);
    setMessage('');
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setBusy(false);
      setMessage('Please sign in first — your company needs an account to belong to.');
      return;
    }
    const { data, error } = await supabase.functions.invoke('create-company', {
      body: { name: name.trim(), address: address.trim(), phone: phone.trim() },
    });
    if (error) {
      let detail = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const body = (await error.context.json()) as { error?: string };
          if (body.error) detail = body.error;
        } catch {
          // keep the generic message
        }
      }
      setBusy(false);
      setMessage(`Could not create the company: ${detail}`);
      return;
    }
    // Pull the new org + membership + free-tier subscription onto this device.
    await syncNow();
    setBusy(false);
    if ((data as { orgId?: string })?.orgId) {
      router.replace('/');
    } else {
      setMessage('Something unexpected happened — try Sync now on the Company tab.');
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Create your company' }} />
      <Text style={{ color: theme.textSecondary, fontSize: 14.5, lineHeight: 22 }}>
        You'll be the owner. Your company starts on the free tier — upgrade anytime from the
        Company tab — and you can invite your team by email once you're in.
      </Text>
      <FormField
        label="Company name *"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Acme Property Management"
      />
      <FormField
        label="Company address"
        value={address}
        onChangeText={setAddress}
        placeholder="Optional — street, city, state, ZIP"
        multiline
      />
      <FormField
        label="Company phone"
        value={phone}
        onChangeText={setPhone}
        placeholder="Optional"
        keyboardType="phone-pad"
      />
      <View style={{ gap: Spacing.two }}>
        <Button
          title={busy ? 'Creating your company…' : 'Create company'}
          onPress={busy ? () => {} : create}
        />
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
      {message ? (
        <Card>
          <Text style={{ color: theme.danger, fontSize: 14 }}>{message}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
