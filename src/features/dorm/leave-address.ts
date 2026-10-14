import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";
import { LEAVE_KINDS, type LeaveKind, type LeaveStatus } from "./leave-ids";
import { KIND_SHORT_WORDS } from "./leave-words";

/*
 * The address of Perizinan asrama and what it asks for. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const LEAVE_ADDRESS = "/asrama/izin";

/** How many request cards one page of the staff list shows. */
export const LEAVE_CARDS_PAGE_SIZE = 20;

/**
 * Where the return from leave stands, for narrowing the staff list: a
 * report waits, the resident is out, or the return is late.
 */
export type ReturnChoice = "reports" | "out" | "late";

/** The statuses the staff list can be narrowed to, and every status. */
export type StatusChoice = LeaveStatus | ReturnChoice | "all";

/** The choices in the order the list offers them; the first is chosen at the start. */
export const STATUS_CHOICE_ORDER: StatusChoice[] = [
  "submitted",
  "reports",
  "out",
  "late",
  "approved",
  "completed",
  "rejected",
  "cancelled",
  "all",
];

/** Each status choice as the address names it. */
export const STATUS_CHOICES: Record<StatusChoice, string> = {
  submitted: "diajukan",
  reports: "laporan-kembali",
  out: "di-luar",
  late: "terlambat",
  approved: "disetujui",
  completed: "selesai",
  rejected: "ditolak",
  cancelled: "dibatalkan",
  all: "semua",
};

export const STATUS_CHOICE_WORDS: Record<StatusChoice, string> = {
  submitted: "Menunggu verifikasi",
  reports: "Laporan kembali menunggu",
  out: "Sedang di luar",
  late: "Terlambat kembali",
  approved: "Disetujui",
  completed: "Selesai",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  all: "Semua",
};

/** The kinds the list can be narrowed to, and every kind. */
export type KindChoice = LeaveKind | "all";

export const KIND_CHOICE_ORDER: KindChoice[] = ["all", ...LEAVE_KINDS];

/** Each kind choice as the address names it. */
export const KIND_CHOICES: Record<KindChoice, string> = {
  all: "",
  outing: "pesiar",
  skip_activities: "itmk",
  special: "khusus",
};

export const KIND_CHOICE_WORDS: Record<KindChoice, string> = {
  all: "Semua jenis",
  ...KIND_SHORT_WORDS,
};

export interface LeaveFilters {
  /** The text to find in a name or a NIM. Empty when nothing is searched. */
  query: string;
  status: StatusChoice;
  kind: KindChoice;
}

export interface LeaveListParams {
  filters: LeaveFilters;
  /** The page of the list, counted from 1. */
  page: number;
}

const PAGE = /^[1-9]\d{0,5}$/;

/** The status choice an address names, or Menunggu verifikasi for any other. */
export function statusNamed(sent: string): StatusChoice {
  const named = STATUS_CHOICE_ORDER.find(
    (choice) => STATUS_CHOICES[choice] === sent,
  );
  return named ?? "submitted";
}

/** The kind choice an address names, or every kind for any other. */
export function kindNamed(sent: string): KindChoice {
  const named = KIND_CHOICE_ORDER.find(
    (choice) => KIND_CHOICES[choice] === sent,
  );
  return named ?? "all";
}

/** The page an address asks for, or the first for anything else. */
export function pageOf(params: SearchParams): number {
  const page = firstParam(params.hal);
  return PAGE.test(page) ? Number(page) : 1;
}

/**
 * What the address asks the staff list for. Nothing in an address is
 * trusted: a part that is not understood counts as not chosen, and a
 * text too long to search for is left out.
 */
export function readLeaveListParams(params: SearchParams): LeaveListParams {
  return {
    filters: {
      query: searchText(firstParam(params.cari)) ?? "",
      status: statusNamed(firstParam(params.status)),
      kind: kindNamed(firstParam(params.jenis)),
    },
    page: pageOf(params),
  };
}

/**
 * The address of a page of the staff list with these filters. What is
 * not chosen is left out, and so are Menunggu verifikasi and the first
 * page.
 */
export function leaveListAddress(filters: LeaveFilters, page = 1): string {
  const params = new URLSearchParams();
  if (filters.query !== "") params.set("cari", filters.query);
  if (filters.status !== "submitted") {
    params.set("status", STATUS_CHOICES[filters.status]);
  }
  if (filters.kind !== "all") params.set("jenis", KIND_CHOICES[filters.kind]);
  if (page > 1) params.set("hal", String(page));
  const search = params.toString();
  if (search === "") return LEAVE_ADDRESS;
  return `${LEAVE_ADDRESS}?${search}`;
}

/** The address of a page of "Riwayat izin saya". */
export function ownLeaveAddress(page: number): string {
  if (page <= 1) return LEAVE_ADDRESS;
  return `${LEAVE_ADDRESS}?hal=${page}`;
}
