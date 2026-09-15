import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

interface PublicPlan {
  id: string;
  name: string;
  emoji: string | null;
  yearly_price: number;
  monthly_price: number | null;
  most_popular: boolean | null;
  max_units: number | null;
  min_units: number | null;
  max_appliances_per_property: number | null;
  trial_days: number;
}

const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);
const perUnit = (n: number) => `$${n.toFixed(2)}`;

/**
 * Plan-comparison table driven by the live plan catalog (the `plans` table,
 * publicly readable). Not currently shown on /pricing — the Stripe-hosted
 * pricing table took its place there — but kept for reuse (e.g. an in-app
 * upgrade screen or a "compare limits" section).
 */
export function PlanTable() {
  const theme = useTheme();
  const [plans, setPlans] = useState<PublicPlan[] | null>(null);

  useEffect(() => {
    supabase
      .from('plans')
      .select(
        'id,name,emoji,yearly_price,monthly_price,most_popular,max_units,min_units,max_appliances_per_property,trial_days',
      )
      .order('yearly_price', { ascending: true })
      .then(({ data }) => setPlans((data as PublicPlan[]) ?? []));
  }, []);

  // Column layout (min widths keep the table readable; narrow screens scroll it).
  const col = [170, 120, 130, 150, 170];
  const tableMinWidth = col.reduce((a, b) => a + b, 0) + Spacing.three * 2;

  const headerCell = (text: string, i: number) => (
    <Text key={i} style={[styles.headerCell, { width: col[i], color: theme.text }]}>{text}</Text>
  );

  if (plans === null) {
    return (
      <Card>
        <Text style={{ color: theme.textSecondary }}>Loading plans…</Text>
      </Card>
    );
  }
  if (plans.length === 0) {
    return (
      <Card>
        <Text style={{ color: theme.textSecondary }}>
          Plans are being finalized — request an invite and we'll get you set up.
        </Text>
      </Card>
    );
  }

  return (
    <>
      <Card style={{ padding: 0 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ minWidth: tableMinWidth, flex: 1, padding: Spacing.three }}>
            <View style={[styles.row, { borderBottomColor: theme.border }]}>
              {[
                'Plan Tier',
                'Max Units Covered',
                'Monthly Price (Billed Monthly)',
                'Annual Price (Billed Annually)',
                'Effective Cost Per Unit / Month',
              ].map(headerCell)}
            </View>

            {plans.map((plan, idx) => {
              const yearly = Number(plan.yearly_price);
              const monthly = plan.monthly_price === null ? null : Number(plan.monthly_price);
              const maxUnits = plan.max_units === null ? null : Number(plan.max_units);
              const minUnits = plan.min_units === null ? null : Number(plan.min_units);
              const free = yearly === 0 && (monthly ?? 0) === 0;
              // Unlimited tiers priced "from" a starting size show a "+".
              const plus = maxUnits === null && minUnits !== null ? '+' : '';
              const annualPerMonth = Math.round((yearly / 12) * 100) / 100;
              // Per-unit range: annual billing is the floor, monthly the ceiling.
              const denominator = maxUnits ?? minUnits;
              const unitLow = denominator ? annualPerMonth / denominator : null;
              const unitHigh = denominator && monthly !== null ? monthly / denominator : null;

              const popular = !!plan.most_popular;
              const last = idx === plans.length - 1;
              return (
                <View
                  key={plan.id}
                  style={[
                    styles.row,
                    { borderBottomColor: theme.border },
                    last && { borderBottomWidth: 0 },
                    popular && {
                      backgroundColor: theme.tintSoft,
                      borderRadius: 12,
                      borderBottomWidth: 0,
                    },
                  ]}>
                  <View style={{ width: col[0], paddingRight: Spacing.two }}>
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>
                      {plan.emoji ? `${plan.emoji} ` : ''}
                      {plan.name}
                    </Text>
                    {popular ? (
                      <Text style={{ color: theme.tint, fontSize: 12, fontStyle: 'italic' }}>
                        (Most Popular)
                      </Text>
                    ) : null}
                  </View>

                  <Text style={[styles.cell, { width: col[1], color: theme.text }]}>
                    {maxUnits !== null
                      ? `${maxUnits} Units`
                      : minUnits !== null
                        ? `Unlimited\n(Starts at ${minUnits})`
                        : 'Unlimited'}
                  </Text>

                  <Text style={[styles.cell, { width: col[2], color: theme.text }]}>
                    {free ? (
                      <Text style={styles.strong}>$0</Text>
                    ) : monthly !== null ? (
                      <>
                        <Text style={styles.strong}>{money(monthly)}{plus}</Text> / mo
                      </>
                    ) : (
                      '—'
                    )}
                  </Text>

                  <Text style={[styles.cell, { width: col[3], color: theme.text }]}>
                    {free ? (
                      <Text style={styles.strong}>$0</Text>
                    ) : (
                      <>
                        <Text style={styles.strong}>{money(annualPerMonth)}{plus}</Text> / mo{' '}
                        <Text style={{ color: theme.textSecondary, fontStyle: 'italic' }}>
                          ({money(yearly)}{plus}/yr)
                        </Text>
                      </>
                    )}
                  </Text>

                  <Text style={[styles.cell, { width: col[4], color: theme.text }]}>
                    {free
                      ? '$0'
                      : unitLow !== null
                        ? maxUnits === null
                          ? `${perUnit(unitLow)} / unit (drops at bulk scale)`
                          : unitHigh !== null && unitHigh !== unitLow
                            ? `${perUnit(Math.min(unitLow, unitHigh))} – ${perUnit(Math.max(unitLow, unitHigh))} / unit`
                            : `${perUnit(unitLow)} / unit`
                        : '—'}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </Card>

      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
        A home with no units counts as 1 unit; a 20-unit building counts as 20.
        {plans.some((p) => p.trial_days > 0)
          ? ` Paid tiers include a free trial (${plans
              .filter((p) => p.trial_days > 0)
              .map((p) => `${p.name}: ${p.trial_days} days`)
              .join(', ')}).`
          : ''}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCell: {
    fontSize: 13,
    fontWeight: '700',
    paddingRight: Spacing.two,
  },
  cell: {
    fontSize: 14,
    paddingRight: Spacing.two,
  },
  strong: {
    fontWeight: '700',
  },
});
