import type {
  MentalRecap,
  PublishedMental,
  PublishedRow,
} from "@/mental-health/mental-recap";
import { FOLLOW_UP_WORDS } from "@/mental-health/session-words";
import { NOT_SCREENED } from "@/mental-health/shared-words";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** The number of the card: how many are assessed, "<5" for 1 to 4. */
export function mentalCardValue(recap: MentalRecap): string {
  if (recap.kind === "none") return "0";
  if (recap.kind === "too_few") return "<5";
  return shown(recap.assessed);
}

/** The line of the card "Kesehatan mental". */
export function mentalCardLine(published: PublishedMental | null): string {
  const matching = published?.matching ?? 0;
  const needCounselling = published?.needCounselling ?? 0;
  const need =
    needCounselling > 0 ? `, ${shown(needCounselling)} perlu konseling` : "";
  return `${shown(matching)} data dipublikasikan konselor untuk Anda${need}.`;
}

/** What section 4 says instead of counts while 1 to 4 students are assessed. */
export const MENTAL_TOO_FEW =
  "Rekap ditampilkan setelah minimal 5 mahasiswa diasesmen, agar identitas tidak dapat ditebak.";

/** What section 4 says while nobody in the group is assessed. */
export const NOBODY_ASSESSED = "Belum ada asesmen kesehatan mental.";

/** The line under the levels. */
export function assessedLine(assessed: number): string {
  return `${shown(assessed)} mahasiswa sudah diasesmen. Identitas tidak ditampilkan kecuali dipublikasikan konselor.`;
}

/** What the list says while nothing is published to the account. */
export const NOTHING_PUBLISHED =
  "Belum ada data yang dipublikasikan konselor. Data hanya tampil dengan persetujuan mahasiswa.";

function sessionsLine(row: PublishedRow): string | null {
  if (!row.data.includes("counselling")) return null;
  if (row.sessions === null) return "Belum ada sesi konseling.";
  const { count, followUp } = row.sessions;
  return `${shown(count)} sesi konseling. Tindak lanjut: ${FOLLOW_UP_WORDS[followUp]}.`;
}

/**
 * The line under a name: the Pengasuh unless `namesMentor` is off, and
 * only the parts the student agreed to share besides the level, which
 * shows as a badge.
 */
export function publishedLine(row: PublishedRow, namesMentor = true): string {
  const unscreened = row.data.includes("level") && row.level === null;
  const mentor = namesMentor ? row.mentorName : null;
  const parts = [
    mentor === null ? null : `Pengasuh: ${mentor}.`,
    unscreened ? `${NOT_SCREENED}.` : null,
    sessionsLine(row),
    row.summary,
  ];
  return parts.filter((part) => part !== null && part !== "").join(" ");
}
