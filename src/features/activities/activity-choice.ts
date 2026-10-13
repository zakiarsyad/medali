import type { ValueKey } from "@/ui/medali-values";

/*
 * Read by the form in the browser, so nothing here may take from the
 * database code: that would send it to the browser with the form.
 */

/** A PPKS activity of Kurikulum as the schedule form offers it. */
export interface ActivityChoice {
  id: string;
  semester: number;
  name: string;
  valueKeys: ValueKey[];
  indicatorCodes: string[];
  /** Null while no target is set. */
  targetParticipants: number | null;
  isRequired: boolean;
}

/** The choices of one semester each, in semester order, for the groups. */
export function choicesBySemester(
  choices: readonly ActivityChoice[],
): Map<number, ActivityChoice[]> {
  const semesters = [...new Set(choices.map((choice) => choice.semester))];
  semesters.sort((one, other) => one - other);
  const grouped = new Map<number, ActivityChoice[]>();
  for (const semester of semesters) {
    grouped.set(
      semester,
      choices.filter((choice) => choice.semester === semester),
    );
  }
  return grouped;
}
