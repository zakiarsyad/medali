import { describe, expect, it } from "vitest";
import {
  EVALUATION_ADDRESS,
  evaluationAddress,
  formAddress,
  readChosenGroup,
  readChosenPart,
  replacementAddress,
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

describe("readChosenPart", () => {
  it("opens Penggantian only when the address names it", () => {
    expect(readChosenPart({ bagian: "penggantian" })).toBe("replacement");
    expect(readChosenPart({ bagian: ["penggantian", "lain"] })).toBe(
      "replacement",
    );
  });

  it("opens Evaluasi for an address that names nothing, or something else", () => {
    expect(readChosenPart({})).toBe("evaluation");
    expect(readChosenPart({ bagian: "evaluasi" })).toBe("evaluation");
    expect(readChosenPart({ bagian: "hapus" })).toBe("evaluation");
  });
});

describe("formAddress", () => {
  it("is the address of the tab when no form and no group is named", () => {
    expect(formAddress("evaluation", null)).toBe(EVALUATION_ADDRESS);
  });

  it("names Penggantian without a group", () => {
    expect(formAddress("replacement", null)).toBe(
      `${EVALUATION_ADDRESS}?bagian=penggantian`,
    );
  });
});

describe("replacementAddress", () => {
  it("opens the tab on Penggantian with the group chosen, as the tab reads it back", () => {
    const address = replacementAddress(GROUP_ID);

    expect(address).toBe(
      `${EVALUATION_ADDRESS}?bagian=penggantian&kelompok=${GROUP_ID}`,
    );
    const params = new URL(address, "http://localhost").searchParams;
    const read = Object.fromEntries(params);
    expect(readChosenGroup(read)).toBe(GROUP_ID);
    expect(readChosenPart(read)).toBe("replacement");
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
