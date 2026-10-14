import { describe, expect, it } from "vitest";
import { AUDIENCES, ROUTINE_PATTERNS } from "@/features/dorm/activity-ids";
import { PAGE_SIZE } from "@/ui/list-pages";
import { sampleDormActivities } from "./sample-dorm-activities";

const DAY = "2026-10-14";
const samples = sampleDormActivities(DAY);
const current = samples.map(({ versions }) => {
  const open = versions.find((version) => version.shownUntil === null);
  if (!open) throw new Error("A sample activity has no version without end.");
  return open;
});
const oneOffs = current.filter((version) => version.pattern === "once");

describe("sampleDormActivities", () => {
  it("gives each activity one version without a last day", () => {
    for (const { versions } of samples) {
      const open = versions.filter((version) => version.shownUntil === null);

      expect(open).toHaveLength(1);
    }
  });

  it("has a repeating activity of every pattern", () => {
    for (const pattern of ROUTINE_PATTERNS) {
      expect(current.map((version) => version.pattern)).toContain(pattern);
    }
  });

  it("has activities for every resident, for the men, for the women and for one dorm", () => {
    const audiences = current.map((version) => version.audience);
    const dorms = AUDIENCES.filter(
      (audience) => !["all", "men", "women"].includes(audience),
    );

    expect(audiences).toEqual(expect.arrayContaining(["all", "men", "women"]));
    expect(audiences.some((audience) => dorms.includes(audience))).toBe(true);
  });

  it("has an activity that was changed, whose earlier version ends the day before the newer one starts", () => {
    const changed = samples.filter(({ versions }) => versions.length > 1);

    expect(changed).toHaveLength(1);
    const [before, after] = changed[0]?.versions ?? [];
    expect(before?.shownUntil).toBe("2026-09-29");
    expect(after?.shownFrom).toBe("2026-09-30");
    expect(before?.startTime).not.toBe(after?.startTime);
  });

  it("has an activity with a day off", () => {
    const daysOff = samples.flatMap((sample) => sample.daysOff);

    expect(daysOff).toEqual(["2026-10-08"]);
  });

  it("has one-off activities that are over, today and to come, more than one page of them", () => {
    const days = oneOffs.map((version) => version.startsOn);

    expect(days.filter((day) => day < DAY).length).toBeGreaterThan(1);
    expect(days.filter((day) => day === DAY)).toHaveLength(1);
    expect(days.filter((day) => day > DAY).length).toBeGreaterThan(1);
    expect(oneOffs.length).toBeGreaterThan(PAGE_SIZE);
  });

  it("has activities today that are over early, that last all day and that start late", () => {
    const daily = current.filter((version) => version.pattern === "daily");
    const allDay = oneOffs.find((version) => version.startsOn === DAY);

    expect(daily.some((version) => version.endTime < "07:00")).toBe(true);
    expect(daily.some((version) => version.startTime >= "22:00")).toBe(true);
    expect(allDay).toMatchObject({ startTime: "00:00", endTime: "23:59" });
  });

  it("ends each after its first hour, and a one-off on its own day", () => {
    for (const version of current) {
      expect(version.endTime > version.startTime).toBe(true);
    }
    for (const version of oneOffs) {
      expect(version.endsOn).toBe(version.startsOn);
    }
  });

  it("moves with the day it is made for", () => {
    const later = sampleDormActivities("2027-03-02");

    expect(later[0]?.versions[0]?.startsOn).not.toBe(
      samples[0]?.versions[0]?.startsOn,
    );
  });
});
