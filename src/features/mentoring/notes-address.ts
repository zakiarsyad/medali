import { firstParam, type SearchParams } from "@/ui/search-params";
import { NOTE_KINDS, type NoteKind } from "./note-kinds";

export const NOTES_ADDRESS = "/pengasuhan/catatan";

/** The part of the address that names the kind the list is narrowed to. */
export const KIND_PARAM = "jenis";

/** How the address names each kind. */
export const KIND_PATHS: Record<NoteKind, string> = {
  individual_counselling: "konseling",
  group_mentoring: "mentoring",
  appreciation: "apresiasi",
  attendance_monitoring: "kehadiran",
  discipline_guidance: "disiplin",
  parent_visit: "kunjungan",
};

export interface NotesParams {
  /** The kind the list is narrowed to. Null means "Semua jenis". */
  kind: NoteKind | null;
  /** The page of the list, counted from 1. */
  page: number;
  /**
   * What the address gives as the id of the student whose detail is open
   * over the list, or null when it names none. It is not checked here:
   * the read of the detail answers "not found" for what is no id.
   */
  detailId: string | null;
  /** The same for the student the form "Catatan baru" opens with. */
  writeForId: string | null;
}

const PAGE = /^[1-9]\d{0,5}$/;
/** As long as the id of a record is. */
const ID_LENGTH = 36;

function kindAt(path: string): NoteKind | null {
  return NOTE_KINDS.find((kind) => KIND_PATHS[kind] === path) ?? null;
}

function readId(value: SearchParams[string]): string | null {
  const id = firstParam(value).trim().slice(0, ID_LENGTH);
  return id === "" ? null : id;
}

/**
 * What the address asks the tab for. Nothing in an address is trusted: a
 * part that is not understood counts as not chosen.
 */
export function readNotesParams(params: SearchParams): NotesParams {
  const page = firstParam(params.hal);
  return {
    kind: kindAt(firstParam(params[KIND_PARAM])),
    page: PAGE.test(page) ? Number(page) : 1,
    detailId: readId(params.profil),
    writeForId: readId(params.tulis),
  };
}

function listParams(kind: NoteKind | null, page: number): URLSearchParams {
  const params = new URLSearchParams();
  if (kind !== null) params.set(KIND_PARAM, KIND_PATHS[kind]);
  if (page > 1) params.set("hal", String(page));
  return params;
}

function addressWith(params: URLSearchParams): string {
  const search = params.toString();
  return search === "" ? NOTES_ADDRESS : `${NOTES_ADDRESS}?${search}`;
}

/**
 * The address of a page of the list narrowed to a kind. What is not
 * chosen is left out, and so is the first page.
 */
export function notesAddress(kind: NoteKind | null, page = 1): string {
  return addressWith(listParams(kind, page));
}

/** The address of a student's detail, open over that page of the list. */
export function noteStudentAddress(
  kind: NoteKind | null,
  page: number,
  studentId: string,
): string {
  const params = listParams(kind, page);
  params.set("profil", studentId);
  return addressWith(params);
}

/** The address of the tab with the form open for one student. */
export function writeNoteAddress(studentId: string): string {
  return addressWith(new URLSearchParams({ tulis: studentId }));
}
