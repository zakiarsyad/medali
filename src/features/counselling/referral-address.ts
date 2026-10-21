import { firstParam, type SearchParams } from "@/ui/search-params";
import { COUNSELLING_ADDRESS } from "./schedule-address";

/*
 * The address of a page of "Rujukan potensi kesehatan mental dari
 * asrama". Read by the screen parts in the browser, so nothing here may
 * take from the database code.
 */

/** How many referrals one page shows. */
export const REFERRALS_PAGE_SIZE = 20;

const PAGE = /^[1-9]\d{0,5}$/;

/** The page of the referrals the address asks for: the first for anything else. */
export function readReferralPage(params: SearchParams): number {
  const page = firstParam(params.rujukan);
  return PAGE.test(page) ? Number(page) : 1;
}

/** The address of a page of the referrals; the first page names none. */
export function referralAddress(page: number): string {
  if (page <= 1) return COUNSELLING_ADDRESS;
  return `${COUNSELLING_ADDRESS}?rujukan=${page}`;
}
