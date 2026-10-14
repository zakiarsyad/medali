import { describe, expect, it } from "vitest";
import {
  alreadyAttendedWords,
  answerToPress,
  type ClarificationAnswer,
  doneWords,
  parseDecision,
} from "./clarification-decision";

describe("parseDecision", () => {
  it.each(["present", "dispensation"] as const)(
    "takes %s without a Catatan, and keeps one that is written",
    (kind) => {
      expect(parseDecision(kind, "")).toEqual({
        ok: true,
        value: { kind, note: "" },
      });
      expect(parseDecision(kind, " Surat sesuai. ")).toEqual({
        ok: true,
        value: { kind, note: "Surat sesuai." },
      });
    },
  );

  it("needs a Catatan for a rejection: spaces, or what is no text, count as none", () => {
    const missing = {
      ok: false,
      error: "Tulis alasan penolakan di kolom catatan.",
    };

    expect(parseDecision("reject", "")).toEqual(missing);
    expect(parseDecision("reject", "  \n ")).toEqual(missing);
    expect(parseDecision("reject", ["Uji"])).toEqual(missing);
    expect(parseDecision("reject", "Lampiran tidak terbaca.")).toEqual({
      ok: true,
      value: { kind: "reject", note: "Lampiran tidak terbaca." },
    });
  });

  it("takes a Catatan of 200 characters and refuses a longer one, spaces around it not counted", () => {
    expect(parseDecision("reject", ` ${"a".repeat(200)} `).ok).toBe(true);
    expect(parseDecision("present", "a".repeat(201))).toEqual({
      ok: false,
      error: "Catatan paling banyak 200 karakter.",
    });
  });

  it("drops the character the database keeps no text with", () => {
    expect(parseDecision("reject", "Uji\u0000 saja")).toEqual({
      ok: true,
      value: { kind: "reject", note: "Uji saja" },
    });
  });

  it("does not understand what is none of the three decisions", () => {
    for (const kind of ["valid", "", undefined, 3]) {
      expect(parseDecision(kind, "Uji")).toEqual({
        ok: false,
        error: "Putusan tidak dikenal. Muat ulang halaman.",
      });
    }
  });
});

describe("the words of a decision", () => {
  it("say what was done", () => {
    expect(doneWords("present")).toBe(
      "Klarifikasi diterima; status kehadiran diperbarui.",
    );
    expect(doneWords("dispensation")).toBe(
      "Klarifikasi diterima; status kehadiran diperbarui.",
    );
    expect(doneWords("reject")).toBe("Klarifikasi ditolak.");
  });

  it("name the status an attendance already has", () => {
    expect(alreadyAttendedWords("valid")).toContain("sudah berstatus Hadir");
    expect(alreadyAttendedWords("dispensation")).toContain(
      "sudah berstatus Dispensasi",
    );
  });
});

describe("answerToPress", () => {
  const DECIDED: ClarificationAnswer = {
    state: { error: null, done: "Klarifikasi ditolak." },
    card: null,
  };
  const keep = () => {};

  it("gives what the server answered to what was sent", async () => {
    const sent: unknown[][] = [];
    const send = async (...parts: unknown[]) => {
      sent.push(parts);
      return DECIDED;
    };

    const answer = await answerToPress("reject", "Uji.", send, keep);

    expect(answer).toBe(DECIDED);
    expect(sent).toEqual([["reject", "Uji."]]);
  });

  it("answers a rejection without a Catatan at once, and sends nothing", async () => {
    let wasSent = false;
    const send = async () => {
      wasSent = true;
      return DECIDED;
    };

    const answer = await answerToPress("reject", " ", send, keep);

    expect(answer).toEqual({
      state: { error: "Tulis alasan penolakan di kolom catatan.", done: null },
      card: null,
    });
    expect(wasSent).toBe(false);
  });

  it("says to try again when the decision did not reach the server", async () => {
    const send = () => Promise.reject(new Error("offline"));

    const answer = await answerToPress("present", "", send, keep);

    expect(answer).toEqual({
      state: {
        error:
          "Putusan tidak terkirim. Periksa koneksi internet, lalu coba lagi.",
        done: null,
      },
      card: null,
    });
  });

  it("throws again what is no failure, as an answer that leads elsewhere", async () => {
    const leads = new Error("NEXT_REDIRECT");
    const send = () => Promise.reject(leads);
    const rethrow = (error: unknown) => {
      throw error;
    };

    await expect(answerToPress("present", "", send, rethrow)).rejects.toBe(
      leads,
    );
  });
});
