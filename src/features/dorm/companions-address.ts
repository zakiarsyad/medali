import { firstParam, type SearchParams } from "@/ui/search-params";

export const COMPANIONS_ADDRESS = "/asrama/kakak";

/** What the Kakak pendamping screen shows. */
export interface CompanionsParams {
  /** The page of the list, counted from 1. */
  page: number;
}

const PAGE = /^[1-9]\d{0,5}$/;

/**
 * What the address asks the screen for. Nothing in an address is trusted:
 * a page that is not understood counts as the first one.
 */
export function readCompanionsParams(params: SearchParams): CompanionsParams {
  const page = firstParam(params.hal);
  return { page: PAGE.test(page) ? Number(page) : 1 };
}

/** The address of a page of the list. The first page is left out. */
export function companionsAddress(page: number): string {
  if (page <= 1) return COMPANIONS_ADDRESS;
  const params = new URLSearchParams({ hal: String(page) });
  return `${COMPANIONS_ADDRESS}?${params}`;
}
