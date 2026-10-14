import { describe, expect, it } from "vitest";
import {
  byWords,
  decisionWords,
  fileNotOpenedWords,
  offerOf,
  verificationWords,
} from "./clarification-card";

describe("verificationWords", () => {
  it("says BAM passed on one it checked, with its note", () => {
    expect(verificationWords("verified", false, "Dikonfirmasi.")).toBe(
      "Diterima BAM: Dikonfirmasi.",
    );
    expect(verificationWords("accepted", true, "")).toBe("Diterima BAM");
  });

  it("says BAM passed on one that Pengelola Asrama rejected after", () => {
    expect(verificationWords("rejected", true, "")).toBe("Diterima BAM");
  });

  it("says BAM rejected one rejected with no decision after the check", () => {
    expect(verificationWords("rejected", false, "Tidak ada surat.")).toBe(
      "Ditolak BAM: Tidak ada surat.",
    );
  });
});

describe("decisionWords", () => {
  it.each([
    ["present", "Diterima sebagai hadir"],
    ["leave", "Diterima sebagai izin"],
  ] as const)("says how it was accepted: %s", (acceptedAs, words) => {
    expect(decisionWords("accepted", acceptedAs, "")).toBe(words);
  });

  it("says it was rejected or closed, with the note", () => {
    expect(decisionWords("rejected", null, "Surat tidak sah.")).toBe(
      "Ditolak: Surat tidak sah.",
    );
    expect(decisionWords("closed", null, "Ketidakhadiran dibatalkan.")).toBe(
      "Ditutup: Ketidakhadiran dibatalkan.",
    );
  });
});

describe("byWords", () => {
  it("names who and when, in campus time", () => {
    expect(byWords("BAM Uji", new Date("2026-10-14T02:05:00Z"))).toBe(
      "(BAM Uji, 14 Okt 2026, 09.05)",
    );
  });
});

describe("offerOf", () => {
  const bam = { verify: true, decide: false };
  const manager = { verify: false, decide: true };
  const reader = { verify: false, decide: false };

  it("offers BAM the check of one that waits for it, and nothing else", () => {
    expect(offerOf("submitted", bam)).toBe("verify");
    expect(offerOf("verified", bam)).toBeNull();
  });

  it("offers Pengelola Asrama the decision once BAM passed it on, and says before that it waits for BAM", () => {
    expect(offerOf("verified", manager)).toBe("decide");
    expect(offerOf("submitted", manager)).toBe("waits_for_bam");
  });

  it.each(["accepted", "rejected", "closed"] as const)(
    "offers nothing on one that is %s, to anyone",
    (status) => {
      expect(offerOf(status, bam)).toBeNull();
      expect(offerOf(status, manager)).toBeNull();
    },
  );

  it("offers a role that only reads nothing", () => {
    expect(offerOf("submitted", reader)).toBeNull();
    expect(offerOf("verified", reader)).toBeNull();
  });
});

describe("fileNotOpenedWords", () => {
  it("tells a role that only reads that there is a file, without its name", () => {
    expect(fileNotOpenedWords(true)).toBe("Terlampir");
    expect(fileNotOpenedWords(false)).toBe("-");
  });
});
