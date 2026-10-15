import { describe, expect, it } from "vitest";
import {
  causeWords,
  issueButtonWords,
  issueQuestion,
  NOT_SCHEDULED,
  scheduleWords,
} from "./warning-words";

describe("scheduleWords", () => {
  it("says the day, the hour and the place, or that there is no call yet", () => {
    expect(
      scheduleWords({ day: "2026-10-16", time: "16:00", place: "Aula" }),
    ).toBe("16 Okt 2026 16:00 · Aula");
    expect(scheduleWords(null)).toBe(NOT_SCHEDULED);
  });
});

describe("causeWords", () => {
  it("joins the causes with dan", () => {
    expect(
      causeWords(["7 pelanggaran tercatat", "klarifikasi kehadiran ditolak"]),
    ).toBe("7 pelanggaran tercatat dan klarifikasi kehadiran ditolak");
  });
});

describe("issuing words", () => {
  it("names the button as the prototype does", () => {
    expect(issueButtonWords(1)).toBe("Terbitkan SP 1");
    expect(issueButtonWords(2)).toBe(
      "Terbitkan SP 2 dan ajukan hukuman disiplin",
    );
  });

  it("asks before issuing, as an SP cannot be undone", () => {
    expect(issueQuestion("Ani", 1)).toBe(
      "Terbitkan SP 1 untuk Ani? SP yang sudah terbit tidak dapat diubah atau ditarik.",
    );
    expect(issueQuestion("Ani", 2)).toBe(
      "Terbitkan SP 2 untuk Ani dan ajukan hukuman disiplin ke Kepala UPK? SP yang sudah terbit tidak dapat diubah atau ditarik.",
    );
  });
});
