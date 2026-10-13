import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import styles from "./activities.module.css";
import {
  ABSENT_PAGE_SIZE,
  type AbsentList,
  absentWords,
} from "./schedule-attendance";

/**
 * What "Peserta" of a schedule opens: how many students it is meant for
 * and how many did not attend, and one page of their names with NIM.
 */
export function AbsentPanel({
  absent,
  addressOf,
}: {
  absent: AbsentList;
  /** The address of a page of the students. */
  addressOf: (page: number) => string;
}) {
  return (
    <div className={styles.absent}>
      <p className={styles.absentLine}>
        {absentWords(absent.targeted, absent.absent)}
      </p>
      {absent.students.length > 0 && (
        <ul className={styles.absentList}>
          {absent.students.map((student) => (
            <li key={student.nim}>
              {student.name}
              <span className={shared.detail}>NIM {student.nim}</span>
            </li>
          ))}
        </ul>
      )}
      {absent.absent > ABSENT_PAGE_SIZE && (
        <ListPager
          page={absent.page}
          matching={absent.absent}
          pageSize={ABSENT_PAGE_SIZE}
          noun="mahasiswa"
          keepsPlace
          addressOf={addressOf}
        />
      )}
    </div>
  );
}
