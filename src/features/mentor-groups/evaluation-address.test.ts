import { describe, expect, it } from "vitest";
import {
  EVALUATION_ADDRESS,
  evaluationAddress,
  readChosenGroup,
} from "./evaluation-address";

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4a01";

describe("readChosenGroup", () => {
  it("reads the group the address names", () => {
    expect(readChosenGroup({ kelompok: GROUP_ID })).toBe(GROUP_ID);
    expect(readChosenGroup({ kelompok: [GROUP_ID, "lain"] })).toBe(GROUP_ID);
  });

  it("counts what is no id, or nothing, as not asked", () => {
    expect(readChosenGroup({})).toBeNull();
    expect(readChosenGroup({ kelompok: "" })).toBeNull();
    expect(readChosenGroup({ kelompok: "1 or 1=1" })).toBeNull();
  });
});

describe("evaluationAddress", () => {
  it("opens the tab with the group chosen, as the tab reads it back", () => {
    const address = evaluationAddress(GROUP_ID);

    expect(address).toBe(`${EVALUATION_ADDRESS}?kelompok=${GROUP_ID}`);
    const params = new URL(address, "http://localhost").searchParams;
    expect(readChosenGroup(Object.fromEntries(params))).toBe(GROUP_ID);
  });
});
