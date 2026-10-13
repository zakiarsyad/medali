import { describe, expect, it } from "vitest";
import { askedGroupId, groupTabAddress } from "./group-address";

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7001";

describe("askedGroupId", () => {
  it("reads the group the address names", () => {
    expect(askedGroupId({ kelompok: GROUP_ID })).toBe(GROUP_ID);
    expect(askedGroupId({ kelompok: [GROUP_ID, "lain"] })).toBe(GROUP_ID);
  });

  it.each(["", "semua", "1 or 1=1", `${GROUP_ID}x`])(
    "takes %o as no group",
    (kelompok) => {
      expect(askedGroupId({ kelompok })).toBeNull();
    },
  );

  it("names no group for an address without one", () => {
    expect(askedGroupId({})).toBeNull();
  });
});

describe("groupTabAddress", () => {
  it("names the group in the address of the tab", () => {
    expect(groupTabAddress("/pengasuhan/nilai", GROUP_ID)).toBe(
      `/pengasuhan/nilai?kelompok=${GROUP_ID}`,
    );
  });
});
