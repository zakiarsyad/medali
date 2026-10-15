import { isDay } from "@/db/is-day";
import { DORM_IDS, type DormId } from "@/dorms/dorms";
import { firstParam, type SearchParams } from "@/ui/search-params";

export const CLEANING_ADDRESS = "/asrama/bersih";

/** What the Pembersihan asrama screen shows. */
export interface CleaningParams {
  /** The dorm the switch shows, or null for Semua asrama. */
  dorm: DormId | null;
  /** The date of Jadwal pembersihan. */
  day: string;
  /** The page of the rooms cleaning their own room, counted from 1. */
  page: number;
  /** The page of "Skor kebersihan kamar", counted from 1. */
  scorePage: number;
}

const PAGE = /^[1-9]\d{0,5}$/;
/** The dates the schedule opens: a date far outside them is a typing slip. */
const FIRST_DAY = "2000-01-01";
const LAST_DAY = "2199-12-31";

function isOpenable(day: string): boolean {
  return isDay(day) && day >= FIRST_DAY && day <= LAST_DAY;
}

/**
 * What the address asks the screen for. Nothing in an address is trusted:
 * a dorm that is not understood counts as Semua asrama, a date as today,
 * and a page as the first one.
 */
export function readCleaningParams(
  params: SearchParams,
  today: string,
): CleaningParams {
  const dorm = firstParam(params.asrama);
  const day = firstParam(params.tgl);
  const page = firstParam(params.hal);
  const scorePage = firstParam(params.skor);
  return {
    dorm: DORM_IDS.find((id) => id === dorm) ?? null,
    day: isOpenable(day) ? day : today,
    page: pageOf(page),
    scorePage: pageOf(scorePage),
  };
}

/** A page number of the address, or the first page when it is not one. */
function pageOf(sent: string): number {
  return PAGE.test(sent) ? Number(sent) : 1;
}

/** The dorms the screen shows: the one picked, or all four. */
export function shownDorms(params: Pick<CleaningParams, "dorm">) {
  return params.dorm === null ? DORM_IDS : [params.dorm];
}

/** The address of the screen. Semua asrama, today and the first pages are left out. */
export function cleaningAddress(
  { dorm, day, page, scorePage }: CleaningParams,
  today: string,
): string {
  const params = new URLSearchParams();
  if (dorm !== null) params.set("asrama", dorm);
  if (day !== today) params.set("tgl", day);
  if (page > 1) params.set("hal", String(page));
  if (scorePage > 1) params.set("skor", String(scorePage));
  const text = params.toString();
  return text === "" ? CLEANING_ADDRESS : `${CLEANING_ADDRESS}?${text}`;
}
