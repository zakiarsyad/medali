import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ClarificationFormView } from "./clarification-form-view";
import type { ClarificationCell, ClarifiedEntry } from "./clarification-time";
import { type HistoryState, NO_ROW_OPEN } from "./history-state";
import { HistoryTableView } from "./history-table-view";

vi.mock("./clarification-actions", () => ({
  sendDormClarificationAction: vi.fn(),
}));

const CLARIFICATION_ID = "00000000-0000-4000-8000-00000000c1a2";

function entry(clarification: ClarificationCell): ClarifiedEntry {
  return {
    activityId: "00000000-0000-4000-8000-00000000a001",
    day: "2026-10-14",
    name: "Apel pagi uji",
    startTime: "05:30",
    status: "absent",
    note: "",
    clarification,
  };
}

const KEY = "2026-10-14 00000000-0000-4000-8000-00000000a001";

function view(cell: ClarificationCell, state: HistoryState = NO_ROW_OPEN) {
  return renderToStaticMarkup(
    <HistoryTableView
      history={[entry(cell)]}
      state={state}
      onOpen={() => {}}
      onCancel={() => {}}
      onAnswer={() => {}}
    />,
  );
}

describe("the Klarifikasi cell of Riwayat", () => {
  it("says Batas klarifikasi lewat once the seven days are over", () => {
    const shown = view({ badge: null, note: "", file: null, action: "closed" });

    expect(shown).toContain("Batas klarifikasi lewat");
    expect(shown).not.toContain("<button");
  });

  it("shows a sent clarification with the file the resident sent, which downloads it", () => {
    const shown = view({
      badge: "submitted",
      note: "",
      file: { clarificationId: CLARIFICATION_ID, name: "surat.pdf" },
      action: null,
    });

    expect(shown).toContain("Klarifikasi diajukan</span>");
    expect(shown).toContain(`href="/asrama/klar/lampiran/${CLARIFICATION_ID}"`);
    expect(shown).toContain("Lampiran: surat.pdf</a>");
  });

  it("shows a rejected one with its note and Ajukan ulang", () => {
    const shown = view({
      badge: "rejected",
      note: "Tidak ada surat keterangan dari klinik asrama.",
      file: null,
      action: "ask_again",
    });

    expect(shown).toContain("Klarifikasi ditolak</span>");
    expect(shown).toContain("Tidak ada surat keterangan dari klinik asrama.");
    expect(shown).toContain(">Ajukan ulang</button>");
  });

  it("opens the form under the row whose Ajukan klarifikasi was pressed, and shows the answer under it", () => {
    const cell = { badge: null, note: "", file: null, action: "ask" } as const;
    const open = view(cell, { openKey: KEY, answer: null });
    const answered = view(cell, {
      openKey: null,
      answer: {
        key: KEY,
        state: { error: null, done: "Klarifikasi terkirim." },
      },
    });

    expect(open).toContain("Kirim klarifikasi");
    expect(answered).not.toContain("Kirim klarifikasi");
    expect(answered).toContain("Klarifikasi terkirim.");
  });

  it("opens no form on a row that may not be asked any more", () => {
    const shown = view(
      { badge: "submitted", note: "", file: null, action: null },
      { openKey: KEY, answer: null },
    );

    expect(shown).not.toContain("Kirim klarifikasi");
  });
});

describe("the form of a clarification", () => {
  const form = renderToStaticMarkup(
    <ClarificationFormView
      sending={false}
      onSubmit={() => {}}
      onCancel={() => {}}
    />,
  );

  it("asks for Alasan from the dorm's list, Lampiran and Penjelasan", () => {
    expect(form).toContain('name="reason"');
    for (const words of [
      "Sakit",
      "Urusan keluarga mendesak",
      "Tugas institusi atau lomba",
      "Sudah hadir tetapi tidak tercatat",
      "Lainnya",
    ]) {
      expect(form).toContain(`>${words}</option>`);
    }
    expect(form).not.toContain("Kendala teknis presensi");
    expect(form).toContain("Lampiran (PDF atau gambar, maks. 5 MB)");
    expect(form).toContain('name="explanation"');
  });

  it("takes a PDF or a picture, which a phone may take with its camera", () => {
    expect(form).toContain(
      '<input type="file" accept="application/pdf,image/jpeg,image/png"',
    );
    // Forcing the camera would leave no way to pick a PDF.
    expect(form).not.toContain("capture");
  });

  it("cannot be sent twice while it is on its way", () => {
    const sending = renderToStaticMarkup(
      <ClarificationFormView sending onSubmit={() => {}} onCancel={() => {}} />,
    );

    expect(sending).toContain("Mengirim…");
    expect(sending.match(/disabled=""/g)).toHaveLength(2);
  });
});
