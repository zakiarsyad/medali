import { desc } from "drizzle-orm";
import { accounts, mentoringNotes, students } from "@/db/schema";

type StoredNote = typeof mentoringNotes.$inferSelect;

/** One note as a list shows it. The NIP of the writer is never read. */
export interface ListedNote
  extends Pick<
    StoredNote,
    "id" | "happenedOn" | "kind" | "valueKeys" | "note" | "followUp"
  > {
  studentId: string;
  studentName: string;
  writer: { name: string; title: string | null };
}

export const LISTED_NOTE = {
  id: mentoringNotes.id,
  happenedOn: mentoringNotes.happenedOn,
  kind: mentoringNotes.kind,
  valueKeys: mentoringNotes.valueKeys,
  note: mentoringNotes.note,
  followUp: mentoringNotes.followUp,
  studentId: students.id,
  studentName: students.name,
  writer: { name: accounts.name, title: accounts.title },
};

/** The one saved last first; the key settles two saved at the same moment. */
export const NEWEST_FIRST = [
  desc(mentoringNotes.writtenAt),
  desc(mentoringNotes.id),
];
