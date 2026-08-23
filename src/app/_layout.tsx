import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
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
        <Stack.Screen name="member-form" options={{ title: 'Member', presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
