import { describe, expect, it } from "vitest";
import {
  REPLACEMENT_STATUS_TITLES,
  replacementStatus,
} from "./replacement-status";

const AT = new Date("2026-10-01T05:00:00Z");

describe("replacementStatus", () => {
  it("is Terjadwal while it is neither carried out nor cancelled", () => {
    const status = replacementStatus({ carriedOutAt: null, cancelledAt: null });

    expect(status).toBe("scheduled");
    expect(REPLACEMENT_STATUS_TITLES[status]).toBe("Terjadwal");
  });

  it("is Berlaku once it is carried out", () => {
    const status = replacementStatus({ carriedOutAt: AT, cancelledAt: null });

    expect(status).toBe("in_force");
    expect(REPLACEMENT_STATUS_TITLES[status]).toBe("Berlaku");
  });

  it("is Dibatalkan once it is cancelled", () => {
    const status = replacementStatus({ carriedOutAt: null, cancelledAt: AT });

    expect(status).toBe("cancelled");
    expect(REPLACEMENT_STATUS_TITLES[status]).toBe("Dibatalkan");
  });
});
