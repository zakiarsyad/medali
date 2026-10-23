import type { AcademicPeriod } from "@/academic-periods/academic-period";
import type { Database } from "@/db/connect";
import { readFitnessLimits } from "@/health-notes/fitness-limits";
import { readBasis } from "./dashboard-view";
import { attentionRows } from "./mentee-attention";
import { readMenteeCards } from "./mentee-cards";
import { readMenteeFacts } from "./mentee-facts-read";
import { countMentees, readMenteeGroups } from "./mentee-groups";
import { attendanceAverageOf, openCoachingOf } from "./mentee-notes";
import { readMenteeNotes } from "./mentee-notes-read";
import { readProgress } from "./mentee-progress-read";
import type { MenteeDashboard } from "./mentee-recap";
import type { MenteeScope } from "./mentee-scope";

/**
 * Reads Dashboard anak asuh of a scope on each load, so a student who
 * left a group, or a group handed to another Pengasuh, is gone at once.
 */
export async function loadMenteeDashboard(
  db: Database,
  scope: MenteeScope,
  period: AcademicPeriod | null,
  today: string,
): Promise<MenteeDashboard> {
  const groups = await readMenteeGroups(db, scope.mentorIds);
  if (groups.length === 0) return { kind: "no_group" };
  const { mentees } = scope;
  const [students, basis, { limits }] = await Promise.all([
    countMentees(db, mentees),
    readBasis(db, today),
    readFitnessLimits(db),
  ]);
  const groupIds = groups.map((group) => group.id);
  const [progress, cards, facts, written] = await Promise.all([
    readProgress(db, { groupIds, mentees, students, period }),
    readMenteeCards(db, scope, basis, limits),
    readMenteeFacts(db, scope, basis, limits),
    readMenteeNotes(db, scope, today),
  ]);
  return {
    kind: "shown",
    groups,
    students,
    progress,
    cards,
    fitnessLimits: limits,
    attention: attentionRows(facts),
    notes: written.notes,
    noteNumbers: {
      recentNotes: written.recentNotes,
      openCoaching: openCoachingOf(facts),
      penalties: written.penalties,
      attendance: attendanceAverageOf(facts),
    },
  };
}
