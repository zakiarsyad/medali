import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SharingStatus } from "@/mental-health/sharing-ids";
import { CounsellingScreen } from "./counselling-screen";
import type { SharingView } from "./sharing-view";

// 10:00 on campus on 21 October 2026.
const MOMENT = new Date("2026-10-21T03:00:00Z");

const SUMMARY = "Mahasiswa sedang dalam pendampingan rutin.";

function sharingOf(status: SharingStatus): SharingView {
  return {
    id: "00000000-0000-4000-8000-000000005ab3",
    status,
    data: ["counselling", "summary"],
    recipients: ["head_of_unit", "mentor"],
    summary: SUMMARY,
    way: status === "waiting" ? null : "online",
    answeredAt: status === "waiting" ? null : MOMENT,
    publishedAt: status === "published" ? MOMENT : null,
    publishedByName: null,
    version: MOMENT.toISOString(),
  };
}

function pageOf(sharing: SharingView | null): string {
  return renderToStaticMarkup(
    <CounsellingScreen
      own={{ consent: null, registration: null, sharing }}
      mayManage={false}
    />,
  );
}

describe("the student's own sharing on Konseling", () => {
  it("shows a waiting request with the recipients, the data, the exact summary, the note on session notes, Setujui berbagi data and Tolak", () => {
    const page = pageOf(sharingOf("waiting"));
    expect(page).toContain("Permintaan persetujuan berbagi data");
    expect(page).toContain("<b>Kepala Unit Pembangunan Karakter, Pengasuh</b>");
    expect(page).toContain(
      "<li>Status, jadwal, dan rencana tindak lanjut konseling, tanpa isi sesi</li>",
    );
    expect(page).toContain(
      "<li>Ringkasan pendampingan yang ditulis konselor</li>",
    );
    expect(page).toContain(`Ringkasan yang akan dibagikan: “${SUMMARY}”`);
    expect(page).toContain("Catatan sesi konseling tidak pernah dibagikan.");
    expect(page).toContain("Setujui berbagi data");
    expect(page).toContain("Tolak");
    expect(page).not.toContain("Cabut persetujuan berbagi");
  });

  it("shows an approved one as given to whom, with Cabut persetujuan berbagi", () => {
    const page = pageOf(sharingOf("approved"));
    expect(page).toContain(
      "<b>Persetujuan berbagi data diberikan</b> kepada Kepala Unit Pembangunan Karakter, Pengasuh:",
    );
    expect(page).toContain("Cabut persetujuan berbagi");
    expect(page).not.toContain("Setujui berbagi data");
  });

  it("shows a published one as Data dibagikan kepada the recipients, with what is shared", () => {
    const page = pageOf(sharingOf("published"));
    expect(page).toContain(
      "<b>Data dibagikan</b> kepada Kepala Unit Pembangunan Karakter, Pengasuh: status, jadwal, dan rencana tindak lanjut konseling, tanpa isi sesi; ringkasan pendampingan yang ditulis konselor.",
    );
    expect(page).toContain(`Ringkasan: “${SUMMARY}”`);
    expect(page).toContain("Cabut persetujuan berbagi");
  });

  it("names the level and advice first, in the words of Konselor's form", () => {
    const waiting = pageOf({
      ...sharingOf("waiting"),
      data: ["counselling", "level"],
      summary: null,
    });
    expect(waiting).toContain(
      "<li>Tingkat hasil asesmen dan rekomendasi tindak lanjut</li><li>Status, jadwal",
    );
    const published = pageOf({
      ...sharingOf("published"),
      data: ["level"],
      summary: null,
    });
    expect(published).toContain(
      "Pengasuh: tingkat hasil asesmen dan rekomendasi tindak lanjut.",
    );
  });

  it("shows nothing of a sharing when none is current", () => {
    const page = pageOf(null);
    expect(page).not.toContain("berbagi data");
    expect(page).not.toContain("Data dibagikan");
  });
});
