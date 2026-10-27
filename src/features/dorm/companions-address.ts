import { firstParam, type SearchParams } from "@/ui/search-params";
import { withoutNullCharacter } from "@/ui/search-text";
import { SEARCH_MAX_LENGTH } from "./room-limits";

export const COMPANIONS_ADDRESS = "/asrama/kakak";

/** What the Kakak pendamping screen shows. */
export interface CompanionsParams {
  /** The page of the list, counted from 1. */
  page: number;
  /** The text the students offered in the form are searched for. */
  query: string;
}

const PAGE = /^[1-9]\d{0,5}$/;

/**
 * What the address asks the screen for. Nothing in an address is trusted:
 * a page that is not understood counts as the first one.
 */
export function readCompanionsParams(params: SearchParams): CompanionsParams {
  const page = firstParam(params.hal);
  return {
    page: PAGE.test(page) ? Number(page) : 1,
    query: withoutNullCharacter(firstParam(params.q))
      .trim()
      .slice(0, SEARCH_MAX_LENGTH),
  };
}

/**
 * The address of the screen. The first page and an empty search are left
 * out.
 */
export function companionsAddress({ page, query }: CompanionsParams): string {
  const params = new URLSearchParams();
  if (query !== "") params.set("q", query);
  if (page > 1) params.set("hal", String(page));
  const text = params.toString();
  return text === "" ? COMPANIONS_ADDRESS : `${COMPANIONS_ADDRESS}?${text}`;
}
