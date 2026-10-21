import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CounsellingScreen } from "./counselling-screen";
import {
  CounsellorSharingPanel,
  StudentSharing,
} from "./counsellor-sharing-panel";
import type { SharingStatus } from "./sharing-ids";
import type { SharingPanel, SharingView } from "./sharing-view";
import {
  NEEDS_COUNSELLING_CONSENT,
  NO_SESSION,
  PICK_FIRST,
} from "./sharing-words";

// 10:00 on campus on 21 October 2026.
const MOMENT = new Date("2026-10-21T03:00:00Z");

function sharingOf(
  status: SharingStatus,
  rest: Partial<SharingView> = {},
): SharingView {
  return {
    id: "00000000-0000-4000-8000-000000005ab1",
    status,
    data: ["counselling", "summary"],
    recipients: ["head_of_unit", "mentor"],
    summary: "Mahasiswa sedang dalam pendampingan rutin.",
    way: null,
    answeredAt: null,
    publishedAt: null,
    publishedByName: null,
    version: MOMENT.toISOString(),
    ...rest,
  };
}

function panelOf(panel: Partial<SharingPanel>): string {
  const full: SharingPanel = {
    hasSessions: true,
    hasScreening: false,
    hasConsent: true,
    sharing: null,
    ...panel,
  };
  return renderToStaticMarkup(
    <StudentSharing
      panel={full}
      name="Mahasiswa Uji"
      pending={false}
      onAsk={() => {}}
      onStep={() => {}}
    />,
  );
}

describe("Publikasi data kesehatan mental", () => {
  it("shows to Konselor with the right, asking to pick a student first", () => {
    const page = renderToStaticMarkup(
      <CounsellingScreen own={null} mayManage={true} mayShare={true} />,
    );
    expect(page).toContain("Publikasi data kesehatan mental");
    expect(page).toContain(PICK_FIRST);
    const without = renderToStaticMarkup(
      <CounsellingScreen own={null} mayManage={true} />,
    );
    expect(without).not.toContain("Publikasi data kesehatan mental");
  });

  it("waits for the consent panel before reading a picked student", () => {
    const page = renderToStaticMarkup(
      <CounsellorSharingPanel
        picked={{
          id: "00000000-0000-4000-8000-000000005ab2",
          name: "Mahasiswa Uji",
          nim: "9986315001",
          program: "Prodi Uji",
        }}
        consentVersion={null}
      />,
    );
    expect(page).not.toContain(PICK_FIRST);
    expect(page).not.toContain("Minta persetujuan mahasiswa");
  });

  it("offers the data, the recipients of this student only, the summary and Minta persetujuan mahasiswa, with nothing ticked", () => {
    const page = panelOf({});
    expect(page).toContain("Data yang dibagikan");
    expect(page).toContain(
      "Status, jadwal, dan rencana tindak lanjut konseling, tanpa isi sesi",
    );
    expect(page).toContain("Ringkasan pendampingan yang ditulis konselor");
    expect(page).toContain("Penerima");
    expect(page).toContain("Kepala Unit Pembangunan Karakter");
    expect(page).toContain("Direktur / Wakil Direktur");
    expect(page).toContain(
      "Ketua Program Studi (hanya ketua prodi mahasiswa ini)",
    );
    expect(page).toContain("Pengasuh (hanya pengasuh mahasiswa ini)");
    expect(page).not.toContain("Pengelola Asrama");
    expect(page).not.toContain("Badan Asrama");
    expect(page).toContain("Ringkasan untuk penerima");
    expect(page).toContain("Minta persetujuan mahasiswa");
    expect(page.match(/type="checkbox"/g)).toHaveLength(6);
    expect(page).not.toContain("checked");
  });

  it("says a student with no session has none, and offers nothing", () => {
    const page = panelOf({ hasSessions: false });
    expect(page).toContain(NO_SESSION);
    expect(page).not.toContain("<form");
    expect(page).not.toContain("<button");
  });

  it("offers nothing while the consent to counselling is not Disetujui", () => {
    const page = panelOf({ hasConsent: false });
    expect(page).toContain(NEEDS_COUNSELLING_CONSENT);
    expect(page).not.toContain("<form");
  });

  it("shows a waiting request with who it is for, what it gives and the summary, and no new form", () => {
    const page = panelOf({ sharing: sharingOf("waiting") });
    expect(page).toContain("Menunggu persetujuan");
    expect(page).toContain(
      "Penerima: Kepala Unit Pembangunan Karakter, Pengasuh.",
    );
    expect(page).toContain(
      "status, jadwal, dan rencana tindak lanjut konseling, tanpa isi sesi; ringkasan pendampingan yang ditulis konselor",
    );
    expect(page).toContain("“Mahasiswa sedang dalam pendampingan rutin.”");
    expect(page).not.toContain("<form");
  });

  it("offers a new request after Ditolak, Ditarik or Dicabut, with no step on the old one", () => {
    for (const status of ["declined", "cancelled", "withdrawn"] as const) {
      const page = panelOf({ sharing: sharingOf(status) });
      expect(page).toContain("Minta persetujuan mahasiswa");
      expect(page).not.toContain("Publikasikan");
      expect(page).not.toContain("Batalkan");
      expect(page).not.toContain("Tarik publikasi");
    }
  });

  it("offers Catat persetujuan tertulis and Batalkan permintaan on a waiting request, never Publikasikan", () => {
    const page = panelOf({ sharing: sharingOf("waiting") });
    expect(page).toContain("Catat persetujuan tertulis");
    expect(page).toContain("Batalkan permintaan");
    expect(page).not.toContain("Publikasikan");
  });

  it("offers Publikasikan and Batalkan once approved, saying recipients see nothing yet", () => {
    const page = panelOf({
      sharing: sharingOf("approved", { way: "paper", answeredAt: MOMENT }),
    });
    expect(page).toContain("Form tertulis");
    expect(page).toContain("Publikasikan");
    expect(page).toContain("Batalkan");
    expect(page).toContain("Data belum tampil bagi penerima");
    expect(page).not.toContain("Minta persetujuan mahasiswa");
  });

  it("shows a published one with its date and the Konselor's name, and offers Tarik publikasi only", () => {
    const page = panelOf({
      sharing: sharingOf("published", {
        way: "online",
        answeredAt: MOMENT,
        publishedAt: MOMENT,
        publishedByName: "Konselor Uji Layar",
      }),
    });
    expect(page).toContain("Dipublikasikan");
    expect(page).toContain("oleh Konselor Uji Layar");
    expect(page).toContain("Tarik publikasi");
    expect(page).not.toContain(">Publikasikan<");
    expect(page).not.toContain("Minta persetujuan mahasiswa");
  });
});
