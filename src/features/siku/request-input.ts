import { isDay } from "@/db/is-day";
import type { Parsed } from "@/parsed";
import {
  PHOTOS_MAX,
  PHOTOS_MIN,
  REPORT_MAX_LENGTH,
  REPORT_MIN_LENGTH,
} from "./request-ids";
import { NO_PHOTO, TOO_MANY_PHOTOS } from "./request-photo";
import { GAIN_REASONS, type SikuReason } from "./siku-ids";

/*
 * What a request for a SIKU gain must hold, checked in the browser to
 * answer at once and again on the server. Read by the form in the
 * browser, so nothing here may take from the database code.
 */

export const NO_REASON = "Pilih kriteria penambahan.";
export const NO_DAY = "Isi tanggal kegiatan.";
export const DAY_IN_FUTURE = "Tanggal kegiatan tidak boleh di masa depan.";
export const REPORT_TOO_SHORT =
  "Keterangan minimal 20 karakter agar penilai memahami kegiatan Anda.";
export const REPORT_TOO_LONG = `Keterangan paling banyak ${REPORT_MAX_LENGTH.toLocaleString("id-ID")} karakter.`;

/** A request as the form holds it, every field as text. */
export interface RequestDraft {
  reason: string;
  day: string;
  report: string;
  photoCount: number;
}

/** A checked request, without its photos, which are checked apart. */
export interface RequestInput {
  reason: SikuReason;
  day: string;
  report: string;
}

/** The database keeps no text with this character; only a hand-made form sends it. */
const NOT_KEPT_AS_TEXT = "\u0000";

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function gainReasonOf(sent: string): SikuReason | null {
  return GAIN_REASONS.find((reason) => reason === sent) ?? null;
}

/**
 * Checks a request as the form holds it, `today` being the day on
 * campus, in the order the form asks: Kriteria penambahan, Tanggal
 * kegiatan, Keterangan and the photos. The activity may be of any age.
 */
export function parseRequest(
  draft: RequestDraft,
  today: string,
): Parsed<RequestInput> {
  const reason = gainReasonOf(draft.reason);
  if (reason === null) return refused(NO_REASON);
  if (!isDay(draft.day)) return refused(NO_DAY);
  if (draft.day > today) return refused(DAY_IN_FUTURE);
  const report = draft.report.replaceAll(NOT_KEPT_AS_TEXT, "").trim();
  if (report.length < REPORT_MIN_LENGTH) return refused(REPORT_TOO_SHORT);
  if (report.length > REPORT_MAX_LENGTH) return refused(REPORT_TOO_LONG);
  if (draft.photoCount < PHOTOS_MIN) return refused(NO_PHOTO);
  if (draft.photoCount > PHOTOS_MAX) return refused(TOO_MANY_PHOTOS);
  return { ok: true, value: { reason, day: draft.day, report } };
}
