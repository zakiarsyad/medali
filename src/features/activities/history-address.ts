import { firstParam, type SearchParams } from "@/ui/search-params";

/** Where a student finds their own activities: Kegiatan karakter itself. */
export const STUDENT_ACTIVITIES_ADDRESS = "/kegiatan";

const PAGE = /^[1-9]\d{0,5}$/;

/**
 * The page of the history the address asks for, counted from 1. Nothing
 * in an address is trusted: a part that is not understood is page 1.
 */
export function readHistoryPage(params: SearchParams): number {
  const page = firstParam(params.hal);
  return PAGE.test(page) ? Number(page) : 1;
}

/** The address of a page of the history. The first page has none of its own. */
export function historyAddress(page: number): string {
  if (page <= 1) return STUDENT_ACTIVITIES_ADDRESS;
  return `${STUDENT_ACTIVITIES_ADDRESS}?hal=${page}`;
}
