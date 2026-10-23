import type { PublishedRow } from "./mental-recap";
import { FOLLOW_UP_WORDS } from "./session-words";
import { NOT_SCREENED } from "./shared-words";

/*
 * How a row of counselling data published to an account is written out
 * on the Dashboards and Dashboard asrama. Read by the screen parts, so
 * nothing here may take from the database code.
 */

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

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
