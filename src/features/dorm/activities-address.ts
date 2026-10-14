import { isDay } from "@/db/is-day";
import { firstParam, type SearchParams } from "@/ui/search-params";

export const ACTIVITIES_ADDRESS = "/asrama/kegiatan";

/** The three lists of Kegiatan asrama, as the address names them. */
export const ACTIVITY_VIEWS = ["harian", "rutin", "nonrutin"] as const;

export type ActivityView = (typeof ACTIVITY_VIEWS)[number];

export const VIEW_WORDS: Record<ActivityView, string> = {
  harian: "Jadwal harian",
  rutin: "Kegiatan rutin",
  nonrutin: "Kegiatan non rutin",
};

/** What the Kegiatan asrama screen shows. */
export interface ActivitiesParams {
  view: ActivityView;
  /** The day of Jadwal harian. */
  day: string;
  /** The page of Kegiatan non rutin, counted from 1. */
  page: number;
}

const PAGE = /^[1-9]\d{0,5}$/;
/** The days Jadwal harian opens: a day far outside them is a typing slip. */
const FIRST_DAY = "2000-01-01";
const LAST_DAY = "2199-12-31";

function isOpenable(day: string): boolean {
  return isDay(day) && day >= FIRST_DAY && day <= LAST_DAY;
}

/**
 * What the address asks the screen for. Nothing in an address is trusted:
 * a list that is not understood counts as Jadwal harian, a day as today,
 * and a page as the first one.
 */
export function readActivitiesParams(
  params: SearchParams,
  today: string,
): ActivitiesParams {
  const view = firstParam(params.lihat);
  const day = firstParam(params.tgl);
  const page = firstParam(params.hal);
  return {
    view: ACTIVITY_VIEWS.find((known) => known === view) ?? "harian",
    day: isOpenable(day) ? day : today,
    page: PAGE.test(page) ? Number(page) : 1,
  };
}

/**
 * The address of the screen. Jadwal harian, today and the first page are
 * left out, and so are the day and the page of a list that has none.
 */
export function activitiesAddress(
  { view, day, page }: ActivitiesParams,
  today: string,
): string {
  const params = new URLSearchParams();
  if (view !== "harian") params.set("lihat", view);
  if (view === "harian" && day !== today) params.set("tgl", day);
  if (view === "nonrutin" && page > 1) params.set("hal", String(page));
  const text = params.toString();
  return text === "" ? ACTIVITIES_ADDRESS : `${ACTIVITIES_ADDRESS}?${text}`;
}
