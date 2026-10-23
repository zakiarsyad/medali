import { describe, expect, it } from "vitest";
import { isOnLeave, memberSemester } from "./member-rules";

const ACTIVE = { status: "active" } as const;
const ON_LEAVE = { status: "on_leave" } as const;

describe("isOnLeave", () => {
  it("tags a member on Cuti and no other", () => {
    expect(isOnLeave(ON_LEAVE)).toBe(true);
    expect(isOnLeave(ACTIVE)).toBe(false);
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
