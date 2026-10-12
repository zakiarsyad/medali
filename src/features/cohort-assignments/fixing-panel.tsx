import { campusDay } from "@/academic-periods/campus-day";
import shared from "@/ui/data-screen.module.css";
import { FixingForm } from "./fixing-form";
import { ProcessLog } from "./process-log";
import type { DraftGroup, StoredAssignment } from "./stored-assignment";

function studentsIn(groups: DraftGroup[]): number {
  let students = 0;
  for (const group of groups) students += group.members.length;
  return students;
}

/**
 * "4. Penetapan", for an account that prepares the penetapan: the decree
 * number, the day the groups start, the buttons and "Riwayat proses".
 * "Berlaku mulai" opens on today until a day is saved.
 */
export function FixingPanel({
  assignment,
  isComplete,
  mayFix,
}: {
  assignment: StoredAssignment;
  /** Whether nothing holds the draft back from being submitted and fixed. */
  isComplete: boolean;
  /** Whether the account may fix the penetapan, or only submits it. */
  mayFix: boolean;
}) {
  const { cohortYear, version, groups } = assignment;
  const start = {
    decreeNumber: assignment.decreeNumber ?? "",
    effectiveOn: assignment.effectiveOn ?? campusDay(),
  };
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>4. Penetapan</h2>
      <FixingForm
        shown={{ cohortYear, version }}
        start={start}
        size={{
          cohortYear,
          groups: groups.length,
          students: studentsIn(groups),
        }}
        isComplete={isComplete}
        mayFix={mayFix}
      />
      <ProcessLog log={assignment.log} />
    </section>
  );
}
