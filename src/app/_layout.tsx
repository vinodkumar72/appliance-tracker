import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { AuthGate } from '@/components/auth-gate';
import { useTheme } from '@/hooks/use-theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.border,
      primary: theme.tint,
    },
  };
  return (
    <ThemeProvider value={navTheme}>
      <AuthGate>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="property/[id]" options={{ title: 'Property' }} />
        <Stack.Screen name="appliance/[id]" options={{ title: 'Appliance' }} />
        <Stack.Screen name="unit/[id]" options={{ title: 'Unit' }} />
        <Stack.Screen name="property-form" options={{ title: 'Property', presentation: 'modal' }} />
        <Stack.Screen name="appliance-form" options={{ title: 'Appliance', presentation: 'modal' }} />
        <Stack.Screen name="log-form" options={{ title: 'Log entry', presentation: 'modal' }} />
        <Stack.Screen name="schedule-form" options={{ title: 'Maintenance schedule', presentation: 'modal' }} />
        <Stack.Screen name="unit-form" options={{ title: 'Unit', presentation: 'modal' }} />
        <Stack.Screen name="org-form" options={{ title: 'Company', presentation: 'modal' }} />
        <Stack.Screen name="platform-setup" options={{ title: 'Platform setup', presentation: 'modal' }} />
        <Stack.Screen name="account" options={{ title: 'Account & sync', presentation: 'modal' }} />
        <Stack.Screen name="about" options={{ title: 'About', headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ title: 'Sign in', headerShown: false }} />
        <Stack.Screen name="how-it-works" options={{ title: 'How it works', headerShown: false }} />
        <Stack.Screen name="contact" options={{ title: 'Contact us', headerShown: false }} />
        <Stack.Screen name="pricing" options={{ title: 'Pricing', headerShown: false }} />
        <Stack.Screen
          name="request-invite"
          options={{ title: 'Request an invite', headerShown: false }}
        />
        <Stack.Screen name="plan-form" options={{ title: 'Plan', presentation: 'modal' }} />
        <Stack.Screen name="subscription-form" options={{ title: 'Subscription', presentation: 'modal' }} />
        <Stack.Screen name="upgrade" options={{ title: 'Upgrade plan', presentation: 'modal' }} />
        <Stack.Screen name="member-form" options={{ title: 'Member', presentation: 'modal' }} />
      </Stack>
      </AuthGate>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
