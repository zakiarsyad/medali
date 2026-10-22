import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ADVICE_WORDS,
  CRISIS_ADVICE,
  RISK_WORDS,
} from "@/mental-health/screening-words";
import {
  nothingSharedWords,
  SHARED_HEADING,
} from "@/mental-health/shared-words";
import { type ScreeningParams, screeningAddress } from "./screening-address";
import { CampusScreenedCount, PERSONAL_DATA_NOTE } from "./screening-campus";
import { ScreeningListPanel } from "./screening-list";
import { ScreeningScreen } from "./screening-screen";
import type { ScreeningRow } from "./screening-view";
import { SharedDetailBox } from "./shared-detail-box";
import { SharedListPanel } from "./shared-list";
import type { SharedList, SharedRow } from "./shared-view";

const ROW: SharedRow = {
  studentId: "00000000-0000-4000-8000-000000000001",
  name: "Mahasiswa Contoh",
  nim: "9986321901",
  program: "Prodi Contoh",
  mentorName: "Pengasuh Contoh",
  data: ["summary", "counselling"],
  level: null,
  publishedAt: new Date("2026-10-19T03:00:00Z"),
};

const START: ScreeningParams = {
  query: "",
  filter: "all",
  page: 1,
  sharedPage: 1,
  profileId: null,
};

function panel(list: Partial<SharedList>): string {
  return renderToStaticMarkup(
    <SharedListPanel
      list={{
        rows: [],
        matching: 0,
        needCounselling: 0,
        page: 1,
        menteesOnly: false,
        ...list,
      }}
      params={START}
    />,
  );
}

const SCREENED: ScreeningRow = {
  studentId: "00000000-0000-4000-8000-000000000002",
  name: "Mahasiswa Diasesmen",
  nim: "9986321902",
  program: "Prodi Contoh",
  mentorName: null,
  instrument: "dass21",
  screenedOn: "2026-10-10",
  level: "normal",
  risk: false,
  consent: null,
  sessions: 0,
  nextDay: null,
  sharing: null,
};

const TABS = {
  pagePath: "penilaian",
  tabs: [{ id: "mental_health", path: "mental", title: "Kesehatan mental" }],
  open: "mental",
};

describe("Kesehatan mental of a Konselor who is also Pengasuh", () => {
  // Konselor searched, filtered and went to page 2 of Daftar mahasiswa.
  const params: ScreeningParams = {
    query: "Bayu",
    filter: "waiting",
    page: 2,
    sharedPage: 1,
    profileId: null,
  };
  const page = renderToStaticMarkup(
    <ScreeningScreen
      tabs={TABS}
      counsellor={{
        numbers: { screened: 60, needCounselling: 0, waitingConsent: 60 },
        list: { rows: [SCREENED], matching: 60, page: 2 },
        params,
      }}
      others={
        <SharedListPanel
          list={{
            rows: [ROW],
            matching: 21,
            needCounselling: 0,
            page: 1,
            menteesOnly: true,
          }}
          params={params}
        />
      }
    />,
  );

  it("pages Data yang dipublikasikan untuk Anda on its own, keeping the search, the filter and the page of Daftar mahasiswa", () => {
    expect(page).toContain(
      'href="/penilaian/mental?cari=Bayu&amp;filter=menunggu-persetujuan&amp;hal=2&amp;hal-data=2"',
    );
  });

  it("pages Daftar mahasiswa keeping the page of Data yang dipublikasikan untuk Anda", () => {
    expect(screeningAddress({ ...params, page: 3 })).toBe(
      "/penilaian/mental?cari=Bayu&filter=menunggu-persetujuan&hal=3",
    );
    expect(page).toContain(
      'href="/penilaian/mental?cari=Bayu&amp;filter=menunggu-persetujuan&amp;hal=3"',
    );
    const onSharedPage2 = renderToStaticMarkup(
      <ScreeningListPanel
        list={{ rows: [SCREENED], matching: 60, page: 2 }}
        params={{ ...params, sharedPage: 2 }}
      />,
    );
    expect(onSharedPage2).toContain(
      'href="/penilaian/mental?cari=Bayu&amp;filter=menunggu-persetujuan&amp;hal=3&amp;hal-data=2"',
    );
  });

  it("keeps the page of Data yang dipublikasikan untuk Anda when searching or filtering Daftar mahasiswa", () => {
    const onSharedPage2 = renderToStaticMarkup(
      <ScreeningListPanel
        list={{ rows: [SCREENED], matching: 60, page: 2 }}
        params={{ ...params, sharedPage: 2 }}
      />,
    );
    expect(onSharedPage2).toContain('name="hal-data" value="2"');
    const onSharedPage1 = renderToStaticMarkup(
      <ScreeningListPanel
        list={{ rows: [SCREENED], matching: 60, page: 2 }}
        params={params}
      />,
    );
    expect(onSharedPage1).not.toContain('name="hal-data"');
  });
});

