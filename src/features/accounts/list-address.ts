import { firstParam, type SearchParams } from "@/ui/search-params";
import type { AccountFilter } from "./manage-accounts";
import { isListedRole } from "./managed-roles";

export const USERS_ADDRESS = "/pengaturan/pengguna";

export interface ListParams extends AccountFilter {
  /** The account whose roles are being changed. */
  editing: string | null;
}

function pageNumber(text: string): number {
  const shown = Number(text);
  if (!Number.isInteger(shown) || shown < 1) return 0;
  return shown - 1;
}

/** Reads the address of the account list. Pages start at 1 in the address. */
export function readListParams(params: SearchParams): ListParams {
  const role = firstParam(params.peran);
  const editing = firstParam(params.ubah);
  return {
    query: firstParam(params.q).trim(),
    role: isListedRole(role) ? role : null,
    page: pageNumber(firstParam(params.hal)),
    editing: editing === "" ? null : editing,
  };
}

export function listAddress(
  filter: AccountFilter,
  options: { edit?: string } = {},
): string {
  const params = new URLSearchParams();
  if (filter.query) params.set("q", filter.query);
  if (filter.role) params.set("peran", filter.role);
  if (filter.page > 0) params.set("hal", String(filter.page + 1));
  if (options.edit) params.set("ubah", options.edit);
  const search = params.toString();
  return search ? `${USERS_ADDRESS}?${search}` : USERS_ADDRESS;
}
