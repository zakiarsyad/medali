import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { DisciplineProposal } from "./discipline-proposals";
import {
  NO_PROPOSALS,
  ProposalsPanel,
  type ProposalTools,
} from "./proposals-panel";
import { readStaffViolationParams } from "./violation-address";

vi.mock("./proposal-actions", () => ({
  handleDisciplineProposalAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));

const ANI = "00000000-0000-4000-8000-0000000000a1";
const BEA = "00000000-0000-4000-8000-0000000000b1";

function proposal(more: Partial<DisciplineProposal> = {}): DisciplineProposal {
  return {
    letterId: "00000000-0000-4000-8000-0000000000c1",
    studentId: ANI,
    name: "Ani Uji Pengajuan",
    nim: "9900990701",
    semesterTitle: "Ganjil 2026/2027",
    counted: 12,
    clarifiedOn: "2026-10-13",
    result: "Mahasiswa hadir dan mengakui pelanggarannya.",
    proposalNote: "Pelanggaran berulang setelah SP 1.",
    proposedAt: new Date("2026-10-13T09:30:00Z"),
    handling: null,
    ...more,
  };
}

const HANDLED = proposal({
  letterId: "00000000-0000-4000-8000-0000000000c2",
  studentId: BEA,
  name: "Bea Uji Pengajuan",
  handling: {
    note: "Diteruskan ke Pembina Disiplin Mahasiswa.",
    by: "Kepala Uji",
    at: new Date("2026-10-15T03:00:00Z"),
  },
});

const HEAD: ProposalTools = { handles: true, ownStudentId: null };
const MANAGER: ProposalTools = { handles: false, ownStudentId: null };

function panel(rows: DisciplineProposal[], tools: ProposalTools): string {
  return renderToStaticMarkup(
    <ProposalsPanel
      proposals={{ rows, matching: rows.length, page: 1 }}
      params={readStaffViolationParams({})}
      tools={tools}
    />,
  );
}

describe("Pengajuan hukuman disiplin dari Pengelola Asrama", () => {
  it("shows the student and semester, the violations, the clarification, the proposal and Diajukan", () => {
    const shown = panel([proposal()], HEAD);

    expect(shown).toContain(
      ">Pengajuan hukuman disiplin dari Pengelola Asrama</h2>",
    );
    for (const said of [
      "Ani Uji Pengajuan",
      "9900990701 · Ganjil 2026/2027",
      ">12</b>",
      "13 Okt 2026",
      "Mahasiswa hadir dan mengakui pelanggarannya.",
      "Pelanggaran berulang setelah SP 1.",
      ">Diajukan</span>",
    ]) {
      expect(shown).toContain(said);
    }
  });

  it("gives Kepala Unit Catatan tindak lanjut and Proses on a row still Diajukan", () => {
    const shown = panel([proposal(), HANDLED], HEAD);

    expect(shown.match(/>Proses<\/button>/g)).toHaveLength(1);
    expect(shown).toContain("Catatan tindak lanjut untuk Ani Uji Pengajuan");
  });

  it("shows a row Diproses with the note, who and when", () => {
    const shown = panel([HANDLED], HEAD);

    expect(shown).toContain(">Diproses</span>");
    expect(shown).toContain("Diteruskan ke Pembina Disiplin Mahasiswa.");
    expect(shown).toContain("Kepala Uji · 15 Okt 2026");
    expect(shown).not.toContain(">Proses</button>");
  });

  it("gives Kepala Unit no Proses on the row of their own student", () => {
    const shown = panel([proposal()], { handles: true, ownStudentId: ANI });

    expect(shown).not.toContain(">Proses</button>");
  });

  it("says when there is none", () => {
    expect(panel([], HEAD)).toContain(NO_PROPOSALS);
  });

  it("is a card per proposal on a phone, as the stacked rows of the app", () => {
    const shown = panel([proposal()], HEAD);

    expect(shown).toMatch(/<table class="[^"]*stacked[^"]*"/);
    for (const title of [
      "Mahasiswa",
      "Pelanggaran",
      "Klarifikasi SP 2",
      "Pengajuan",
      "Status",
    ]) {
      expect(shown).toContain(`data-title="${title}"`);
    }
  });

  it("gives Pengelola Asrama the same rows and statuses without the field and the button", () => {
    const shown = panel([proposal(), HANDLED], MANAGER);

    expect(shown).toContain(">Diajukan</span>");
    expect(shown).toContain(">Diproses</span>");
    expect(shown).toContain("Diteruskan ke Pembina Disiplin Mahasiswa.");
    expect(shown).not.toContain("Catatan tindak lanjut");
    expect(shown).not.toContain(">Proses</button>");
  });
});
