import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HistoryTable } from "./history-table";
import type { OwnEntry } from "./own-siku";
import { OwnSikuScreen } from "./own-siku-screen";
import { repeatedFile, savedMessage } from "./save-siku-file";
import { SAVE_AGAIN, savedBeforeNote } from "./siku-file-preview";

const UPLOAD = {
  source: "upload",
  id: "00000000-0000-4000-8000-000000000201",
  day: "2026-10-14",
  fileName: "siku-oktober.csv",
  students: 12,
  enteredBy: "Penilai Contoh",
  seeAddress: "/penilaian/siku?lihat=1",
} as const;

const FORM = {
  source: "form",
  id: "00000000-0000-4000-8000-000000000202",
  day: "2026-10-13",
  kind: "loss",
  reason: "discipline_penalty",
  points: 4,
  students: 1,
  note: "Catatan contoh",
  basis: "",
  enteredBy: "Penilai Contoh",
  seeAddress: "/penilaian/siku?lihat=2",
} as const;

describe("an upload in the history list", () => {
  const html = renderToStaticMarkup(
    <HistoryTable rows={[UPLOAD, FORM]} mayCancel />,
  );

  it("shows Unggah berkas with the file name, no points, and its students", () => {
    expect(html).toContain("Unggah berkas</span>");
    expect(html).toContain("siku-oktober.csv");
    expect(html).toMatch(/data-title="Poin">-<\/td>/);
    expect(html).toContain('<td data-title="Mahasiswa">12</td>');
  });

  it("keeps showing a form entry as before", () => {
    expect(html).toContain("Pengurangan");
    expect(html).toContain("−4");
    expect(html).toContain("Catatan contoh");
  });

  it("offers Lihat mahasiswa and Batalkan on both", () => {
    expect(html.split("Lihat mahasiswa")).toHaveLength(3);
    expect(html.split("Batalkan")).toHaveLength(3);
  });
});

describe("a row from a file in Transparansi nilai SIKU", () => {
  const entry: OwnEntry = {
    id: "00000000-0000-4000-8000-000000000203",
    day: "2026-10-14",
    kind: "loss",
    reason: "unannounced_absence",
    points: 2,
    note: "",
    basis: "",
    enteredAs: "assessor",
    fromFile: true,
  };

  it("says it was entered by unggah berkas beside who entered it", () => {
    const html = renderToStaticMarkup(
      <OwnSikuScreen
        tabs={{ pagePath: "penilaian", tabs: [], open: "siku" }}
        base={70}
        siku={{ totals: { gains: 0, losses: 2 }, entries: [entry] }}
      />,
    );

    expect(html).toContain("Penilai Mahasiswa lewat unggah berkas");
  });
});

describe("the words of a save", () => {
  it("says how many rows were saved", () => {
    expect(savedMessage({ saved: 1250 })).toBe("1.250 baris tersimpan.");
  });

  it("warns of a file saved before with its day, and names the confirm", () => {
    expect(savedBeforeNote("2026-10-14")).toBe(
      "Berkas dengan nama dan isi yang sama sudah disimpan pada 14 Okt 2026.",
    );
    expect(repeatedFile("2026-10-14").error).toBe(
      `Berkas dengan nama dan isi yang sama sudah disimpan pada 14 Okt 2026. Centang "${SAVE_AGAIN}", lalu simpan bila memang perlu.`,
    );
  });
});
