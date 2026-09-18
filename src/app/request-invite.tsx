import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PageHero, PublicPage } from '@/components/public-page';
import { Button, Card, ChipPicker, FormField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

interface PublicPlanOption {
  id: string;
  name: string;
  emoji: string | null;
  yearly_price: number;
  max_units: number | null;
}

const NOT_SURE = 'not-sure';

/** Public page: prospective customers ask to be onboarded. No account needed. */
export default function RequestInviteScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [planId, setPlanId] = useState(NOT_SURE);
  const [plans, setPlans] = useState<PublicPlanOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase
      .from('plans')
      .select('id,name,emoji,yearly_price,max_units')
      .order('yearly_price', { ascending: true })
      .then(({ data }) => setPlans((data as PublicPlanOption[]) ?? []));
  }, []);

  const submit = async () => {
    if (!company.trim() || !contactName.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setStatus('Company name, your name, and a valid email are required.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('onboarding_requests').insert({
      company_name: company.trim(),
      contact_name: contactName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      message: message.trim() || null,
      plan_id: planId === NOT_SURE ? null : planId,
    });
    setBusy(false);
    if (error) {
      setStatus(`Could not send the request: ${error.message}. Please try again.`);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <PublicPage>
        <Stack.Screen options={{ title: 'Request an invite' }} />
        <PageHero
          emoji="📬"
          title="Request sent!"
          subtitle={`We'll review it and email an invitation to ${email.trim()} to get ${company.trim()} set up.`}
        />
        <Button title="Go to sign in" onPress={() => router.replace('/sign-in')} />
      </PublicPage>
    );
  }

  return (
    <PublicPage>
      <Stack.Screen options={{ title: 'Request an invite' }} />
      <PageHero
        emoji="🏢"
        title="Request an invite"
        subtitle="Tell us about your property management company and we'll set you up — you'll get an invitation by email."
      />
      <FormField
        label="Company name *"
        value={company}
        onChangeText={setCompany}
        placeholder="e.g. Acme Property Management"
      />
      <FormField
        label="Your name *"
        value={contactName}
        onChangeText={setContactName}
        placeholder="Who should we contact?"
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
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        placeholder="Optional"
        keyboardType="phone-pad"
      />
      {plans.length > 0 ? (
        <ChipPicker
          label="Which plan are you interested in?"
          value={planId}
          onChange={setPlanId}
          options={[
            { value: NOT_SURE, label: 'Not sure yet' },
            ...plans.map((p) => ({
              value: p.id,
              label: `${p.emoji ? `${p.emoji} ` : ''}${p.name}${
                p.max_units != null ? ` — ${p.max_units} units` : ''
              }`,
            })),
          ]}
        />
      ) : null}
      <FormField
        label="Anything we should know?"
        value={message}
        onChangeText={setMessage}
        placeholder="e.g. we manage ~40 rentals across two cities"
        multiline
      />
      <View style={{ gap: Spacing.two }}>
        <Button title={busy ? 'Sending…' : 'Send request'} onPress={busy ? () => {} : submit} />
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

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  logo: {
    fontSize: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 460,
  },
});
