import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import type { Parsed } from "@/parsed";
import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";
import {
  type FollowUp,
  isFollowUp,
  isNoteKind,
  type NoteKind,
} from "./note-kinds";

/** "Simpan catatan" as the form sends it. */
export interface SentNote {
  /** The key of the form, which becomes the key of the note. */
  id: string;
  studentId: string;
  kind: string;
  happenedOn: string;
  valueKeys: string[];
  note: string;
  followUp: string;
}

export interface NoteInput {
  id: string;
  studentId: string;
  kind: NoteKind;
  happenedOn: string;
  valueKeys: ValueKey[];
  note: string;
  followUp: FollowUp;
}

export const NOTE_MIN_LENGTH = 5;
export const NOTE_MAX_LENGTH = 1000;

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/**
 * The text as it was typed, without the blanks around it. The browser
 * counts a line break as one character against the limit of the field
 * and sends it as two, so each is put back to one before it is counted.
 */
function typedText(sent: string): string {
  return sent.replaceAll("\r\n", "\n").trim();
}

/** The values ticked, each once, in the order of MEDALI. Null when one is unknown. */
function tickedValues(sent: string[]): ValueKey[] | null {
  const known = MEDALI_VALUES.map((value) => value.key);
  const isKnown = sent.every((key) => known.some((each) => each === key));
  if (!isKnown) return null;
  return known.filter((key) => sent.includes(key));
}

function textFault(note: string): string | null {
  if (note.length < NOTE_MIN_LENGTH) {
    return `Catatan terlalu pendek. Tulis paling sedikit ${NOTE_MIN_LENGTH} huruf tentang apa yang dibahas atau diamati.`;
  }
  if (note.length > NOTE_MAX_LENGTH) {
    return `Catatan paling panjang ${NOTE_MAX_LENGTH.toLocaleString("id-ID")} karakter.`;
  }
  return null;
}

function dayFault(happenedOn: string, today: string): string | null {
  if (!isDay(happenedOn)) return "Isi tanggal kegiatan dengan benar.";
  if (happenedOn > today) {
    return "Tanggal tidak boleh setelah hari ini. Pilih hari ini atau tanggal sebelumnya.";
  }
  return null;
}

/**
 * Checks "Simpan catatan" as sent, on the campus day `today`. A student
 * must be chosen, the text holds 5 letters or more, and the day is today
 * or earlier. Whether the student is a mentee of the writer is decided
 * where the note is saved.
 */
export function parseNote(sent: SentNote, today: string): Parsed<NoteInput> {
  if (!isUuid(sent.id)) {
    return refused(
      "Formulir ini tidak lengkap. Muat ulang halaman, lalu isi lagi.",
    );
  }
  if (!isUuid(sent.studentId)) {
    return refused("Pilih mahasiswa terlebih dahulu.");
  }
  if (!isNoteKind(sent.kind)) return refused("Pilih jenis kegiatan.");
  const dayError = dayFault(sent.happenedOn, today);
  if (dayError !== null) return refused(dayError);
  const valueKeys = tickedValues(sent.valueKeys);
  if (valueKeys === null) {
    return refused("Pilih nilai yang terkait dari enam nilai MEDALI.");
  }
  const note = typedText(sent.note);
  const textError = textFault(note);
  if (textError !== null) return refused(textError);
  if (!isFollowUp(sent.followUp)) return refused("Pilih tindak lanjut.");
  return {
    ok: true,
    value: {
      id: sent.id,
      studentId: sent.studentId,
      kind: sent.kind,
      happenedOn: sent.happenedOn,
      valueKeys,
      note,
      followUp: sent.followUp,
    },
  };
}
