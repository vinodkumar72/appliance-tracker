import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { findFreePlan } from '@/lib/billing';
import { Button, ChipPicker, EmptyState, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sendInvite } from '@/lib/invite';
import { can } from '@/lib/permissions';
import { useAppStore, useSessionInfo } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { syncNow } from '@/lib/sync';

export default function OrgFormScreen() {
  const { id, requestId, company, owner, email, planId: requestedPlanId } = useLocalSearchParams<{
    id?: string;
    requestId?: string;
    company?: string;
    owner?: string;
    email?: string;
    planId?: string;
  }>();
  const theme = useTheme();
  const router = useRouter();
  const organizations = useAppStore((s) => s.organizations);
  const plans = useAppStore((s) => s.plans);
  const createOrganization = useAppStore((s) => s.createOrganization);
  const updateOrganization = useAppStore((s) => s.updateOrganization);
  const setSubscription = useAppStore((s) => s.setSubscription);
  const { role, isPlatformAdmin } = useSessionInfo();

  const existing = id ? organizations.find((o) => o.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? company ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [orgPhone, setOrgPhone] = useState(existing?.phone ?? '');
  const [ownerName, setOwnerName] = useState(owner ?? '');
  const [ownerEmail, setOwnerEmail] = useState(email ?? '');
  const [errors, setErrors] = useState<{ name?: string; ownerName?: string; ownerEmail?: string }>(
    {},
  );
  const [inviting, setInviting] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');
  // The plan the prospect asked for on the request-invite form wins as the
  // default; otherwise start them on the free tier.
  const [planId, setPlanId] = useState(
    (requestedPlanId && plans.some((p) => p.id === requestedPlanId) ? requestedPlanId : null) ??
      findFreePlan(plans)?.id ??
      plans[0]?.id ??
      '',
  );
  const [planMode, setPlanMode] = useState<'trial' | 'active'>('trial');

  const selectedPlan = plans.find((p) => p.id === planId);
  const isPaidPlan = !!selectedPlan && selectedPlan.yearlyPrice > 0;
  const trialAvailable = isPaidPlan && selectedPlan.trialDays > 0;
  const effectiveMode: 'trial' | 'active' =
    !isPaidPlan || !trialAvailable ? 'active' : planMode;

  // Onboarding new companies is the platform owner's job; renaming needs
  // manageOrg within the company (or the platform owner).
  const allowed = existing ? can(role, 'manageOrg') || isPlatformAdmin : isPlatformAdmin;
  if (!allowed) {
    return (
      <Screen>
        <EmptyState
          emoji="🔒"
          title="No permission"
          message={
            existing
              ? 'Only the company owner or the platform owner can rename a company.'
              : 'Only the platform owner can onboard new companies.'
          }
        />
      </Screen>
    );
  }

  const save = async () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Company name is required.';
    if (!existing) {
      if (!ownerName.trim()) nextErrors.ownerName = "The company owner's name is required.";
      if (ownerEmail.trim() && !/^\S+@\S+\.\S+$/.test(ownerEmail.trim())) {
        nextErrors.ownerEmail = 'Enter a valid email address.';
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (existing) {
      updateOrganization(existing.id, {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: orgPhone.trim() || undefined,
      });
      router.back();
      return;
    }

    const orgId = createOrganization(name, ownerName, ownerEmail);
    if (selectedPlan) {
      setSubscription(orgId, selectedPlan.id, effectiveMode);
    }
    // Mark the matching onboarding request handled — by id when onboarding
    // from the inbox, otherwise by the owner's email (covers companies
    // onboarded via "+ Onboard company" while their request sat pending).
    const markRequest = requestId
      ? supabase.from('onboarding_requests').update({ status: 'onboarded' }).eq('id', requestId)
      : supabase
          .from('onboarding_requests')
          .update({ status: 'onboarded' })
          .eq('email', ownerEmail.trim())
          .eq('status', 'pending');
    void markRequest.then(({ error }) => {
      // Fire-and-forget, but never silently: a failure here is how requests
      // get stuck in "pending" forever.
      if (error) console.warn(`Could not mark onboarding request handled: ${error.message}`);
    });
    const planNote = selectedPlan
      ? ` Plan: ${selectedPlan.name}${
          selectedPlan.yearlyPrice === 0
            ? ''
            : effectiveMode === 'trial'
              ? ` (${selectedPlan.trialDays}-day trial)`
              : ' (active, 1 year)'
        }.`
      : '';
    if (ownerEmail.trim()) {
      setInviting(true);
      // The invitation must NOT go out before the company, its owner record,
      // and the membership are safely on the server — otherwise the owner can
      // sign in before their membership exists, their login binds to a fresh
      // disconnected user record, and every sync of theirs fails with
      // permission errors. Sync first; invite only on success.
      const syncResult = await syncNow();
      if (!syncResult.ok) {
        setInviting(false);
        setDoneMessage(
          `${name.trim()} was created locally, but uploading it failed (${syncResult.error}). ` +
            `The invitation was NOT sent — fix the sync (see Company tab), press Sync now, ` +
            `then re-send the invite from the member list.`,
        );
        return;
      }
      const inviteError = await sendInvite(ownerEmail, orgId);
      setInviting(false);
      setDoneMessage(
        inviteError
          ? `${name.trim()} was onboarded, but the invitation email to ${ownerName.trim()} could not be sent (${inviteError}). They can still sign up themselves using ${ownerEmail.trim()}.${planNote}`
          : `${name.trim()} was onboarded and an invitation email was sent to ${ownerName.trim()} (${ownerEmail.trim()}). Once they accept, they can run their company.${planNote}`,
      );
      return;
    }
    router.back();
  };

  if (doneMessage) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Company onboarded' }} />
        <EmptyState emoji="📧" title="Company onboarded" message={doneMessage}>
          <Button title="Close" onPress={() => router.back()} />
        </EmptyState>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit company' : 'Onboard company' }} />
      <FormField
        label="Company name *"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Acme Property Management"
        error={errors.name}
      />
      {existing ? (
        <>
          <FormField
            label="Company address"
            value={address}
            onChangeText={setAddress}
            placeholder="Street, city, state, ZIP"
            multiline
          />
          <FormField
            label="Company phone"
            value={orgPhone}
            onChangeText={setOrgPhone}
            placeholder="Main office number"
            keyboardType="phone-pad"
          />
        </>
      ) : null}
      {!existing ? (
        <>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
            Every company needs its first Owner — they'll manage the company's members and
            properties from there.
          </Text>
          <FormField
            label="Company owner's name *"
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Who runs this company?"
            error={errors.ownerName}
          />
          <FormField
            label="Company owner's email"
            value={ownerEmail}
            onChangeText={setOwnerEmail}
            placeholder="owner@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.ownerEmail}
          />
          {plans.length > 0 ? (
            <>
              <ChipPicker
                label="Starting plan"
                value={planId}
                onChange={setPlanId}
                options={plans.map((p) => ({
                  value: p.id,
                  label: `${p.name} — ${p.yearlyPrice === 0 ? 'free' : `$${p.yearlyPrice}/yr`}`,
                }))}
              />
              {selectedPlan ? (
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  {selectedPlan.maxUnits != null
                    ? `Up to ${selectedPlan.maxUnits} units.`
                    : 'Unlimited units.'}
                  {selectedPlan.maxAppliancesPerProperty != null
                    ? ` Up to ${selectedPlan.maxAppliancesPerProperty} appliances per unit.`
                    : ''}
                  {trialAvailable ? ` ${selectedPlan.trialDays}-day trial available.` : ''}
                </Text>
              ) : null}
              {trialAvailable ? (
                <ChipPicker
                  label="Billing"
                  value={planMode}
                  onChange={setPlanMode}
                  options={[
                    { value: 'trial', label: `Start ${selectedPlan!.trialDays}-day trial` },
                    { value: 'active', label: `Activate — 1 year ($${selectedPlan!.yearlyPrice})` },
                  ]}
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
      <View style={{ gap: Spacing.two }}>
        <Button
          title={inviting ? 'Sending invitation…' : existing ? 'Save' : 'Onboard company'}
          onPress={inviting ? () => {} : save}
        />
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
