import { describe, expect, it } from "vitest";
import { historyAfter, NO_ROW_OPEN } from "./history-state";

const SENT = { error: null, done: "Klarifikasi terkirim." };
const REFUSED = { error: "Lampirkan dokumen pendukung.", done: null };

describe("historyAfter", () => {
  it("opens one form at a time, and clears the last answer", () => {
    const answered = { openKey: null, answer: { key: "a", state: SENT } };

    expect(historyAfter(answered, { kind: "opened", key: "b" })).toEqual({
      openKey: "b",
      answer: null,
    });
  });

  it("closes the form on Batal and keeps the answer", () => {
    const open = { openKey: "a", answer: { key: "a", state: REFUSED } };

    expect(historyAfter(open, { kind: "cancelled" })).toEqual({
      openKey: null,
      answer: { key: "a", state: REFUSED },
    });
  });

  it("closes the form of a row whose clarification was kept, and leaves a refused one open", () => {
    const open = { ...NO_ROW_OPEN, openKey: "a" };

    expect(
      historyAfter(open, { kind: "answered", key: "a", state: SENT }),
    ).toEqual({ openKey: null, answer: { key: "a", state: SENT } });
    expect(
      historyAfter(open, { kind: "answered", key: "a", state: REFUSED }),
    ).toEqual({ openKey: "a", answer: { key: "a", state: REFUSED } });
  });

  it("never closes the form of another row opened in the meantime", () => {
    const other = { ...NO_ROW_OPEN, openKey: "b" };

    expect(
      historyAfter(other, { kind: "answered", key: "a", state: SENT }),
    ).toEqual({ openKey: "b", answer: { key: "a", state: SENT } });
  });
});
