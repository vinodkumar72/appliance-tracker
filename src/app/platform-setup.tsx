import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/lib/store';

/** First-run setup: creates the software operator (platform owner) account. */
export default function PlatformSetupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const bootstrapPlatformAdmin = useAppStore((s) => s.bootstrapPlatformAdmin);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const save = () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Your name is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    bootstrapPlatformAdmin(name, email);
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Platform setup' }} />
      <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
        You are the software operator. You'll onboard property management companies onto the
        platform; each company then manages its own properties, members, and roles.
      </Text>
      <FormField
        label="Your name *"
        value={name}
        onChangeText={setName}
        placeholder="Platform owner"
        error={errors.name}
      />
      <FormField
        label="Your email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@yourcompany.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={{ gap: Spacing.two }}>
        <Button title="Set up platform" onPress={save} />
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
