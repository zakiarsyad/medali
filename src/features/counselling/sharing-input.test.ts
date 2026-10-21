import { describe, expect, it } from "vitest";
import { SUMMARY_MAX } from "./sharing-ids";
import { readSharingInput } from "./sharing-input";
import {
  NO_DATA,
  NO_RECIPIENT,
  NO_SUMMARY,
  SUMMARY_TOO_LONG,
} from "./sharing-words";

const SUMMARY = "Mahasiswa sedang dalam pendampingan rutin.";

describe("what Konselor asks to share", () => {
  it("is kept in the order of the form, each once, with the summary trimmed", () => {
    expect(
      readSharingInput(
        ["summary", "counselling", "summary"],
        ["mentor", "head_of_unit"],
        `  ${SUMMARY}  `,
      ),
    ).toEqual({
      ok: true,
      value: {
        data: ["counselling", "summary"],
        recipients: ["head_of_unit", "mentor"],
        summary: SUMMARY,
      },
    });
  });

  it("keeps no summary when the summary is not chosen", () => {
    expect(readSharingInput(["counselling"], ["director"], SUMMARY)).toEqual({
      ok: true,
      value: { data: ["counselling"], recipients: ["director"], summary: null },
    });
  });

  it("is refused with no data", () => {
    expect(readSharingInput([], ["mentor"], "")).toEqual({
      ok: false,
      error: NO_DATA,
    });
  });

  it("is refused with no recipient", () => {
    expect(readSharingInput(["counselling"], [], "")).toEqual({
      ok: false,
      error: NO_RECIPIENT,
    });
  });

  it("is refused with a chosen summary under 10 letters, or too long", () => {
    expect(readSharingInput(["summary"], ["mentor"], " Pendek   ")).toEqual({
      ok: false,
      error: NO_SUMMARY,
    });
    expect(
      readSharingInput(["summary"], ["mentor"], "a".repeat(SUMMARY_MAX + 1)),
    ).toEqual({ ok: false, error: SUMMARY_TOO_LONG });
  });

  it("takes the level, first in the order of the form", () => {
    expect(readSharingInput(["counselling", "level"], ["mentor"], "")).toEqual({
      ok: true,
      value: {
        data: ["level", "counselling"],
        recipients: ["mentor"],
        summary: null,
      },
    });
  });

  it("takes no data or recipient it does not know, Pengelola Asrama and BAM among them", () => {
    expect(readSharingInput(["scores", "note"], ["mentor"], "")).toEqual({
      ok: false,
      error: NO_DATA,
    });
    expect(
      readSharingInput(["counselling"], ["dorm_manager", "bam_health"], ""),
    ).toEqual({ ok: false, error: NO_RECIPIENT });
  });

  it("is refused when what was sent is not lists and text", () => {
    expect(readSharingInput(null, null, null)).toEqual({
      ok: false,
      error: NO_DATA,
    });
    expect(readSharingInput("counselling", "mentor", "")).toEqual({
      ok: false,
      error: NO_DATA,
    });
    expect(readSharingInput(["summary"], ["mentor"], 12345678901)).toEqual({
      ok: false,
      error: NO_SUMMARY,
    });
  });
});
