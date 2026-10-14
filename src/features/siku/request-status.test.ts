import { describe, expect, it } from "vitest";
import {
  SHOWN_STATUS_WORDS,
  shownStatus,
  waitingWords,
} from "./request-status";

describe("waitingWords", () => {
  it("says how many requests wait, or that none does", () => {
    expect(waitingWords(0)).toBe("tidak ada pengajuan menunggu");
    expect(waitingWords(1)).toBe("1 pengajuan menunggu");
    expect(waitingWords(12)).toBe("12 pengajuan menunggu");
  });
});

describe("shownStatus", () => {
  it("shows a waiting request as Diajukan", () => {
    const shown = shownStatus({ status: "waiting", gainCancelled: false });

    expect(shown).toBe("waiting");
    expect(shown && SHOWN_STATUS_WORDS[shown]).toBe("Diajukan");
  });

  it("shows an approved request whose gain is in force as Disetujui", () => {
    const shown = shownStatus({ status: "approved", gainCancelled: false });

    expect(shown).toBe("approved");
    expect(shown && SHOWN_STATUS_WORDS[shown]).toBe("Disetujui");
  });

  it("shows an approved request whose gain was cancelled as Dibatalkan", () => {
    const shown = shownStatus({ status: "approved", gainCancelled: true });

    expect(shown).toBe("cancelled");
    expect(shown && SHOWN_STATUS_WORDS[shown]).toBe("Dibatalkan");
  });

  it("shows a rejected request as Ditolak", () => {
    const shown = shownStatus({ status: "rejected", gainCancelled: false });

    expect(shown && SHOWN_STATUS_WORDS[shown]).toBe("Ditolak");
  });

  it("shows a withdrawn request to nobody", () => {
    expect(shownStatus({ status: "withdrawn", gainCancelled: false })).toBe(
      null,
    );
  });
});
