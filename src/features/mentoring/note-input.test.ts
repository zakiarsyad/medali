import { describe, expect, it } from "vitest";
import { NOTE_MAX_LENGTH, parseNote, type SentNote } from "./note-input";

const TODAY = "2026-10-13";
const NOTE_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4b01";
const STUDENT_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4b02";

const SENT: SentNote = {
  id: NOTE_ID,
  studentId: STUDENT_ID,
  kind: "individual_counselling",
  happenedOn: "2026-10-12",
  valueKeys: ["A", "M"],
  note: "  Membahas jadwal belajar.  ",
  followUp: "watch_two_weeks",
};

function errorOf(sent: SentNote): string | null {
  const parsed = parseNote(sent, TODAY);
  return parsed.ok ? null : parsed.error;
}

describe("parseNote", () => {
  it("takes a full note, without the blanks around its text and with its values in the order of MEDALI", () => {
    expect(parseNote(SENT, TODAY)).toEqual({
      ok: true,
      value: {
        id: NOTE_ID,
        studentId: STUDENT_ID,
        kind: "individual_counselling",
        happenedOn: "2026-10-12",
        valueKeys: ["M", "A"],
        note: "Membahas jadwal belajar.",
        followUp: "watch_two_weeks",
      },
    });
  });

  it("takes a note of today, with no value ticked and no follow-up", () => {
    const parsed = parseNote(
      { ...SENT, happenedOn: TODAY, valueKeys: [], followUp: "none" },
      TODAY,
    );

    expect(parsed).toMatchObject({
      ok: true,
      value: { happenedOn: TODAY, valueKeys: [], followUp: "none" },
    });
  });

  it("keeps a value that was sent twice once", () => {
    const parsed = parseNote({ ...SENT, valueKeys: ["D", "D", "I"] }, TODAY);

    expect(parsed).toMatchObject({
      ok: true,
      value: { valueKeys: ["D", "I"] },
    });
  });

  it.each(["", "bukan-id", "123"])(
    "refuses when no student is chosen (%j), and says to choose one",
    (studentId) => {
      expect(errorOf({ ...SENT, studentId })).toBe(
        "Pilih mahasiswa terlebih dahulu.",
      );
    },
  );

  it.each(["", "    ", "Baik", " ok  "])(
    "refuses a text under 5 letters (%j), and says so",
    (note) => {
      expect(errorOf({ ...SENT, note })).toBe(
        "Catatan terlalu pendek. Tulis paling sedikit 5 huruf tentang apa yang dibahas atau diamati.",
      );
    },
  );

  it("takes a text of exactly 5 letters", () => {
    expect(errorOf({ ...SENT, note: "Hadir" })).toBeNull();
  });

  it("refuses a day after today, and says so", () => {
    expect(errorOf({ ...SENT, happenedOn: "2026-10-14" })).toBe(
      "Tanggal tidak boleh setelah hari ini. Pilih hari ini atau tanggal sebelumnya.",
    );
  });

  it.each(["", "13-10-2026", "2026-02-30", "besok"])(
    "refuses what is no day (%j)",
    (happenedOn) => {
      expect(errorOf({ ...SENT, happenedOn })).toBe(
        "Isi tanggal kegiatan dengan benar.",
      );
    },
  );

  it.each(["0000-01-01", "0000-12-31"])(
    "refuses a day of a year below 1 (%j), which the database cannot keep",
    (happenedOn) => {
      expect(errorOf({ ...SENT, happenedOn })).toBe(
        "Isi tanggal kegiatan dengan benar.",
      );
    },
  );

  it("takes a day of year 1, the earliest the database keeps", () => {
    expect(errorOf({ ...SENT, happenedOn: "0001-01-01" })).toBeNull();
  });

  it.each(["Membahas\u0000jadwal.", "\u0000Membahas jadwal.", "Hadir\u0000"])(
    "refuses a text that holds a NUL character (%j), which the database cannot keep",
    (note) => {
      expect(errorOf({ ...SENT, note })).toBe(
        "Catatan memuat karakter yang tidak dapat disimpan. Ketik ulang catatan tanpa menyalin dari tempat lain, lalu simpan lagi.",
      );
    },
  );

  it("refuses a kind that is not offered", () => {
    expect(errorOf({ ...SENT, kind: "gossip" })).toBe("Pilih jenis kegiatan.");
  });

  it("refuses a value that is no MEDALI value", () => {
    expect(errorOf({ ...SENT, valueKeys: ["M", "X"] })).toBe(
      "Pilih nilai yang terkait dari enam nilai MEDALI.",
    );
  });

  it("refuses a follow-up that is not offered", () => {
    expect(errorOf({ ...SENT, followUp: "expel" })).toBe(
      "Pilih tindak lanjut.",
    );
  });

  it("refuses a text longer than the field allows, counting a line break as one", () => {
    const longest = `${"a".repeat(NOTE_MAX_LENGTH - 1)}\r\n`;
    const full = `${"a".repeat(NOTE_MAX_LENGTH - 2)}\r\nb`;

    expect(errorOf({ ...SENT, note: full })).toBeNull();
    expect(errorOf({ ...SENT, note: longest })).toBeNull();
    expect(errorOf({ ...SENT, note: "a".repeat(NOTE_MAX_LENGTH + 1) })).toBe(
      "Catatan paling panjang 1.000 karakter.",
    );
  });

  it("refuses a form without its own key, and says to load the page again", () => {
    expect(errorOf({ ...SENT, id: "" })).toBe(
      "Formulir ini tidak lengkap. Muat ulang halaman, lalu isi lagi.",
    );
  });
});
