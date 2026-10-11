import { entryPath } from "@/db/schema";
import { firstParam, type SearchParams } from "@/ui/search-params";
import { NAME_MAX_LENGTH } from "./input-limits";
import { CATEGORIES, type CategoryField } from "./labels";
import { addressOf } from "./new-students-address";

export const STUDENT_LIST_ADDRESS = "/mahasiswa";

/** Aktif dan cuti, Semua status, or Non aktif. */
export type StatusChoice = "current" | "all" | "inactive";

export type EntryPath = (typeof entryPath.enumValues)[number];

/** The filters of the top bar. Null means every choice. */
export interface TopFilters {
  studyProgramId: number | null;
  entryPath: EntryPath | null;
  category: CategoryField | null;
}

export interface StudentListFilters extends TopFilters {
  query: string;
  cohortYear: number | null;
  status: StatusChoice;
}

export interface StudentListParams {
  filters: StudentListFilters;
}

const NO_TOP_FILTERS: TopFilters = {
  studyProgramId: null,
  entryPath: null,
  category: null,
};

/** How the list opens: Aktif dan cuti, and nothing else chosen. */
export const NO_FILTERS: StudentListFilters = {
  query: "",
  cohortYear: null,
  status: "current",
  ...NO_TOP_FILTERS,
};

/** Each status choice as the address writes it. */
export const STATUS_IN_ADDRESS: Record<StatusChoice, string> = {
  current: "aktif",
  all: "semua",
  inactive: "nonaktif",
};

const YEAR = /^\d{4}$/;
/** Short enough to fit the number the database keeps for a program studi. */
const PROGRAM_ID = /^[1-9]\d{0,8}$/;

function readStatus(text: string): StatusChoice {
  if (text === STATUS_IN_ADDRESS.all) return "all";
  if (text === STATUS_IN_ADDRESS.inactive) return "inactive";
  return NO_FILTERS.status;
}

function readTopFilters(params: SearchParams): TopFilters {
  const program = firstParam(params.prodi);
  const path = firstParam(params.jalur);
  const category = firstParam(params.kategori);
  return {
    studyProgramId: PROGRAM_ID.test(program) ? Number(program) : null,
    entryPath: entryPath.enumValues.find((one) => one === path) ?? null,
    category: CATEGORIES.find((one) => one.field === category)?.field ?? null,
  };
}

/**
 * What the address asks the list for. Nothing in an address is trusted: a
 * part that is not understood counts as not chosen.
 */
export function readStudentListParams(params: SearchParams): StudentListParams {
  const year = firstParam(params.angkatan);
  return {
    filters: {
      query: firstParam(params.q).trim().slice(0, NAME_MAX_LENGTH),
      cohortYear: YEAR.test(year) ? Number(year) : null,
      status: readStatus(firstParam(params.status)),
      ...readTopFilters(params),
    },
  };
}

/** How many filters of the top bar are in use. */
export function topFiltersInUse(filters: TopFilters): number {
  const chosen = [filters.studyProgramId, filters.entryPath, filters.category];
  return chosen.filter((choice) => choice !== null).length;
}

/** The same filters with those of the top bar cleared. */
export function withoutTopFilters(
  filters: StudentListFilters,
): StudentListFilters {
  return { ...filters, ...NO_TOP_FILTERS };
}

/** The address of the list with these filters. What is not chosen is left out. */
export function studentListAddress(filters: StudentListFilters): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.cohortYear !== null) {
    params.set("angkatan", String(filters.cohortYear));
  }
  if (filters.status !== NO_FILTERS.status) {
    params.set("status", STATUS_IN_ADDRESS[filters.status]);
  }
  if (filters.studyProgramId !== null) {
    params.set("prodi", String(filters.studyProgramId));
  }
  if (filters.entryPath) params.set("jalur", filters.entryPath);
  if (filters.category) params.set("kategori", filters.category);
  return addressOf(STUDENT_LIST_ADDRESS, params.toString());
}
