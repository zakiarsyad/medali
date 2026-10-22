import { and, count, eq, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, mentoringNotes, students } from "@/db/schema";
import {
  LISTED_NOTE,
  type ListedNote,
  NEWEST_FIRST,
} from "@/mentoring/listed-note";
import { NOTE_KINDS, type NoteKind } from "@/mentoring/note-ids";
import { opensDetailOf } from "@/mentoring/opens-detail";
import { pageWithin } from "@/ui/list-pages";

/** How many notes one page of the list shows. */
export const NOTES_PAGE_SIZE = 20;

export type KindCounts = Record<NoteKind, number>;

/** A note in the list of every student's notes. */
export interface NoteInList extends ListedNote {
  /** Whether the account that reads the list may open the student's detail. */
  opensDetail: boolean;
}

export interface NoteList {
  /** The notes of the page, the one saved last first. */
  notes: NoteInList[];
  /** How many notes the list has in all, narrowed to the kind chosen. */
  matching: number;
  /** The page shown: the last one when the page asked for does not exist. */
  page: number;
  /** How many notes there are of each kind, whatever kind is chosen. */
  counts: KindCounts;
}

const NO_NOTES: KindCounts = {
  individual_counselling: 0,
  group_mentoring: 0,
  appreciation: 0,
  attendance_monitoring: 0,
  discipline_guidance: 0,
  parent_visit: 0,
};

async function countByKind(db: Database, visible: SQL): Promise<KindCounts> {
  const rows = await db
    .select({ kind: mentoringNotes.kind, notes: count() })
    .from(mentoringNotes)
    .innerJoin(students, eq(students.id, mentoringNotes.studentId))
    .where(visible)
    .groupBy(mentoringNotes.kind);
  const counts = { ...NO_NOTES };
  for (const row of rows) counts[row.kind] = row.notes;
  return counts;
}

function total(counts: KindCounts): number {
  let notes = 0;
  for (const kind of NOTE_KINDS) notes += counts[kind];
  return notes;
}

function ofKind(visible: SQL, kind: NoteKind | null): SQL | undefined {
  if (kind === null) return visible;
  return and(visible, eq(mentoringNotes.kind, kind));
}

/**
 * One page of the notes about the students `visible` holds, which is the
 * row limit of the account that asks, with the count of each kind. A note
 * is shown by whose student it is about, not by who wrote it: the mentor
 * of today reads what an earlier mentor wrote, under the earlier name.
 * `detailVisible` holds the students whose detail the account may open,
 * or null for none: each note says whether its student is one of them.
 */
export async function listNotes(
  db: Database,
  visible: SQL,
  kind: NoteKind | null,
  page: number,
  detailVisible: SQL | null = null,
): Promise<NoteList> {
  const counts = await countByKind(db, visible);
  const matching = kind === null ? total(counts) : counts[kind];
  const shown = pageWithin(page, matching, NOTES_PAGE_SIZE);
  const notes = await db
    .select({ ...LISTED_NOTE, opensDetail: opensDetailOf(detailVisible) })
    .from(mentoringNotes)
    .innerJoin(students, eq(students.id, mentoringNotes.studentId))
    .innerJoin(accounts, eq(accounts.id, mentoringNotes.writtenBy))
    .where(ofKind(visible, kind))
    .orderBy(...NEWEST_FIRST)
    .limit(NOTES_PAGE_SIZE)
    .offset((shown - 1) * NOTES_PAGE_SIZE);
  return { notes, matching, page: shown, counts };
}
