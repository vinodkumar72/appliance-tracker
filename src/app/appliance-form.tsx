import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Button, ChipPicker, EmptyState, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isValidISODate } from '@/lib/dates';
import { APPLIANCE_TYPES, APPLIANCE_TYPE_ORDER } from '@/lib/defaults';
import NetInfo from '@react-native-community/netinfo';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { useApplianceLimit } from '@/lib/billing';
import { parseLabelText } from '@/lib/label-parser';
import { OFFLINE_OCR_AVAILABLE, runOfflineOcr } from '@/lib/ocr';
import { can } from '@/lib/permissions';
import { useAppStore, useSessionInfo } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { ApplianceType } from '@/lib/types';

interface LabelScanResult {
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  applianceType: string | null;
  suggestedName: string | null;
}

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
  const [purchasePrice, setPurchasePrice] = useState(
    existing?.purchasePrice != null ? String(existing.purchasePrice) : '',
  );
  const [warrantyExpiry, setWarrantyExpiry] = useState(existing?.warrantyExpiry ?? '');
  const [warrantyProvider, setWarrantyProvider] = useState(existing?.warrantyProvider ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [withDefaults, setWithDefaults] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [scanTone, setScanTone] = useState<'success' | 'progress' | 'warning'>('progress');
  // Limit check for the bucket (unit or building/common) currently selected.
  const applianceLimit = useApplianceLimit(targetPropertyId, {
    unitId: unitId || null,
    excludeApplianceId: existing?.id,
  });
  const bucketBlocked =
    !!applianceLimit?.atLimit && (!existing || (existing.unitId ?? null) !== (unitId || null));
  const bucketLabel = unitId
    ? (propertyUnits.find((u) => u.id === unitId)?.name ?? 'this unit')
    : propertyUnits.length > 0
      ? 'the building/common area'
      : 'this property';
  const showScan = (message: string, tone: 'success' | 'progress' | 'warning') => {
    setScanMessage(message);
    setScanTone(tone);
  };
  const [errors, setErrors] = useState<{
    name?: string;
    purchaseDate?: string;
    purchasePrice?: string;
    warrantyExpiry?: string;
  }>({});

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

  const scanLabel = async () => {
    try {
      setScanMessage('');
      let result: ImagePicker.ImagePickerResult;
      if (Platform.OS === 'web') {
        // Browsers get a file picker (phones' browsers still offer the camera there).
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.6,
          base64: true,
        });
      } else {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          showScan('Camera permission is needed to scan labels.', 'warning');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true });
      }
      const asset = result.canceled ? undefined : result.assets?.[0];
      if (!asset?.base64) return;

      setScanning(true);
      const mediaType = asset.mimeType ?? 'image/jpeg';

      const applyScan = (scan: LabelScanResult, how: string): boolean => {
        if (scan.brand) setBrand(scan.brand);
        if (scan.model) setModel(scan.model);
        if (scan.serialNumber) setSerialNumber(scan.serialNumber);
        if (scan.applianceType && scan.applianceType in APPLIANCE_TYPES) {
          setType(scan.applianceType as ApplianceType);
        }
        if (scan.suggestedName && !name.trim()) setName(scan.suggestedName);
        const found = [
          scan.brand && 'brand',
          scan.model && 'model',
          scan.serialNumber && 'serial number',
        ]
          .filter(Boolean)
          .join(', ');
        if (found) {
          showScan(
            `Label scanned ${how} — filled in ${found}. Double-check against the label.`,
            'success',
          );
        }
        return !!found;
      };

      const isOnline =
        Platform.OS === 'web'
          ? typeof navigator === 'undefined' || navigator.onLine
          : !!(await NetInfo.fetch()).isConnected;

      // 1) Online: AI vision — by far the most accurate reader for messy labels.
      let cloudFailure = '';
      if (isOnline) {
        showScan('Reading label with AI…', 'progress');
        const { data, error } = await supabase.functions.invoke('scan-label', {
          body: { imageBase64: asset.base64, mediaType },
        });
        if (!error) {
          const scan = data as LabelScanResult & { error?: string };
          if (!scan.error) {
            if (!applyScan(scan, 'with AI')) {
              showScan(
                "Couldn't read any details from that photo — try a closer, well-lit shot of the label.",
                'warning',
              );
            }
            return;
          }
          cloudFailure = scan.error;
        } else {
          cloudFailure = error.message;
          if (error instanceof FunctionsHttpError) {
            const status = error.context.status;
            try {
              const body = (await error.context.json()) as {
                error?: string;
                message?: string;
                code?: string | number;
              };
              cloudFailure =
                body?.error ?? body?.message ?? `HTTP ${status}${body?.code ? ` (${body.code})` : ''}`;
            } catch {
              cloudFailure = `HTTP ${status}`;
            }
          }
        }
        // Cloud scan unavailable — fall through to the on-device reader.
      }

      // 2) Offline (or cloud failed): on-device OCR where available.
      if (OFFLINE_OCR_AVAILABLE) {
        showScan(
          isOnline ? 'AI scan unavailable — reading on this device…' : 'Offline — reading label on this device…',
          'progress',
        );
        const ocrText = await runOfflineOcr(asset.base64, mediaType);
        const parsed = ocrText ? parseLabelText(ocrText) : {};
        const found = applyScan(
          {
            brand: parsed.brand ?? null,
            model: parsed.model ?? null,
            serialNumber: parsed.serialNumber ?? null,
            applianceType: parsed.applianceType ?? null,
            suggestedName: parsed.suggestedName ?? null,
          },
          'on this device',
        );
        if (!found) {
          showScan(
            "Couldn't read any details from that photo — try a closer, straight-on, well-lit shot of the label, or enter the details manually.",
            'warning',
          );
        }
      } else {
        showScan(
          isOnline
            ? `The AI scan failed: ${cloudFailure || 'unknown error'}. Enter the details manually for now.`
            : 'Scanning on phones needs an internet connection — enter the details manually for now.',
          'warning',
        );
      }
    } catch (e) {
      showScan(`Scan failed: ${e instanceof Error ? e.message : String(e)}`, 'warning');
    } finally {
      setScanning(false);
    }
  };

  const save = () => {
    if (bucketBlocked) return; // the limit banner explains why
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Name is required.';
    if (purchaseDate && !isValidISODate(purchaseDate)) nextErrors.purchaseDate = 'Use YYYY-MM-DD.';
    if (warrantyExpiry && !isValidISODate(warrantyExpiry)) nextErrors.warrantyExpiry = 'Use YYYY-MM-DD.';
    const priceNumber = purchasePrice.trim()
      ? Number(purchasePrice.replace(/[$,]/g, ''))
      : undefined;
    if (priceNumber !== undefined && (Number.isNaN(priceNumber) || priceNumber < 0)) {
      nextErrors.purchasePrice = 'Enter a valid amount.';
    }
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
      purchasePrice: priceNumber,
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
      <Button
        title={scanning ? 'Scanning…' : '📷 Scan appliance label'}
        variant="secondary"
        onPress={scanning ? () => {} : scanLabel}
      />
      {scanMessage ? (
        <View
          style={[
            styles.scanBanner,
            {
              borderColor:
                scanTone === 'success'
                  ? theme.success
                  : scanTone === 'warning'
                    ? theme.warning
                    : theme.border,
              backgroundColor: theme.backgroundElement,
            },
          ]}>
          <Text style={styles.scanBannerIcon}>
            {scanTone === 'success' ? '✅' : scanTone === 'warning' ? '⚠️' : '⏳'}
          </Text>
          <Text
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: '600',
              lineHeight: 21,
              color:
                scanTone === 'success'
                  ? theme.success
                  : scanTone === 'warning'
                    ? theme.warning
                    : theme.textSecondary,
            }}>
            {scanMessage}
          </Text>
        </View>
      ) : null}
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
      {bucketBlocked && applianceLimit ? (
        <View
          style={{
            borderWidth: 1.5,
            borderRadius: 10,
            padding: 12,
            borderColor: theme.warning,
            backgroundColor: theme.backgroundElement,
            gap: 4,
          }}>
          <Text style={{ color: theme.warning, fontSize: 14, fontWeight: '600' }}>
            Appliance limit reached in {bucketLabel} ({applianceLimit.count}/{applianceLimit.max})
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
            The {applianceLimit.planName ?? 'current'} plan allows {applianceLimit.max} appliances
            per unit.{propertyUnits.length > 0 ? ' Pick a different location, or upgrade the plan.' : ' Upgrade the plan to add more.'}
          </Text>
        </View>
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
      <FormField
        label="Purchase price ($)"
        value={purchasePrice}
        onChangeText={setPurchasePrice}
        placeholder="0.00"
        keyboardType="decimal-pad"
        error={errors.purchasePrice}
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
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
  },
  scanBannerIcon: {
    fontSize: 18,
    lineHeight: 21,
  },
});
