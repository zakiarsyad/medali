import { describe, expect, it } from "vitest";
import {
  confirmWords,
  mustConfirm,
  parseRecord,
  recordedWords,
  sentRecord,
} from "./manual-record";

describe("sentRecord", () => {
  it("reads the parts of what the form sends, and counts anything else as nothing sent", () => {
    const sent = {
      studentId: "student-1",
      scheduleId: "schedule-1",
      kind: "sick",
      note: "Surat",
      replaces: "valid",
    };
    const nothing = {
      studentId: undefined,
      scheduleId: undefined,
      kind: undefined,
      note: undefined,
      replaces: undefined,
    };

    expect(sentRecord({ ...sent, extra: "dropped" })).toEqual(sent);
    for (const other of [null, undefined, "sick", 7]) {
      expect(sentRecord(other)).toEqual(nothing);
    }
  });
});

describe("parseRecord", () => {
  it('keeps Hadir as a valid attendance with "Dicatat manual.", and what was typed after it', () => {
    expect(parseRecord("present", "")).toEqual({
      ok: true,
      value: { status: "valid", note: "Dicatat manual." },
    });
    expect(parseRecord("present", "  Ponsel rusak ")).toEqual({
      ok: true,
      value: { status: "valid", note: "Dicatat manual. Ponsel rusak" },
    });
  });

  it.each([
    ["leave", "Izin. Surat nomor 12"],
    ["sick", "Sakit. Surat nomor 12"],
  ] as const)(
    "keeps %s as a dispensation whose Keterangan starts with its reason",
    (kind, note) => {
      expect(parseRecord(kind, "Surat nomor 12")).toEqual({
        ok: true,
        value: { status: "dispensation", note },
      });
    },
  );

  it.each(["leave", "sick"] as const)(
    "does not take %s without a Keterangan",
    (kind) => {
      for (const note of ["", "   ", undefined, 7]) {
        expect(parseRecord(kind, note)).toEqual({
          ok: false,
          error: "Isi keterangan dispensasi.",
        });
      }
    },
  );

  it("takes a Keterangan of 200 characters and none longer", () => {
    expect(parseRecord("sick", "a".repeat(200)).ok).toBe(true);
    expect(parseRecord("present", "a".repeat(201))).toEqual({
      ok: false,
      error: "Keterangan paling banyak 200 karakter.",
    });
  });

  it("takes no other status, such as one sent by hand", () => {
    for (const kind of ["", "valid", "rejected", "waiting", undefined, 1]) {
      expect(parseRecord(kind, "Surat")).toEqual({
        ok: false,
        error: "Pilih status kehadiran.",
      });
    }
  });
});

describe("mustConfirm", () => {
  it("asks nothing for a student without a status", () => {
    expect(mustConfirm(null, null)).toBe(false);
    expect(mustConfirm(null, "valid")).toBe(false);
  });

  it("asks before a status is replaced, until that status is agreed to", () => {
    expect(mustConfirm("valid", null)).toBe(true);
    expect(mustConfirm("valid", "valid")).toBe(false);
  });

  it("asks again when the status changed since it was agreed to", () => {
    expect(mustConfirm("rejected", "waiting")).toBe(true);
    expect(mustConfirm("dispensation", "")).toBe(true);
  });
});

describe("the words of a record made by hand", () => {
  it("name the student and the status they already have", () => {
    expect(confirmWords("Mahasiswa Uji", "valid")).toBe(
      "Mahasiswa Uji sudah berstatus Hadir pada kegiatan ini. Tekan Simpan lagi untuk menggantinya.",
    );
    expect(confirmWords("Mahasiswa Uji", "waiting")).toContain(
      "berstatus Menunggu verifikasi",
    );
    expect(recordedWords("Mahasiswa Uji")).toBe(
      "Kehadiran Mahasiswa Uji dicatat.",
    );
  });
});
