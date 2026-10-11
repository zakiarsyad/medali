import { asc } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { studyPrograms } from "@/db/schema";

export interface StudyProgram {
  id: number;
  name: string;
}

export async function listStudyPrograms(db: Database): Promise<StudyProgram[]> {
  return db.select().from(studyPrograms).orderBy(asc(studyPrograms.name));
}
