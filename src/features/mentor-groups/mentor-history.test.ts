import { describe, expect, it } from "vitest";
import {
  currentMentor,
  historyWords,
  mentorLabel,
  mentorLineWords,
} from "./mentor-history";

const ENDED = {
  startsOn: "2024-09-01",
  endsOn: "2025-08-31",
  endReason: "Mutasi ke unit lain",
};
const TODAY = { startsOn: "2025-09-01", endsOn: null, endReason: null };

describe("currentMentor", () => {
  it("gives the line without a last day", () => {
    expect(currentMentor([TODAY, ENDED])).toBe(TODAY);
  });

  it("gives none for a group whose every line has ended", () => {
    expect(currentMentor([ENDED])).toBeNull();
    expect(currentMentor([])).toBeNull();
  });
});

describe("mentorLineWords", () => {
  it("says since when the mentor of today holds the group", () => {
    expect(mentorLineWords(TODAY)).toBe("Sejak 1 Sep 2025. Sedang mengasuh.");
  });

  it("says from when to when an earlier mentor held it, and why it ended", () => {
    expect(mentorLineWords(ENDED)).toBe(
      "1 Sep 2024 sampai 31 Agu 2025. Alasan: Mutasi ke unit lain.",
    );
  });

  it("writes a dash for a reason that was not kept", () => {
    expect(mentorLineWords({ ...ENDED, endReason: null })).toBe(
      "1 Sep 2024 sampai 31 Agu 2025. Alasan: -.",
    );
  });
});

describe("mentorLabel", () => {
  it("writes the gelar after the name when there is one", () => {
    expect(mentorLabel({ name: "Sari Uji", title: "M.Si." })).toBe(
      "Sari Uji, M.Si.",
    );
  });

  it("writes the name alone without a gelar", () => {
    expect(mentorLabel({ name: "Sari Uji", title: null })).toBe("Sari Uji");
    expect(mentorLabel({ name: "Sari Uji", title: "" })).toBe("Sari Uji");
  });
});

describe("historyWords", () => {
  it("says Pengasuh awal for a group that has had one mentor", () => {
    expect(historyWords(1)).toBe("Pengasuh awal");
  });

  it("says how many times the mentor was replaced", () => {
    expect(historyWords(2)).toBe("1 kali diganti");
    expect(historyWords(4)).toBe("3 kali diganti");
  });

  it("says Pengasuh awal for a group that has had no mentor yet", () => {
    expect(historyWords(0)).toBe("Pengasuh awal");
  });
});
