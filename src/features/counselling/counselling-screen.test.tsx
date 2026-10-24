import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { OwnSessionSummary } from "@/mental-health/session-view";
import { ConsentStatusLine } from "./consent-badge";
import type { ConsentView } from "./consent-view";
import { CONSENT_TEXT } from "./consent-words";
import {
  CounsellingScreen,
  EMERGENCY_TEXT,
  HELP_TEXT,
} from "./counselling-screen";
import type { OwnHistory, OwnScheduleView } from "./schedule-view";

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

describe("the head of Konseling", () => {
  it("shows the prototype's description under its title", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen own={null} mayManage={true} />,
    );

    expect(page).toMatch(
      /<h1[^>]*>Konseling<\/h1><p[^>]*>Daftar konseling secara sukarela, dan pantau jadwal konseling yang ditugaskan kepada Anda\. Isi pembicaraan dalam sesi bersifat rahasia antara Anda dan konselor\.<\/p>/,
    );
  });
});

describe("Konseling of Konselor", () => {
  it("shows the emergency notice with 119, and Persetujuan konseling with a student search until one is picked", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen own={null} mayManage={true} />,
    );

    expect(page).toContain("Keadaan darurat.");
    expect(EMERGENCY_TEXT).toContain("119");
    expect(page).toContain(EMERGENCY_TEXT);
    expect(page).toContain("Persetujuan konseling");
    expect(page).toContain('aria-label="Cari mahasiswa"');
    expect(page).toContain("Pilih mahasiswa untuk melihat status persetujuan");
  });

  it("shows neither to an account without the right", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen own={null} mayManage={false} />,
    );

    expect(page).not.toContain("Keadaan darurat.");
    expect(page).not.toContain("Persetujuan konseling");
  });
});

function consentOf(
  status: ConsentView["status"],
  way: ConsentView["way"] = null,
): ConsentView {
  return {
    status,
    way,
    changedAt: MOMENT,
    counsellorName: null,
    version: MOMENT.toISOString(),
  };
}

const NO_HISTORY: OwnHistory = { items: [], hasMore: false, shown: 10 };

function studentPage(
  consent: ConsentView | null,
  schedules: OwnScheduleView[] = [],
  history: OwnHistory = NO_HISTORY,
): string {
  return renderToStaticMarkup(
    <CounsellingScreen
      own={{
        consent,
        registration: { schedules, history, tomorrow: "2026-10-17" },
      }}
      mayManage={false}
    />,
  );
}

function buttonsOf(page: string): string[] {
  return [...page.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map(
    (match) => match[1] ?? "",
  );
}

describe("Konseling of the student", () => {
  it("shows a waiting request with the full consent text, Setujui and Tolak", () => {
    const page = studentPage(consentOf("waiting"));

    expect(page).toContain("Permintaan persetujuan konseling");
    expect(page).toContain(CONSENT_TEXT);
    expect(buttonsOf(page)).toEqual(["Setujui", "Tolak", "Daftar konseling"]);
  });

  it("shows Belum diminta and Butuh bantuan segera? with 119 to a student never asked, with no consent button", () => {
    const page = studentPage(null);

    expect(page).toContain("Belum diminta");
    expect(page).toContain("Butuh bantuan segera?");
    expect(HELP_TEXT).toContain("119");
    expect(page).toContain(HELP_TEXT);
    expect(buttonsOf(page)).toEqual(["Daftar konseling"]);
  });

  it("shows Disetujui online with its date, and Cabut persetujuan", () => {
    const page = studentPage(consentOf("approved", "online"));

    expect(page).toContain("Disetujui");
    expect(page).toContain("Persetujuan daring · 16 Okt 2026");
    expect(buttonsOf(page)).toEqual(["Cabut persetujuan", "Daftar konseling"]);
  });

  it.each([
    ["declined", "Ditolak"],
    ["withdrawn", "Dicabut"],
  ] as const)(
    "shows %s as %s with its date, with no button",
    (status, words) => {
      const page = studentPage(consentOf(status));

      expect(page).toContain(words);
      expect(page).toContain("16 Okt 2026");
      expect(buttonsOf(page)).toEqual(["Daftar konseling"]);
    },
  );

  it("shows no registration form and no Jadwal konseling saya without the right to register", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen
        own={{ consent: null, registration: null }}
        mayManage={false}
      />,
    );

    expect(page).toContain("Belum diminta");
    expect(page).not.toContain("Daftar konseling sukarela");
    expect(page).not.toContain("Jadwal konseling saya");
  });

  it("shows no part of Konselor to a student", () => {
    const page = studentPage(null);

    expect(page).not.toContain("Keadaan darurat.");
    expect(page).not.toContain("Cari mahasiswa");
  });

  it("shows a student who is also Konselor their own part first, then that of Konselor", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen
        own={{
          consent: consentOf("waiting"),
          registration: {
            schedules: [],
            history: NO_HISTORY,
            tomorrow: "2026-10-17",
          },
        }}
        mayManage={true}
      />,
    );

    const own = page.indexOf("Permintaan persetujuan konseling");
    const counsellor = page.indexOf("Keadaan darurat.");
    expect(own).toBeGreaterThan(-1);
    expect(counsellor).toBeGreaterThan(own);
  });
});

