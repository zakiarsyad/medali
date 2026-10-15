import Link from "next/link";
import { DORM_SHORT_NAMES } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { ModalDialog } from "@/ui/modal-dialog";
import { PressableRow } from "@/ui/pressable-row";
import { RekapFilterRow, type SemesterChoice } from "./rekap-filters";
import {
  type StaffViolationParams,
  staffViolationsAddress,
} from "./violation-address";
import type { Rekap, StudentViolations } from "./violation-board";
import { VIOLATIONS_PAGE_SIZE } from "./violation-ids";
import { AnnouncedTable } from "./violation-lists";
import styles from "./violations.module.css";
import { LetterMark } from "./warning-calls-panel";
import type { WarningLevel } from "./warning-ids";

export const NO_REKAP = "Tidak ada pelanggaran pada semester ini.";

function shownCount(amount: number): string {
  return amount === 0 ? "-" : amount.toLocaleString("id-ID");
}

function RekapTable({
  rekap,
  marks,
  params,
}: {
  rekap: Rekap;
  marks: Record<string, WarningLevel>;
  params: StaffViolationParams;
}) {
  if (rekap.rows.length === 0)
    return <p className={shared.empty}>{NO_REKAP}</p>;
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Asrama</th>
            <th>Tercatat</th>
            <th>Proses advokasi</th>
            <th>Advokasi diterima</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rekap.rows.map((row) => {
            const address = staffViolationsAddress({
              ...params,
              studentId: row.studentId,
              studentPage: 1,
            });
            const mark = marks[row.studentId] ?? null;
            return (
              <PressableRow key={row.studentId} address={address}>
                <td className={shared.rowHeading} data-title="Mahasiswa">
                  <Link
                    href={address}
                    className={`${shared.link} ${shared.typed}`}
                    scroll={false}
                  >
                    {row.name}
                  </Link>
                  <small className={shared.detail}>{row.nim}</small>
                </td>
                <td data-title="Asrama">{DORM_SHORT_NAMES[row.dorm]}</td>
                <td data-title="Tercatat">
                  <b>{shownCount(row.escalated)}</b>
                </td>
                <td data-title="Proses advokasi">{shownCount(row.inAppeal)}</td>
                <td data-title="Advokasi diterima">
                  {shownCount(row.accepted)}
                </td>
                <td data-title="Status">
                  {mark === null ? "-" : <LetterMark level={mark} />}
                </td>
              </PressableRow>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * "Rekap pelanggaran per mahasiswa": each student with an announced
 * violation of the semester, with Tercatat, the violations that went up
 * to Pengelola Asrama, Proses advokasi, those in Masa advokasi or
 * Advokasi diproses, Advokasi diterima, and the SP of the semester as
 * Status. Pressing a row opens that student's violations.
 */
export function RekapPanel({
  rekap,
  marks,
  params,
  semesters,
  shownSemester,
}: {
  rekap: Rekap;
  marks: Record<string, WarningLevel>;
  params: StaffViolationParams;
  semesters: SemesterChoice[];
  shownSemester: string | null;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Rekap pelanggaran per mahasiswa</h2>
      <p className={styles.sub}>Pelanggaran yang naik ke Pengelola Asrama</p>
      <RekapFilterRow
        params={params}
        semesters={semesters}
        shownSemester={shownSemester}
      />
      <RekapTable rekap={rekap} marks={marks} params={params} />
      {rekap.matching > 0 && (
        <ListPager
          page={rekap.page}
          matching={rekap.matching}
          pageSize={VIOLATIONS_PAGE_SIZE}
          noun="mahasiswa"
          keepsPlace
          stepsOnOnePage={false}
          addressOf={(page) =>
            staffViolationsAddress({ ...params, page, studentId: null })
          }
        />
      )}
    </section>
  );
}

/** One student's violations of the semester, in a box over the tab. */
export function StudentViolationsDialog({
  student,
  params,
  semesterTitle,
  now,
}: {
  student: StudentViolations;
  params: StaffViolationParams;
  semesterTitle: string;
  now: Date;
}) {
  return (
    <ModalDialog
      label="Pelanggaran mahasiswa"
      closeAddress={staffViolationsAddress({
        ...params,
        studentId: null,
        studentPage: 1,
      })}
    >
      <h2 className={shared.heading}>{student.name}</h2>
      <p className={styles.sub}>
        NIM {student.nim} · semester {semesterTitle}
      </p>
      <AnnouncedTable
        rows={student.rows}
        now={now}
        reader="staff"
        withStudent={false}
      />
      <ListPager
        page={student.page}
        matching={student.matching}
        pageSize={VIOLATIONS_PAGE_SIZE}
        noun="pelanggaran"
        keepsPlace
        stepsOnOnePage={false}
        addressOf={(page) =>
          staffViolationsAddress({ ...params, studentPage: page })
        }
      />
    </ModalDialog>
  );
}
