import { shownDay } from "@/ui/day";
import {
  COUNSELLING_HOURS,
  type CounsellingTopic,
  type CounsellingWay,
  type ScheduleKind,
  type ScheduleStatus,
  type ScheduleStep,
  type ScheduleTopic,
} from "./schedule-ids";

/*
 * The words of counselling schedules on screen, as the prototype has
 * them. Read by the screen parts in the browser.
 */

export const SCHEDULE_STATUS_WORDS: Record<ScheduleStatus, string> = {
  submitted: "Diajukan",
  proposed: "Usulan jadwal lain",
  scheduled: "Dijadwalkan",
  done: "Selesai",
  missed: "Tidak hadir",
  cancelled: "Dibatalkan",
  awaiting: "Menunggu jadwal",
  reschedule_asked: "Minta jadwal ulang",
};

/** The Jenis of a schedule. */
export const KIND_WORDS: Record<ScheduleKind, string> = {
  voluntary: "Sukarela",
  assigned: "Penugasan",
  called: "Pemanggilan",
};

/** Where a schedule comes from, as the student's card says it. */
export const KIND_SOURCE_WORDS: Record<ScheduleKind, string> = {
  voluntary: "Didaftarkan sendiri oleh mahasiswa",
  assigned: "Konseling wajib dari Pembina Disiplin Mahasiswa",
  called: "Dipanggil Penilai Mahasiswa berdasarkan hasil asesmen karakter",
};

export const TOPIC_WORDS: Record<CounsellingTopic, string> = {
  academic: "Akademik",
  campus_adjustment: "Adaptasi kampus",
  family: "Keluarga",
  social_relations: "Relasi sosial",
  finances: "Keuangan",
  emotions_and_stress: "Emosi dan stres",
  other: "Lainnya",
};

/** The Topik of any schedule, also of an assignment. */
export const SCHEDULE_TOPIC_WORDS: Record<ScheduleTopic, string> = {
  ...TOPIC_WORDS,
  discipline_violation: "Pelanggaran disiplin",
  character_assessment: "Hasil asesmen karakter",
};

export const COUNSELLING_WAY_WORDS: Record<CounsellingWay, string> = {
  in_person: "Tatap muka di Ruang Konseling",
  online: "Daring (tautan dikirim konselor)",
};

/** What each step is called in "Riwayat langkah". */
export const STEP_WORDS: Record<ScheduleStep, string> = {
  register: "Mendaftar konseling",
  approve: "Menyetujui jadwal",
  propose: "Mengusulkan jadwal lain",
  accept: "Menerima usulan jadwal",
  ask_another: "Meminta jadwal lain",
  cancel: "Dibatalkan mahasiswa",
  reschedule: "Mengubah jadwal",
  mark_done: "Sesi selesai",
  mark_missed: "Mahasiswa tidak hadir",
  assign: "Menugaskan konseling wajib",
  call: "Memanggil untuk konseling",
  set_time: "Menetapkan jadwal",
};

export const REGISTERED =
  "Pendaftaran terkirim. Konselor akan mengonfirmasi jadwal.";

export const PICK_FROM_TOMORROW = "Pilih tanggal mulai besok.";

export const WEEKDAYS_ONLY = "Konseling tersedia Senin–Jumat.";

export const TICK_CONSENT = "Centang persetujuan terlebih dahulu.";

export const STILL_ACTIVE = "Anda masih punya pendaftaran sukarela yang aktif.";

export const PICK_FROM_LIST =
  "Pilih Topik, Jam, dan Cara konseling dari daftar.";

export const STORY_TOO_LONG = "Cerita paling panjang 1.000 karakter.";

export const NOTE_TOO_LONG = "Pesan atau alasan paling panjang 500 karakter.";

export const NOT_ALLOWED_WORDS =
  "Anda tidak memiliki hak untuk mengubah jadwal konseling ini.";

export const SCHEDULE_NOT_FOUND =
  "Jadwal konseling tidak ditemukan. Muat ulang halaman.";

/**
 * What a press made on a schedule that changed since the screen showed
 * it is told: by someone else, or by the same press made twice.
 */
export const SCHEDULE_CHANGED_SINCE =
  "Jadwal konseling ini sudah berubah, jadi tidak ada yang diubah. Status terbarunya ditampilkan.";

/** The hours, as the note under the form says them. */
export const HOURS_NOTE = `Jadwal konseling: Senin–Jumat pukul ${COUNSELLING_HOURS.join(", ")}. Konselor akan menyetujui atau mengusulkan waktu lain.`;

/** What Konselor's card says while an assignment has no time yet. */
export const NO_TIME_YET = "Belum ada";

/** What the student's card says while an assignment has no time yet. */
export const WAITING_FOR_TIME = "Menunggu jadwal dari konselor";

/** A time of a schedule as a card shows it, such as 26 Okt 2026 pukul 10:00. */
export function timeWords(day: string, hour: string): string {
  return `${shownDay(day)} pukul ${hour}`;
}

export const PICK_WEEKDAY = "Pilih hari Senin–Jumat.";

export const TIME_PASSED =
  "Waktu itu sudah lewat. Pilih waktu yang akan datang.";

export const WISHED_TIME_PASSED =
  "Waktu yang diminta sudah lewat. Usulkan waktu lain.";

export const PROPOSAL_PASSED =
  "Waktu usulan konselor sudah lewat. Minta waktu lain.";

export const APPROVED = "Jadwal disetujui.";

/** What "Simpan jadwal" of "Tetapkan jadwal" says once kept. */
export const TIME_SET = "Jadwal dikirim ke mahasiswa.";

/**
 * Why a step that does not belong to the Jenis is refused, such as
 * cancelling a konseling wajib.
 */
export const NOT_FOR_THIS_KIND =
  "Langkah ini tidak berlaku untuk jenis konseling ini.";

export const PROPOSED = "Jadwal dikirim ke mahasiswa.";

export const ACCEPTED = "Jadwal konseling dikonfirmasi.";

export const ASKED_ANOTHER = "Permintaan jadwal baru dikirim ke konselor.";

/** What the student is asked before "Batalkan pendaftaran" or "Batalkan". */
export const CANCEL_QUESTION = "Batalkan konseling ini?";

export const CANCELLED = "Konseling dibatalkan.";

/** What Konselor is asked before "Tandai selesai". */
export const DONE_QUESTION = "Tandai sesi konseling ini selesai?";

/** What Konselor is asked before "Tidak hadir". */
export const MISSED_QUESTION = "Tandai mahasiswa tidak hadir pada sesi ini?";

export const MARKED_DONE = "Ditandai selesai.";

export const MARKED_MISSED = "Ditandai tidak hadir.";

export const NOT_HELD_YET =
  "Sesi ini belum berlangsung. Tandai pada tanggal sesi atau sesudahnya.";
