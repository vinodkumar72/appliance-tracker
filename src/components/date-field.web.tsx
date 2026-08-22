import { StyleSheet, Text, View } from 'react-native';
import { unstable_createElement } from 'react-native-web';

import { useTheme } from '@/hooks/use-theme';
import type { DateFieldProps } from './date-field';

export type { DateFieldProps };

/** Web variant: uses the browser's built-in date input (calendar popup). */
export function DateField({ label, value, onChange, error, clearable }: DateFieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.inputRow}>
        {unstable_createElement('input', {
          type: 'date',
          value: value || '',
          onChange: (e: { target: { value: string } }) => onChange(e.target.value),
          style: [
            styles.input,
            {
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              borderColor: error ? theme.danger : theme.border,
            },
          ],
        })}
        {clearable && value ? (
          <Text
            onPress={() => onChange('')}
            style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '600' }}>
            Clear
          </Text>
        ) : null}
      </View>
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
    borderStyle: 'solid',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'inherit',
  },
});
