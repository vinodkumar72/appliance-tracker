import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, ChipPicker, EmptyState, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysUntil, formatDate, today, yearsSince } from '@/lib/dates';
import { APPLIANCE_TYPES } from '@/lib/defaults';
import { getSchedulesWithDue, useOrgData } from '@/lib/store';

type ReportKind = 'due' | 'inventory' | 'costs' | 'warranty';
type Period = 'ytd' | '12m' | '90d' | 'all';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'ytd', label: 'This year' },
  { value: '12m', label: 'Last 12 months' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

const periodStart = (p: Period): string => {
  const now = new Date();
  if (p === 'ytd') return `${now.getFullYear()}-01-01`;
  const d = new Date(now);
  if (p === '12m') d.setFullYear(d.getFullYear() - 1);
  if (p === '90d') d.setDate(d.getDate() - 90);
  if (p === 'all') return '0000-00-00';
  return d.toISOString().slice(0, 10);
};

const money = (n: number) => `$${n.toFixed(2).replace(/\.00$/, '')}`;

/** Minimal data table: fixed column widths, horizontal scroll on overflow. */
function Table({ columns, rows }: { columns: { label: string; width: number }[]; rows: string[][] }) {
  const theme = useTheme();
  const minWidth = columns.reduce((a, c) => a + c.width, 0) + Spacing.three * 2;
  return (
    <Card style={{ padding: 0 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ minWidth, flex: 1, padding: Spacing.three }}>
          <View style={[styles.tr, { borderBottomColor: theme.border }]}>
            {columns.map((c, i) => (
              <Text key={i} style={[styles.th, { width: c.width, color: theme.text }]}>
                {c.label}
              </Text>
            ))}
          </View>
          {rows.length === 0 ? (
            <Text style={{ color: theme.textSecondary, paddingVertical: 12 }}>
              Nothing to show for the current filters.
            </Text>
          ) : (
            rows.map((r, ri) => (
              <View
                key={ri}
                style={[
                  styles.tr,
                  { borderBottomColor: theme.border },
                  ri === rows.length - 1 && { borderBottomWidth: 0 },
                ]}>
                {r.map((cell, ci) => (
                  <Text key={ci} style={[styles.td, { width: columns[ci].width, color: theme.text }]}>
                    {cell}
                  </Text>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'danger' | 'warning' }) {
  const theme = useTheme();
  const color = tone === 'danger' ? theme.danger : tone === 'warning' ? theme.warning : theme.text;
  return (
    <View style={[styles.stat, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Text style={{ color, fontSize: 20, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Reports for property managers. Web-only; computed from the (role-scoped) local store. */
export default function ReportsScreen() {
  const theme = useTheme();
  const { properties, units, appliances, logs, schedules } = useOrgData();
  const [report, setReport] = useState<ReportKind>('due');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [period, setPeriod] = useState<Period>('ytd');

  const data = useMemo(() => {
    const propName = (id: string) => properties.find((p) => p.id === id)?.name ?? '—';
    const unitName = (id?: string) => (id ? (units.find((u) => u.id === id)?.name ?? '—') : '—');
    const inProperty = (propertyId: string) =>
      propertyFilter === 'all' || propertyId === propertyFilter;

    const active = appliances.filter(
      (a) => (a.status ?? 'active') === 'active' && inProperty(a.propertyId),
    );
    const allInFilter = appliances.filter((a) => inProperty(a.propertyId));

    // --- Maintenance due ---
    const tasks = getSchedulesWithDue({ schedules, appliances, properties, units }).filter((t) =>
      inProperty(t.propertyId),
    );
    const dueRows = tasks.map((t) => [
      t.propertyName,
      t.unitName ?? '—',
      t.applianceName,
      t.title,
      formatDate(t.nextDue),
      t.daysUntilDue < 0
        ? `OVERDUE ${-t.daysUntilDue}d`
        : t.daysUntilDue <= 30
          ? `due in ${t.daysUntilDue}d`
          : 'upcoming',
    ]);

    // --- Inventory ---
    const inventoryRows = allInFilter
      .slice()
      .sort((a, b) => propName(a.propertyId).localeCompare(propName(b.propertyId)))
      .map((a) => {
        const age = a.purchaseDate ? `${yearsSince(a.purchaseDate).toFixed(1)}y` : '—';
        const wd = a.warrantyExpiry ? daysUntil(a.warrantyExpiry) : null;
        return [
          propName(a.propertyId),
          unitName(a.unitId),
          a.name,
          APPLIANCE_TYPES[a.type].label,
          a.brand ?? '—',
          a.model ?? '—',
          a.serialNumber ?? '—',
          age,
          wd === null ? '—' : wd < 0 ? 'expired' : `until ${formatDate(a.warrantyExpiry!)}`,
          a.status ?? 'active',
        ];
      });
    const year = today().slice(0, 4);
    const inventorySummary = {
      total: allInFilter.length,
      active: active.length,
      underWarranty: active.filter((a) => a.warrantyExpiry && daysUntil(a.warrantyExpiry) >= 0).length,
      old: active.filter((a) => a.purchaseDate && yearsSince(a.purchaseDate) >= 10).length,
      replacedThisYear: allInFilter.filter(
        (a) => (a.status ?? 'active') !== 'active' && a.retiredAt?.startsWith(year),
      ).length,
    };

    // --- Costs ---
    const since = periodStart(period);
    const applianceById = new Map(appliances.map((a) => [a.id, a]));
    const costLogs = logs.filter((l) => {
      const a = applianceById.get(l.applianceId);
      return a && inProperty(a.propertyId) && l.date >= since && (l.cost ?? 0) > 0;
    });
    const costTotal = costLogs.reduce((s, l) => s + (l.cost ?? 0), 0);
    const costByType = new Map<string, number>();
    for (const l of costLogs) costByType.set(l.type, (costByType.get(l.type) ?? 0) + (l.cost ?? 0));
    const byProperty = new Map<string, { count: number; total: number }>();
    for (const l of costLogs) {
      const a = applianceById.get(l.applianceId)!;
      const cur = byProperty.get(a.propertyId) ?? { count: 0, total: 0 };
      byProperty.set(a.propertyId, { count: cur.count + 1, total: cur.total + (l.cost ?? 0) });
    }
    const costRows = [...byProperty.entries()]
      .sort((x, y) => y[1].total - x[1].total)
      .map(([pid, v]) => [propName(pid), String(v.count), money(v.total)]);
    const byAppliance = new Map<string, { count: number; total: number }>();
    for (const l of costLogs) {
      const cur = byAppliance.get(l.applianceId) ?? { count: 0, total: 0 };
      byAppliance.set(l.applianceId, { count: cur.count + 1, total: cur.total + (l.cost ?? 0) });
    }
    const topApplianceRows = [...byAppliance.entries()]
      .sort((x, y) => y[1].total - x[1].total)
      .slice(0, 10)
      .map(([aid, v]) => {
        const a = applianceById.get(aid)!;
        return [a.name, propName(a.propertyId), unitName(a.unitId), String(v.count), money(v.total)];
      });

    // --- Warranty ---
    const withWarranty = active
      .filter((a) => a.warrantyExpiry)
      .map((a) => ({ a, days: daysUntil(a.warrantyExpiry!) }))
      .filter((x) => x.days >= 0)
      .sort((x, y) => x.days - y.days);
    const warrantyRows = withWarranty.map(({ a, days }) => [
      propName(a.propertyId),
      unitName(a.unitId),
      a.name,
      formatDate(a.warrantyExpiry!),
      `${days}d`,
      a.warrantyProvider ?? '—',
    ]);
    const warrantySummary = {
      in30: withWarranty.filter((x) => x.days <= 30).length,
      in90: withWarranty.filter((x) => x.days <= 90).length,
      total: withWarranty.length,
    };

    return {
      dueRows,
      overdue: tasks.filter((t) => t.daysUntilDue < 0).length,
      dueSoon: tasks.filter((t) => t.daysUntilDue >= 0 && t.daysUntilDue <= 30).length,
      inventoryRows,
      inventorySummary,
      costRows,
      topApplianceRows,
      costTotal,
      costByType,
      costEvents: costLogs.length,
      warrantyRows,
      warrantySummary,
    };
  }, [report, propertyFilter, period, properties, units, appliances, logs, schedules]);

  if (Platform.OS !== 'web') {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Reports' }} />
        <EmptyState
          emoji="📊"
          title="Reports live on the web"
          message="Open PropsLane in a browser and sign in with this account — reports, printing, and CSV exports are built for the big screen."
        />
      </Screen>
    );
  }

  const COLUMNS: Record<ReportKind, { label: string; width: number }[]> = {
    due: [
      { label: 'Property', width: 130 },
      { label: 'Unit', width: 70 },
      { label: 'Appliance', width: 150 },
      { label: 'Task', width: 170 },
      { label: 'Due', width: 100 },
      { label: 'Status', width: 110 },
    ],
    inventory: [
      { label: 'Property', width: 120 },
      { label: 'Unit', width: 60 },
      { label: 'Appliance', width: 140 },
      { label: 'Type', width: 100 },
      { label: 'Brand', width: 90 },
      { label: 'Model', width: 110 },
      { label: 'Serial #', width: 110 },
      { label: 'Age', width: 55 },
      { label: 'Warranty', width: 120 },
      { label: 'Status', width: 80 },
    ],
    costs: [
      { label: 'Property', width: 200 },
      { label: 'Events', width: 80 },
      { label: 'Total', width: 100 },
    ],
    warranty: [
      { label: 'Property', width: 130 },
      { label: 'Unit', width: 70 },
      { label: 'Appliance', width: 150 },
      { label: 'Expires', width: 100 },
      { label: 'Days left', width: 80 },
      { label: 'Provider', width: 140 },
    ],
  };

  const rowsFor: Record<ReportKind, string[][]> = {
    due: data.dueRows,
    inventory: data.inventoryRows,
    costs: data.costRows,
    warranty: data.warrantyRows,
  };

  const downloadCsv = () => {
    const cols = COLUMNS[report].map((c) => c.label);
    const lines = [cols, ...rowsFor[report]].map((r) => r.map(csvEscape).join(','));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `propslane-${report}-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeCount = appliances.filter((a) => (a.status ?? 'active') === 'active').length;
  const ytdSpend = logs
    .filter((l) => l.date >= `${today().slice(0, 4)}-01-01`)
    .reduce((s, l) => s + (l.cost ?? 0), 0);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Reports' }} />

      {/* Portfolio overview */}
      <View style={styles.statRow}>
        <Stat label="Properties" value={String(properties.length)} />
        <Stat label="Units" value={String(units.length)} />
        <Stat label="Active appliances" value={String(activeCount)} />
        <Stat label="Overdue tasks" value={String(data.overdue)} tone={data.overdue ? 'danger' : undefined} />
        <Stat label="Spend YTD" value={money(ytdSpend)} />
        <Stat
          label="Warranties ≤90d"
          value={String(data.warrantySummary.in90)}
          tone={data.warrantySummary.in90 ? 'warning' : undefined}
        />
      </View>

      <ChipPicker
        label="Report"
        value={report}
        onChange={setReport}
        options={[
          { value: 'due', label: 'Maintenance due' },
          { value: 'inventory', label: 'Appliance inventory' },
          { value: 'costs', label: 'Costs' },
          { value: 'warranty', label: 'Warranty expiration' },
        ]}
      />
      {properties.length > 1 ? (
        <ChipPicker
          label="Property"
          value={propertyFilter}
          onChange={setPropertyFilter}
          options={[
            { value: 'all', label: 'All properties' },
            ...properties.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
      ) : null}
      {report === 'costs' ? (
        <ChipPicker label="Period" value={period} onChange={setPeriod} options={PERIODS} />
      ) : null}

      {/* Per-report summary line */}
      <Text style={{ color: theme.textSecondary, fontSize: 13.5 }}>
        {report === 'due'
          ? `${data.overdue} overdue · ${data.dueSoon} due within 30 days · ${data.dueRows.length} scheduled tasks in view.`
          : report === 'inventory'
            ? `${data.inventorySummary.total} appliances · ${data.inventorySummary.active} active · ${data.inventorySummary.underWarranty} under warranty · ${data.inventorySummary.old} older than 10 years · ${data.inventorySummary.replacedThisYear} replaced this year.`
            : report === 'costs'
              ? `${money(data.costTotal)} across ${data.costEvents} events (${
                  [...data.costByType.entries()].map(([t, v]) => `${t}: ${money(v)}`).join(' · ') || 'no costs'
                }).`
              : `${data.warrantySummary.in30} expire within 30 days · ${data.warrantySummary.in90} within 90 · ${data.warrantySummary.total} active warranties.`}
      </Text>

      <Table columns={COLUMNS[report]} rows={rowsFor[report]} />

      {report === 'costs' && data.topApplianceRows.length > 0 ? (
        <>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>
            Top appliances by cost
          </Text>
          <Table
            columns={[
              { label: 'Appliance', width: 170 },
              { label: 'Property', width: 140 },
              { label: 'Unit', width: 70 },
              { label: 'Events', width: 70 },
              { label: 'Total', width: 90 },
            ]}
            rows={data.topApplianceRows}
          />
        </>
      ) : null}

      <View style={{ flexDirection: 'row', gap: Spacing.two }}>
        <Button title="Download CSV" variant="secondary" compact onPress={downloadCsv} />
        <Button
          title="Print"
          variant="secondary"
          compact
          onPress={() => (typeof window !== 'undefined' ? window.print() : undefined)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  stat: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 110,
    gap: 2,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  th: {
    fontSize: 12.5,
    fontWeight: '700',
    paddingRight: 10,
  },
  td: {
    fontSize: 13,
    paddingRight: 10,
  },
});
