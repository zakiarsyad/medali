import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { listStudyPrograms } from "@/db/study-programs";
import { dormCohortsOf } from "@/dorms/dorm-cohorts";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import type { AskedDetail } from "./asked-detail";
import { runningPeriodNow } from "./running-period-now";
import { stageCohorts } from "./stage-cohorts";
import { countChoices } from "./student-choice-counts";
import {
  type MorePanelsOf,
  StudentDetailDialog,
} from "./student-detail-dialog";
import { listCohortYears, listStudents } from "./student-list";
import {
  STUDENT_LIST_ADDRESS,
  type StudentListParams,
  studentDetailAddress,
  studentListAddress,
} from "./student-list-address";
import { StudentListBar } from "./student-list-bar";
import { StudentListFilterRow } from "./student-list-filters";
import { StudentListPager } from "./student-list-pager";
import { StudentListTable } from "./student-list-table";
import type { GroupAddressOf, MentorAddressOf } from "./student-mentor-group";

export async function StudentListScreen({
  limit,
  params,
  detail,
  groupAddressOf,
  mentorAddressOf,
  morePanelsOf,
}: {
  /** Which student rows the account that opened the page may see. */
  limit: RowLimit;
  params: StudentListParams;
  /** The detail the address asks to open over the list, or null for none. */
  detail: AskedDetail | null;
  groupAddressOf: GroupAddressOf;
  mentorAddressOf: MentorAddressOf;
  /** The panels other areas add to the detail. */
  morePanelsOf: MorePanelsOf;
}) {
  const db = database();
  const { filters } = params;
  const [cohortYears, programs, period] = await Promise.all([
    listCohortYears(db, limit),
    listStudyPrograms(db),
    runningPeriodNow(),
  ]);
  // The angkatan of the rows the account sees are enough: every filter
  // finds within those rows only.
  const cohorts = {
    stages: stageCohorts(cohortYears, period),
    dorms: dormCohortsOf(cohortYears, period),
  };
  const [list, counts] = await Promise.all([
    listStudents(db, limit, filters, params.page, cohorts),
    countChoices(db, limit, filters, cohorts),
  ]);
  return (
    <>
      <PageHead title="Mahasiswa">
        Data mahasiswa beserta program studi, angkatan, dan provinsi domisili.
        Pilih nama untuk melihat profil lengkap.
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
          found={list.matching}
        />
        <section className={shared.panel}>
          <StudentListFilterRow filters={filters} cohortYears={cohortYears} />
          {list.matching > 0 ? (
            <>
              <StudentListTable
                students={list.students}
                period={period}
                detailAddressOf={(studentId) =>
                  studentDetailAddress(filters, list.page, studentId)
                }
              />
              <StudentListPager
                filters={filters}
                page={list.page}
                matching={list.matching}
              />
            </>
          ) : (
            <p className={shared.empty}>
              Tidak ada mahasiswa yang cocok. Ubah kata kunci atau filter.
            </p>
          )}
        </section>
      </AutoSubmitForm>
      {detail && (
        <StudentDetailDialog
          detail={detail}
          period={period}
          closeAddress={studentListAddress(filters, list.page)}
          groupAddressOf={groupAddressOf}
          mentorAddressOf={mentorAddressOf}
          morePanelsOf={morePanelsOf}
        />
      )}
    </>
  );
}
