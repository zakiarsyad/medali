import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { listStudyPrograms } from "@/db/study-programs";
import { dormCohortsOf } from "@/dorms/dorm-cohorts";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import {
  countStudents,
  findAddedStudent,
  listAddedStudents,
} from "./added-students";
import { listGroupChoices } from "./mentor-group-choices";
import {
  NEW_STUDENTS_ADDRESS,
  type NewStudentsParams,
  newStudentsAddress,
} from "./new-students-address";
import { cohortChoices } from "./student-input";
import { StudentInputPanel } from "./student-input-panel";
import { listCohortYears } from "./student-list";
import { StudentNotice } from "./student-notice";
import { StudentNumbers } from "./student-numbers";
import { StudentTable } from "./student-table";

/** The list holds every student put in here, whoever opens it. */
const EVERY_STUDENT: RowLimit = { kind: "all" };

function Search({ query }: { query: string }) {
  return (
    <form action={NEW_STUDENTS_ADDRESS} className={shared.filters}>
      <input
        name="q"
        className={shared.input}
        placeholder="Cari nama atau NIM"
        defaultValue={query}
        aria-label="Cari"
      />
      <button type="submit" className={shared.quiet}>
        Cari
      </button>
    </form>
  );
}

function NothingListed({ anyAdded }: { anyAdded: boolean }) {
  return (
    <p className={shared.empty}>
      {anyAdded
        ? "Tidak ada yang cocok dengan pencarian."
        : "Belum ada mahasiswa yang ditambahkan."}
    </p>
  );
}

export async function NewStudentsScreen({
  params,
  tabs,
}: {
  params: NewStudentsParams;
  tabs: TabLinksProps;
}) {
  const db = database();
  const [studentYears, period, programs, editing, groups] = await Promise.all([
    listCohortYears(db, EVERY_STUDENT),
    readRunningPeriod(db),
    listStudyPrograms(db),
    params.editing ? findAddedStudent(db, params.editing) : null,
    listGroupChoices(db),
  ]);
  const dormCohorts = dormCohortsOf(studentYears, period);
  const [counts, list] = await Promise.all([
    countStudents(db, dormCohorts),
    listAddedStudents(db, params.query, dormCohorts, params.page),
  ]);
  const place = { query: params.query, page: list.page };
  const thisYear = new Date().getFullYear();
  return (
    <>
      <PageHead title="Pengguna baru mahasiswa">
        Tambahkan mahasiswa yang belum ada di data induk, misalnya mahasiswa
        baru, pindahan, atau penghuni asrama baru. Mahasiswa yang ditambahkan
        langsung bisa dipilih sebagai pengguna (masuk dengan NIM), muncul di
        semua menu, dan masuk ke penetapan pengasuh angkatannya.
      </PageHead>
      <TabLinks {...tabs} />
      <StudentNumbers counts={counts} />
      <StudentNotice>
        <StudentInputPanel
          key={editing?.nim ?? "new"}
          programs={programs}
          cohortYears={cohortChoices(thisYear, editing?.cohortYear)}
          editing={editing}
          groups={groups}
          place={place}
          period={period}
        />
        <section className={shared.panel}>
          <h2 className={shared.heading}>Mahasiswa yang ditambahkan</h2>
          <p className={shared.detail}>
            Data induk awal tidak diubah dari menu ini.
          </p>
          <Search query={params.query} />
          {list.matching === 0 ? (
            <NothingListed anyAdded={counts.added > 0} />
          ) : (
            <>
              <StudentTable students={list.students} place={place} />
              <ListPager
                page={list.page}
                matching={list.matching}
                noun="mahasiswa"
                keepsPlace
                stepsOnOnePage={false}
                addressOf={(page) => newStudentsAddress({ ...place, page })}
              />
            </>
          )}
        </section>
      </StudentNotice>
    </>
  );
}
