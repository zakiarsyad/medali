import { describe, expect, it } from "vitest";
import { daysAfter } from "@/academic-periods/days-after";
import { parseActivity, type SentActivity } from "./activity-input";
import { SENT_ONE_OFF, SENT_ROUTINE } from "./test-activities";

function refusal(sent: Partial<SentActivity>, base = SENT_ROUTINE) {
  const parsed = parseActivity({ ...base, ...sent });
  return parsed.ok ? null : parsed.error;
}

describe("parseActivity for a repeating activity", () => {
  it("keeps a daily one as sent, without a last day when Berlaku sampai is empty", () => {
    expect(parseActivity(SENT_ROUTINE)).toEqual({
      ok: true,
      value: {
        name: "Apel pagi uji",
        category: "roll_call",
        location: "Lapangan uji",
        pattern: "daily",
        weekdays: [],
        monthDay: null,
        startsOn: "2026-08-01",
        endsOn: null,
        daysOff: [],
        startTime: "05:30",
        endTime: "06:15",
        organiser: "coach",
        organiserName: "Tim Pelatih Uji",
        audience: "all",
        isRequired: true,
        rundown: [{ time: "05:30", activity: "Apel uji" }],
      },
    });
  });

  it("keeps a weekly one on its days, each once and in order", () => {
    const parsed = parseActivity({
      ...SENT_ROUTINE,
      pattern: "weekly",
      weekdays: ["6", "3", "6"],
    });

    expect(parsed).toMatchObject({
      ok: true,
      value: { pattern: "weekly", weekdays: [3, 6], monthDay: null },
    });
  });

  it.each(["1", "28"])("keeps a monthly one on the %s of the month", (day) => {
    const parsed = parseActivity({
      ...SENT_ROUTINE,
      pattern: "monthly",
      monthDay: day,
    });

    expect(parsed).toMatchObject({
      ok: true,
      value: { pattern: "monthly", weekdays: [], monthDay: Number(day) },
    });
  });

  it("keeps the days off each once and in order, and a Berlaku sampai on the first day", () => {
    const parsed = parseActivity({
      ...SENT_ROUTINE,
      endsOn: "2026-08-01",
      daysOff: ["2026-10-20", "2026-10-08", "2026-10-20"],
    });

    expect(parsed).toMatchObject({
      ok: true,
      value: { endsOn: "2026-08-01", daysOff: ["2026-10-08", "2026-10-20"] },
    });
  });

  it("leaves out a line of Rincian kegiatan without an activity, and trims what was typed", () => {
    const parsed = parseActivity({
      ...SENT_ROUTINE,
      name: "  Apel pagi uji  ",
      rundownTimes: [" 05:30 ", "06:00", ""],
      rundownActivities: [" Apel ", "", "Penutup"],
    });

    expect(parsed).toMatchObject({
      ok: true,
      value: {
        name: "Apel pagi uji",
        rundown: [
          { time: "05:30", activity: "Apel" },
          { time: "", activity: "Penutup" },
        ],
      },
    });
  });
});

describe("parseActivity for a one-off activity", () => {
  it("keeps its Tanggal as its first and last day, with no pattern, no Berlaku and no day off", () => {
    const parsed = parseActivity({
      ...SENT_ONE_OFF,
      startsOn: "2026-01-01",
      endsOn: "2026-12-31",
      weekdays: ["1"],
      daysOff: ["2026-10-21"],
    });

    expect(parsed).toMatchObject({
      ok: true,
      value: {
        pattern: "once",
        weekdays: [],
        monthDay: null,
        startsOn: "2026-10-20",
        endsOn: "2026-10-20",
        daysOff: [],
      },
    });
  });

  it("refuses one without a real Tanggal", () => {
    expect(refusal({ day: "2026-02-30" }, SENT_ONE_OFF)).toBe(
      "Isi tanggal kegiatan dengan tanggal yang benar.",
    );
  });
});

describe("parseActivity and the days off one form sends", () => {
  function pastDays(count: number): string[] {
    return Array.from({ length: count }, (_, place) =>
      daysAfter("2000-01-01", place),
    );
  }

  it("takes 100 of them", () => {
    expect(refusal({ daysOff: pastDays(100) })).toBeNull();
  });

  it.each([101, 40_000])(
    "refuses %i of them, a hand-made request, with a message",
    (count) => {
      expect(refusal({ daysOff: pastDays(count) })).toBe(
        "Hari tanpa kegiatan yang dikirim sekaligus paling banyak 100 tanggal.",
      );
    },
  );
});

describe("parseActivity refuses", () => {
  it.each([
    [
      "a name under 3 letters",
      { name: " Ab " },
      "Nama kegiatan paling sedikit 3 huruf.",
    ],
    [
      "an end time that is the start time",
      { endTime: "05:30" },
      "Jam selesai harus setelah jam mulai.",
    ],
    [
      "an end time before the start time",
      { endTime: "05:00" },
      "Jam selesai harus setelah jam mulai.",
    ],
    [
      "Berlaku sampai before Berlaku mulai",
      { endsOn: "2026-07-31" },
      "Berlaku sampai harus sama atau setelah Berlaku mulai.",
    ],
    [
      "Mingguan with no day",
      { pattern: "weekly", weekdays: [] },
      "Pilih minimal satu hari untuk pola mingguan.",
    ],
  ])("%s, with a message", (_kind, sent, message) => {
    expect(refusal(sent)).toBe(message);
  });

  it.each([
    ["a name too long", { name: "a".repeat(101) }],
    ["a Kategori not on the list", { category: "party" }],
    ["a place too long", { location: "a".repeat(101) }],
    ["a pattern not on the list", { pattern: "yearly" }],
    ["a day of the week 7", { pattern: "weekly", weekdays: ["7"] }],
    ["the 29th of the month", { pattern: "monthly", monthDay: "29" }],
    ["the 0th of the month", { pattern: "monthly", monthDay: "0" }],
    ["no Berlaku mulai", { startsOn: "" }],
    ["a Berlaku sampai that is no day", { endsOn: "besok" }],
    ["a day off that is no day", { daysOff: ["2026-13-01"] }],
    ["a start hour that is no hour", { startTime: "24:00" }],
    ["an end hour that is no hour", { endTime: "7:30" }],
    ["a penanggung jawab not on the list", { organiser: "dosen" }],
    [
      "a name of the penanggung jawab too long",
      { organiserName: "a".repeat(101) },
    ],
    ["a Peserta not on the list", { audience: "staf" }],
    ["lines of Rincian kegiatan that do not pair up", { rundownTimes: [] }],
    [
      "more than 20 lines of Rincian kegiatan",
      {
        rundownTimes: Array.from({ length: 21 }, () => "07:00"),
        rundownActivities: Array.from({ length: 21 }, () => "Apel"),
      },
    ],
  ])("%s", (_kind, sent) => {
    expect(refusal(sent)).not.toBeNull();
  });
});
