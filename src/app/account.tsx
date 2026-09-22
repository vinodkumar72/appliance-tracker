import type { Session } from '@supabase/supabase-js';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Badge, Button, Card, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { signOutClean } from '@/lib/sign-out';
import { useAppStore, usePendingChanges } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { syncNow, toPropertyRow } from '@/lib/sync';

export default function AccountScreen() {
  const theme = useTheme();
  const pendingChanges = usePendingChanges();
  const lastSyncAt = useAppStore((s) => s.lastSyncAt);

  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
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

  const [doctorReport, setDoctorReport] = useState('');
  /**
   * Sync Doctor: inspects the whole permission chain from THIS session's real
   * credentials — identity link, server membership, local-vs-server state —
   * and performs a live insert probe. Produces a copyable report.
   */
  const runDoctor = async () => {
    setBusy(true);
    const L: string[] = [`SYNC DOCTOR — ${new Date().toISOString()}`];
    try {
      const { data: au } = await supabase.auth.getUser();
      L.push(`login: ${au.user?.email ?? 'NOT SIGNED IN'} (auth ${au.user?.id ?? 'n/a'})`);
      if (au.user) {
        const { data: me, error: e1 } = await supabase
          .from('app_users')
          .select('id,email,is_platform_admin')
          .eq('auth_id', au.user.id);
        L.push(`server profile by auth link: ${e1 ? `ERROR ${e1.message}` : JSON.stringify(me)}`);
        const myId = me?.[0]?.id;
        if (myId) {
          const { data: mems, error: e2 } = await supabase
            .from('memberships')
            .select('org_id,role,property_ids,unit_ids')
            .eq('user_id', myId);
          L.push(`server memberships: ${e2 ? `ERROR ${e2.message}` : JSON.stringify(mems)}`);
          const probeOrg = mems?.[0]?.org_id;
          if (probeOrg) {
            const probeId = `doctor-probe-${Date.now()}`;
            const { error: pe } = await supabase
              .from('properties')
              .insert({ id: probeId, org_id: probeOrg, name: 'sync-doctor-probe', address: 'probe' });
            L.push(`LIVE INSERT PROBE into org ${probeOrg}: ${pe ? `FAILED — ${pe.message}` : 'OK'}`);
            if (!pe) await supabase.from('properties').delete().eq('id', probeId);

            // Byte-exact replica of what the sync engine pushes: the full row
            // of the first pending property, via the same upsert call. If it
            // succeeds, the property is genuinely uploaded (the doctor heals).
            const stNow = useAppStore.getState();
            const pendingProp = stNow.properties.find(
              (p) => !stNow.lastSyncAt || (p.updatedAt && p.updatedAt > stNow.lastSyncAt),
            );
            if (pendingProp) {
              // Update-path autopsy: the row may already exist server-side,
              // making the upsert an UPDATE governed by different policies.
              const { data: existsRows, error: exErr } = await supabase
                .from('properties')
                .select('id,updated_at')
                .eq('id', pendingProp.id);
              L.push(
                `row exists on server: ${exErr ? `ERROR ${exErr.message}` : JSON.stringify(existsRows)}`,
              );
              const { data: canEdit, error: ceErr } = await supabase.rpc('can_edit_property', {
                p_property_id: pendingProp.id,
              });
              L.push(
                `can_edit_property(${pendingProp.id}) as me: ${ceErr ? `ERROR ${ceErr.message}` : String(canEdit)}`,
              );
              const { data: updRows, error: updErr } = await supabase
                .from('properties')
                .update({ notes: pendingProp.notes ?? '' })
                .eq('id', pendingProp.id)
                .select('id');
              L.push(
                `plain UPDATE of the row: ${
                  updErr ? `FAILED — ${updErr.message}` : `OK (${updRows?.length ?? 0} rows touched)`
                }`,
              );
              // (A) FULL row, plain INSERT, fresh id — isolates the column payload.
              const fullRow = { ...toPropertyRow(pendingProp), id: `doctor-full-${Date.now()}` };
              const { error: fe } = await supabase.from('properties').insert(fullRow);
              L.push(`full-row plain INSERT (fresh id): ${fe ? `FAILED — ${fe.message}` : 'OK'}`);
              if (!fe) await supabase.from('properties').delete().eq('id', String(fullRow.id));

              // (B) MINIMAL row, UPSERT, fresh id — isolates the upsert mechanism.
              const miniId = `doctor-mini-${Date.now()}`;
              const { error: me2 } = await supabase
                .from('properties')
                .upsert([{ id: miniId, org_id: probeOrg, name: 'mini', address: 'mini' }], {
                  onConflict: 'id',
                });
              L.push(`minimal-row UPSERT (fresh id): ${me2 ? `FAILED — ${me2.message}` : 'OK'}`);
              if (!me2) await supabase.from('properties').delete().eq('id', miniId);

              const { error: ue } = await supabase
                .from('properties')
                .upsert([toPropertyRow(pendingProp)], { onConflict: 'id' });
              L.push(
                `EXACT SYNC-STYLE UPSERT of "${pendingProp.name}" (org ${pendingProp.orgId}): ` +
                  (ue ? `FAILED — ${ue.message}` : 'OK — actually uploaded'),
              );
            } else {
              L.push('EXACT SYNC-STYLE UPSERT skipped: no pending property.');
            }
          } else {
            L.push('LIVE INSERT PROBE skipped: no server membership.');
          }
        }
      }
      const st = useAppStore.getState();
      L.push(`local session: user=${st.session.currentUserId ?? 'null'} org=${st.session.currentOrgId ?? 'null'}`);
      L.push(`local lastAuthUserId: ${st.lastAuthUserId ?? 'null'} | demo: ${st.demoMode} | sample: ${st.sampleDataLoaded}`);
      L.push(`local orgs: ${JSON.stringify(st.organizations.map((o) => ({ id: o.id, name: o.name })))}`);
      L.push(`local properties: ${JSON.stringify(st.properties.map((p) => ({ id: p.id, name: p.name, org: p.orgId })))}`);
      L.push(`local users: ${JSON.stringify(st.users.map((u) => ({ id: u.id, email: u.email, admin: !!u.isPlatformAdmin })))}`);
      L.push(`local memberships: ${JSON.stringify(st.memberships.map((m) => ({ user: m.userId, org: m.orgId, role: m.role })))}`);
      L.push(`lastSyncAt: ${st.lastSyncAt ?? 'never'}`);
    } catch (e) {
      L.push(`DOCTOR CRASHED: ${e instanceof Error ? e.message : String(e)}`);
    }
    setDoctorReport(L.join('\n'));
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

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setMessage(error ? `Could not update password: ${error.message}` : 'Password updated.');
    setNewPassword('');
    setBusy(false);
  };

  const signOut = async () => {
    const result = await signOutClean();
    if (result) setMessage(result);
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
          <Button
            title={busy ? 'Working…' : 'Run sync doctor'}
            variant="secondary"
            onPress={busy ? () => {} : runDoctor}
          />
          {doctorReport ? (
            <Card>
              <Text
                selectable
                style={{
                  color: theme.text,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  lineHeight: 18,
                }}>
                {doctorReport}
              </Text>
            </Card>
          ) : null}
          <Card>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              Set or change your password (invited users: set one here so you can sign in on other
              devices).
            </Text>
            <FormField
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 6 characters"
              secureTextEntry
            />
            <Button
              title={busy ? 'Working…' : 'Update password'}
              variant="secondary"
              compact
              onPress={busy ? () => {} : updatePassword}
            />
          </Card>
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
