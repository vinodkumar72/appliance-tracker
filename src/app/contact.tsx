import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { PageHero, PublicPage } from '@/components/public-page';
import { Button, Card, FormField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

/** Public page: send us a message. No account needed. */
export default function ContactScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || !message.trim()) {
      setStatus('Your name, a valid email, and a message are required.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: name.trim(),
      email: email.trim(),
      company: company.trim() || null,
      message: message.trim(),
    });
    setBusy(false);
    if (error) {
      setStatus(`Could not send your message: ${error.message}. Please try again.`);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <PublicPage>
        <Stack.Screen options={{ title: 'Contact us' }} />
        <PageHero
          emoji="✅"
          title="Message sent!"
          subtitle={`Thanks, ${name.trim()} — we'll get back to you at ${email.trim()}.`}
        />
        <Button title="Back to home" onPress={() => router.replace('/')} />
      </PublicPage>
    );
  }

  return (
    <PublicPage>
      <Stack.Screen options={{ title: 'Contact us' }} />
      <PageHero
        emoji="💬"
        title="Contact us"
        subtitle="Questions about plans, onboarding, or anything else — send a message and we'll get back to you."
      />
      <FormField
        label="Your name *"
        value={name}
        onChangeText={setName}
        placeholder="Who are we talking to?"
      />
      <FormField
        label="Email *"
        value={email}
        onChangeText={setEmail}
        placeholder="you@company.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <FormField
        label="Company"
        value={company}
        onChangeText={setCompany}
        placeholder="Optional"
      />
      <FormField
        label="Message *"
        value={message}
        onChangeText={setMessage}
        placeholder="What can we help with?"
        multiline
        numberOfLines={5}
      />
      <View style={{ gap: Spacing.two }}>
        <Button title={busy ? 'Sending…' : 'Send message'} onPress={busy ? () => {} : submit} />
        <Button title="Back to home" variant="secondary" onPress={() => router.replace('/')} />
      </View>
      {status ? (
        <Card>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{status}</Text>
        </Card>
      ) : null}
    </PublicPage>
  );
}
