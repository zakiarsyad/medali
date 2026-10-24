import { describe, expect, it } from "vitest";
import { cardOf, maySendPhoto } from "./activity-card";
import type { StudentSchedule } from "./student-schedule";
import {
  TEST_NOW,
  TEST_SENT_PHOTO,
  TEST_STUDENT_SCHEDULE,
} from "./test-student-schedules";

function attended(
  status: "valid" | "rejected" | "dispensation",
  note = "",
): StudentSchedule {
  return {
    ...TEST_STUDENT_SCHEDULE,
    attendance: { status, note, sentAt: TEST_SENT_PHOTO.sentAt },
  };
}

const WAITING = { ...TEST_STUDENT_SCHEDULE, attendance: TEST_SENT_PHOTO };

describe("maySendPhoto", () => {
  it("lets a student send while the upload time is open and nothing was sent", () => {
    expect(maySendPhoto(TEST_STUDENT_SCHEDULE, TEST_NOW)).toBe(true);
    expect(
      maySendPhoto(TEST_STUDENT_SCHEDULE, { day: "2026-10-14", time: "23:59" }),
    ).toBe(true);
  });

  it("does not before the first hour, nor after the last upload day", () => {
    const early = { day: "2026-10-13", time: "07:29" };
    const late = { day: "2026-10-15", time: "00:00" };

    expect(maySendPhoto(TEST_STUDENT_SCHEDULE, early)).toBe(false);
    expect(maySendPhoto(TEST_STUDENT_SCHEDULE, late)).toBe(false);
  });

  it("does not while a photo waits or is validated", () => {
    expect(maySendPhoto(WAITING, TEST_NOW)).toBe(false);
    expect(maySendPhoto(attended("valid"), TEST_NOW)).toBe(false);
  });

  it("does not after a dispensation", () => {
    expect(maySendPhoto(attended("dispensation"), TEST_NOW)).toBe(false);
  });

  it("lets a student send again after a rejection, while the upload time is still open", () => {
    const late = { day: "2026-10-15", time: "00:00" };

    expect(maySendPhoto(attended("rejected"), TEST_NOW)).toBe(true);
    expect(maySendPhoto(attended("rejected"), late)).toBe(false);
  });
});

describe("cardOf", () => {
  it("writes the name, the day with hours and place, and until when photos are taken", () => {
    expect(cardOf(TEST_STUDENT_SCHEDULE, TEST_NOW)).toMatchObject({
      name: "Latihan dasar kepemimpinan organisasi",
      when: "13 Okt 2026, 07:30–11:30 · Aula asrama",
      until: "Unggah foto sampai 14 Okt 2026",
      description: "Latihan memimpin rapat dan membagi tugas.",
      valueKeys: ["M", "D"],
    });
  });

  it("shows a dash for a schedule without a place", () => {
    const nowhere = { ...TEST_STUDENT_SCHEDULE, location: "" };

    expect(cardOf(nowhere, TEST_NOW).when).toBe("13 Okt 2026, 07:30–11:30 · -");
  });

  it("shows the status of the schedule while nothing was sent", () => {
    const early = { day: "2026-10-13", time: "07:00" };

    expect(cardOf(TEST_STUDENT_SCHEDULE, TEST_NOW).badge).toEqual({
      words: "Unggah foto dibuka",
      look: "good",
    });
    expect(cardOf(TEST_STUDENT_SCHEDULE, early).badge).toEqual({
      words: "Hari ini, belum dibuka",
      look: "warning",
    });
    expect(cardOf(TEST_STUDENT_SCHEDULE, TEST_NOW).photoLine).toBeNull();
  });

  it("shows Menunggu verifikasi with the time the photo was sent, in campus time", () => {
    const card = cardOf(WAITING, TEST_NOW);

    expect(card.badge).toEqual({
      words: "Menunggu verifikasi",
      look: "warning",
    });
    expect(card.photoLine).toBe(
      "Foto terunggah 13 Okt 2026, 09.05. Pegawai UPK akan memverifikasi.",
    );
    expect(card.maySend).toBe(false);
  });

  it.each([
    ["valid", "Hadir", "good"],
    ["rejected", "Ditolak", "bad"],
    ["dispensation", "Dispensasi", "plain"],
  ] as const)("shows a %s attendance as %s", (status, words, look) => {
    expect(cardOf(attended(status), TEST_NOW).badge).toEqual({ words, look });
  });

  it("says why a photo was rejected", () => {
    const rejected = attended("rejected", "Wajah tidak terlihat jelas");

    expect(cardOf(rejected, TEST_NOW).photoLine).toBe(
      "Presensi ditolak: Wajah tidak terlihat jelas.",
    );
    expect(cardOf(attended("rejected"), TEST_NOW).photoLine).toBe(
      "Presensi ditolak: -.",
    );
  });
});
