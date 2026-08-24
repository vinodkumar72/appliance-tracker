import { daysUntil, formatDate } from './dates';
import { useAppStore } from './store';
import type { Plan, Subscription } from './types';

export interface PlanStatus {
  /** The plan the org is signed up for (null = none assigned). */
  plan: Plan | null;
  status: 'none' | 'free' | 'trial' | 'active' | 'expired';
  /** Property limit currently in force (expired subs fall back to the free tier). */
  effectiveMax: number | null; // null = unlimited
  trialDaysLeft: number | null;
  renewsAt: string | null;
}

/** The most generous free tier, used as the fallback when nothing (or an expired plan) applies. */
export function findFreePlan(plans: Plan[]): Plan | null {
  const free = plans.filter((p) => p.yearlyPrice === 0);
  if (free.length === 0) return null;
  return free.sort(
    (a, b) => (b.maxProperties ?? Infinity) - (a.maxProperties ?? Infinity),
  )[0];
}

export function getPlanStatus(
  plans: Plan[],
  subscriptions: Subscription[],
  orgId: string,
): PlanStatus {
  const freePlan = findFreePlan(plans);
  const freeMax = freePlan ? (freePlan.maxProperties ?? null) : 0;
  const sub = subscriptions.find((s) => s.orgId === orgId) ?? null;
  const plan = sub ? (plans.find((p) => p.id === sub.planId) ?? null) : null;

  if (!sub || !plan) {
    // No subscription: free tier if one exists; fully unlimited if the
    // platform owner hasn't configured any plans at all.
    if (plans.length === 0) {
      return { plan: null, status: 'none', effectiveMax: null, trialDaysLeft: null, renewsAt: null };
    }
    return {
      plan: freePlan,
      status: freePlan ? 'free' : 'none',
      effectiveMax: freePlan ? freeMax : 0,
      trialDaysLeft: null,
      renewsAt: null,
    };
  }

  if (plan.yearlyPrice === 0) {
    return {
      plan,
      status: 'free',
      effectiveMax: plan.maxProperties ?? null,
      trialDaysLeft: null,
      renewsAt: null,
    };
  }

  if (sub.status === 'trial') {
    const left = sub.trialEndsAt ? daysUntil(sub.trialEndsAt) : -1;
    if (left >= 0) {
      return {
        plan,
        status: 'trial',
        effectiveMax: plan.maxProperties ?? null,
        trialDaysLeft: left,
        renewsAt: null,
      };
    }
    return { plan, status: 'expired', effectiveMax: freeMax, trialDaysLeft: null, renewsAt: null };
  }

  const end = sub.currentPeriodEnd ?? null;
  if (end && daysUntil(end) < 0) {
    return { plan, status: 'expired', effectiveMax: freeMax, trialDaysLeft: null, renewsAt: end };
  }
  return {
    plan,
    status: 'active',
    effectiveMax: plan.maxProperties ?? null,
    trialDaysLeft: null,
    renewsAt: end,
  };
}

export interface OrgPlanInfo extends PlanStatus {
  propertyCount: number;
  atLimit: boolean;
}

/** Plan status + usage for an org. Counts ALL org properties, not just those visible to the viewer. */
export function useOrgPlan(orgId: string | null | undefined): OrgPlanInfo | null {
  const plans = useAppStore((s) => s.plans);
  const subscriptions = useAppStore((s) => s.subscriptions);
  const properties = useAppStore((s) => s.properties);
  if (!orgId) return null;
  const status = getPlanStatus(plans, subscriptions, orgId);
  const propertyCount = properties.filter((p) => p.orgId === orgId).length;
  const atLimit = status.effectiveMax !== null && propertyCount >= status.effectiveMax;
  return { ...status, propertyCount, atLimit };
}

export function describePlanStatus(info: PlanStatus): string {
  switch (info.status) {
    case 'none':
      return 'No plans configured';
    case 'free':
      return info.plan?.name ?? 'Free';
    case 'trial':
      return `${info.plan?.name} — trial, ${info.trialDaysLeft} day${info.trialDaysLeft === 1 ? '' : 's'} left`;
    case 'active':
      return `${info.plan?.name}${info.renewsAt ? ` — renews ${formatDate(info.renewsAt)}` : ''}`;
    case 'expired':
      return `${info.plan?.name} — expired, on free limits`;
  }
}
