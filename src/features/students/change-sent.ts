import type { Parsed } from "@/parsed";
import { parseGroupChoice } from "./fitting-group";

/** What the change form sends beside the record, as the browser sends it. */
export interface SentChange {
  mentorGroupId: string;
  openedGroupId: string;
  version: string;
}

/** What the change form sends beside the record. */
export interface ChangeSent {
  /** The kelompok pengasuhan chosen, or null for "Belum ditetapkan". */
  mentorGroupId: string | null;
  /** The kelompok pengasuhan the form opened with, or null for none. */
  openedGroupId: string | null;
  /** The version of the record the form opened with. */
  version: number;
}

/** What a form is told when it was not sent by the page as it is. */
export const NOT_UNDERSTOOD = {
  ok: false,
  error: "Data yang dikirim tidak lengkap. Muat ulang halaman, lalu coba lagi.",
} as const;

const WHOLE_NUMBER_FROM_1 = /^[1-9]\d{0,8}$/;

export function parseChangeSent(sent: SentChange): Parsed<ChangeSent> {
  const group = parseGroupChoice(sent.mentorGroupId);
  if (!group.ok) return group;
  // The page fills this in itself, so a wrong one is no choice to redo.
  const opened = parseGroupChoice(sent.openedGroupId);
  if (!opened.ok) return NOT_UNDERSTOOD;
  if (!WHOLE_NUMBER_FROM_1.test(sent.version)) return NOT_UNDERSTOOD;
  return {
    ok: true,
    value: {
      mentorGroupId: group.value,
      openedGroupId: opened.value,
      version: Number(sent.version),
    },
  };
}
