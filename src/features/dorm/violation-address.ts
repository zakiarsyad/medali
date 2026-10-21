import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import { firstParam, type SearchParams } from "@/ui/search-params";
import { searchText } from "@/ui/search-text";

/*
 * The address of Pelanggaran asrama and what it asks for. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const VIOLATIONS_ADDRESS = "/asrama/pel";

/** What the staff screen of Pelanggaran shows. */
export interface StaffViolationParams {
  /** The page of "Advokasi masuk", counted from 1. */
  appealPage: number;
  /** The page of Jadwal publikasi, counted from 1. */
  schedulePage: number;
  /** The violation day of "Pengumuman pelanggaran", or null for the latest. */
  day: string | null;
  /** The page of "Pengumuman pelanggaran", counted from 1. */
  announcementPage: number;
  /** The semester of the rekap, or null for the running one. */
  periodId: string | null;
  /** The text to find in a name or a NIM. Empty when nothing is searched. */
  query: string;
  /** The page of the rekap, counted from 1. */
  page: number;
  /** The student whose violations show in a box, or null for none. */
  studentId: string | null;
  /** The page of the box, counted from 1. */
  studentPage: number;
  /** The period of the account's own record, for a resident who is also staff. */
  ownPeriodId: string | "all" | null;
  /** The page of the account's own record, counted from 1. */
  ownPage: number;
  /** The page of "Pengajuan hukuman disiplin dari Pengelola Asrama", counted from 1. */
  proposalPage: number;
  /** The page of "Panggilan klarifikasi dan surat peringatan", counted from 1. */
  callPage: number;
  /** The student whose call is open in a box to process, or null for none. */
  callStudentId: string | null;
  /** The page of "Riwayat pengurangan pelanggaran", counted from 1. */
  reductionPage: number;
}

/** What the screen of a resident shows. */
export interface OwnViolationParams {
  /** The period of "Rekam jejak pelanggaran saya", or "all" for every one, or null for the running one. */
  periodId: string | "all" | null;
  /** The page of "Rekam jejak pelanggaran saya", counted from 1. */
  page: number;
  day: string | null;
  announcementPage: number;
}

/** How the address names "Semua periode". */
export const ALL_PERIODS = "semua";

const PAGE = /^[1-9]\d{0,5}$/;

/** A page number of the address, or the first page when it is not one. */
export function pageOf(sent: string): number {
  return PAGE.test(sent) ? Number(sent) : 1;
}

function dayOf(sent: string): string | null {
  return isDay(sent) ? sent : null;
}

/**
 * A key of the address in small letters. The database reads a key in
 * capitals as the same row, so a comparison with the account's own
 * student, as for "Proses", must see the one written form.
 */
function keyOf(sent: string): string | null {
  return isUuid(sent) ? sent.toLowerCase() : null;
}

function ownPeriodOf(sent: string): string | "all" | null {
  return sent === ALL_PERIODS ? "all" : keyOf(sent);
}

function setOwnPeriod(search: URLSearchParams, periodId: string | null) {
  if (periodId === "all") search.set("periode", ALL_PERIODS);
  if (periodId !== null && periodId !== "all") search.set("periode", periodId);
}

/**
 * What the address asks the staff screen for. Nothing in an address is
 * trusted: a part that is not understood counts as not chosen, a page as
 * the first one, and a text too long to search for is left out.
 */
export function readStaffViolationParams(
  params: SearchParams,
): StaffViolationParams {
  return {
    appealPage: pageOf(firstParam(params.advokasi)),
    schedulePage: pageOf(firstParam(params.jadwal)),
    day: dayOf(firstParam(params.tgl)),
    announcementPage: pageOf(firstParam(params.umum)),
    periodId: keyOf(firstParam(params.sem)),
    query: searchText(firstParam(params.cari)) ?? "",
    page: pageOf(firstParam(params.hal)),
    studentId: keyOf(firstParam(params.mhs)),
    studentPage: pageOf(firstParam(params.mhshal)),
    ownPeriodId: ownPeriodOf(firstParam(params.periode)),
    ownPage: pageOf(firstParam(params.rekam)),
    proposalPage: pageOf(firstParam(params.pengajuan)),
    callPage: pageOf(firstParam(params.panggilan)),
    callStudentId: keyOf(firstParam(params.proses)),
    reductionPage: pageOf(firstParam(params.kurang)),
  };
}

/** What the address asks the screen of a resident for, read as for staff. */
export function readOwnViolationParams(
  params: SearchParams,
): OwnViolationParams {
  return {
    periodId: ownPeriodOf(firstParam(params.periode)),
    page: pageOf(firstParam(params.hal)),
    day: dayOf(firstParam(params.tgl)),
    announcementPage: pageOf(firstParam(params.umum)),
  };
}

function withSearch(search: URLSearchParams): string {
  const text = search.toString();
  return text === "" ? VIOLATIONS_ADDRESS : `${VIOLATIONS_ADDRESS}?${text}`;
}

function setPage(search: URLSearchParams, name: string, page: number) {
  if (page > 1) search.set(name, String(page));
}

/** The address of the staff screen. What is not chosen and first pages are left out. */
export function staffViolationsAddress(params: StaffViolationParams): string {
  const search = new URLSearchParams();
  setPage(search, "advokasi", params.appealPage);
  setPage(search, "jadwal", params.schedulePage);
  if (params.day !== null) search.set("tgl", params.day);
  setPage(search, "umum", params.announcementPage);
  if (params.periodId !== null) search.set("sem", params.periodId);
  if (params.query !== "") search.set("cari", params.query);
  setPage(search, "hal", params.page);
  if (params.studentId !== null) search.set("mhs", params.studentId);
  setPage(search, "mhshal", params.studentPage);
  setOwnPeriod(search, params.ownPeriodId);
  setPage(search, "rekam", params.ownPage);
  setPage(search, "pengajuan", params.proposalPage);
  setPage(search, "panggilan", params.callPage);
  if (params.callStudentId !== null) search.set("proses", params.callStudentId);
  setPage(search, "kurang", params.reductionPage);
  return withSearch(search);
}

/** Where the proof of an appeal is downloaded from the server. */
export function appealProofAddress(appealId: string): string {
  return `${VIOLATIONS_ADDRESS}/bukti/${appealId}`;
}

/** The address of the screen of a resident, read the same way. */
export function ownViolationsAddress(params: OwnViolationParams): string {
  const search = new URLSearchParams();
  setOwnPeriod(search, params.periodId);
  setPage(search, "hal", params.page);
  if (params.day !== null) search.set("tgl", params.day);
  setPage(search, "umum", params.announcementPage);
  return withSearch(search);
}
