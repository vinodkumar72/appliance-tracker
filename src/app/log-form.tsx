import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Button, ChipPicker, EmptyState, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { isValidISODate, today } from '@/lib/dates';
import { can } from '@/lib/permissions';
import { useAppStore, useSessionInfo } from '@/lib/store';
import type { LogType } from '@/lib/types';

const LOG_TYPES: { value: LogType; label: string }[] = [
  { value: 'repair', label: '🔧 Repair' },
  { value: 'maintenance', label: '🧰 Maintenance' },
  { value: 'inspection', label: '🔍 Inspection' },
  { value: 'replacement', label: '♻️ Part replaced' },
];

export default function LogFormScreen() {
  const { applianceId } = useLocalSearchParams<{ applianceId: string }>();
  const router = useRouter();
  const addLog = useAppStore((s) => s.addLog);

  const [date, setDate] = useState(today());
  const [type, setType] = useState<LogType>('repair');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [vendor, setVendor] = useState('');
  const [errors, setErrors] = useState<{ date?: string; description?: string; cost?: string }>({});
  const { role } = useSessionInfo();

  if (!can(role, 'logMaintenance')) {
    return (
      <Screen>
        <EmptyState emoji="🔒" title="No permission" message="Your role can't log maintenance." />
      </Screen>
    );
  }

  const save = () => {
    const nextErrors: typeof errors = {};
    if (!isValidISODate(date)) nextErrors.date = 'Use YYYY-MM-DD.';
    if (!description.trim()) nextErrors.description = 'Description is required.';
    const costNumber = cost.trim() ? Number(cost.replace(/[$,]/g, '')) : undefined;
    if (costNumber !== undefined && (Number.isNaN(costNumber) || costNumber < 0)) {
      nextErrors.cost = 'Enter a valid amount.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !applianceId) return;

    addLog({
      applianceId,
      date,
      type,
      description: description.trim(),
      cost: costNumber,
      vendor: vendor.trim() || undefined,
    });
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Log repair / maintenance' }} />
      <ChipPicker label="Type" value={type} onChange={setType} options={LOG_TYPES} />
      <DateField label="Date *" value={date} onChange={setDate} error={errors.date} />
      <FormField
        label="Description *"
        value={description}
        onChangeText={setDescription}
        placeholder="What was done?"
        multiline
        error={errors.description}
      />
      <FormField
        label="Cost ($)"
        value={cost}
        onChangeText={setCost}
        placeholder="0.00"
        keyboardType="decimal-pad"
        error={errors.cost}
      />
      <FormField label="Vendor" value={vendor} onChangeText={setVendor} placeholder="Who did the work?" />
      <View style={{ gap: Spacing.two }}>
        <Button title="Save log entry" onPress={save} />
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
