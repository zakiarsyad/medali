import { firstParam, type SearchParams } from "@/ui/search-params";
import {
  ACTIVE_STATUSES,
  SCHEDULE_KINDS,
  type ScheduleKind,
  type ScheduleStatus,
  TO_SCHEDULE_STATUSES,
} from "./schedule-ids";

/*
 * The address of "Jadwal konseling" and what it asks for. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const COUNSELLING_ADDRESS = "/konseling";

/** How many request cards one page shows. */
export const SCHEDULES_PAGE_SIZE = 20;

/** The choices of the Status filter. */
export type ScheduleFilter =
  | "needs_action"
  | "active"
  | "scheduled"
  | "done"
  | "missed"
  | "cancelled"
  | "all";

export const FILTER_ORDER: ScheduleFilter[] = [
  "needs_action",
  "active",
  "scheduled",
  "done",
  "missed",
  "cancelled",
  "all",
];

/** Each choice as the address names it. */
const FILTER_NAMES: Record<ScheduleFilter, string> = {
  needs_action: "perlu",
  active: "aktif",
  scheduled: "dijadwalkan",
  done: "selesai",
  missed: "tidak-hadir",
  cancelled: "dibatalkan",
  all: "semua",
};

export const FILTER_WORDS: Record<ScheduleFilter, string> = {
  needs_action: "Perlu ditindaklanjuti",
  active: "Semua yang aktif",
  scheduled: "Dijadwalkan",
  done: "Selesai",
  missed: "Tidak hadir",
  cancelled: "Dibatalkan",
  all: "Semua",
};

/** The statuses a choice shows, or null for every status. */
export function statusesOf(filter: ScheduleFilter): ScheduleStatus[] | null {
  if (filter === "all") return null;
  if (filter === "needs_action") return [...TO_SCHEDULE_STATUSES];
  if (filter === "active") return [...ACTIVE_STATUSES];
  return [filter];
}

export interface ScheduleListParams {
  filter: ScheduleFilter;
  /** The page of the cards, counted from 1. */
  page: number;
  /** The Jenis filter; none for "Semua jenis". */
  kind?: ScheduleKind | null;
}

/** Each Jenis as the address names it. */
const KIND_NAMES: Record<ScheduleKind, string> = {
  voluntary: "sukarela",
  assigned: "penugasan",
  called: "pemanggilan",
};

/** The Jenis a name of the address stands for, or none for any other. */
export function kindNamed(sent: string): ScheduleKind | null {
  return SCHEDULE_KINDS.find((kind) => KIND_NAMES[kind] === sent) ?? null;
}

/** The name of a Jenis in the address, and "" for "Semua jenis". */
export function kindName(kind: ScheduleKind | null): string {
  return kind === null ? "" : KIND_NAMES[kind];
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
): Required<ScheduleListParams> {
  const page = firstParam(params.hal);
  return {
    filter: filterNamed(firstParam(params.status)),
    page: PAGE.test(page) ? Number(page) : 1,
    kind: kindNamed(firstParam(params.jenis)),
  };
}

/** The name of a choice in the address. */
export function filterName(filter: ScheduleFilter): string {
  return FILTER_NAMES[filter];
}

/**
 * The address of a page of the cards with this choice and Jenis. The
 * first choice, the first page and "Semua jenis" are left out.
 */
export function scheduleListAddress(
  filter: ScheduleFilter,
  page = 1,
  kind: ScheduleKind | null = null,
): string {
  const params = new URLSearchParams();
  if (filter !== "needs_action") params.set("status", FILTER_NAMES[filter]);
  if (kind !== null) params.set("jenis", KIND_NAMES[kind]);
  if (page > 1) params.set("hal", String(page));
  const search = params.toString();
  if (search === "") return COUNSELLING_ADDRESS;
  return `${COUNSELLING_ADDRESS}?${search}`;
}

/** How many lines of the student's "Riwayat" one step shows. */
export const HISTORY_PAGE_SIZE = 10;

/**
 * How many lines of "Riwayat" the address asks for: 10 for each step,
 * the first step when it asks nothing it understands.
 */
export function readHistoryShown(params: SearchParams): number {
  const steps = firstParam(params.riwayat);
  return (PAGE.test(steps) ? Number(steps) : 1) * HISTORY_PAGE_SIZE;
}

/** The address that shows 10 lines of "Riwayat" more than `shown`. */
export function moreHistoryAddress(shown: number): string {
  const steps = Math.floor(shown / HISTORY_PAGE_SIZE) + 1;
  return `${COUNSELLING_ADDRESS}?riwayat=${steps}`;
}
