import { type SexCounts, sexCounts } from "./sex-counts";
import type { WaitingStudent } from "./waiting-students";

type CountedStudent = Pick<WaitingStudent, "sex" | "entryPath" | "programName">;

/** How many new students one program studi and jalur has. */
export interface IntakeBatch {
  /** The program studi, with "(alih program)" after it for that jalur. */
  label: string;
  students: number;
}

/** What "1. Mahasiswa baru angkatan" says of the students to place. */
export interface IntakeSummary extends SexCounts {
  students: number;
  /** By program studi, the Reguler jalur before alih program. */
  batches: IntakeBatch[];
}

/** The program studi and jalur of a student as the tab writes them. */
export function batchLabel(
  student: Pick<WaitingStudent, "entryPath" | "programName">,
): string {
  if (student.entryPath === "transfer") {
    return `${student.programName} (alih program)`;
  }
  return student.programName;
}

function countByLabel(students: CountedStudent[]): IntakeBatch[] {
  const counts = new Map<string, number>();
  for (const student of students) {
    const label = batchLabel(student);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const batches = [...counts].map(([label, count]) => ({
    label,
    students: count,
  }));
  return batches.sort((a, b) => a.label.localeCompare(b.label));
}

export function intakeSummary(students: CountedStudent[]): IntakeSummary {
  return {
    students: students.length,
    ...sexCounts(students),
    batches: countByLabel(students),
  };
}
