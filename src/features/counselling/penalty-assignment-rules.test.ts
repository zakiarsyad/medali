import { describe, expect, it } from "vitest";
import { readsPageAgain, senderMessageOf } from "./penalty-assignment-rules";
import {
  ALREADY_ASSIGNED,
  assignedTo,
  PENALTY_NOT_FOUND,
} from "./penalty-assignment-words";

describe("Pesan untuk konselor of a Penugasan", () => {
  it("keeps what was typed without the spaces around it", () => {
    expect(senderMessageOf("  Mohon pendampingan.\n")).toBe(
      "Mohon pendampingan.",
    );
  });

  it("keeps none when nothing but spaces was typed", () => {
    expect(senderMessageOf("")).toBeNull();
    expect(senderMessageOf("   ")).toBeNull();
  });
});

describe("Rincian read again after Tugaskan konseling", () => {
  it("is read again once it is sent, so the status box replaces the button", () => {
    expect(
      readsPageAgain({ error: null, done: assignedTo("Ani Contoh") }),
    ).toBe(true);
  });

  it("is read again when someone else sent it first, so their status box shows", () => {
    expect(readsPageAgain({ error: ALREADY_ASSIGNED, done: null })).toBe(true);
  });

  it("is not read again on another refusal, so the message typed stays", () => {
    expect(readsPageAgain({ error: PENALTY_NOT_FOUND, done: null })).toBe(
      false,
    );
  });
});
