import { describe, expect, it } from "vitest";
import { UPLOAD_COUNT_MAX, uploadDeadline } from "./upload-range";

const ENDS_ON = "2026-10-13";

describe("uploadDeadline", () => {
  it("is the last day itself for a range of 0, in either unit", () => {
    expect(
      uploadDeadline({ endsOn: ENDS_ON, uploadCount: 0, uploadUnit: "day" }),
    ).toBe(ENDS_ON);
    expect(
      uploadDeadline({ endsOn: ENDS_ON, uploadCount: 0, uploadUnit: "week" }),
    ).toBe(ENDS_ON);
  });

  it("adds one day for each hari", () => {
    expect(
      uploadDeadline({ endsOn: ENDS_ON, uploadCount: 1, uploadUnit: "day" }),
    ).toBe("2026-10-14");
    expect(
      uploadDeadline({ endsOn: ENDS_ON, uploadCount: 20, uploadUnit: "day" }),
    ).toBe("2026-11-02");
  });

  it("adds seven days for each minggu", () => {
    expect(
      uploadDeadline({ endsOn: ENDS_ON, uploadCount: 1, uploadUnit: "week" }),
    ).toBe("2026-10-20");
    expect(
      uploadDeadline({ endsOn: ENDS_ON, uploadCount: 3, uploadUnit: "week" }),
    ).toBe("2026-11-03");
  });

  it("reaches into the next year for the longest range", () => {
    expect(
      uploadDeadline({
        endsOn: ENDS_ON,
        uploadCount: UPLOAD_COUNT_MAX,
        uploadUnit: "week",
      }),
    ).toBe("2027-10-12");
  });

  it("counts from the last day, not the first", () => {
    const range = { uploadCount: 2, uploadUnit: "day" } as const;

    expect(uploadDeadline({ ...range, endsOn: "2026-10-15" })).toBe(
      "2026-10-17",
    );
  });
});