function scheduleOf(
  status: OwnScheduleView["status"],
  more: Partial<OwnScheduleView> = {},
): OwnScheduleView {
  return {
    id: "jadwal-1",
    kind: "voluntary",
    status,
    topic: "family",
    day: "2026-10-21",
    hour: "10:00",
    way: "online",
    counsellorName: null,
    counsellorMessage: null,
    version: MOMENT.toISOString(),
    ...more,
  };
}

describe("Daftar konseling sukarela of the student", () => {
  const page = studentPage(null);

  it("comes below the consent box, then Jadwal konseling saya", () => {
    const consent = page.indexOf("Persetujuan konseling");
    const form = page.indexOf("Daftar konseling sukarela");
    const list = page.indexOf("Jadwal konseling saya");
    expect(consent).toBeGreaterThan(-1);
    expect(form).toBeGreaterThan(consent);
    expect(list).toBeGreaterThan(form);
  });

  it("asks Topik, Tanggal yang diinginkan from tomorrow, the four hours, Cara konseling and an optional story", () => {
    for (const words of [
      "Topik",
      "Akademik",
      "Emosi dan stres",
      "Lainnya",
      "Tanggal yang diinginkan",
      "Cara konseling",
      "Tatap muka di Ruang Konseling",
      "Daring (tautan dikirim konselor)",
      "Ceritakan singkat (opsional, hanya dibaca konselor)",
    ]) {
      expect(page).toContain(words);
    }
    expect(page).toContain('min="2026-10-17"');
    const hours = [...page.matchAll(/<option value="(\d\d:\d\d)">/g)].map(
      (match) => match[1],
    );
    expect(hours).toEqual(["08:30", "10:00", "13:00", "14:30"]);
  });

  it("has the consent tick with the full consent text", () => {
    expect(page).toContain('type="checkbox" name="consented"');
    expect(page).toContain(CONSENT_TEXT);
  });

  it("says Belum ada jadwal konseling. when there is none", () => {
    expect(page).toContain("Belum ada jadwal konseling.");
    expect(page).toContain("0 aktif");
  });
});

