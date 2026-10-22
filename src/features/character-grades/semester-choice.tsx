import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import {
  FILTER_CHOICES,
  GRADE_ADDRESS,
  type GradeParams,
} from "./grade-address";

/** A closed period as the choice names it. */
export interface SemesterOption {
  id: string;
  title: string;
}

export const RUNNING_WORDS = "Berjalan";

/**
 * The choice "Semester": "Berjalan", the running semester, then each
 * closed period, newest first. A choice keeps the search and the filter
 * in the address and starts the list again at its first page.
 */
export function SemesterChoice({
  closed,
  params,
}: {
  closed: readonly SemesterOption[];
  params: GradeParams;
}) {
  return (
    <div className={shared.filters}>
      <AutoSubmitForm action={GRADE_ADDRESS}>
        {params.query !== "" && (
          <input type="hidden" name="cari" value={params.query} />
        )}
        {params.filter !== "all" && (
          <input
            type="hidden"
            name="saring"
            value={FILTER_CHOICES[params.filter]}
          />
        )}
        <label className={shared.field}>
          Semester
          <select
            // A new address, as on going back, shows its own choice.
            key={params.semester ?? ""}
            name="semester"
            className={shared.input}
            defaultValue={params.semester ?? ""}
          >
            <option value="">{RUNNING_WORDS}</option>
            {closed.map((each) => (
              <option key={each.id} value={each.id}>
                {each.title}
              </option>
            ))}
          </select>
        </label>
      </AutoSubmitForm>
    </div>
  );
}
