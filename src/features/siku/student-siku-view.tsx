import shared from "@/ui/data-screen.module.css";
import { SikuBreakdown } from "./siku-breakdown";
import type { StudentSiku } from "./student-siku";

/** How many lines a table of the detail shows before the rest is folded. */
const DETAIL_FOLD_AFTER = 10;

/** "Rincian nilai SIKU" of one student, in their detail. Read only. */
export function StudentSikuView({
  base,
  siku,
}: {
  base: number;
  siku: StudentSiku;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Rincian nilai SIKU</h2>
      <SikuBreakdown
        base={base}
        totals={siku.totals}
        lines={siku.entries}
        foldAfter={DETAIL_FOLD_AFTER}
      />
    </section>
  );
}
