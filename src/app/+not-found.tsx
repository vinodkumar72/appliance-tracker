import { Stack } from 'expo-router';
import { View } from 'react-native';

import { PageHero, PublicPage } from '@/components/public-page';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';

/** Shown for any URL that matches no route. The root layout marks it noindex. */
export default function NotFoundScreen() {
  return (
    <PublicPage title="Page not found" description="That page doesn't exist or has moved.">
      <Stack.Screen options={{ title: 'Page not found' }} />
      <PageHero
        emoji="🧭"
        title="Page not found"
        subtitle="That page doesn't exist or has moved. Head back to the homepage to find what you need."
      />
      <View style={{ gap: Spacing.two }}>
        <Button title="Back to home" href="/" />
        <Button title="Contact us" variant="secondary" href="/contact" />
      </View>
    </PublicPage>
  );
}
