import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, parseISODate, toISODate } from '@/lib/dates';

export interface DateFieldProps {
  label: string;
  /** YYYY-MM-DD, or '' when unset. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  /** Show a Clear action so optional dates can be unset. */
  clearable?: boolean;
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  clearable,
}: DateFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const dateValue = value ? parseISODate(value) : new Date();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.inputRow}>
        <Pressable
          onPress={() => setOpen(true)}
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: error ? theme.danger : theme.border,
            },
          ]}>
          <Text style={{ color: value ? theme.text : theme.textSecondary, fontSize: 16 }}>
            {value ? formatDate(value) : placeholder}
          </Text>
        </Pressable>
        {clearable && value ? (
          <Text
            onPress={() => onChange('')}
            style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '600' }}>
            Clear
          </Text>
        ) : null}
      </View>
      {open ? (
        Platform.OS === 'ios' ? (
          <View style={styles.iosPicker}>
            <DateTimePicker
              value={dateValue}
              mode="date"
              display="spinner"
              onChange={(_, d) => {
                if (d) onChange(toISODate(d));
              }}
            />
            <Button title="Done" variant="secondary" compact onPress={() => setOpen(false)} />
          </View>
        ) : (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="default"
            onChange={(event, d) => {
              setOpen(false);
              if (event.type === 'set' && d) onChange(toISODate(d));
            }}
          />
        )
      ) : null}
      {error ? <Text style={{ color: theme.danger, fontSize: 13 }}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  iosPicker: {
    gap: 6,
  },
});