describe("the numbers of a recipient on Kesehatan mental", () => {
  it("shows Dipublikasikan untuk Anda, Perlu konseling, Sudah diasesmen and Sesi konseling 30 hari as sent, with the note on personal data", () => {
    const page = renderToStaticMarkup(
      <CampusScreenedCount
        shown="12"
        shared={{
          forYou: 3,
          needCounselling: 2,
          menteesOnly: false,
          sessions: "<5",
        }}
      />,
    );
    expect(page).toContain("Dipublikasikan untuk Anda");
    expect(page).toContain(">3<");
    expect(page).toContain("Perlu konseling");
    expect(page).toContain(">2<");
    expect(page).toContain("dari data yang dipublikasikan");
    expect(page.indexOf("Perlu konseling")).toBeLessThan(
      page.indexOf("Sudah diasesmen"),
    );
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
        shared={{
          forYou: 1,
          needCounselling: 0,
          menteesOnly: true,
          sessions: "0",
        }}
      />,
    );
    expect(page).toContain("anak asuh");
  });

  it("shows only Sudah diasesmen without the right to shared data", () => {
    const page = renderToStaticMarkup(<CampusScreenedCount shown="0" />);
    expect(page).not.toContain("Dipublikasikan untuk Anda");
    expect(page).not.toContain("Perlu konseling");
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
          screening: null,
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
          screening: null,
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
          screening: null,
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
    expect(counsellingOnly).not.toContain("Tingkat asesmen");
  });

  it("shows Tingkat asesmen terakhir with the instrument and the date, and the advice of the level, never the crisis advice or Risiko", () => {
    const page = renderToStaticMarkup(
      <SharedDetailBox
        detail={{
          data: ["level"],
          screening: {
            level: "extremely_severe",
            instrument: "dass21",
            screenedOn: "2026-10-12",
          },
          counselling: null,
          summary: null,
          publishedByName: "Konselor Contoh",
          publishedAt: PUBLISHED,
        }}
      />,
    );
    expect(page).toContain("Tingkat asesmen terakhir");
    expect(page).toContain("Sangat berat");
    expect(page).toContain("DASS-21, 12 Okt 2026");
    expect(page).toContain("Rekomendasi");
    expect(page).toContain(ADVICE_WORDS.extremely_severe);
    expect(page).not.toContain(CRISIS_ADVICE);
    expect(page).not.toContain(RISK_WORDS);
    expect(page).not.toContain("Status konseling");
  });

  it("says Belum ada asesmen when the level is shared and there is no screening", () => {
    const page = renderToStaticMarkup(
      <SharedDetailBox
        detail={{
          data: ["level"],
          screening: null,
          counselling: null,
          summary: null,
          publishedByName: "Konselor Contoh",
          publishedAt: PUBLISHED,
        }}
      />,
    );
    expect(page).toContain("Belum ada asesmen.");
  });
});

describe("Tingkat in Data yang dipublikasikan untuk Anda", () => {
  it("shows the level when shared, Tidak dibagikan when left out, and Belum ada asesmen with no screening", () => {
    const page = panel({
      rows: [
        { ...ROW, data: ["level", "counselling"], level: "moderate" },
        {
          ...ROW,
          studentId: "00000000-0000-4000-8000-000000000003",
          data: ["counselling"],
        },
        {
          ...ROW,
          studentId: "00000000-0000-4000-8000-000000000004",
          data: ["level"],
        },
      ],
      matching: 3,
    });
    expect(page).toContain('data-title="Tingkat"');
    expect(page).toContain("Sedang");
    expect(page).toContain("Tidak dibagikan");
    expect(page).toContain("Belum ada asesmen");
    expect(page).toContain("Tingkat asesmen, Status konseling");
    expect(page).not.toContain(RISK_WORDS);
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
