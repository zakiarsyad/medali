import { entryPath } from "@/db/schema";
import { DORM_IDS, type DormId } from "@/dorms/dorms";
import { firstParam, type SearchParams } from "@/ui/search-params";
import { ORIGIN_AGENCIES, PROVINCES } from "./fixed-lists";
import { NAME_MAX_LENGTH } from "./input-limits";
import { CATEGORIES, type CategoryField } from "./labels";
import { addressOf } from "./new-students-address";

export const STUDENT_LIST_ADDRESS = "/mahasiswa";

/** Aktif dan cuti, Semua status, or Non aktif. */
export type StatusChoice = "current" | "all" | "inactive";

export type EntryPath = (typeof entryPath.enumValues)[number];

/** The Instansi choice that finds the students who came from no instansi. */
export const NO_AGENCY = "tanpa";

/** The Asrama choice that finds the students who live in no dorm. */
export const NO_DORM = "non";

export type DormChoice = DormId | typeof NO_DORM;

/** The filters of the top bar. Null means every choice. */
export interface TopFilters {
  studyProgramId: number | null;
  entryPath: EntryPath | null;
  category: CategoryField | null;
  /** The number of a tahap, 1 to 4. */
  stageNo: number | null;
  province: string | null;
  /** The name of an instansi, or `NO_AGENCY`. */
  originAgency: string | null;
  /** A dorm, or `NO_DORM`. */
  dorm: DormChoice | null;
}

export interface StudentListFilters extends TopFilters {
  query: string;
  cohortYear: number | null;
  status: StatusChoice;
}

export interface StudentListParams {
  filters: StudentListFilters;
  /** The page of the list, counted from 1. */
  page: number;
  /**
   * What the address gives as the id of the student whose detail is open
   * over the list, or null when it names none. It is not checked here: the
   * read of the detail answers "not found" for what is no id.
   */
  detailId: string | null;
}

const NO_TOP_FILTERS: TopFilters = {
  studyProgramId: null,
  entryPath: null,
  category: null,
  stageNo: null,
  province: null,
  originAgency: null,
  dorm: null,
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
const PAGE = /^[1-9]\d{0,5}$/;
/** Short enough to fit the number the database keeps for a program studi. */
const PROGRAM_ID = /^[1-9]\d{0,8}$/;
const STAGE_NO = /^[1-4]$/;
/** As long as the id of a record is. */
const ID_LENGTH = 36;

function readStatus(text: string): StatusChoice {
  if (text === STATUS_IN_ADDRESS.all) return "all";
  if (text === STATUS_IN_ADDRESS.inactive) return "inactive";
  return NO_FILTERS.status;
}

function readAgency(text: string): string | null {
  if (text === NO_AGENCY) return NO_AGENCY;
  return ORIGIN_AGENCIES.find((one) => one === text) ?? null;
}

function readDorm(text: string): DormChoice | null {
  if (text === NO_DORM) return NO_DORM;
  return DORM_IDS.find((one) => one === text) ?? null;
}

function readTopFilters(params: SearchParams): TopFilters {
  const program = firstParam(params.prodi);
  const path = firstParam(params.jalur);
  const category = firstParam(params.kategori);
  const stage = firstParam(params.tahap);
  const province = firstParam(params.provinsi);
  return {
    studyProgramId: PROGRAM_ID.test(program) ? Number(program) : null,
    entryPath: entryPath.enumValues.find((one) => one === path) ?? null,
    category: CATEGORIES.find((one) => one.field === category)?.field ?? null,
    stageNo: STAGE_NO.test(stage) ? Number(stage) : null,
    province: PROVINCES.find((one) => one === province) ?? null,
    originAgency: readAgency(firstParam(params.instansi)),
    dorm: readDorm(firstParam(params.asrama)),
  };
}

/**
 * What the address asks the list for. Nothing in an address is trusted: a
 * part that is not understood counts as not chosen.
 */
export function readStudentListParams(params: SearchParams): StudentListParams {
  const year = firstParam(params.angkatan);
  const page = firstParam(params.hal);
  const detail = firstParam(params.profil).trim().slice(0, ID_LENGTH);
  return {
    page: PAGE.test(page) ? Number(page) : 1,
    detailId: detail === "" ? null : detail,
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
  const chosen = [
    filters.studyProgramId,
    filters.entryPath,
    filters.category,
    filters.stageNo,
    filters.province,
    filters.originAgency,
    filters.dorm,
  ];
  return chosen.filter((choice) => choice !== null).length;
}

/** The same filters with those of the top bar cleared. */
export function withoutTopFilters(
  filters: StudentListFilters,
): StudentListFilters {
  return { ...filters, ...NO_TOP_FILTERS };
}

function setTopFilters(params: URLSearchParams, filters: TopFilters): void {
  if (filters.studyProgramId !== null) {
    params.set("prodi", String(filters.studyProgramId));
  }
  if (filters.entryPath) params.set("jalur", filters.entryPath);
  if (filters.category) params.set("kategori", filters.category);
  if (filters.stageNo !== null) params.set("tahap", String(filters.stageNo));
  if (filters.province) params.set("provinsi", filters.province);
  if (filters.originAgency) params.set("instansi", filters.originAgency);
  if (filters.dorm) params.set("asrama", filters.dorm);
}

function listParams(filters: StudentListFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.cohortYear !== null) {
    params.set("angkatan", String(filters.cohortYear));
  }
  if (filters.status !== NO_FILTERS.status) {
    params.set("status", STATUS_IN_ADDRESS[filters.status]);
  }
  setTopFilters(params, filters);
  if (page > 1) params.set("hal", String(page));
  return params;
}

/**
 * The address of a page of the list with these filters. What is not chosen
 * is left out, and so is the first page.
 */
export function studentListAddress(
  filters: StudentListFilters,
  page = 1,
): string {
  const params = listParams(filters, page);
  return addressOf(STUDENT_LIST_ADDRESS, params.toString());
}

/**
 * The address of a student's detail, open over a page of the list. It
 * names the student by the id of the record, never by NIM, so that no NIM
 * stays in the history of a browser or in the records of requests.
 */
export function studentDetailAddress(
  filters: StudentListFilters,
  page: number,
  studentId: string,
): string {
  const params = listParams(filters, page);
  params.set("profil", studentId);
  return addressOf(STUDENT_LIST_ADDRESS, params.toString());
}
