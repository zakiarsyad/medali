import { DORM_NAMES } from "@/dorms/dorms";
import { COMPANION_DORM_IDS } from "./companion-dorms";

/**
 * How a message names the dorms that have kakak pendamping. Their own
 * residents cannot be kakak pendamping.
 */
export const COMPANION_DORMS_NAMED = COMPANION_DORM_IDS.map(
  (dorm) => DORM_NAMES[dorm],
).join(" atau ");

/** What a change to the kakak pendamping answers to a role without the right. */
export const COMPANIONS_NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak mengelola kakak pendamping.",
} as const;

/**
 * What naming answers, and the screen says, while no academic period runs.
 * No semester is known then, so who lives in a dorm cannot be told.
 */
export const NO_PERIOD_TO_NAME = {
  ok: false,
  error:
    "Belum ada periode akademik yang berjalan, jadi kakak pendamping belum bisa ditetapkan. Minta Kepala Unit mengatur periode akademik.",
} as const;
