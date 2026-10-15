import { describe, expect, it } from "vitest";
import { dashboardAddress } from "./dashboard-address";

describe("dashboardAddress", () => {
  it("leaves out the first page of Kehadiran kegiatan, and names any other", () => {
    expect(dashboardAddress(1)).toBe("/asrama/dash");
    expect(dashboardAddress(3)).toBe("/asrama/dash?hal=3");
  });
});
