/*
 * How a sent health note is checked. Read by the form in the browser and
 * by the server, which checks again what is sent, so nothing here may
 * take from the database code.
 */

import { isDay } from "@/db/is-day";
import type { Parsed } from "@/parsed";
import {
  ADVICE_MAX,
  ILLNESSES,
  type Illness,
  NOTE_CATEGORIES,
  type NoteCategory,
  type NoteIllness,
  SHORT_TEXT_MAX,
} from "./health-ids";

/** A note as the form sends it: every field still a text. */
export interface SentNote {
  studentId: string;
  examinedOn: string;
  examiner: string;
  /** The illnesses picked, each beside its note in `illnessNotes`. */
  illnesses: readonly string[];
  illnessNotes: readonly string[];
  otherHistory: string;
  medicine: string;
  advice: string;
  /** Empty for "Ikuti hasil tes kebugaran". */
  category: string;
}

/** A note the server keeps. */
export interface NoteInput {
  studentId: string;
  examinedOn: string;
  examiner: string | null;
  illnesses: NoteIllness[];
  otherHistory: string;
  medicine: string;
  advice: string;
  category: NoteCategory | null;
}

export const NO_NOTE = "Isi riwayat penyakit atau catatan.";
export const NOTE_NO_DAY = "Isi tanggal.";
export const NOTE_DAY_IN_FUTURE = "Tanggal tidak boleh setelah hari ini.";
export const NOTE_TOO_LONG = `Isian terlalu panjang, jadi catatan tidak disimpan. Pemeriksa, catatan tiap penyakit, Riwayat lain, dan Obat paling banyak ${SHORT_TEXT_MAX} karakter; Catatan dan rekomendasi paling banyak ${ADVICE_MAX} karakter.`;
export const UNKNOWN_CHOICE =
  "Pilihan riwayat penyakit atau pertimbangan kategori tidak dikenal, jadi catatan tidak disimpan. Muat ulang halaman, lalu isi lagi.";

function isIllness(sent: string): sent is Illness {
  return ILLNESSES.some((illness) => illness === sent);
}

function isNoteCategory(sent: string): sent is NoteCategory {
  return NOTE_CATEGORIES.some((category) => category === sent);
}

/** The illnesses picked with their notes, or null when one is not a choice of the form. */
function illnessesOf(sent: SentNote): NoteIllness[] | null {
  if (sent.illnesses.length !== sent.illnessNotes.length) return null;
  if (new Set(sent.illnesses).size !== sent.illnesses.length) return null;
  const picked: NoteIllness[] = [];
  for (const [place, illness] of sent.illnesses.entries()) {
    if (!isIllness(illness)) return null;
    picked.push({ illness, note: (sent.illnessNotes[place] ?? "").trim() });
  }
  return picked;
}

/** "Pertimbangan kategori", null to follow the test; undefined when not a choice. */
function categoryOf(sent: string): NoteCategory | null | undefined {
  if (sent === "") return null;
  return isNoteCategory(sent) ? sent : undefined;
}

function fitsLengths(note: NoteInput): boolean {
  const short = [
    note.examiner ?? "",
    note.otherHistory,
    note.medicine,
    ...note.illnesses.map((each) => each.note),
  ];
  const shortFits = short.every((text) => text.length <= SHORT_TEXT_MAX);
  return shortFits && note.advice.length <= ADVICE_MAX;
}

function isEmpty(note: NoteInput): boolean {
  const hasText =
    note.otherHistory !== "" || note.medicine !== "" || note.advice !== "";
  return note.illnesses.length === 0 && !hasText;
}

/**
 * Checks a sent note: Tanggal is a day not after `today`; the illnesses
 * and "Pertimbangan kategori" are choices of the form; it holds an
 * illness or a text; and no text is longer than allowed. Texts are
 * trimmed, and an empty Pemeriksa is none.
 */
export function parseNote(sent: SentNote, today: string): Parsed<NoteInput> {
  if (!isDay(sent.examinedOn)) return { ok: false, error: NOTE_NO_DAY };
  if (sent.examinedOn > today) return { ok: false, error: NOTE_DAY_IN_FUTURE };
  const illnesses = illnessesOf(sent);
  const category = categoryOf(sent.category);
  if (illnesses === null || category === undefined) {
    return { ok: false, error: UNKNOWN_CHOICE };
  }
  const examiner = sent.examiner.trim();
  const note: NoteInput = {
    studentId: sent.studentId,
    examinedOn: sent.examinedOn,
    examiner: examiner === "" ? null : examiner,
    illnesses,
    otherHistory: sent.otherHistory.trim(),
    medicine: sent.medicine.trim(),
    advice: sent.advice.trim(),
    category,
  };
  if (isEmpty(note)) return { ok: false, error: NO_NOTE };
  if (!fitsLengths(note)) return { ok: false, error: NOTE_TOO_LONG };
  return { ok: true, value: note };
}
