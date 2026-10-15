import { describe, expect, it } from "vitest";
import {
  isChangeable,
  offeredRoomWords,
  ownRoomWords,
  placeRows,
  residentsOf,
} from "./cleaning-rows";

const MANDI = { id: "p1", dorm: "dana_rakca", name: "Kamar Mandi" } as const;
const APEL = { id: "p2", dorm: "dana_rakca", name: "Lapangan Apel" } as const;
const DUTY = { id: "d1", placeId: "p2", roomId: "r1", roomNumber: "101" };
const ROOMS = [{ id: "r1", number: "101", residents: 3 }];

describe("placeRows", () => {
  it("gives each place its duty on the date, or none", () => {
    expect(placeRows([MANDI, APEL], [DUTY])).toEqual([
      { place: MANDI, duty: null },
      { place: APEL, duty: DUTY },
    ]);
  });
});

describe("residentsOf", () => {
  it("counts the residents of the room of a duty today", () => {
    expect(residentsOf(DUTY, ROOMS)).toBe(3);
  });

  it("gives none for a room removed or without residents", () => {
    expect(residentsOf({ ...DUTY, roomId: null }, ROOMS)).toBeNull();
    expect(residentsOf({ ...DUTY, roomId: "r9" }, ROOMS)).toBeNull();
  });
});

describe("the words of a room", () => {
  it("names a room's own room and a room offered with its residents", () => {
    expect(ownRoomWords("101")).toBe("Kamar 101 (kamar sendiri)");
    expect(offeredRoomWords({ id: "r1", number: "101", residents: 3 })).toBe(
      "Kamar 101 (3)",
    );
  });
});

describe("isChangeable", () => {
  it("lets a duty of today and later be given or cancelled, not one gone by", () => {
    expect(isChangeable("2026-10-15", "2026-10-15")).toBe(true);
    expect(isChangeable("2026-10-16", "2026-10-15")).toBe(true);
    expect(isChangeable("2026-10-14", "2026-10-15")).toBe(false);
  });
});
