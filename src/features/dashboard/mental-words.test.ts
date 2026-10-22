import { describe, expect, it } from "vitest";
import { mentalCardLine, mentalCardValue } from "./mental-words";

describe("the card Kesehatan mental", () => {
  it("shows how many are assessed, <5 for 1 to 4, and 0 for none", () => {
    expect(mentalCardValue({ kind: "shown", assessed: 1200 })).toBe("1.200");
    expect(mentalCardValue({ kind: "too_few" })).toBe("<5");
    expect(mentalCardValue({ kind: "none" })).toBe("0");
  });

  it("says how many are published to the account, with those needing counselling only when there are", () => {
    expect(mentalCardLine({ matching: 3, needCounselling: 1 })).toBe(
      "3 data dipublikasikan konselor untuk Anda, 1 perlu konseling.",
    );
    expect(mentalCardLine({ matching: 2, needCounselling: 0 })).toBe(
      "2 data dipublikasikan konselor untuk Anda.",
    );
    expect(mentalCardLine(null)).toBe(
      "0 data dipublikasikan konselor untuk Anda.",
    );
  });
});
