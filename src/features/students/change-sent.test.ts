import { describe, expect, it } from "vitest";
import { NOT_UNDERSTOOD, parseChangeSent } from "./change-sent";
import { GROUP_NOT_AVAILABLE } from "./fitting-group";

const GROUP_ID = "00000000-0000-4000-8000-000000000035";

describe("parseChangeSent", () => {
  it("reads the group chosen and the version the form opened with", () => {
    const sent = parseChangeSent({ mentorGroupId: GROUP_ID, version: "3" });

    expect(sent).toEqual({
      ok: true,
      value: { mentorGroupId: GROUP_ID, version: 3 },
    });
  });

  it("reads the empty choice as no group", () => {
    const sent = parseChangeSent({ mentorGroupId: "", version: "1" });

    expect(sent).toEqual({
      ok: true,
      value: { mentorGroupId: null, version: 1 },
    });
  });

  it("refuses a group that has not the shape of an id", () => {
    const sent = parseChangeSent({ mentorGroupId: "kelompok", version: "1" });

    expect(sent).toEqual(GROUP_NOT_AVAILABLE);
  });

  it.each(["", "0", "-1", "1.5", "satu", "1 or 1=1", "99999999999"])(
    "refuses the version '%s'",
    (version) => {
      const sent = parseChangeSent({ mentorGroupId: "", version });

      expect(sent).toEqual(NOT_UNDERSTOOD);
    },
  );
});
