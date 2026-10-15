import { describe, expect, it } from "vitest";
import { residenceWords } from "./residence-words";

describe("residenceWords", () => {
  it("says Non asrama for a student who lives in no dorm", () => {
    expect(residenceWords(null)).toBe("Non asrama");
  });

  it("names the dorm only when the room is not shown", () => {
    expect(residenceWords({ dorm: "wismantara_putra", room: null })).toBe(
      "Asrama Wismantara Putra",
    );
  });

  it("names the dorm, the floor and the room of a resident with a room", () => {
    const room = {
      plotted: true,
      dorm: "dana_rakca",
      floor: 3,
      number: "305",
      asCompanion: false,
    } as const;

    expect(residenceWords({ dorm: "dana_rakca", room })).toBe(
      "Asrama Dana Rakca, lantai 3, kamar 305",
    );
  });

  it("names the kakak pendamping room of a resident of another dorm", () => {
    const room = {
      plotted: true,
      dorm: "dana_rakca",
      floor: 1,
      number: "102",
      asCompanion: true,
    } as const;

    expect(residenceWords({ dorm: "wismantara_putri", room })).toBe(
      "Asrama Dana Rakca, lantai 1, kamar 102 (kakak pendamping)",
    );
  });

  it("says Belum diplot after the dorm for a resident without a room", () => {
    expect(
      residenceWords({ dorm: "cipta_bakti", room: { plotted: false } }),
    ).toBe("Asrama Cipta Bakti · Belum diplot");
  });
});
