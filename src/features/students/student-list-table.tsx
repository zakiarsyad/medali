import Link from "next/link";
import type { CharacterGrade } from "@/character-grades/character-grade";
import { GradeLetterBadge } from "@/character-grades/grade-letter-badge";
import { INCOMPLETE_WORDS, shownFinal } from "@/character-grades/grade-words";
import { PredicateBadge } from "@/character-scores/predicate-badge";
import { NOT_ASSESSED } from "@/character-scores/predicate-words";
import { shownRerata } from "@/character-scores/shown-rerata";
import type { Sanction } from "@/discipline-penalties/sanction";
import { SanctionBadge } from "@/discipline-penalties/sanction-badge";
import { DORM_NAMES } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { PressableRow } from "@/ui/pressable-row";
import pressable from "@/ui/pressable-row.module.css";
import { CATEGORIES, ENTRY_PATH_LABELS, STATUS_LABELS } from "./labels";
import { type RunningPeriod, semesterNow } from "./semester-now";
import { rowSemesterWords } from "./semester-words";
import type { ListedStudent } from "./student-list";
import type { ListScores } from "./student-list-scores";

const ACHIEVEMENT_TITLE = "Capaian karakter (MEDALI)";
const GRADE_TITLE = "Nilai karakter (KEP-220)";

/** What a row shows while its scores were not read. */
const NOT_SCORED: ListScores = { rerata: null, grade: { complete: false } };

/** The NIM, and the status when the student is not active. */
function nimAndStatus(student: ListedStudent): string {
  if (student.status === "active") return student.nim;
  return `${student.nim} · ${STATUS_LABELS[student.status].toLowerCase()}`;
}

function pathAndAgency(student: ListedStudent): string {
  const path = ENTRY_PATH_LABELS[student.entryPath];
  return student.originAgency ? `${path} · ${student.originAgency}` : path;
}

function Achievement({ rerata }: { rerata: number | null }) {
  if (rerata === null) return NOT_ASSESSED;
  return (
    <>
      <PredicateBadge rerata={rerata} />
      <small className={shared.detail}>Rerata {shownRerata(rerata)}</small>
    </>
  );
}

function Grade({ grade }: { grade: CharacterGrade }) {
  if (!grade.complete) return INCOMPLETE_WORDS;
  return (
    <>
      <GradeLetterBadge grade={grade} />
      <small className={shared.detail}>{shownFinal(grade)}</small>
    </>
  );
}

function StudentRow({
  student,
  scores,
  sanction,
  period,
  detailAddress,
}: {
  student: ListedStudent;
  scores: ListScores;
  sanction: Sanction | null;
  period: RunningPeriod;
  detailAddress: string;
}) {
  const tags = CATEGORIES.filter(({ field }) => student[field]);
  const semester = semesterNow(student, period);
  return (
    <PressableRow address={detailAddress}>
      <td data-title="Mahasiswa">
        <Link href={detailAddress} scroll={false} className={pressable.open}>
          <b>{student.name}</b>
        </Link>
        <small className={shared.detail}>{nimAndStatus(student)}</small>
        {sanction !== null && <SanctionBadge sanction={sanction} />}
        {tags.map(({ field, label }) => (
          <span key={field} className={shared.badge}>
            {label}
          </span>
        ))}
        {student.dorm && (
          <span className={shared.badge}>{DORM_NAMES[student.dorm]}</span>
        )}
      </td>
      <td data-title="Program studi">
        {student.studyProgram}
        <small className={shared.detail}>{pathAndAgency(student)}</small>
      </td>
      <td data-title="Angkatan">
        {student.cohortYear}
        <small className={shared.detail}>
          {rowSemesterWords(semester, student.className)}
        </small>
      </td>
      <td data-title="Provinsi">{student.province ?? "-"}</td>
      <td data-title="Pengasuh">{student.mentorName ?? "-"}</td>
      <td data-title={ACHIEVEMENT_TITLE}>
        <Achievement rerata={scores.rerata} />
      </td>
      <td data-title={GRADE_TITLE}>
        <Grade grade={scores.grade} />
      </td>
    </PressableRow>
  );
}

export function StudentListTable({
  students,
  scores,
  sanctions,
  period,
  detailAddressOf,
}: {
  students: ListedStudent[];
  /** The scores of each student of the page, by id. */
  scores: ReadonlyMap<string, ListScores>;
  /**
   * The badge of each suspended or dismissed student of the page, by id;
   * none for an account that may not read discipline records.
   */
  sanctions: ReadonlyMap<string, Sanction>;
  /** The academic period that runs now, which says each row's semester. */
  period: RunningPeriod;
  /** The address that opens the detail of a student over this list. */
  detailAddressOf: (studentId: string) => string;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Program studi</th>
            <th>Angkatan</th>
            <th>Provinsi</th>
            <th>Pengasuh</th>
            <th>{ACHIEVEMENT_TITLE}</th>
            <th>{GRADE_TITLE}</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <StudentRow
              key={student.nim}
              student={student}
              scores={scores.get(student.id) ?? NOT_SCORED}
              sanction={sanctions.get(student.id) ?? null}
              period={period}
              detailAddress={detailAddressOf(student.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
