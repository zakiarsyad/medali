import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { listStudyPrograms } from "@/db/study-programs";
import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { AutoSubmitForm } from "./auto-submit-form";
import { countChoices } from "./student-choice-counts";
import { listCohortYears, listStudents } from "./student-list";
import {
  STUDENT_LIST_ADDRESS,
  type StudentListParams,
  studentListAddress,
} from "./student-list-address";
import { StudentListBar } from "./student-list-bar";
import { StudentListFilterRow } from "./student-list-filters";
import { StudentListTable } from "./student-list-table";

export async function StudentListScreen({
  limit,
  params,
}: {
  /** Which student rows the account that opened the page may see. */
  limit: RowLimit;
  params: StudentListParams;
}) {
  const db = database();
  const { filters } = params;
  const [list, cohortYears, programs, counts] = await Promise.all([
    listStudents(db, limit, filters),
    listCohortYears(db, limit),
    listStudyPrograms(db),
    countChoices(db, limit, filters),
  ]);
  return (
    <>
      <PageHead title="Mahasiswa">
        Data mahasiswa beserta program studi, angkatan, dan provinsi domisili.
      </PageHead>
      {/* Made anew for each address, so its fields show what the address holds. */}
      <AutoSubmitForm
        key={studentListAddress(filters)}
        action={STUDENT_LIST_ADDRESS}
      >
        <StudentListBar
          filters={filters}
          programs={programs}
          counts={counts}
          found={list.students.length}
        />
        <section className={shared.panel}>
          <StudentListFilterRow filters={filters} cohortYears={cohortYears} />
          <StudentListTable students={list.students} />
        </section>
      </AutoSubmitForm>
    </>
  );
}
