import { describe, expect, it } from "vitest";
import { inactiveFacts, type ReadMentorEnd } from "./inactive-facts";

const NO_END: ReadMentorEnd = {
  roleTakenAt: null,
  deletedAt: null,
  leftAsInactive: false,
  leftOn: null,
  leftFor: null,
};

const RETIRED: ReadMentorEnd = {
  ...NO_END,
  leftAsInactive: true,
  leftOn: "2026-10-01",
  leftFor: "retirement",
};

describe("inactiveFacts", () => {
  it("says nothing of a mentor who is not Tidak aktif", () => {
    expect(inactiveFacts("reserve", RETIRED)).toEqual({
      inactiveSince: null,
      inactiveReason: null,
    });
  });

  it("gives the start date and the reason of the replacement that set the mentor Tidak aktif", () => {
    expect(inactiveFacts("inactive", RETIRED)).toEqual({
      inactiveSince: "2026-10-01",
      inactiveReason: "Pensiun",
    });
  });

  it("keeps the replacement's date and reason when the account was removed later", () => {
    const removed = { ...RETIRED, deletedAt: new Date("2026-11-05T03:00:00Z") };

    expect(inactiveFacts("inactive", removed)).toEqual({
      inactiveSince: "2026-10-01",
      inactiveReason: "Pensiun",
    });
  });

  it("gives the day the role was taken for one the account made Tidak aktif", () => {
    const taken = { ...NO_END, roleTakenAt: new Date("2026-03-04T02:00:00Z") };

    expect(inactiveFacts("inactive", taken)).toEqual({
      inactiveSince: "2026-03-04",
      inactiveReason: "Akun dihapus atau peran diganti",
    });
  });

  it("makes up no day when none is known", () => {
    expect(inactiveFacts("inactive", NO_END)).toEqual({
      inactiveSince: null,
      inactiveReason: "Akun dihapus atau peran diganti",
    });
  });
});
