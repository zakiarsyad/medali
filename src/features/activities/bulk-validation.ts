import type { FormState } from "@/ui/form-message";
import { CARDS_PAGE_SIZE } from "./verification-address";
import type { VerificationCard } from "./verification-card";

/*
 * The rules of validating many photos at once, apart from how the cards
 * are drawn and from the database, so they can be checked alone. Read by
 * the cards in the browser: nothing here may take from the database code.
 */

/** The most photos one press validates: the cards of one page. */
export const BULK_MAX = CARDS_PAGE_SIZE;

export const NOTHING_TICKED = "Pilih presensi yang akan divalidasi.";
export const TOO_MANY_TICKED = `Paling banyak ${BULK_MAX} presensi dapat divalidasi sekaligus.`;

/**
 * What validating many photos answers: the words to show, and each card
 * that was sent as it stands now.
 */
export interface BulkAnswer {
  state: FormState;
  cards: VerificationCard[];
}

/** How the photos sent together ended. */
export interface BulkCount {
  validated: number;
  /** Those someone decided before this press reached them. */
  decidedBefore: number;
}

/** The keys of the cards that can be ticked: those that still wait. */
export function tickableIds(cards: readonly VerificationCard[]): string[] {
  return cards.filter((card) => card.status === "waiting").map(({ id }) => id);
}

/** The ticks that still count: a card decided since its tick is dropped. */
export function tickedOf(
  ticked: readonly string[],
  cards: readonly VerificationCard[],
): string[] {
  return tickableIds(cards).filter((id) => ticked.includes(id));
}

/** The ticks after one card is ticked or cleared. */
export function ticksAfter(
  ticked: readonly string[],
  cardId: string,
  isTicked: boolean,
): string[] {
  const others = ticked.filter((id) => id !== cardId);
  return isTicked ? [...others, cardId] : others;
}

export function bulkButtonWords(ticked: number): string {
  if (ticked === 0) return "Validasi terpilih";
  return `Validasi ${ticked} terpilih`;
}

export function bulkQuestion(ticked: number): string {
  return `Validasi ${ticked} presensi terpilih?`;
}

/** What is said after the press, also of those decided in the meantime. */
export function bulkDoneWords({ validated, decidedBefore }: BulkCount): string {
  const done = `${validated} presensi divalidasi.`;
  if (decidedBefore === 0) return done;
  return `${done} ${decidedBefore} sudah diputuskan sebelumnya.`;
}

/**
 * What a hand-made or stale request may send in place of the ticked
 * keys: only a list of texts is read, each key once.
 */
export function sentIds(sent: unknown): string[] {
  if (!Array.isArray(sent)) return [];
  const texts = sent.filter((id): id is string => typeof id === "string");
  return [...new Set(texts)];
}
