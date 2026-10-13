import { describe, expect, it } from "vitest";
import { REJECTION_REASONS, rejectionNote } from "./rejection-reasons";

describe("the reasons a photo is rejected for", () => {
  it("are the five of the list, Lainnya last", () => {
    expect(REJECTION_REASONS).toEqual([
      "Wajah tidak terlihat jelas",
      "Foto bukan dari kegiatan ini",
      "Tidak terlihat di lokasi kegiatan",
      "Foto tidak sesuai waktu kegiatan",
      "Lainnya",
    ]);
  });
});

describe("rejectionNote", () => {
  it.each(REJECTION_REASONS.slice(0, 4))(
    "keeps the reason %s as it is, without a note",
    (reason) => {
      expect(rejectionNote(reason, "catatan yang tidak diminta")).toEqual({
        ok: true,
        value: reason,
      });
    },
  );

  it.each(["", "Bukan alasan dari daftar", "lainnya"])(
    "asks for a reason when %j is sent",
    (reason) => {
      expect(rejectionNote(reason, "catatan")).toEqual({
        ok: false,
        error: "Pilih alasan penolakan.",
      });
    },
  );

  it("keeps Lainnya with its note, without the spaces around it", () => {
    expect(rejectionNote("Lainnya", "  Foto buram  ")).toEqual({
      ok: true,
      value: "Lainnya: Foto buram",
    });
  });

  it.each(["", "   "])("asks for a note when Lainnya comes with %j", (note) => {
    expect(rejectionNote("Lainnya", note)).toEqual({
      ok: false,
      error: "Isi catatan untuk alasan Lainnya.",
    });
  });

  it.each([
    ["3 characters", "abc"],
    ["200 characters", "a".repeat(200)],
  ])("takes a note of %s", (_length, note) => {
    expect(rejectionNote("Lainnya", note).ok).toBe(true);
  });

  it.each([
    ["2 characters", "ab"],
    ["201 characters", "a".repeat(201)],
  ])("refuses a note of %s and says how long it may be", (_length, note) => {
    expect(rejectionNote("Lainnya", note)).toEqual({
      ok: false,
      error: "Catatan untuk alasan Lainnya 3 sampai 200 karakter.",
    });
  });
});

describe("rejectionNote sent by hand", () => {
  it.each([undefined, null, 7, ["Foto buram"]])(
    "counts the note %j, which is no text, as empty and asks for one",
    (note) => {
      expect(rejectionNote("Lainnya", note)).toEqual({
        ok: false,
        error: "Isi catatan untuk alasan Lainnya.",
      });
    },
  );

  it.each([undefined, null, 7, ["Lainnya"]])(
    "asks for a reason when %j, which is no text, is sent as one",
    (reason) => {
      expect(rejectionNote(reason, "Foto buram")).toEqual({
        ok: false,
        error: "Pilih alasan penolakan.",
      });
    },
  );

  it("keeps a reason of the list whatever is sent as its note", () => {
    expect(rejectionNote("Wajah tidak terlihat jelas", undefined)).toEqual({
      ok: true,
      value: "Wajah tidak terlihat jelas",
    });
  });
});
