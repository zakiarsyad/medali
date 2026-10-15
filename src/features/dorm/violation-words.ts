import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import { shownDay } from "@/ui/day";
import type { Punishment } from "./violation-ids";
import type { ViolationStatus } from "./violation-status";

/*
 * How Pelanggaran asrama says things on screen. Read by the screen parts
 * in the browser, so nothing here may take from the database code.
 */

export const PUNISHMENT_WORDS: Record<Punishment, string> = {
  direct_action: "Penindakan langsung",
  warning: "Teguran",
  tks: "TKS",
  other: "Hukuman lainnya",
};

export const STATUS_WORDS: Record<ViolationStatus, string> = {
  scheduled: "Terjadwal",
  appeal: "Masa advokasi",
  escalated: "Naik ke Pengelola",
};

/** The punishment as a list shows it: what Hukuman lainnya is, when it is that. */
export function punishmentText(
  punishment: Punishment,
  otherPunishment: string,
): string {
  if (punishment === "other" && otherPunishment !== "") return otherPunishment;
  return PUNISHMENT_WORDS[punishment];
}

/** A moment on campus as the tab shows it, such as 12 Okt 2026 21:00. */
export function shownHour(at: Date): string {
  return `${shownDay(campusDay(at))} ${campusTime(at)}`;
}
