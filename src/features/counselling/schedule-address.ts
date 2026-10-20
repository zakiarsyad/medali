import { firstParam, type SearchParams } from "@/ui/search-params";
import { ACTIVE_STATUSES, type ScheduleStatus } from "./schedule-ids";

/*
 * The address of "Jadwal konseling" and what it asks for. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const COUNSELLING_ADDRESS = "/konseling";

/** How many request cards one page shows. */
export const SCHEDULES_PAGE_SIZE = 20;

/** The choices of the Status filter. */
export type ScheduleFilter = "needs_action" | "active" | "scheduled" | "all";

export const FILTER_ORDER: ScheduleFilter[] = [
  "needs_action",
  "active",
  "scheduled",
  "all",
];

/** Each choice as the address names it. */
const FILTER_NAMES: Record<ScheduleFilter, string> = {
  needs_action: "perlu",
  active: "aktif",
  scheduled: "dijadwalkan",
  all: "semua",
};

export const FILTER_WORDS: Record<ScheduleFilter, string> = {
  needs_action: "Perlu ditindaklanjuti",
  active: "Semua yang aktif",
  scheduled: "Dijadwalkan",
  all: "Semua",
};

/** The statuses a choice shows, or null for every status. */
export function statusesOf(filter: ScheduleFilter): ScheduleStatus[] | null {
  if (filter === "needs_action") return ["submitted"];
  if (filter === "scheduled") return ["scheduled"];
  if (filter === "active") return [...ACTIVE_STATUSES];
  return null;
}

export interface ScheduleListParams {
  filter: ScheduleFilter;
  /** The page of the cards, counted from 1. */
  page: number;
}

const PAGE = /^[1-9]\d{0,5}$/;

/** The choice a name of the address stands for, or the first for any other. */
export function filterNamed(sent: string): ScheduleFilter {
  const named = FILTER_ORDER.find((filter) => FILTER_NAMES[filter] === sent);
  return named ?? "needs_action";
}

/** What the address asks the cards for. Nothing in an address is trusted. */
export function readScheduleListParams(
  params: SearchParams,
): ScheduleListParams {
  const page = firstParam(params.hal);
  return {
    filter: filterNamed(firstParam(params.status)),
    page: PAGE.test(page) ? Number(page) : 1,
  };
}

/** The name of a choice in the address. */
export function filterName(filter: ScheduleFilter): string {
  return FILTER_NAMES[filter];
}

/**
 * The address of a page of the cards with this choice. The first choice
 * and the first page are left out.
 */
export function scheduleListAddress(filter: ScheduleFilter, page = 1): string {
  const params = new URLSearchParams();
  if (filter !== "needs_action") params.set("status", FILTER_NAMES[filter]);
  if (page > 1) params.set("hal", String(page));
  const search = params.toString();
  if (search === "") return COUNSELLING_ADDRESS;
  return `${COUNSELLING_ADDRESS}?${search}`;
}
