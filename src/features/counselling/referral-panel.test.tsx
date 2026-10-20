import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CounsellingScreen } from "./counselling-screen";
import { NO_REFERRALS, REFERRAL_NOTE, ReferralPanel } from "./referral-panel";
import type { ReferralList, ReferralRow } from "./referral-view";

const ROW: ReferralRow = {
  studentId: "00000000-0000-4000-8000-000000000001",
  name: "Ani Rujukan",
  nim: "9900000001",
  program: "D3 Akuntansi",
  dorm: "dana_rakca",
  room: { dorm: "dana_rakca", floor: 2, number: "204" },
  observation: "Menarik diri dari kegiatan asrama.",
  // 10:00 on campus on 14 October 2026.
  markedAt: new Date("2026-10-14T03:00:00Z"),
  markedBy: "Sari Kesehatan",
};

const ONE: ReferralList = { rows: [ROW], matching: 1, page: 1 };
const NONE: ReferralList = { rows: [], matching: 0, page: 1 };

describe("Rujukan potensi kesehatan mental dari asrama", () => {
  it("shows the title, the note, the number and each row's student, room, observation and who marked it when", () => {
    const html = renderToStaticMarkup(<ReferralPanel list={ONE} />);

    expect(html).toContain("Rujukan potensi kesehatan mental dari asrama");
    expect(REFERRAL_NOTE).toContain(
      "Penanda awal dari BAM - Kesehatan berdasarkan pengamatan, bukan hasil asesmen",
    );
    expect(html).toContain(REFERRAL_NOTE);
    expect(html).toMatch(/class="[^"]*badge[^"]*">1<\/span>/);
    expect(html).toContain("Ani Rujukan");
    expect(html).toContain("9900000001 · D3 Akuntansi");
    expect(html).toContain("Dana Rakca, lantai 2, kamar 204");
    expect(html).toContain("Menarik diri dari kegiatan asrama.");
    expect(html).toContain("14 Okt 2026");
    expect(html).toContain("Sari Kesehatan");
    expect(html).not.toContain(NO_REFERRALS);
  });

  it("makes each row a card on a phone", () => {
    const html = renderToStaticMarkup(<ReferralPanel list={ONE} />);
    expect(html).toMatch(/<table class="[^"]*stacked/);
    for (const title of ["Mahasiswa", "Kamar", "Pengamatan", "Ditandai"]) {
      expect(html).toContain(`data-title="${title}"`);
    }
  });

  it("says Tidak ada rujukan dari asrama. when there is none", () => {
    const html = renderToStaticMarkup(<ReferralPanel list={NONE} />);
    expect(html).toContain(NO_REFERRALS);
    expect(html).toMatch(/class="[^"]*badge[^"]*">0<\/span>/);
    expect(html).not.toContain("<table");
  });

  it("steps to the next 20 when there are more", () => {
    const rows = Array.from({ length: 20 }, (_, place) => ({
      ...ROW,
      studentId: `00000000-0000-4000-8000-0000000000${String(place).padStart(2, "0")}`,
    }));
    const html = renderToStaticMarkup(
      <ReferralPanel list={{ rows, matching: 21, page: 1 }} />,
    );
    expect(html).toContain("1–20 dari 21 rujukan");
    expect(html).toContain('href="/konseling?rujukan=2"');
  });
});

describe("Konseling with the referrals", () => {
  it("shows the referrals to Konselor", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen own={null} mayManage={true} referrals={ONE} />,
    );
    expect(page).toContain("Rujukan potensi kesehatan mental dari asrama");
  });

  it("shows nothing of them without the list", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen own={null} mayManage={true} />,
    );
    expect(page).not.toContain("Rujukan potensi");
  });
});
