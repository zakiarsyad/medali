import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AttentionRow } from "./mentee-attention";
import { MenteeAttentionPanel } from "./mentee-attention-panel";

function rowOf(place: number): AttentionRow {
  return {
    studentId: `00000000-0000-4000-8000-0000000000${String(place).padStart(2, "0")}`,
    name: `Mahasiswa ${place}`,
    opensDetail: true,
    rerata: place === 1 ? null : 60 + place,
    reasons: [
      { words: "Hukuman disiplin ringan", tone: "serious" },
      { words: "Kehadiran kegiatan 70%", tone: "warning" },
    ],
  };
}

describe("Perlu perhatian", () => {
  it("names each anak asuh with their average and one tag per reason, the name opening their detail", () => {
    const html = renderToStaticMarkup(
      <MenteeAttentionPanel rows={[rowOf(1), rowOf(2)]} />,
    );

    expect(html).toContain("2 anak asuh");
    expect(html).toContain("belum diasesmen");
    expect(html).toContain("MEDALI 62,0");
    expect(html).toContain(">Hukuman disiplin ringan</span>");
    expect(html).toContain(">Kehadiran kegiatan 70%</span>");
    expect(html).toContain(
      'href="/dashboard?tampilan=anak-asuh&amp;profil=00000000-0000-4000-8000-000000000002"',
    );
    expect(html).not.toContain("Lihat semua");
  });

  it("shows the first 8, and the rest behind Lihat semua", () => {
    const rows = Array.from({ length: 10 }, (_, place) => rowOf(place + 1));

    const html = renderToStaticMarkup(<MenteeAttentionPanel rows={rows} />);
    const [shownFirst, behind] = html.split("<summary>Lihat semua</summary>");

    expect(shownFirst).toContain("Mahasiswa 8<");
    expect(shownFirst).not.toContain("Mahasiswa 9<");
    expect(behind).toContain("Mahasiswa 9<");
    expect(behind).toContain("Mahasiswa 10<");
  });

  it("says so when nobody needs attention", () => {
    const html = renderToStaticMarkup(<MenteeAttentionPanel rows={[]} />);

    expect(html).toContain(
      "Tidak ada anak asuh yang perlu perhatian khusus saat ini.",
    );
  });
});
