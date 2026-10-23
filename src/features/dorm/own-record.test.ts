import { describe, expect, it } from "vitest";
import { isOwnRecord, isOwnRoom } from "./own-record";

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

describe("isOwnRoom", () => {
  const room = { dorm: "dana_rakca", number: "101" } as const;

  it("holds for the room of the same dorm and number only", () => {
    expect(isOwnRoom(room, { dorm: "dana_rakca", number: "101" })).toBe(true);
    expect(isOwnRoom(room, { dorm: "dana_rakca", number: "102" })).toBe(false);
    expect(isOwnRoom(room, { dorm: "wismantara_putri", number: "101" })).toBe(
      false,
    );
  });

  it("does not hold for an account that lives in no room", () => {
    expect(isOwnRoom(null, room)).toBe(false);
  });
});
