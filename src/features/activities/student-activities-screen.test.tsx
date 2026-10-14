import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StudentActivities } from "./student-activities";
import { StudentActivitiesScreen } from "./student-activities-screen";
import type { StudentSchedule } from "./student-schedule";
import {
  TEST_EMPTY_ACTIVITIES,
  TEST_SENT_PHOTO,
  TEST_STUDENT_SCHEDULE,
} from "./test-student-schedules";

function shown(more: Partial<StudentActivities> = {}): string {
  return renderToStaticMarkup(
    <StudentActivitiesScreen
      activities={{ ...TEST_EMPTY_ACTIVITIES, ...more }}
    />,
  );
}

/** A schedule of one morning that is over, of a day in October. */
function past(day: number, more: Partial<StudentSchedule>): StudentSchedule {
  const startsOn = `2026-10-${String(day).padStart(2, "0")}`;
  return {
    ...TEST_STUDENT_SCHEDULE,
    id: `past-${day}`,
    startsOn,
    endsOn: startsOn,
    ...more,
  };
}

function historyOf(schedules: StudentSchedule[], matching = schedules.length) {
  return { history: { schedules, matching, page: 1 } };
}

describe("StudentActivitiesScreen", () => {
  it("shows the title, the intro with the tahap of the student, and the three parts", () => {
    const screen = shown();

    expect(screen).toContain("<h1");
    expect(screen).toContain("Kegiatan karakter");
    expect(screen).toContain(
      "Kegiatan tahap penumbuhan untuk Anda. Unggah foto kehadiran selama masa unggah dibuka, lalu Pegawai UPK memverifikasinya. Kehadiran yang tervalidasi menjadi nilai kehadiran kegiatan.",
    );
    for (const part of [
      "Berlangsung dan masa unggah foto",
      "Akan datang",
      "Riwayat kehadiran",
    ]) {
      expect(screen).toContain(`>${part}</h2>`);
    }
  });

  it("says so in each part that has nothing to show", () => {
    const screen = shown();

    expect(screen).toContain(
      "Tidak ada kegiatan yang sedang membuka unggah foto.",
    );
    expect(screen).toContain("Belum ada jadwal berikutnya.");
    expect(screen).toContain("Belum ada riwayat.");
  });

  it("shows the four numbers, with a dash while no required activity counts", () => {
    const screen = shown();

    for (const label of [
      "Nilai kehadiran kegiatan",
      "Menunggu verifikasi",
      "Dispensasi",
      "Kegiatan berikutnya",
    ]) {
      expect(screen).toContain(`>${label}</dt>`);
    }
    expect(screen).toContain("belum ada kegiatan wajib");
    expect(screen).toContain("foto terunggah");
    expect(screen).toContain("izin atau sakit, tidak dihitung");
  });

  it("shows the score as a percentage with how many of how many, and the other numbers", () => {
    const next = {
      ...TEST_STUDENT_SCHEDULE,
      name: "Kegiatan depan",
      startsOn: "2026-10-21",
      endsOn: "2026-10-21",
    };
    const screen = shown({
      score: { attended: 7, counted: 8 },
      waiting: 2,
      dispensations: 1,
      coming: [next],
    });

    expect(screen).toContain(">87,5%</dd>");
    expect(screen).toContain("7/8 kegiatan karakter");
    expect(screen).toContain(">2</dd>");
    expect(screen).toContain(">1</dd>");
    expect(screen).toContain(">Kegiatan depan</dd>");
    expect(screen).toContain(">21 Okt 2026</dd>");
  });

  it("shows a running schedule as a card with all it says", () => {
    const screen = shown({ current: [TEST_STUDENT_SCHEDULE] });

    expect(screen).toContain("Latihan dasar kepemimpinan organisasi</h3>");
    expect(screen).toContain("13 Okt 2026, 07:30–11:30 · Aula asrama");
    expect(screen).toContain("Unggah foto sampai 14 Okt 2026");
    expect(screen).toContain("Latihan memimpin rapat dan membagi tugas.");
    expect(screen).toContain("Mandiri");
    expect(screen).toContain("Disiplin");
    expect(screen).toContain("Unggah foto dibuka");
    expect(screen).not.toContain(
      "Tidak ada kegiatan yang sedang membuka unggah foto.",
    );
  });

  it("shows a photo that waits on its card, with the time it was sent", () => {
    const waiting = { ...TEST_STUDENT_SCHEDULE, attendance: TEST_SENT_PHOTO };
    const screen = shown({ current: [waiting] });

    expect(screen).toContain("Menunggu verifikasi</span>");
    expect(screen).toContain(
      "Foto terunggah 13 Okt 2026, 09.05. Pegawai UPK akan memverifikasi.",
    );
  });

  it("lists a coming schedule with its day, hours and place", () => {
    const coming = { ...TEST_STUDENT_SCHEDULE, startsOn: "2026-10-20" };
    const screen = shown({ coming: [{ ...coming, endsOn: "2026-10-20" }] });

    expect(screen).toContain("20 Okt 2026, 07:30–11:30 · Aula asrama");
    expect(screen).not.toContain("Belum ada jadwal berikutnya.");
  });

  it("shows every status of the history, with the note as Keterangan", () => {
    const sent = { sentAt: TEST_SENT_PHOTO.sentAt };
    const screen = shown(
      historyOf([
        past(12, { attendance: null }),
        past(9, { attendance: TEST_SENT_PHOTO }),
        past(8, { attendance: { status: "valid", note: "", ...sent } }),
        past(7, {
          attendance: { status: "rejected", note: "Foto buram", ...sent },
        }),
        past(6, {
          attendance: { status: "dispensation", note: "Sakit", sentAt: null },
        }),
        past(5, { attendance: null }),
      ]),
    );

    for (const title of [
      "Tanggal",
      "Kegiatan",
      "Status",
      "Keterangan",
      "Klarifikasi",
    ]) {
      expect(screen).toContain(`<th>${title}</th>`);
      expect(screen).toContain(`data-title="${title}"`);
    }
    for (const status of [
      "Belum unggah",
      "Menunggu verifikasi",
      "Hadir",
      "Ditolak",
      "Dispensasi",
      "Tidak hadir",
    ]) {
      expect(screen).toContain(`${status}</span>`);
    }
    expect(screen).toContain("sampai 13 Okt 2026");
    expect(screen.match(/sampai /g)).toHaveLength(1);
    expect(screen).toContain('<td data-title="Keterangan">Foto buram</td>');
    expect(screen).toContain('<td data-title="Keterangan">Sakit</td>');
  });

  it('offers "Ajukan klarifikasi" only for an absence and a rejected photo, and says how under the table', () => {
    const sent = { sentAt: TEST_SENT_PHOTO.sentAt };
    const screen = shown(
      historyOf([
        past(12, { attendance: null }),
        past(9, { attendance: TEST_SENT_PHOTO }),
        past(8, { attendance: { status: "valid", note: "", ...sent } }),
        past(7, {
          attendance: { status: "rejected", note: "Foto buram", ...sent },
        }),
        past(5, { attendance: null }),
        past(1, { attendance: null }),
      ]),
    );

    expect(screen.match(/>Ajukan klarifikasi<\/button>/g)).toHaveLength(2);
    expect(screen.match(/Batas klarifikasi lewat/g)).toHaveLength(1);
    expect(screen).toContain(
      "Tercatat tidak hadir padahal punya alasan? Ajukan klarifikasi dengan lampiran paling lambat 7 hari setelah masa unggah foto berakhir. Klarifikasi diperiksa Penilai Mahasiswa.",
    );
  });

  it("shows the newest clarification of each schedule: waiting, accepted with the attendance it gave, and rejected with its note", () => {
    const [waiting, accepted, rejected] = [
      past(10, {}),
      past(9, {}),
      past(8, {}),
    ];
    if (!waiting || !accepted || !rejected) throw new Error("No schedules.");
    const screen = shown({
      ...historyOf([
        waiting,
        {
          ...accepted,
          attendance: {
            status: "valid",
            note: "Klarifikasi: Kendala teknis presensi",
            sentAt: null,
          },
        },
        rejected,
      ]),
      clarifications: {
        [waiting.id]: {
          status: "submitted",
          note: "",
          file: { clarificationId: "abc", name: "surat-keterangan.pdf" },
        },
        [accepted.id]: { status: "accepted", note: "", file: null },
        [rejected.id]: {
          status: "rejected",
          note: "Surat tidak terbaca.",
          file: null,
        },
      },
    });

    expect(screen.match(/>Lampiran: [^<]+<\/a>/g)).toEqual([
      ">Lampiran: surat-keterangan.pdf</a>",
    ]);
    expect(screen).toContain('href="/kegiatan/klarifikasi/lampiran/abc"');
    expect(screen).toContain("Klarifikasi diajukan</span>");
    expect(screen).toContain("Klarifikasi diterima</span>");
    expect(screen).toContain(
      '<td data-title="Keterangan">Klarifikasi: Kendala teknis presensi</td>',
    );
    expect(screen).toContain("Hadir</span>");
    expect(screen).toContain("Klarifikasi ditolak</span>");
    expect(screen).toContain("Surat tidak terbaca.</span>");
    expect(screen.match(/>Ajukan ulang<\/button>/g)).toHaveLength(1);
    expect(screen).not.toContain(">Ajukan klarifikasi</button>");
  });

  it("shows no note about clarifications while the history is empty", () => {
    const screen = shown();

    expect(screen).toContain("Belum ada riwayat.");
    expect(screen).not.toContain("Klarifikasi");
  });

  it('marks a schedule that is not required with "(tidak wajib)", and no other', () => {
    const screen = shown(
      historyOf([past(8, { isRequired: false }), past(7, {})]),
    );

    expect(screen.match(/\(tidak wajib\)/g)).toHaveLength(1);
  });

  it("pages the history 20 at a time", () => {
    const schedules = Array.from({ length: 20 }, (_, place) =>
      past(place + 1, {}),
    );
    const screen = shown(historyOf(schedules, 21));

    expect(screen).toContain("1–20 dari 21 kegiatan");
    expect(screen).toContain('href="/kegiatan?hal=2"');
  });
});
