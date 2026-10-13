import { describe, expect, it } from "vitest";
import {
  attendanceShare,
  averageAttendance,
  shownAverage,
} from "./attendance-average";

describe("attendanceShare", () => {
  it("is hadir divided by hadir plus alpa", () => {
    expect(attendanceShare(["present", "present", "present", "absent"])).toBe(
      0.75,
    );
  });

  it("leaves Izin and Sakit out", () => {
    expect(attendanceShare(["present", "excused", "sick", "absent"])).toBe(0.5);
    expect(attendanceShare(["present", "excused", "sick"])).toBe(1);
  });

  it("is 0 for a member who was only Alpa", () => {
    expect(attendanceShare(["absent", "absent"])).toBe(0);
  });

  it("is nothing for a member with no Hadir and no Alpa", () => {
    expect(attendanceShare([])).toBeNull();
    expect(attendanceShare(["excused", "sick"])).toBeNull();
  });
});

describe("averageAttendance", () => {
  it("is the average of the members' own shares, not of all marks together", () => {
    // 1 of 1 and 1 of 4: the shares are 100% and 25%, so 62.5%. All
    // marks together would give 2 of 5, 40%.
    const average = averageAttendance([
      ["present"],
      ["present", "absent", "absent", "absent"],
    ]);

    expect(average).toBe(63);
  });

  it("leaves out the members who have no Hadir and no Alpa", () => {
    const average = averageAttendance([
      ["present", "absent"],
      ["excused", "sick"],
      [],
    ]);

    expect(average).toBe(50);
  });

  it("is a whole percent", () => {
    const average = averageAttendance([
      ["present", "present", "absent"],
      ["present"],
      ["present"],
    ]);

    expect(average).toBe(89);
  });

  it("is 100 when every counted member always came, and 0 when none did", () => {
    expect(averageAttendance([["present"], ["present", "sick"]])).toBe(100);
    expect(averageAttendance([["absent"], ["absent", "excused"]])).toBe(0);
  });

  it("is nothing while no member has a Hadir or an Alpa", () => {
    expect(averageAttendance([])).toBeNull();
    expect(averageAttendance([[], ["excused"], ["sick", "sick"]])).toBeNull();
  });
});

describe("shownAverage", () => {
  it("shows a percent, and a dash where there is none", () => {
    expect(shownAverage(87)).toBe("87%");
    expect(shownAverage(0)).toBe("0%");
    expect(shownAverage(null)).toBe("-");
  });
});
