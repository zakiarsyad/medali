import { firstParam, type SearchParams } from "@/ui/search-params";
import { isNim } from "./input-limits";

export const NEW_STUDENTS_ADDRESS = "/pengaturan/mahasiswa";

/** The name of the form on the screen, for a link that goes straight to it. */
export const FORM_ANCHOR = "formulir";

export interface NewStudentsParams {
  query: string;
  /** The NIM of the student whose data is being changed. */
  editing: string | null;
}

export function readNewStudentsParams(params: SearchParams): NewStudentsParams {
  const editing = firstParam(params.ubah);
  return {
    query: firstParam(params.q).trim(),
    editing: isNim(editing) ? editing : null,
  };
}

/** The address of the list with a search, and the student to change if any. */
export function newStudentsAddress(query: string, editNim?: string): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (editNim) params.set("ubah", editNim);
  const search = params.toString();
  const address = search
    ? `${NEW_STUDENTS_ADDRESS}?${search}`
    : NEW_STUDENTS_ADDRESS;
  return editNim ? `${address}#${FORM_ANCHOR}` : address;
}
