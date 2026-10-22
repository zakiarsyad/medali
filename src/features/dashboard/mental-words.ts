import type { MentalRecap, PublishedMental } from "./mental-recap";

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
