import type { students } from "@/db/schema";
import type { AssignmentMethod } from "./methods";
import { type SplitStudent, splitStudents } from "./split-students";
import { groupCount } from "./target-size";

type Student = typeof students.$inferSelect;

/** What forming groups reads of a new student. */
export type NewStudent = SplitStudent &
  Pick<Student, "id" | "studyProgramId" | "entryPath">;

/** A group as it is formed: who is in it, and no mentor yet. */
export interface FormedGroup {
  studyProgramId: number;
  entryPath: Student["entryPath"];
  /** From 1 within the program studi and jalur. */
  number: number;
  studentIds: string[];
}

/** The new students of one program studi and jalur. */
interface Batch {
  studyProgramId: number;
  entryPath: Student["entryPath"];
  students: NewStudent[];
}

function batchKey(student: NewStudent): string {
  return `${student.entryPath} ${student.studyProgramId}`;
}

/** The Reguler jalur first, then by program studi, as the prototype does. */
function inBatchOrder(a: Batch, b: Batch): number {
  if (a.entryPath !== b.entryPath) return a.entryPath === "regular" ? -1 : 1;
  return a.studyProgramId - b.studyProgramId;
}

function batchesOf(students: NewStudent[]): Batch[] {
  const batches = new Map<string, Batch>();
  for (const student of students) {
    const key = batchKey(student);
    const batch = batches.get(key) ?? {
      studyProgramId: student.studyProgramId,
      entryPath: student.entryPath,
      students: [],
    };
    batch.students.push(student);
    batches.set(key, batch);
  }
  return [...batches.values()].sort(inBatchOrder);
}

function groupsOfBatch(
  batch: Batch,
  targetSize: number,
  method: AssignmentMethod,
): FormedGroup[] {
  const count = groupCount(batch.students.length, targetSize);
  const split = splitStudents(batch.students, count, method);
  return split.map((members, place) => ({
    studyProgramId: batch.studyProgramId,
    entryPath: batch.entryPath,
    number: place + 1,
    studentIds: members.map((student) => student.id),
  }));
}

/**
 * Forms the groups of an angkatan from the students given: those of each
 * program studi and jalur apart, split by the method into as many groups
 * as the target size asks for, numbered from 1. Every student is in one
 * group. Give it only the students to place, which are the Aktif ones
 * that have no kelompok pengasuhan.
 */
export function formGroups(
  students: NewStudent[],
  targetSize: number,
  method: AssignmentMethod,
): FormedGroup[] {
  return batchesOf(students).flatMap((batch) =>
    groupsOfBatch(batch, targetSize, method),
  );
}
