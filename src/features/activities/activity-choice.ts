import type { ValueKey } from "@/ui/medali-values";

/*
 * Read by the form in the browser, so nothing here may take from the
 * database code: that would send it to the browser with the form.
 */

/** An activity of Kurikulum as the schedule form offers it. */
export interface ActivityChoice {
  id: string;
  /** Null for a special or additional activity, which has no semester. */
  semester: number | null;
  name: string;
  valueKeys: ValueKey[];
  indicatorCodes: string[];
  /** Null while no target is set. */
  targetParticipants: number | null;
  isRequired: boolean;
}

/**
 * The choices of one semester each, in semester order, for the groups.
 * The special and additional ones, of no semester, are one group first.
 */
export function choicesBySemester(
  choices: readonly ActivityChoice[],
): Map<number | null, ActivityChoice[]> {
  const semesters = [...new Set(choices.map((choice) => choice.semester))];
  semesters.sort((one, other) => (one ?? 0) - (other ?? 0));
  const grouped = new Map<number | null, ActivityChoice[]>();
  for (const semester of semesters) {
    grouped.set(
      semester,
      choices.filter((choice) => choice.semester === semester),
    );
  }
  return grouped;
}
