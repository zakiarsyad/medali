import type { Parsed } from "@/parsed";
import {
  SHARED_DATA,
  SHARING_RECIPIENTS,
  type SharingContent,
  SUMMARY_MAX,
  SUMMARY_MIN,
} from "./sharing-ids";
import {
  NO_DATA,
  NO_RECIPIENT,
  NO_SUMMARY,
  SUMMARY_TOO_LONG,
} from "./sharing-words";

/** The known values that were sent, each once, in their fixed order. */
function picked<T extends string>(known: readonly T[], sent: unknown): T[] {
  if (!Array.isArray(sent)) return [];
  return known.filter((value) => sent.includes(value));
}

function readSummary(sent: unknown): Parsed<string> {
  const summary = typeof sent === "string" ? sent.trim() : "";
  if (summary.length < SUMMARY_MIN) return { ok: false, error: NO_SUMMARY };
  if (summary.length > SUMMARY_MAX) {
    return { ok: false, error: SUMMARY_TOO_LONG };
  }
  return { ok: true, value: summary };
}

/**
 * Checks what Konselor asks to share, with the prototype's messages: some
 * data, some recipient, and a summary of at least 10 letters when the
 * summary is chosen. What was sent comes from outside.
 */
export function readSharingInput(
  sentData: unknown,
  sentRecipients: unknown,
  sentSummary: unknown,
): Parsed<SharingContent> {
  const data = picked(SHARED_DATA, sentData);
  if (data.length === 0) return { ok: false, error: NO_DATA };
  const recipients = picked(SHARING_RECIPIENTS, sentRecipients);
  if (recipients.length === 0) return { ok: false, error: NO_RECIPIENT };
  if (!data.includes("summary")) {
    return { ok: true, value: { data, recipients, summary: null } };
  }
  const summary = readSummary(sentSummary);
  if (!summary.ok) return summary;
  return { ok: true, value: { data, recipients, summary: summary.value } };
}
