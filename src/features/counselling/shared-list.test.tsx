import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CampusScreenedCount, PERSONAL_DATA_NOTE } from "./screening-campus";
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
