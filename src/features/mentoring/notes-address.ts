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
}

const PAGE = /^[1-9]\d{0,5}$/;

function kindAt(path: string): NoteKind | null {
  return NOTE_KINDS.find((kind) => KIND_PATHS[kind] === path) ?? null;
}

/**
 * What the address asks the list for. Nothing in an address is trusted: a
 * part that is not understood counts as not chosen.
 */
export function readNotesParams(params: SearchParams): NotesParams {
  const page = firstParam(params.hal);
  return {
    kind: kindAt(firstParam(params[KIND_PARAM])),
    page: PAGE.test(page) ? Number(page) : 1,
  };
}

/**
 * The address of a page of the list narrowed to a kind. What is not
 * chosen is left out, and so is the first page.
 */
export function notesAddress(kind: NoteKind | null, page = 1): string {
  const params = new URLSearchParams();
  if (kind !== null) params.set(KIND_PARAM, KIND_PATHS[kind]);
  if (page > 1) params.set("hal", String(page));
  const search = params.toString();
  return search === "" ? NOTES_ADDRESS : `${NOTES_ADDRESS}?${search}`;
}
