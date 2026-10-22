import { describe, expect, it } from "vitest";
import { isOwnRecord } from "./own-record";

const ANI = "00000000-0000-4000-8000-0000000000a1";
const BEA = "00000000-0000-4000-8000-0000000000b2";

describe("isOwnRecord", () => {
  it("holds for the account's own student, whatever case either key is in", () => {
    expect(isOwnRecord(ANI, ANI)).toBe(true);
    expect(isOwnRecord(ANI, ANI.toUpperCase())).toBe(true);
    expect(isOwnRecord(ANI.toUpperCase(), ANI)).toBe(true);
  });

  it("does not hold for another student, nor for an account that is not a student", () => {
    expect(isOwnRecord(ANI, BEA)).toBe(false);
    expect(isOwnRecord(null, ANI)).toBe(false);
  });
});
