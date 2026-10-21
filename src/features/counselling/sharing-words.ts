import { ROLES } from "@/auth/roles";
import {
  SHARED_DATA,
  SHARING_RECIPIENTS,
  type SharedData,
  type SharingRecipient,
  type SharingStatus,
  type SharingWay,
} from "./sharing-ids";

/** The words of each status on screen, as in the prototype. */
export const SHARING_STATUS_WORDS: Record<SharingStatus, string> = {
  waiting: "Menunggu persetujuan",
  approved: "Disetujui",
  declined: "Ditolak",
  published: "Dipublikasikan",
  cancelled: "Ditarik",
  withdrawn: "Dicabut",
};

/** "Data yang dibagikan", as in the prototype. */
export const SHARED_DATA_WORDS: Record<SharedData, string> = {
  level: "Tingkat hasil asesmen dan rekomendasi tindak lanjut",
  counselling:
    "Status, jadwal, dan rencana tindak lanjut konseling, tanpa isi sesi",
  summary: "Ringkasan pendampingan yang ditulis konselor",
};

/** A recipient by the title of its role. */
export function recipientWords(recipient: SharingRecipient): string {
  return ROLES[recipient].title;
}

/** What a recipient's tick adds, for the roles that read only their own students. */
export const RECIPIENT_LIMITS: Partial<Record<SharingRecipient, string>> = {
  head_of_program: "(hanya ketua prodi mahasiswa ini)",
  mentor: "(hanya pengasuh mahasiswa ini)",
};

export const SHARING_WAY_WORDS: Record<SharingWay, string> = {
  online: "Persetujuan daring",
  paper: "Form tertulis",
};

/** The values a sharing holds, in the order the form offers them. */
export function inFormOrder<T extends string>(
  offered: readonly T[],
  held: readonly T[],
): T[] {
  return offered.filter((value) => held.includes(value));
}

/** The recipients of a sharing in one line, in the order of the form. */
export function recipientsLine(
  recipients: readonly SharingRecipient[],
): string {
  return inFormOrder(SHARING_RECIPIENTS, recipients)
    .map(recipientWords)
    .join(", ");
}

/** The data of a sharing in one line, in the order of the form, as the prototype words it. */
export function dataLine(data: readonly SharedData[]): string {
  return inFormOrder(SHARED_DATA, data)
    .map((each) => SHARED_DATA_WORDS[each].toLowerCase())
    .join("; ");
}

export const PANEL_LEDE =
  "Bagikan data mahasiswa kepada pihak terkait setelah mahasiswa menyetujuinya.";

export const PICK_FIRST =
  "Pilih mahasiswa di Persetujuan konseling untuk mengatur publikasi datanya.";

export const NO_SESSION = "Belum ada sesi konseling untuk mahasiswa ini.";

export const NO_SCREENING = "Belum ada asesmen untuk mahasiswa ini.";

/** What the panel says of a student with neither a screening nor a session, as in the prototype. */
export const NO_SCREENING_OR_SESSION =
  "Belum ada asesmen atau sesi konseling untuk mahasiswa ini.";

export const NEEDS_COUNSELLING_CONSENT =
  "Data hanya dapat dibagikan selama persetujuan konseling mahasiswa Disetujui.";

export const SUMMARY_PLACEHOLDER =
  "Misalnya: mahasiswa sedang dalam pendampingan rutin. Mohon pengasuh memberi ruang dan memantau kehadiran.";

export const ASK_NOTE =
  "Data baru dapat dipublikasikan setelah mahasiswa menyetujui melalui halaman Konseling miliknya. Catatan sesi tidak pernah dibagikan.";

export const NO_DATA = "Pilih data yang akan dibagikan.";

export const NO_RECIPIENT = "Pilih minimal satu penerima.";

export const NO_SUMMARY = "Tulis ringkasan untuk penerima.";

export const SUMMARY_TOO_LONG =
  "Ringkasan untuk penerima terlalu panjang. Persingkat lalu kirim lagi.";

export function askedMessage(name: string): string {
  return `Permintaan persetujuan dikirim ke ${name}.`;
}

export const PAPER_MESSAGE = "Persetujuan tertulis dicatat.";

export function publishedMessage(name: string): string {
  return `Data kesehatan mental ${name} dipublikasikan.`;
}

export const CANCELLED_MESSAGE = "Permintaan dibatalkan.";

export const PULLED_MESSAGE = "Publikasi ditarik.";

export const STUDENT_APPROVED_MESSAGE =
  "Persetujuan diberikan. Konselor dapat mempublikasikan data.";

export const STUDENT_DECLINED_MESSAGE = "Permintaan berbagi data ditolak.";

export const STUDENT_WITHDRAWN_MESSAGE =
  "Persetujuan dicabut. Data tidak lagi ditampilkan.";

/**
 * What a press made on a sharing that changed since the screen showed
 * it is told: by someone else, or by the same press made twice.
 */
export const SHARING_CHANGED =
  "Status berbagi data sudah berubah, jadi tidak ada yang diubah. Status terbarunya ditampilkan.";

export const SHARING_NOT_ALLOWED =
  "Anda tidak memiliki hak untuk mengubah berbagi data ini.";
