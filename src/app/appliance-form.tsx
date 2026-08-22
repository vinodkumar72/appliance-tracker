import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Button, ChipPicker, EmptyState, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isValidISODate } from '@/lib/dates';
import { APPLIANCE_TYPES, APPLIANCE_TYPE_ORDER } from '@/lib/defaults';
import { can } from '@/lib/permissions';
import { useAppStore, useSessionInfo } from '@/lib/store';
import type { ApplianceType } from '@/lib/types';

export default function ApplianceFormScreen() {
  const { id, propertyId, unitId: unitIdParam } = useLocalSearchParams<{
    id?: string;
    propertyId?: string;
    unitId?: string;
  }>();
  const theme = useTheme();
  const router = useRouter();
  const appliances = useAppStore((s) => s.appliances);
  const units = useAppStore((s) => s.units);
  const addAppliance = useAppStore((s) => s.addAppliance);
  const updateAppliance = useAppStore((s) => s.updateAppliance);
  const { role } = useSessionInfo();

  const existing = id ? appliances.find((a) => a.id === id) : undefined;
  const targetPropertyId = existing?.propertyId ?? propertyId;
  const propertyUnits = units.filter((u) => u.propertyId === targetPropertyId);

  const [name, setName] = useState(existing?.name ?? '');
  const [unitId, setUnitId] = useState(existing?.unitId ?? unitIdParam ?? '');
  const [type, setType] = useState<ApplianceType>(existing?.type ?? 'refrigerator');
  const [brand, setBrand] = useState(existing?.brand ?? '');
  const [model, setModel] = useState(existing?.model ?? '');
  const [serialNumber, setSerialNumber] = useState(existing?.serialNumber ?? '');
  const [purchaseDate, setPurchaseDate] = useState(existing?.purchaseDate ?? '');
  const [warrantyExpiry, setWarrantyExpiry] = useState(existing?.warrantyExpiry ?? '');
  const [warrantyProvider, setWarrantyProvider] = useState(existing?.warrantyProvider ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [withDefaults, setWithDefaults] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; purchaseDate?: string; warrantyExpiry?: string }>({});

  if (!can(role, 'editProperties')) {
    return (
      <Screen>
        <EmptyState emoji="🔒" title="No permission" message="Your role can't edit appliances." />
      </Screen>
    );
  }

  if (!targetPropertyId) {
    router.back();
    return null;
  }

  const defaultsCount = APPLIANCE_TYPES[type].defaultSchedules.length;

  const save = () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Name is required.';
    if (purchaseDate && !isValidISODate(purchaseDate)) nextErrors.purchaseDate = 'Use YYYY-MM-DD.';
    if (warrantyExpiry && !isValidISODate(warrantyExpiry)) nextErrors.warrantyExpiry = 'Use YYYY-MM-DD.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const data = {
      propertyId: targetPropertyId,
      unitId: unitId || undefined,
      name: name.trim(),
      type,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      purchaseDate: purchaseDate || undefined,
      warrantyExpiry: warrantyExpiry || undefined,
      warrantyProvider: warrantyProvider.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    if (existing) {
      updateAppliance(existing.id, data);
    } else {
      addAppliance(data, withDefaults);
    }
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit appliance' : 'Add appliance' }} />
      <FormField
        label="Name *"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Kitchen refrigerator"
        error={errors.name}
      />
      <ChipPicker
        label="Type"
        value={type}
        onChange={setType}
        options={APPLIANCE_TYPE_ORDER.map((t) => ({
          value: t,
          label: `${APPLIANCE_TYPES[t].emoji} ${APPLIANCE_TYPES[t].label}`,
        }))}
      />
      {propertyUnits.length > 0 ? (
        <ChipPicker
          label="Location"
          value={unitId}
          onChange={setUnitId}
          options={[
            { value: '', label: '🏢 Building / common' },
            ...propertyUnits.map((u) => ({ value: u.id, label: `🚪 ${u.name}` })),
          ]}
        />
      ) : null}
      <FormField label="Brand" value={brand} onChangeText={setBrand} placeholder="e.g. Whirlpool" />
      <FormField label="Model" value={model} onChangeText={setModel} placeholder="Model number" />
      <FormField
        label="Serial number"
        value={serialNumber}
        onChangeText={setSerialNumber}
        placeholder="Serial number"
      />
      <DateField
        label="Purchase / install date"
        value={purchaseDate}
        onChange={setPurchaseDate}
        clearable
        error={errors.purchaseDate}
      />
      <DateField
        label="Warranty expiry"
        value={warrantyExpiry}
        onChange={setWarrantyExpiry}
        clearable
        error={errors.warrantyExpiry}
      />
      <FormField
        label="Warranty provider"
        value={warrantyProvider}
        onChangeText={setWarrantyProvider}
        placeholder="e.g. Manufacturer 1-year"
      />
      <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Filter size, quirks…" multiline />

      {!existing && defaultsCount > 0 ? (
        <View style={styles.switchRow}>
          <Switch value={withDefaults} onValueChange={setWithDefaults} />
          <Text style={{ color: theme.text, flex: 1, fontSize: 14 }}>
            Add {defaultsCount} recommended maintenance schedule{defaultsCount === 1 ? '' : 's'} for
            this appliance type
          </Text>
        </View>
      ) : null}

      <View style={{ gap: Spacing.two }}>
        <Button title={existing ? 'Save changes' : 'Add appliance'} onPress={save} />
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
