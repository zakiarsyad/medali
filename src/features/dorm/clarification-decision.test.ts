import { describe, expect, it } from "vitest";
import {
  doneWords,
  NOTE_TOO_LONG,
  parseDecision,
  REJECTION_NEEDS_NOTE,
  statusAfterStep,
  UNKNOWN_DECISION,
} from "./clarification-decision";

describe("parseDecision", () => {
  it("takes BAM passing on or rejecting, and only that, at the check", () => {
    expect(parseDecision("verify", "pass", "")).toEqual({
      ok: true,
      value: { kind: "pass", note: "" },
    });
    expect(parseDecision("verify", "present", "")).toEqual(UNKNOWN_DECISION);
    expect(parseDecision("verify", "leave", "")).toEqual(UNKNOWN_DECISION);
  });

  it("takes Pengelola Asrama accepting as present or as leave, or rejecting, and not passing on", () => {
    expect(parseDecision("decide", "present", " Sesuai. ")).toEqual({
      ok: true,
      value: { kind: "present", note: "Sesuai." },
    });
    expect(parseDecision("decide", "leave", "")).toMatchObject({ ok: true });
    expect(parseDecision("decide", "pass", "")).toEqual(UNKNOWN_DECISION);
  });

  it("needs a note to reject, at either step", () => {
    expect(parseDecision("verify", "reject", "  ")).toEqual(
      REJECTION_NEEDS_NOTE,
    );
    expect(parseDecision("decide", "reject", null)).toEqual(
      REJECTION_NEEDS_NOTE,
    );
    expect(parseDecision("decide", "reject", "Surat tidak sah.")).toMatchObject(
      { ok: true, value: { kind: "reject", note: "Surat tidak sah." } },
    );
  });

  it("refuses a note longer than 200 letters, and a kind that is no text", () => {
    expect(parseDecision("verify", "pass", "a".repeat(201))).toEqual(
      NOTE_TOO_LONG,
    );
    expect(parseDecision("verify", "pass", "a".repeat(200))).toMatchObject({
      ok: true,
    });
    expect(parseDecision("decide", 3, "")).toEqual(UNKNOWN_DECISION);
  });
});

describe("statusAfterStep", () => {
  it("moves a clarification BAM passes on to Diverifikasi BAM, and one Pengelola accepts to Diterima", () => {
    expect(statusAfterStep("verify", "pass")).toBe("verified");
    expect(statusAfterStep("decide", "present")).toBe("accepted");
    expect(statusAfterStep("decide", "leave")).toBe("accepted");
  });

  it("makes a rejection at either step Ditolak, without going on to Pengelola", () => {
    expect(statusAfterStep("verify", "reject")).toBe("rejected");
    expect(statusAfterStep("decide", "reject")).toBe("rejected");
  });
});

describe("doneWords", () => {
  it("says what became of the clarification", () => {
    expect(doneWords("pass")).toBe(
      "Klarifikasi diterima dan diteruskan ke Pengelola Asrama.",
    );
    expect(doneWords("present")).toBe(
      "Klarifikasi diterima; status kehadiran diperbarui.",
    );
    expect(doneWords("reject")).toBe("Klarifikasi ditolak.");
  });
});
