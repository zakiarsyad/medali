/*
 * How a health note is written on screen. Read by the screen parts in
 * the browser, so nothing here may take from the database code.
 */

import { DORM_SHORT_NAMES, type DormId } from "@/dorms/dorms";
import type { ShownCategory } from "./fitness-category";
import { CATEGORY_WORDS } from "./fitness-words";
import type {
  HealthNote,
  Illness,
  NoteCategory,
  NoteContent,
  Residence,
} from "./health-ids";
import type { RecapNumbers, RecapRoom } from "./health-recap";

/** Each choice of "Riwayat penyakit", in the prototype's words. */
export const ILLNESS_WORDS: Record<Illness, string> = {
  asthma: "Asma",
  hypertension: "Hipertensi",
  diabetes: "Diabetes melitus",
  heart_disease: "Penyakit jantung",
  gastric_disorder: "Gangguan lambung",
  allergy: "Alergi",
  epilepsy: "Epilepsi",
  bone_joint_injury: "Cedera atau operasi tulang/sendi",
  infectious_disease: "Penyakit menular",
  other: "Lainnya",
};

/** The choice of "Pertimbangan kategori" that follows the fitness test. */
export const FOLLOW_TEST_WORDS = "Ikuti hasil tes kebugaran";

/** Each other choice of "Pertimbangan kategori". */
export const NOTE_CATEGORY_WORDS: Record<NoteCategory, string> = {
  good: CATEGORY_WORDS.good,
  attention: CATEGORY_WORDS.attention,
  medical: CATEGORY_WORDS.medical,
};

/** What the form and the list say for a student with no note. */
export const NO_NOTE_YET = "Belum ada catatan kesehatan.";

/** What the list says of a student in Perlu perhatian or worse with no note. */
export const NOTE_MISSING = "Belum ada catatan";

/** What the list says of any other student with no note. */
export const NO_NOTE = "Tidak ada catatan";

/** The mark of a category that a note made more serious than the test. */
export const FROM_NOTE_MARK = "berdasarkan catatan kesehatan";

function smallCategory(category: ShownCategory): string {
  return CATEGORY_WORDS[category].toLowerCase();
}

function historyText(note: NoteContent): string {
  const illnesses = note.illnesses.map(({ illness, note: aside }) => {
    const words = ILLNESS_WORDS[illness];
    return aside === "" ? words : `${words} (${aside})`;
  });
  const parts = [illnesses.join(", "), note.otherHistory].filter(
    (part) => part !== "",
  );
  if (parts.length === 0) return "";
  return `Riwayat: ${parts.join("; ")}.`;
}

/**
 * A note written out as the prototype does: "Riwayat: Asma (sejak SMP),
 * Hipertensi; (riwayat lain). Obat: (obat). (catatan)". What is empty is
 * left out.
 */
export function noteText(note: NoteContent): string {
  const medicine = note.medicine === "" ? "" : `Obat: ${note.medicine}.`;
  return [historyText(note), medicine, note.advice]
    .filter((part) => part !== "")
    .join(" ");
}

/** What "Simpan catatan" says once the note is kept. */
export function savedNoteMessage(
  name: string,
  category: ShownCategory,
): string {
  return `Catatan kesehatan ${name} disimpan. Kategori: ${smallCategory(category)}.`;
}

/** The line beside "Pertimbangan kategori". */
export function categoryHint(
  test: ShownCategory,
  final: ShownCategory,
): string {
  return `Hasil tes: ${smallCategory(test)}. Kategori akhir: ${smallCategory(final)}.`;
}

/** Who examined: Pemeriksa, or who saved the note when none is named. */
export function examinerOf(
  note: Pick<HealthNote, "examiner" | "savedBy">,
): string {
  return note.examiner ?? note.savedBy;
}

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** The hint of "Mahasiswa aktif". */
export function residenceHint(numbers: RecapNumbers): string {
  const nonDorm = numbers.students - numbers.dorm;
  return `${shown(numbers.dorm)} asrama · ${shown(nonDorm)} non asrama`;
}

/** The hint of "Sakit atau punya riwayat penyakit": their share of the students. */
export function listedHint(numbers: RecapNumbers): string {
  if (numbers.students === 0) return "0% mahasiswa";
  const share = Math.round((numbers.listed / numbers.students) * 100);
  return `${share}% mahasiswa`;
}

/** The hint of "Perlu tindak lanjut medis" in the recap. */
export function medicalHint(numbers: RecapNumbers): string {
  if (numbers.medicalWithoutNote === 0) return "catatan lengkap";
  return `${shown(numbers.medicalWithoutNote)} belum punya catatan`;
}

/** "Kamar" of the recap: the room of a resident, or Non asrama. */
export function roomWords(dorm: DormId | null, room: RecapRoom | null): string {
  if (dorm === null) return "Non asrama";
  const name = DORM_SHORT_NAMES[dorm];
  if (room === null) return `${name}, belum diplot`;
  return `${name}, lantai ${room.floor}, kamar ${room.number}`;
}

/** Each choice of the recap's filter "Tempat tinggal". */
export const RESIDENCE_WORDS: Record<Residence, string> = {
  all: "Asrama dan non asrama",
  dorm: "Asrama",
  non_dorm: "Non asrama",
};

/** What the recap says when nobody matches. */
export const NOBODY_ILL = "Tidak ada mahasiswa yang sakit pada filter ini.";

/** The line above the recap filtered by an illness. */
export function illnessLine(matching: number, illness: Illness): string {
  return `${shown(matching)} mahasiswa dengan riwayat ${ILLNESS_WORDS[illness].toLowerCase()}.`;
}
