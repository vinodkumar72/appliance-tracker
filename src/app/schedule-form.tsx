import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Button, EmptyState, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { confirmDestructive } from '@/lib/confirm';
import { isValidISODate, today } from '@/lib/dates';
import { can } from '@/lib/permissions';
import { useAppStore, useSessionInfo } from '@/lib/store';

export default function ScheduleFormScreen() {
  const { id, applianceId } = useLocalSearchParams<{ id?: string; applianceId?: string }>();
  const router = useRouter();
  const schedules = useAppStore((s) => s.schedules);
  const addSchedule = useAppStore((s) => s.addSchedule);
  const updateSchedule = useAppStore((s) => s.updateSchedule);
  const deleteSchedule = useAppStore((s) => s.deleteSchedule);

  const existing = id ? schedules.find((s) => s.id === id) : undefined;
  const targetApplianceId = existing?.applianceId ?? applianceId;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [intervalMonths, setIntervalMonths] = useState(
    existing ? String(existing.intervalMonths) : '6',
  );
  const [lastDone, setLastDone] = useState(existing?.lastDone ?? today());
  const [errors, setErrors] = useState<{ title?: string; interval?: string; lastDone?: string }>({});
  const { role } = useSessionInfo();

  if (!can(role, 'editProperties')) {
    return (
      <Screen>
        <EmptyState emoji="🔒" title="No permission" message="Your role can't edit schedules." />
      </Screen>
    );
  }

  const save = () => {
    const nextErrors: typeof errors = {};
    if (!title.trim()) nextErrors.title = 'Title is required.';
    const interval = Number(intervalMonths);
    if (!Number.isInteger(interval) || interval < 1 || interval > 120) {
      nextErrors.interval = 'Enter a whole number of months (1–120).';
    }
    if (!isValidISODate(lastDone)) nextErrors.lastDone = 'Use YYYY-MM-DD.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !targetApplianceId) return;

    if (existing) {
      updateSchedule(existing.id, { title: title.trim(), intervalMonths: interval, lastDone });
    } else {
      addSchedule({ applianceId: targetApplianceId, title: title.trim(), intervalMonths: interval, lastDone });
    }
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit schedule' : 'Add maintenance schedule' }} />
      <FormField
        label="Task *"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Replace air filter"
        error={errors.title}
      />
      <FormField
        label="Repeat every (months) *"
        value={intervalMonths}
        onChangeText={setIntervalMonths}
        placeholder="6"
        keyboardType="number-pad"
        error={errors.interval}
      />
      <DateField label="Last done *" value={lastDone} onChange={setLastDone} error={errors.lastDone} />
      <View style={{ gap: Spacing.two }}>
        <Button title={existing ? 'Save changes' : 'Add schedule'} onPress={save} />
        {existing ? (
          <Button
            title="Delete schedule"
            variant="danger"
            onPress={() =>
              confirmDestructive('Delete schedule?', existing.title, () => {
                deleteSchedule(existing.id);
                router.back();
              })
            }
          />
        ) : null}
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
