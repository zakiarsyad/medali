import { describe, expect, it } from "vitest";
import {
  callWords,
  causeWords,
  issueButtonWords,
  issuedWords,
  issueQuestion,
  NOT_SCHEDULED,
  receivedWords,
  scheduleWords,
  WILL_BE_SCHEDULED,
} from "./warning-words";

describe("scheduleWords", () => {
  it("says the day, the hour and the place, or that there is no call yet", () => {
    expect(
      scheduleWords({ day: "2026-10-16", time: "16:00", place: "Aula" }),
    ).toBe("16 Okt 2026 16:00 · Aula");
    expect(scheduleWords(null)).toBe(NOT_SCHEDULED);
  });
});

describe("causeWords", () => {
  it("joins the causes with dan", () => {
    expect(
      causeWords(["7 pelanggaran tercatat", "klarifikasi kehadiran ditolak"]),
    ).toBe("7 pelanggaran tercatat dan klarifikasi kehadiran ditolak");
  });
});

describe("callWords", () => {
  it("tells the resident when and where to come, or that the call will be scheduled", () => {
    expect(
      callWords({
        day: "2026-10-21",
        time: "16:00",
        place: "Kantor Pengelola Asrama",
      }),
    ).toBe(
      "Hadir untuk klarifikasi pada 21 Okt 2026 pukul 16:00 di Kantor Pengelola Asrama.",
    );
    expect(callWords(null)).toBe(WILL_BE_SCHEDULED);
    expect(WILL_BE_SCHEDULED).toBe(
      "Pengelola Asrama akan menjadwalkan klarifikasi.",
    );
  });
});

describe("receivedWords", () => {
  it("says the SP, its day on campus and the result, and for SP 2 the proposal", () => {
    expect(
      receivedWords({
        level: 1,
        issuedAt: new Date("2026-10-10T18:00:00Z"),
        result: "Mahasiswa hadir dan mengakui pelanggarannya. ",
      }),
    ).toBe(
      "pada 11 Okt 2026. Hasil klarifikasi: Mahasiswa hadir dan mengakui pelanggarannya.",
    );
    expect(
      receivedWords({
        level: 2,
        issuedAt: new Date("2026-10-10T03:00:00Z"),
        result: "Tidak hadir pada panggilan.",
      }),
    ).toBe(
      "pada 10 Okt 2026. Hasil klarifikasi: Tidak hadir pada panggilan. Pengelola Asrama mengajukan proses hukuman disiplin ke Kepala Unit Pembangunan Karakter.",
    );
  });
});

describe("issuedWords", () => {
  const AT = new Date("2026-10-10T09:30:00Z");

  it("says the SP and its day, and the result and the note only to those who may read them", () => {
    expect(
      issuedWords({ level: 1, issuedAt: AT, result: null, proposalNote: null }),
    ).toBe("Surat Peringatan 1 terbit pada 10 Okt 2026.");
    expect(
      issuedWords({
        level: 2,
        issuedAt: AT,
        result: "Tidak hadir pada panggilan.",
        proposalNote: "Pelanggaran berulang.",
      }),
    ).toBe(
      "Surat Peringatan 2 terbit pada 10 Okt 2026. Hasil klarifikasi: Tidak hadir pada panggilan. Catatan pengajuan hukuman disiplin ke Kepala UPK: Pelanggaran berulang.",
    );
    expect(
      issuedWords({
        level: 2,
        issuedAt: AT,
        result: "Hadir.",
        proposalNote: "",
      }),
    ).toBe(
      "Surat Peringatan 2 terbit pada 10 Okt 2026. Hasil klarifikasi: Hadir.",
    );
  });
});

describe("issuing words", () => {
  it("names the button as the prototype does", () => {
    expect(issueButtonWords(1)).toBe("Terbitkan SP 1");
    expect(issueButtonWords(2)).toBe(
      "Terbitkan SP 2 dan ajukan hukuman disiplin",
    );
  });

  it("asks before issuing, as an SP cannot be undone", () => {
    expect(issueQuestion("Ani", 1)).toBe(
      "Terbitkan SP 1 untuk Ani? SP yang sudah terbit tidak dapat diubah atau ditarik.",
    );
    expect(issueQuestion("Ani", 2)).toBe(
      "Terbitkan SP 2 untuk Ani dan ajukan hukuman disiplin ke Kepala UPK? SP yang sudah terbit tidak dapat diubah atau ditarik.",
    );
  });
});
