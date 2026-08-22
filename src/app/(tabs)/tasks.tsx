import { Text } from 'react-native';

import { TaskRow } from '@/components/task-row';
import { Card, EmptyState, Screen, SectionHeader } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { getSchedulesWithDue, useOrgData } from '@/lib/store';
import type { ScheduleWithDue } from '@/lib/types';

export default function TasksScreen() {
  const { properties, units, appliances, schedules } = useOrgData();

  const tasks = getSchedulesWithDue({ schedules, appliances, properties, units });
  const overdue = tasks.filter((t) => t.daysUntilDue < 0);
  const dueSoon = tasks.filter((t) => t.daysUntilDue >= 0 && t.daysUntilDue <= 30);
  const upcoming = tasks.filter((t) => t.daysUntilDue > 30);

  if (tasks.length === 0) {
    return (
      <Screen>
        <EmptyState
          emoji="✅"
          title="No maintenance schedules yet"
          message="Add appliances to your properties — recommended maintenance schedules are created automatically, and you can add your own."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <TaskGroup title={`Overdue (${overdue.length})`} tasks={overdue} emptyText="Nothing overdue. 🎉" />
      <TaskGroup title={`Due soon (${dueSoon.length})`} tasks={dueSoon} emptyText="Nothing due in the next 30 days." />
      <TaskGroup title={`Upcoming (${upcoming.length})`} tasks={upcoming} emptyText="No upcoming tasks." />
    </Screen>
  );
}

function TaskGroup({
  title,
  tasks,
  emptyText,
}: {
  title: string;
  tasks: ScheduleWithDue[];
  emptyText: string;
}) {
  const theme = useTheme();
  return (
    <>
      <SectionHeader title={title} />
      {tasks.length === 0 ? (
        <Card>
          <Text style={{ color: theme.textSecondary }}>{emptyText}</Text>
        </Card>
      ) : (
        tasks.map((t) => <TaskRow key={t.id} task={t} showMarkDone />)
      )}
    </>
  );
}
