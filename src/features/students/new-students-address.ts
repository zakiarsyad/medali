import { firstParam, type SearchParams } from "@/ui/search-params";
import { withoutNullCharacter } from "@/ui/search-text";
import { isNim } from "./input-limits";

export const NEW_STUDENTS_ADDRESS = "/pengaturan/mahasiswa";

/** The name of the form on the screen, for a link that goes straight to it. */
export const FORM_ANCHOR = "formulir";

const PAGE = /^[1-9]\d{0,5}$/;

/** Where the list of added students is: its search and its page. */
export interface ListPlace {
  query: string;
  /** The page of the list, counted from 1. */
  page: number;
}

export interface NewStudentsParams extends ListPlace {
  /** The NIM of the student whose data is being changed. */
  editing: string | null;
}

export function readNewStudentsParams(params: SearchParams): NewStudentsParams {
  const editing = firstParam(params.ubah);
  const page = firstParam(params.hal);
  return {
    query: withoutNullCharacter(firstParam(params.q)).trim(),
    page: PAGE.test(page) ? Number(page) : 1,
    editing: isNim(editing) ? editing : null,
  };
}

/** The address that downloads the kept file a batch was saved from. */
export function studentFileAddress(fileId: string): string {
  return `${NEW_STUDENTS_ADDRESS}/berkas/${encodeURIComponent(fileId)}`;
}

/** An address as one text: the path, and what comes after the `?` if any. */
export function addressOf(path: string, search: string): string {
  return search ? `${path}?${search}` : path;
}

/**
 * The address of a page of the list with a search, and the student to
 * change if any. The first page is left out.
 */
export function newStudentsAddress(place: ListPlace, editNim?: string): string {
  const params = new URLSearchParams();
  if (place.query) params.set("q", place.query);
  if (place.page > 1) params.set("hal", String(place.page));
  if (editNim) params.set("ubah", editNim);
  const address = addressOf(NEW_STUDENTS_ADDRESS, params.toString());
  return editNim ? `${address}#${FORM_ANCHOR}` : address;
}
