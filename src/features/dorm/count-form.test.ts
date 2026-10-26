import { describe, expect, it, vi } from "vitest";
import { noParticipantWords } from "./count-form";

vi.mock("./count-actions", () => ({ saveCountAction: vi.fn() }));

describe("noParticipantWords", () => {
  it("says there is nobody yet with no search and every participant shown", () => {
    expect(noParticipantWords(" ", false)).toBe("Belum ada peserta.");
  });

  it.each([
    ["nama lain", false],
    ["", true],
  ])("says nobody matches for the search %j, only marked %s", (typed, only) => {
    expect(noParticipantWords(typed, only)).toBe(
      "Tidak ada peserta pada filter ini.",
    );
  });
});
