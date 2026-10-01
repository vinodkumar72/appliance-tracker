import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Button, ChipPicker, EmptyState, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isValidISODate, today } from '@/lib/dates';
import { can } from '@/lib/permissions';
import { useAppStore, useSessionInfo } from '@/lib/store';

const REASONS = [
  { value: 'failed', label: 'Failed' },
  { value: 'end-of-life', label: 'End of life' },
  { value: 'upgrade', label: 'Upgrade' },
  { value: 'other', label: 'Other' },
] as const;


/**
 * Replace or remove an appliance: writes the closing history entry, retires
 * the record (history preserved, schedules silenced), and — for replacements —
 * hands off to the add-appliance form pre-filled with the same location.
 */
export default function RetireApplianceScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const theme = useTheme();
  const router = useRouter();
  const appliances = useAppStore((s) => s.appliances);
  const addLog = useAppStore((s) => s.addLog);
  const retireAppliance = useAppStore((s) => s.retireAppliance);
  const { role } = useSessionInfo();

  const replacing = mode !== 'removed';
  const appliance = appliances.find((a) => a.id === id);

  const [date, setDate] = useState(today());
  const [reason, setReason] = useState<(typeof REASONS)[number]['value']>('failed');
  const [cost, setCost] = useState('');
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [dateError, setDateError] = useState('');

  if (!can(role, 'editProperties')) {
    return (
      <Screen>
        <EmptyState emoji="🔒" title="No permission" message="Your role can't edit appliances." />
      </Screen>
    );
  }
  if (!appliance) {
    return (
      <Screen>
        <EmptyState emoji="🤔" title="Appliance not found" message="It may have been deleted." />
      </Screen>
    );
  }

  const reasonLabel = REASONS.find((r) => r.value === reason)!.label;

  const confirm = () => {
    if (!isValidISODate(date)) {
      setDateError('Use YYYY-MM-DD.');
      return;
    }
    const costNumber = cost.trim() ? Number(cost.replace(/[$,]/g, '')) : undefined;
    addLog({
      applianceId: appliance.id,
      date,
      type: 'replacement',
      description:
        `${replacing ? 'Replaced' : 'Removed'} — ${reasonLabel.toLowerCase()}` +
        (notes.trim() ? `. ${notes.trim()}` : ''),
      cost: costNumber !== undefined && !Number.isNaN(costNumber) ? costNumber : undefined,
      vendor: vendor.trim() || undefined,
    });
    retireAppliance(appliance.id, {
      status: replacing ? 'replaced' : 'removed',
      retiredAt: date,
      reason: reasonLabel,
    });
    if (replacing) {
      // Hand off to the add form in the same location; it links old → new.
      router.replace(
        (`/appliance-form?propertyId=${appliance.propertyId}` +
          (appliance.unitId ? `&unitId=${appliance.unitId}` : '') +
          `&replaces=${appliance.id}`) as never,
      );
    } else {
      router.back();
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: replacing ? 'Replace appliance' : 'Remove appliance' }} />
      <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 21 }}>
        "{appliance.name}" and its full maintenance history will be preserved — the record is
        marked {replacing ? 'replaced' : 'removed'}, its reminders stop, and it moves out of the
        main lists.{replacing ? " You'll add the new appliance next." : ''}
      </Text>
      <DateField label={`${replacing ? 'Replacement' : 'Removal'} date *`} value={date} onChange={setDate} error={dateError} />
      <ChipPicker label="Reason" options={[...REASONS]} value={reason} onChange={setReason} />
      <FormField
        label={replacing ? 'Cost of replacement work ($)' : 'Removal cost ($)'}
        value={cost}
        onChangeText={setCost}
        placeholder="Optional — logged to history"
        keyboardType="decimal-pad"
      />
      <FormField
        label="Vendor / who did the work"
        value={vendor}
        onChangeText={setVendor}
        placeholder="Optional"
      />
      <FormField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional"
        multiline
      />
      <View style={{ gap: Spacing.two }}>
        <Button
          title={replacing ? 'Retire & add the new appliance' : 'Remove appliance'}
          onPress={confirm}
        />
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
