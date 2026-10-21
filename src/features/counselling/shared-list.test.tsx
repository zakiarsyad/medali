import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CampusScreenedCount, PERSONAL_DATA_NOTE } from "./screening-campus";
import { SharedDetailBox } from "./shared-detail-box";
import { SharedListPanel } from "./shared-list";
import type { SharedList, SharedRow } from "./shared-view";
import { nothingSharedWords, SHARED_HEADING } from "./shared-words";

const ROW: SharedRow = {
  studentId: "00000000-0000-4000-8000-000000000001",
  name: "Mahasiswa Contoh",
  nim: "9986321901",
  program: "Prodi Contoh",
  mentorName: "Pengasuh Contoh",
  data: ["summary", "counselling"],
  publishedAt: new Date("2026-10-19T03:00:00Z"),
};

function panel(list: Partial<SharedList>): string {
  return renderToStaticMarkup(
    <SharedListPanel
      list={{ rows: [], matching: 0, page: 1, menteesOnly: false, ...list }}
    />,
  );
}

describe("the numbers of a recipient on Kesehatan mental", () => {
  it("shows Dipublikasikan untuk Anda, Sudah diasesmen and Sesi konseling 30 hari as sent, with the note on personal data", () => {
    const page = renderToStaticMarkup(
      <CampusScreenedCount
        shown="12"
        shared={{ forYou: 3, menteesOnly: false, sessions: "<5" }}
      />,
    );
    expect(page).toContain("Dipublikasikan untuk Anda");
    expect(page).toContain(">3<");
    expect(page).toContain("Sudah diasesmen");
    expect(page).toContain("Sesi konseling 30 hari");
    expect(page).toContain("&lt;5");
    expect(page).toContain(PERSONAL_DATA_NOTE);
    expect(PERSONAL_DATA_NOTE).toContain(
      "Catatan sesi konseling tidak pernah dibagikan",
    );
  });

  it("counts anak asuh for a Pengasuh", () => {
    const page = renderToStaticMarkup(
      <CampusScreenedCount
        shown="0"
        shared={{ forYou: 1, menteesOnly: true, sessions: "0" }}
      />,
    );
    expect(page).toContain("anak asuh");
  });

  it("shows only Sudah diasesmen without the right to shared data", () => {
    const page = renderToStaticMarkup(<CampusScreenedCount shown="0" />);
    expect(page).not.toContain("Dipublikasikan untuk Anda");
    expect(page).not.toContain("Sesi konseling 30 hari");
  });
});

describe("Rincian of shared counselling data", () => {
  const PUBLISHED = new Date("2026-10-19T03:00:00Z");

  it("shows Status konseling with the sessions, the last date, the follow-up and the next session, Ringkasan konselor, and who published it when", () => {
    const page = renderToStaticMarkup(
      <SharedDetailBox
        detail={{
          data: ["counselling", "summary"],
          counselling: {
            count: 2,
            lastDay: "2026-10-16",
            followUp: "next_session",
            nextDay: "2026-10-28",
          },
          summary: "Mohon beri ruang saat ujian.",
          publishedByName: "Konselor Contoh",
          publishedAt: PUBLISHED,
        }}
      />,
    );
    expect(page).toContain("Status konseling");
    expect(page).toContain("2 sesi, terakhir 16 Okt 2026");
    expect(page).toContain("Sesi lanjutan");
    expect(page).toContain("28 Okt 2026");
    expect(page).toContain("Ringkasan konselor");
    expect(page).toContain("Mohon beri ruang saat ujian.");
    expect(page).toContain(
      "Dipublikasikan Konselor Contoh pada 19 Okt 2026 dengan persetujuan mahasiswa. Gunakan hanya untuk keperluan pendampingan dan jangan disebarluaskan.",
    );
  });

  it("shows no Status konseling when only the summary is shared, and no next session when none is set", () => {
    const summaryOnly = renderToStaticMarkup(
      <SharedDetailBox
        detail={{
          data: ["summary"],
          counselling: null,
          summary: "Mohon beri ruang saat ujian.",
          publishedByName: "Konselor Contoh",
          publishedAt: PUBLISHED,
        }}
      />,
    );
    expect(summaryOnly).not.toContain("Status konseling");
    const counsellingOnly = renderToStaticMarkup(
      <SharedDetailBox
        detail={{
          data: ["counselling"],
          counselling: {
            count: 1,
            lastDay: "2026-10-16",
            followUp: "monitoring",
            nextDay: null,
          },
          summary: null,
          publishedByName: "Konselor Contoh",
          publishedAt: PUBLISHED,
        }}
      />,
    );
    expect(counsellingOnly).not.toContain("Ringkasan konselor");
    expect(counsellingOnly).not.toContain("Sesi berikutnya");
  });
});

describe("Data yang dipublikasikan untuk Anda", () => {
  it("lists name, NIM, program studi, Pengasuh, Data yang dibagikan and the date published, as cards on a phone", () => {
    const page = panel({ rows: [ROW], matching: 1 });
    expect(page).toContain(SHARED_HEADING);
    expect(page).toContain("Mahasiswa Contoh");
    expect(page).toContain("9986321901 · Prodi Contoh");
    expect(page).toContain("Pengasuh Contoh");
    expect(page).toContain("Status konseling, Ringkasan konselor");
    expect(page).toContain("19 Okt 2026");
    for (const title of [
      "Mahasiswa",
      "Pengasuh",
      "Data yang dibagikan",
      "Dipublikasikan",
    ]) {
      expect(page).toContain(`data-title="${title}"`);
    }
    expect(page).toMatch(/<table class="[^"]*stacked/);
    expect(page).toContain("Rincian");
  });

  it("says so when nothing is published, for anak asuh Anda to a Pengasuh", () => {
    expect(nothingSharedWords(false)).toBe(
      "Belum ada data kesehatan mental yang dipublikasikan untuk Anda.",
    );
    expect(panel({})).toContain(nothingSharedWords(false));
    expect(panel({ menteesOnly: true })).toContain(
      "Belum ada data kesehatan mental yang dipublikasikan untuk anak asuh Anda.",
    );
  });

  it("steps through the pages, 20 at a time", () => {
    const page = panel({ rows: [ROW], matching: 21, page: 2 });
    expect(page).toContain("21");
    expect(page).toContain('href="/penilaian/mental"');
  });
});
