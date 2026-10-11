import { describe, expect, it } from "vitest";
import { pagesFor } from "@/auth/access";
import { SAMPLE_ACCOUNTS, SAMPLE_PPKS_ACTIVITIES } from "./sample-data";

describe("the sample account with two roles", () => {
  it("shows more pages than either of its roles alone", () => {
    const twoRoles = SAMPLE_ACCOUNTS.filter((a) => a.roles.length === 2);
    expect(twoRoles).toHaveLength(1);
    const roles = twoRoles[0]?.roles ?? [];
    const together = pagesFor(roles).length;
    for (const role of roles) {
      expect(together).toBeGreaterThan(pagesFor([role]).length);
    }
  });
});

describe("the sample PPKS activities", () => {
  it("spread over more than one semester, from 1 to 8", () => {
    const semesters = SAMPLE_PPKS_ACTIVITIES.map((a) => a.semester);
    expect(new Set(semesters).size).toBeGreaterThan(1);
    for (const semester of semesters) {
      expect(semester).toBeGreaterThanOrEqual(1);
      expect(semester).toBeLessThanOrEqual(8);
    }
  });

  it("aim only at indicators of their own values", () => {
    for (const activity of SAMPLE_PPKS_ACTIVITIES) {
      expect(activity.indicatorCodes.length).toBeGreaterThan(0);
      for (const code of activity.indicatorCodes) {
        expect(activity.valueKeys).toContain(code[0]);
        expect(code).toMatch(/^[MEDALI][1-4]$/);
      }
    }
  });
});
