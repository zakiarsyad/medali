import { describe, expect, it } from "vitest";
import {
  activityDetail,
  participantWords,
  shownDays,
  shownHours,
  targetWords,
  uploadWords,
} from "./schedule-words";

describe("shownDays", () => {
  it("shows one day with its year", () => {
    expect(shownDays("2026-10-13", "2026-10-13")).toBe("13 Okt 2026");
  });

  it("shows the first day without a year and the last one with it", () => {
    expect(shownDays("2026-10-13", "2026-10-15")).toBe("13 Okt – 15 Okt 2026");
    expect(shownDays("2026-12-30", "2027-01-02")).toBe("30 Des – 2 Jan 2027");
  });
});

describe("shownHours", () => {
  it("shows the first and the last hour", () => {
    expect(shownHours("07:30", "11:30")).toBe("07:30–11:30");
  });
});

describe("uploadWords", () => {
  it("names the last upload day and the range in hari", () => {
    expect(
      uploadWords({ endsOn: "2026-10-13", uploadCount: 1, uploadUnit: "day" }),
    ).toBe("Unggah s.d. 14 Okt (1 hari)");
  });

  it("names the range in minggu", () => {
    expect(
      uploadWords({ endsOn: "2026-10-13", uploadCount: 2, uploadUnit: "week" }),
    ).toBe("Unggah s.d. 27 Okt (2 minggu)");
  });

  it("names the last day itself for a range of 0", () => {
    expect(
      uploadWords({ endsOn: "2026-10-13", uploadCount: 0, uploadUnit: "day" }),
    ).toBe("Unggah s.d. 13 Okt (0 hari)");
  });
});

describe("targetWords", () => {
  it("names the semester and its tahap", () => {
    expect(targetWords(1)).toBe("Semester 1 (Penanaman)");
    expect(targetWords(3)).toBe("Semester 3 (Penumbuhan)");
    expect(targetWords(6)).toBe("Semester 6 (Pengembangan)");
    expect(targetWords(8)).toBe("Semester 8 (Pematangan)");
  });
});

describe("participantWords", () => {
  it("shows the participants and the target", () => {
    expect(participantWords(96, 110)).toBe("96 peserta · target 110");
  });

  it("leaves the target out for an activity that has none", () => {
    expect(participantWords(96, null)).toBe("96 peserta");
  });

  it("shows a target of 0, which is a target", () => {
    expect(participantWords(0, 0)).toBe("0 peserta · target 0");
  });

  it("writes thousands the Indonesian way", () => {
    expect(participantWords(1250, 1300)).toBe("1.250 peserta · target 1.300");
  });
});

describe("activityDetail", () => {
  it("shows the place and the indicators", () => {
    expect(activityDetail("Aula asrama", true, ["M2", "D2"])).toBe(
      "Aula asrama · M2, D2",
    );
  });

  it("shows a dash for no place", () => {
    expect(activityDetail("", true, ["M2"])).toBe("- · M2");
  });

  it("says so when the schedule is not required", () => {
    expect(activityDetail("Aula asrama", false, ["E1"])).toBe(
      "Aula asrama · tidak wajib · E1",
    );
  });
});