describe("Jadwal konseling saya", () => {
  it("shows a Diajukan request with Topik, the time the student picked and Cara", () => {
    const page = studentPage(null, [scheduleOf("submitted")]);

    expect(page).toContain("Konseling sukarela");
    expect(page).toContain("Diajukan");
    expect(page).toContain("Keluarga");
    expect(page).toContain("Waktu yang Anda pilih");
    expect(page).toContain("21 Okt 2026 pukul 10:00");
    expect(page).toContain("Daring (tautan dikirim konselor)");
    expect(page).toContain("1 aktif");
    expect(page).not.toContain("Belum ada jadwal konseling.");
  });

  it("shows a proposal of Konselor with its message, Terima jadwal ini and Minta waktu lain", () => {
    const page = studentPage(null, [
      scheduleOf("proposed", { counsellorMessage: "Pesan konselor uji." }),
    ]);

    expect(page).toContain("Usulan jadwal lain");
    expect(page).toContain("Usulan konselor");
    expect(page).toContain("Pesan konselor");
    expect(page).toContain("Pesan konselor uji.");
    expect(buttonsOf(page)).toEqual([
      "Daftar konseling",
      "Terima jadwal ini",
      "Minta waktu lain",
      "Batalkan pendaftaran",
    ]);
  });

  it("offers Batalkan pendaftaran on a Diajukan request", () => {
    const page = studentPage(null, [scheduleOf("submitted")]);

    expect(buttonsOf(page)).toEqual([
      "Daftar konseling",
      "Batalkan pendaftaran",
    ]);
  });

  it("shows a Dijadwalkan session with its date, Jam, Cara, konselor and Pesan konselor, Minta jadwal ulang and Batalkan", () => {
    const page = studentPage(null, [
      scheduleOf("scheduled", {
        counsellorName: "Konselor Contoh",
        counsellorMessage: "Pesan konselor uji.",
      }),
    ]);

    for (const words of [
      "21 Okt 2026 pukul 10:00",
      "Daring (tautan dikirim konselor)",
      "Konselor Contoh",
      "Pesan konselor",
      "Pesan konselor uji.",
    ]) {
      expect(page).toContain(words);
    }
    expect(buttonsOf(page)).toEqual([
      "Daftar konseling",
      "Minta jadwal ulang",
      "Batalkan",
    ]);
  });

  it("names the Konselor of a Dijadwalkan request", () => {
    const page = studentPage(null, [
      scheduleOf("scheduled", { counsellorName: "Konselor Contoh" }),
    ]);

    expect(page).toContain("Dijadwalkan");
    expect(page).toContain("Jadwal");
    expect(page).toContain("Konselor Contoh");
  });
});

describe("an assignment in Jadwal konseling saya", () => {
  const WAITING = scheduleOf("awaiting", {
    kind: "assigned",
    topic: "discipline_violation",
    day: null,
    hour: null,
    way: null,
  });

  it("is marked wajib with where it comes from, and waits for its time, with nothing to press", () => {
    const page = studentPage(null, [WAITING]);

    for (const words of [
      "Konseling penugasan",
      ">wajib<",
      "Konseling wajib dari Pembina Disiplin Mahasiswa",
      "Menunggu jadwal",
      "Pelanggaran disiplin",
      "Menunggu jadwal dari konselor",
    ]) {
      expect(page).toContain(words);
    }
    expect(page).not.toContain(">Cara<");
    expect(buttonsOf(page)).toEqual(["Daftar konseling"]);
  });

  it("says a Pemanggilan comes from Penilai Mahasiswa", () => {
    const page = studentPage(null, [
      { ...WAITING, kind: "called", topic: "character_assessment" },
    ]);

    expect(page).toContain("Konseling pemanggilan");
    expect(page).toContain(
      "Dipanggil Penilai Mahasiswa berdasarkan hasil asesmen karakter",
    );
    expect(page).toContain("Hasil asesmen karakter");
  });

  it("shows its time, Cara, konselor and message once set, with Minta jadwal ulang and no Batalkan", () => {
    const page = studentPage(null, [
      scheduleOf("scheduled", {
        kind: "assigned",
        topic: "discipline_violation",
        counsellorName: "Konselor Contoh",
        counsellorMessage: "Pesan konselor uji.",
      }),
    ]);

    for (const words of [
      "21 Okt 2026 pukul 10:00",
      "Daring (tautan dikirim konselor)",
      "Konselor Contoh",
      "Pesan konselor uji.",
    ]) {
      expect(page).toContain(words);
    }
    expect(buttonsOf(page)).toEqual(["Daftar konseling", "Minta jadwal ulang"]);
  });

  it("shows Minta jadwal ulang with the time asked, and nothing to press", () => {
    const page = studentPage(null, [
      scheduleOf("reschedule_asked", {
        kind: "called",
        topic: "character_assessment",
      }),
    ]);

    expect(page).toContain("Minta jadwal ulang");
    expect(page).toContain("Waktu yang Anda pilih");
    expect(buttonsOf(page)).toEqual(["Daftar konseling"]);
  });

  it("is listed in Riwayat with its Jenis", () => {
    const page = studentPage(null, [], {
      items: [
        {
          id: "riwayat-wajib",
          kind: "assigned",
          status: "missed",
          day: "2026-10-14",
          topic: "discipline_violation",
        },
      ],
      hasMore: false,
      shown: 10,
    });

    expect(page).toContain("Konseling penugasan");
    expect(page).toContain("Tidak hadir");
    expect(page).toContain("Pelanggaran disiplin");
  });
});

