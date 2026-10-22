import Link from "next/link";
import styles from "./dashboard.module.css";
import {
  type DashboardFilters,
  studentDetailAddress,
} from "./dashboard-address";
import { LatestNotesPanel } from "./latest-notes-panel";
import type { MentoringNumbers, MentoringView } from "./mentoring-recap";
import {
  everyoneLine,
  groupsLine,
  intensiveLine,
  RECENT_NOTES_LINE,
} from "./mentoring-words";
import { ProgramPanel } from "./program-panel";
import { SectionHead } from "./section-head";

/** Where section Pendampingan starts. */
export const MENTORING_SECTION = "pendampingan";

/** Where each number of Pendampingan leads, or null for a menu the account may not open. */
export interface MentoringLinks {
  students: string | null;
  mentors: string | null;
  notes: string | null;
  coaching: string | null;
}

/** One number: what it counts, the number and the line under it, a link to its menu when the account may open it. */
function MentoringNumber({
  label,
  amount,
  line,
  address,
}: {
  label: string;
  amount: number;
  line: string | undefined;
  address: string | null;
}) {
  const content = (
    <>
      <span className={styles.tileLabel}>{label}</span>
      <span className={styles.tileValue}>{amount.toLocaleString("id-ID")}</span>
      {line !== undefined && <span className={styles.cardLine}>{line}</span>}
    </>
  );
  if (address === null) return <div className={styles.tile}>{content}</div>;
  return (
    <Link href={address} className={styles.tile}>
      {content}
    </Link>
  );
}

/** The four numbers, two by two, so a phone shows two in a row. */
function NumberStrip({
  numbers,
  students,
  links,
}: {
  numbers: MentoringNumbers;
  /** The Aktif students of the filter. */
  students: number;
  links: MentoringLinks;
}) {
  return (
    <div className={styles.strip}>
      <div className={styles.pair}>
        <MentoringNumber
          label="Mahasiswa aktif"
          amount={students}
          line={everyoneLine(numbers.everyone)}
          address={links.students}
        />
        <MentoringNumber
          label="Pengasuh"
          amount={numbers.mentors}
          line={groupsLine(numbers.groups)}
          address={links.mentors}
        />
      </div>
      <div className={styles.pair}>
        <MentoringNumber
          label="Catatan 30 hari terakhir"
          amount={numbers.recentNotes}
          line={RECENT_NOTES_LINE}
          address={links.notes}
        />
        <MentoringNumber
          label="Perlu pembinaan"
          amount={numbers.openCoaching}
          line={intensiveLine(numbers.intensiveCoaching)}
          address={links.coaching}
        />
      </div>
    </div>
  );
}

/** The last section, Pendampingan, of the students of the filter. */
export function MentoringSection({
  mentoring,
  students,
  filters,
  links,
}: {
  mentoring: MentoringView;
  students: number;
  /** The filters in use, which a student's detail closes back to. */
  filters: DashboardFilters;
  links: MentoringLinks;
}) {
  return (
    <section className={styles.section} aria-labelledby={MENTORING_SECTION}>
      <SectionHead
        id={MENTORING_SECTION}
        title="Pendampingan"
        detailAddress={null}
      >
        Pengasuhan dan pembinaan mahasiswa sesuai filter.
      </SectionHead>
      <NumberStrip
        numbers={mentoring.numbers}
        students={students}
        links={links}
      />
      <div className={styles.panels}>
        {mentoring.programs !== null && (
          <ProgramPanel programs={mentoring.programs} />
        )}
        <LatestNotesPanel
          notes={mentoring.notes}
          detailAddressOf={(studentId) =>
            studentDetailAddress(filters, studentId)
          }
          link={
            links.notes === null
              ? null
              : { address: links.notes, words: "Lihat semua" }
          }
        />
      </div>
    </section>
  );
}
