import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { studentBatches, studentBatchFiles } from "@/db/schema";
import { type AddedStudent, addStudents, type NewStudent } from "./add-student";

/** A file of students as it is kept in the file storage. */
export interface BatchFile {
  objectKey: string;
  fileName: string;
  byteSize: number;
  contentType: string;
}

export interface NewBatch {
  inputAt: Date;
  inputBy: string;
  students: NewStudent[];
  file: BatchFile;
}

/**
 * Saves the students of one file together with their batch and the record
 * of the kept file: all of it or none of it. Gives the students that were
 * added. When every NIM is already used, nothing is added, no batch and
 * no file record either.
 */
export async function addStudentBatch(
  db: Database,
  batch: NewBatch,
): Promise<AddedStudent[]> {
  const { inputAt, inputBy } = batch;
  return db.transaction(async (tx) => {
    const [made] = await tx
      .insert(studentBatches)
      .values({ inputAt, inputBy })
      .returning({ id: studentBatches.id });
    if (!made) throw new Error("The batch was not added.");

    const inBatch = batch.students.map((student) => ({
      ...student,
      inputBatchId: made.id,
    }));
    const added = await addStudents(tx, inBatch, inputBy);
    if (added.length === 0) {
      await tx.delete(studentBatches).where(eq(studentBatches.id, made.id));
      return [];
    }
    await tx.insert(studentBatchFiles).values({
      ...batch.file,
      batchId: made.id,
      keptAt: inputAt,
      keptBy: inputBy,
    });
    return added;
  });
}
