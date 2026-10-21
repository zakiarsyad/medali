import shared from "@/ui/data-screen.module.css";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import styles from "./counselling.module.css";
import { CounsellingListTable } from "./counselling-list-table";
import type {
  CounsellingNumbers,
  CounsellingStudentList,
} from "./counselling-list-view";
import { NO_COUNSELLING_DATA } from "./counselling-list-words";

/** What Konselor sees of the students they work with on Konseling. */
export interface CounsellorStudents {
  numbers: CounsellingNumbers;
  list: CounsellingStudentList;
}

function CounsellingNumberCards({ numbers }: { numbers: CounsellingNumbers }) {
  return (
    <NumberCards>
      <NumberCard
        label="Menunggu persetujuan"
        amount={numbers.waitingConsent}
        note="form consent"
      />
      <NumberCard
        label="Sesi 30 hari terakhir"
        amount={numbers.recentSessions}
        note="konseling"
      />
    </NumberCards>
  );
}

/**
 * The numbers and "Daftar mahasiswa" of Konselor on Konseling: every
 * student with a consent record, a schedule or a session, by name. On a
 * phone each student is a card.
 */
export function CounsellingListPart({
  students,
}: {
  students: CounsellorStudents;
}) {
  const { numbers, list } = students;
  return (
    <>
      <CounsellingNumberCards numbers={numbers} />
      <section className={`${shared.panel} ${styles.stack}`}>
        <h2 className={shared.heading}>Daftar mahasiswa</h2>
        {list.matching === 0 ? (
          <p className={shared.empty}>{NO_COUNSELLING_DATA}</p>
        ) : (
          <CounsellingListTable rows={list.rows} />
        )}
      </section>
    </>
  );
}
