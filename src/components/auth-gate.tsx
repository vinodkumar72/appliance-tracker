import type { Session } from '@supabase/supabase-js';
import { ReactNode, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAutoSync } from '@/lib/auto-sync';
import { useAppStore } from '@/lib/store';
import { initialAuthLinkType, supabase } from '@/lib/supabase';
import { syncNow } from '@/lib/sync';

/**
 * Front door of the app: requires a signed-in account (or explicit offline
 * demo mode) before showing anything else. Sessions persist on-device, so a
 * user signs in once and the app keeps working offline afterwards.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const theme = useTheme();
  useAutoSync();
  const demoMode = useAppStore((s) => s.demoMode);
  const setDemoMode = useAppStore((s) => s.setDemoMode);
  const hydrated = useAppStore((s) => s.hydrated);
  const storeSession = useAppStore((s) => s.session);
  const users = useAppStore((s) => s.users);
  const memberships = useAppStore((s) => s.memberships);
  const organizations = useAppStore((s) => s.organizations);
  const updateUserProfile = useAppStore((s) => s.updateUserProfile);
  const updateOrganization = useAppStore((s) => s.updateOrganization);

  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  // Arrived via an invitation or password-reset link → ask them to set a password.
  const [needsPassword, setNeedsPassword] = useState(
    initialAuthLinkType === 'invite' ||
      initialAuthLinkType === 'recovery' ||
      initialAuthLinkType === 'magiclink',
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Invited users complete their profile (phone, company address) on arrival.
  const [needsProfile, setNeedsProfile] = useState(initialAuthLinkType === 'invite');
  const [userPhone, setUserPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
      // Already signed in from a previous run → refresh data in the background.
      if (data.session) syncNow().catch(() => {});
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setNeedsPassword(true);
      // A fresh sign-in (login, invite link, reset link) → pull their data.
      if (event === 'SIGNED_IN') syncNow().catch(() => {});
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!checked || !hydrated) {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
  }

  if (session && needsPassword) {
    const savePassword = async () => {
      if (newPassword.length < 6) {
        setMessage('Password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage("Passwords don't match.");
        return;
      }
      setBusy(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setBusy(false);
      if (error) {
        setMessage(`Could not set password: ${error.message}`);
        return;
      }
      setMessage('');
      setNeedsPassword(false);
    };
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.logo}>👋</Text>
          <Text style={[styles.title, { color: theme.text }]}>Welcome!</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            You're signed in as {session.user.email}. Choose a password so you can sign in on any
            device, including the mobile app.
          </Text>
        </View>
        <FormField
          label="Choose a password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="At least 6 characters"
          secureTextEntry
        />
        <FormField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Same password again"
          secureTextEntry
        />
        <View style={{ gap: Spacing.two }}>
          <Button
            title={busy ? 'Saving…' : 'Set password & continue'}
            onPress={busy ? () => {} : savePassword}
          />
          <Button title="Skip for now" variant="secondary" onPress={() => setNeedsPassword(false)} />
        </View>
        {message ? (
          <Card>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{message}</Text>
          </Card>
        ) : null}
      </Screen>
    );
  }

  // Step 2 for invited users: complete profile (phone + company address).
  const currentUser = users.find((u) => u.id === storeSession.currentUserId);
  const ownedOrg = organizations.find((o) =>
    memberships.some(
      (m) => m.orgId === o.id && m.userId === currentUser?.id && m.role === 'owner',
    ),
  );
  const profileIncomplete =
    !currentUser || !currentUser.phone || (!!ownedOrg && !ownedOrg.address);

  if (session && !needsPassword && needsProfile && profileIncomplete) {
    const saveProfile = () => {
      if (!currentUser) return;
      if (!userPhone.trim()) {
        setMessage('Please enter your phone number.');
        return;
      }
      if (ownedOrg && !companyAddress.trim()) {
        setMessage("Please enter your company's address.");
        return;
      }
      updateUserProfile(currentUser.id, { phone: userPhone.trim() });
      if (ownedOrg) {
        updateOrganization(ownedOrg.id, {
          address: companyAddress.trim(),
          ...(companyPhone.trim() ? { phone: companyPhone.trim() } : {}),
        });
      }
      setMessage('');
      setNeedsProfile(false);
      syncNow().catch(() => {});
    };
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.logo}>📋</Text>
          <Text style={[styles.title, { color: theme.text }]}>Complete your profile</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {currentUser
              ? ownedOrg
                ? `A few details for ${ownedOrg.name} before you get started.`
                : 'A few details before you get started.'
              : 'Setting up your account…'}
          </Text>
        </View>
        {currentUser ? (
          <>
            <FormField
              label="Your phone number *"
              value={userPhone}
              onChangeText={setUserPhone}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
            />
            {ownedOrg ? (
              <>
                <FormField
                  label="Company address *"
                  value={companyAddress}
                  onChangeText={setCompanyAddress}
                  placeholder="Street, city, state, ZIP"
                  multiline
                />
                <FormField
                  label="Company phone"
                  value={companyPhone}
                  onChangeText={setCompanyPhone}
                  placeholder="Main office number (optional)"
                  keyboardType="phone-pad"
                />
              </>
            ) : null}
            <View style={{ gap: Spacing.two }}>
              <Button title="Save & continue" onPress={saveProfile} />
              <Button
                title="Skip for now"
                variant="secondary"
                onPress={() => setNeedsProfile(false)}
              />
            </View>
          </>
        ) : null}
        {message ? (
          <Card>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{message}</Text>
          </Card>
        ) : null}
      </Screen>
    );
  }

  if (session || demoMode) {
    return <>{children}</>;
  }

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
    setBusy(false);
    // Session change unlocks the app; link + pull data in the background.
    syncNow().catch(() => {});
  };

  const signUp = async () => {
    setBusy(true);
    setMessage('');
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) {
      setMessage(error.message);
    } else if (!data.session) {
      setMessage('Account created — check your email for a confirmation link, then sign in.');
    } else {
      syncNow().catch(() => {});
    }
    setBusy(false);
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
    <Screen>
      <View style={styles.header}>
        <Text style={styles.logo}>🏠</Text>
        <Text style={[styles.title, { color: theme.text }]}>Appliance Tracker</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Appliance maintenance, warranties, and repairs for property managers and owners.
        </Text>
      </View>

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
        <Button
          title="Create account"
          variant="secondary"
          onPress={busy ? () => {} : signUp}
        />
        <Button
          title="Forgot password?"
          variant="secondary"
          onPress={busy ? () => {} : forgotPassword}
        />
        <Button
          title="Continue offline (demo)"
          variant="secondary"
          onPress={() => setDemoMode(true)}
        />
      </View>
      <Text style={[styles.hint, { color: theme.textSecondary }]}>
        Invited by your company? Use the link in your invitation email, or create an account with
        the same email address it was sent to.
      </Text>
      {message ? (
        <Card>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{message}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  logo: {
    fontSize: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 420,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
});
