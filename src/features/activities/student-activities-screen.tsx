import { PageHead } from "@/ui/page-head";
import { cardOf } from "./activity-card";
import { AttendanceHistory } from "./attendance-history";
import { ComingActivities } from "./coming-activities";
import { CurrentActivities } from "./current-activities";
import type { StudentActivities } from "./student-activities";
import { ledeWords } from "./student-activity-words";
import { StudentNumbers } from "./student-numbers";

/**
 * Kegiatan karakter for a student: the numbers of their attendance, the
 * schedules that run or take photos, the next ones, and their history.
 */
export function StudentActivitiesScreen({
  activities,
}: {
  activities: StudentActivities;
}) {
  const { now, current, coming, history } = activities;
  return (
    <>
      <PageHead title="Kegiatan karakter">
        {ledeWords(activities.semester)}
      </PageHead>
      <StudentNumbers activities={activities} />
      <CurrentActivities
        cards={current.map((schedule) => cardOf(schedule, now))}
      />
      <ComingActivities schedules={coming} />
      <AttendanceHistory history={history} today={now.day} />
    </>
  );
}
