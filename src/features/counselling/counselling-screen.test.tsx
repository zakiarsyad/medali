import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConsentStatusLine } from "./consent-badge";
import type { ConsentView } from "./consent-view";
import { CONSENT_TEXT } from "./consent-words";
import {
  CounsellingScreen,
  EMERGENCY_TEXT,
  HELP_TEXT,
} from "./counselling-screen";
import type { OwnScheduleView } from "./schedule-view";

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

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

function studentPage(
  consent: ConsentView | null,
  schedules: OwnScheduleView[] = [],
): string {
  return renderToStaticMarkup(
    <CounsellingScreen
      own={{ consent, schedules, tomorrow: "2026-10-17" }}
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
          schedules: [],
          tomorrow: "2026-10-17",
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

  it("names the Konselor of a Dijadwalkan request", () => {
    const page = studentPage(null, [
      scheduleOf("scheduled", { counsellorName: "Konselor Contoh" }),
    ]);

    expect(page).toContain("Dijadwalkan");
    expect(page).toContain("Jadwal");
    expect(page).toContain("Konselor Contoh");
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
