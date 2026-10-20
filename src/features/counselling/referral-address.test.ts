import { describe, expect, it } from "vitest";
import { readReferralPage, referralAddress } from "./referral-address";

describe("the page of the referrals in the address", () => {
  it.each([
    [{}, 1],
    [{ rujukan: "3" }, 3],
    [{ rujukan: ["2", "5"] }, 2],
    [{ rujukan: "0" }, 1],
    [{ rujukan: "-2" }, 1],
    [{ rujukan: "abc" }, 1],
    [{ rujukan: "99999999" }, 1],
  ])("reads %j as page %i", (params, page) => {
    expect(readReferralPage(params)).toBe(page);
  });

  it("names the page after the first", () => {
    expect(referralAddress(1)).toBe("/konseling");
    expect(referralAddress(2)).toBe("/konseling?rujukan=2");
  });
});
