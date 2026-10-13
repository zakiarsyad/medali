import { describe, expect, it } from "vitest";
import { NOT_UNDERSTOOD, parseChangeSent } from "./change-sent";
import { GROUP_NOT_AVAILABLE } from "./fitting-group";

const GROUP_ID = "00000000-0000-4000-8000-000000000035";
const OPENED_ID = "00000000-0000-4000-8000-000000000036";

const NO_GROUPS = { mentorGroupId: "", openedGroupId: "", version: "1" };

describe("parseChangeSent", () => {
  it("reads the group chosen, and the group and the version the form opened with", () => {
    const sent = parseChangeSent({
      mentorGroupId: GROUP_ID,
      openedGroupId: OPENED_ID,
      version: "3",
    });

    expect(sent).toEqual({
      ok: true,
      value: { mentorGroupId: GROUP_ID, openedGroupId: OPENED_ID, version: 3 },
    });
  });

  it("reads the empty choice as no group", () => {
    const sent = parseChangeSent({ ...NO_GROUPS, openedGroupId: OPENED_ID });

    expect(sent).toEqual({
      ok: true,
      value: { mentorGroupId: null, openedGroupId: OPENED_ID, version: 1 },
    });
  });

  it("reads a form that opened with no group as opened with none", () => {
    const sent = parseChangeSent({ ...NO_GROUPS, mentorGroupId: GROUP_ID });

    expect(sent).toEqual({
      ok: true,
      value: { mentorGroupId: GROUP_ID, openedGroupId: null, version: 1 },
    });
  });

  it("refuses a group that has not the shape of an id", () => {
    const sent = parseChangeSent({ ...NO_GROUPS, mentorGroupId: "kelompok" });

    expect(sent).toEqual(GROUP_NOT_AVAILABLE);
  });

  it("refuses an opened group that has not the shape of an id", () => {
    const sent = parseChangeSent({ ...NO_GROUPS, openedGroupId: "kelompok" });

    expect(sent).toEqual(NOT_UNDERSTOOD);
  });

  it.each(["", "0", "-1", "1.5", "satu", "1 or 1=1", "99999999999"])(
    "refuses the version '%s'",
    (version) => {
      const sent = parseChangeSent({ ...NO_GROUPS, version });

      expect(sent).toEqual(NOT_UNDERSTOOD);
    },
  );
});
