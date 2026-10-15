import { firstParam, type SearchParams } from "@/ui/search-params";

/*
 * The address of Pelanggaran asrama and what it asks for. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const VIOLATIONS_ADDRESS = "/asrama/pel";

/** What the staff screen of Pelanggaran shows. */
export interface StaffViolationParams {
  /** The page of Jadwal publikasi, counted from 1. */
  schedulePage: number;
}

const PAGE = /^[1-9]\d{0,5}$/;

/** A page number of the address, or the first page when it is not one. */
export function pageOf(sent: string): number {
  return PAGE.test(sent) ? Number(sent) : 1;
}

/**
 * What the address asks the staff screen for. Nothing in an address is
 * trusted: a page that is not understood counts as the first one.
 */
export function readStaffViolationParams(
  params: SearchParams,
): StaffViolationParams {
  return { schedulePage: pageOf(firstParam(params.jadwal)) };
}

/** The address of the staff screen. The first pages are left out. */
export function staffViolationsAddress(params: StaffViolationParams): string {
  const search = new URLSearchParams();
  if (params.schedulePage > 1) {
    search.set("jadwal", String(params.schedulePage));
  }
  const text = search.toString();
  return text === "" ? VIOLATIONS_ADDRESS : `${VIOLATIONS_ADDRESS}?${text}`;
}
