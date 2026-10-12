import { describe, expect, it } from "vitest";
import {
  academicClasses,
  countedMembers,
  isOnLeave,
  memberSemester,
} from "./member-rules";

const ACTIVE = { status: "active", className: "2-01" } as const;
const ON_LEAVE = { status: "on_leave", className: "2-09" } as const;

describe("countedMembers", () => {
  it("counts the Aktif members, not those on Cuti", () => {
    expect(countedMembers([ACTIVE, ON_LEAVE, ACTIVE])).toBe(2);
  });

  it("counts nobody in a group without members", () => {
    expect(countedMembers([])).toBe(0);
  });
});

describe("isOnLeave", () => {
  it("tags a member on Cuti and no other", () => {
    expect(isOnLeave(ON_LEAVE)).toBe(true);
    expect(isOnLeave(ACTIVE)).toBe(false);
  });
});

describe("academicClasses", () => {
  it("counts each kelas akademik of the Aktif members once", () => {
    const members = [
      ACTIVE,
      { ...ACTIVE, className: "2-02" },
      { ...ACTIVE, className: "2-01" },
    ];

    expect(academicClasses(members)).toBe(2);
  });

  it("leaves out a member without a kelas and a member on Cuti", () => {
    const members = [ACTIVE, { ...ACTIVE, className: null }, ON_LEAVE];

    expect(academicClasses(members)).toBe(1);
  });
});

describe("memberSemester", () => {
  it("gives the semester of the member's angkatan in the running period", () => {
    const period = { startYear: 2026, term: "odd" } as const;

    expect(memberSemester({ cohortYear: 2026 }, period)).toBe(1);
    expect(memberSemester({ cohortYear: 2024 }, period)).toBe(5);
  });

  it("gives none while no academic period runs", () => {
    expect(memberSemester({ cohortYear: 2026 }, null)).toBeNull();
  });
});