describe("Riwayat of the student", () => {
  const HISTORY: OwnHistory = {
    items: [
      {
        id: "riwayat-1",
        kind: "voluntary",
        status: "cancelled",
        day: "2026-10-14",
        topic: "family",
      },
      {
        id: "riwayat-2",
        kind: "voluntary",
        status: "done",
        day: "2026-10-05",
        topic: "academic",
      },
      {
        id: "riwayat-3",
        kind: "voluntary",
        status: "missed",
        day: "2026-09-28",
        topic: "finances",
      },
    ],
    hasMore: false,
    shown: 10,
  };

  it("lists each finished, missed and cancelled schedule with its date, status and Topik, after Jadwal konseling saya", () => {
    const page = studentPage(null, [], HISTORY);

    expect(page.indexOf("Riwayat")).toBeGreaterThan(
      page.indexOf("Jadwal konseling saya"),
    );
    for (const words of [
      "14 Okt 2026",
      "Dibatalkan",
      "Keluarga",
      "5 Okt 2026",
      "Selesai",
      "Akademik",
      "28 Sep 2026",
      "Tidak hadir",
      "Keuangan",
    ]) {
      expect(page).toContain(words);
    }
    expect(page).not.toContain("Tampilkan lebih banyak");
  });

  it("loads 10 more on request when there are more", () => {
    const page = studentPage(null, [], { ...HISTORY, hasMore: true });

    expect(page).toContain('href="/konseling?riwayat=2"');
    expect(page).toContain("Tampilkan lebih banyak");
  });

  it("is not shown while there is nothing in it", () => {
    expect(studentPage(null)).not.toContain(">Riwayat<");
  });
});

describe("the status of a consent", () => {
  it("is Belum diminta for a student never asked", () => {
    const line = renderToStaticMarkup(<ConsentStatusLine consent={null} />);

    expect(line).toContain("Belum diminta");
  });

  it("names a paper form, its date and the Konselor who recorded it", () => {
    const line = renderToStaticMarkup(
      <ConsentStatusLine
        consent={{
          status: "approved",
          way: "paper",
          changedAt: MOMENT,
          counsellorName: "Konselor Contoh",
          version: MOMENT.toISOString(),
        }}
      />,
    );

    expect(line).toContain("Disetujui");
    expect(line).toContain("Form tertulis · 16 Okt 2026 · Konselor Contoh");
  });

  it("names an online answer and its date, without a name", () => {
    const line = renderToStaticMarkup(
      <ConsentStatusLine
        consent={{
          status: "approved",
          way: "online",
          changedAt: MOMENT,
          counsellorName: null,
          version: MOMENT.toISOString(),
        }}
      />,
    );

    expect(line).toContain("Persetujuan daring · 16 Okt 2026</span>");
  });
});

describe("the counselling sessions of the student", () => {
  function pageWith(sessions: OwnSessionSummary | null): string {
    return renderToStaticMarkup(
      <CounsellingScreen
        own={{
          consent: consentOf("approved", "online"),
          registration: null,
          sessions,
        }}
        mayManage={false}
      />,
    );
  }

  it("say how many there were, the last date and the next session, never any notes", () => {
    const page = pageWith({
      count: 3,
      lastDay: "2026-10-19",
      nextDay: "2026-10-26",
    });

    expect(page).toContain(
      "<b>Sesi konseling:</b> 3 sesi, terakhir 19 Okt 2026",
    );
    expect(page).toContain("<b>Sesi berikutnya:</b> 26 Okt 2026");
    expect(page).not.toContain("Catatan sesi");
  });

  it("leave out Sesi berikutnya when none is set", () => {
    const page = pageWith({ count: 1, lastDay: "2026-10-19", nextDay: null });

    expect(page).toContain("1 sesi, terakhir 19 Okt 2026");
    expect(page).not.toContain("Sesi berikutnya");
  });

  it("are not shown while there is none", () => {
    expect(pageWith(null)).not.toContain("Sesi konseling:");
  });
});
