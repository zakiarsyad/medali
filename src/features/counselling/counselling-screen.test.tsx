import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConsentStatusLine } from "./consent-badge";
import { CounsellingScreen, EMERGENCY_TEXT } from "./counselling-screen";

// 10:00 on campus on 16 October 2026.
const MOMENT = new Date("2026-10-16T03:00:00Z");

describe("Konseling of Konselor", () => {
  it("shows the emergency notice with 119, and Persetujuan konseling with a student search until one is picked", () => {
    const page = renderToStaticMarkup(<CounsellingScreen mayManage={true} />);

    expect(page).toContain("Keadaan darurat.");
    expect(EMERGENCY_TEXT).toContain("119");
    expect(page).toContain(EMERGENCY_TEXT);
    expect(page).toContain("Persetujuan konseling");
    expect(page).toContain('aria-label="Cari mahasiswa"');
    expect(page).toContain("Pilih mahasiswa untuk melihat status persetujuan");
  });

  it("shows neither to an account without the right", () => {
    const page = renderToStaticMarkup(<CounsellingScreen mayManage={false} />);

    expect(page).not.toContain("Keadaan darurat.");
    expect(page).not.toContain("Persetujuan konseling");
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
