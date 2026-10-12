import { firstParam, type SearchParams } from "@/ui/search-params";
import type { AccountFilter } from "./manage-accounts";
import { isListedRole } from "./managed-roles";

export const USERS_ADDRESS = "/pengaturan/pengguna";

/** The address part that holds the page of the BAM students. */
export const BAM_PAGE_PARAM = "halBam";

/**
 * What the screen shows of its two lists: the staff accounts and the BAM
 * students. Each has a page of its own, so a link of one keeps the other.
 */
export interface ListView extends AccountFilter {
  bamPage: number;
}

export interface ListParams extends ListView {
  /** The staff account whose roles are being changed. */
  editing: string | null;
  /** The student's account whose BAM roles are being changed. */
  bamEditing: string | null;
}

function pageNumber(text: string): number {
  const shown = Number(text);
  if (!Number.isInteger(shown) || shown < 1) return 0;
  return shown - 1;
}

function orNull(text: string): string | null {
  return text === "" ? null : text;
}

/** Reads the address of the two lists. Pages start at 1 in the address. */
export function readListParams(params: SearchParams): ListParams {
  const role = firstParam(params.peran);
  return {
    query: firstParam(params.q).trim(),
    role: isListedRole(role) ? role : null,
    page: pageNumber(firstParam(params.hal)),
    editing: orNull(firstParam(params.ubah)),
    bamPage: pageNumber(firstParam(params[BAM_PAGE_PARAM])),
    bamEditing: orNull(firstParam(params.ubahBam)),
  };
}

export function listAddress(
  view: ListView,
  options: { edit?: string; bamEdit?: string } = {},
): string {
  const params = new URLSearchParams();
  if (view.query) params.set("q", view.query);
  if (view.role) params.set("peran", view.role);
  if (view.page > 0) params.set("hal", String(view.page + 1));
  if (options.edit) params.set("ubah", options.edit);
  if (view.bamPage > 0) params.set(BAM_PAGE_PARAM, String(view.bamPage + 1));
  if (options.bamEdit) params.set("ubahBam", options.bamEdit);
  const search = params.toString();
  return search ? `${USERS_ADDRESS}?${search}` : USERS_ADDRESS;
}
