import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ListedCompanion } from "./companion-list";
import { CompanionNoteDialog } from "./companion-note-button";
import { CompanionTable } from "./companion-table";

vi.mock("./companion-actions", () => ({
  changeCompanionNoteAction: vi.fn(),
  restartCompanionAction: vi.fn(),
  stopCompanionAction: vi.fn(),
}));

function companion(
  name: string,
  isActive: boolean,
  note: string | null,
): ListedCompanion {
  return {
    studentId: `6f1c1f8e-3b7a-4c55-9a51-2f7d3c8b9e1${isActive ? 1 : 2}`,
    name,
    nim: "9934240201",
    studyProgram: "Prodi Contoh",
    semester: 5,
    dorm: "cipta_bakti",
    room: null,
    note,
    isActive,
  };
}

const ACTIVE = companion("Dewi Contoh", true, "Lantai 2");
const STOPPED = companion("Sari Contoh", false, null);

function rowOf(table: string, name: string): string {
  const row = table.split("<tr>").find((part) => part.includes(name));
  if (!row) throw new Error(`No row for ${name}.`);
  return row;
}

function table(mayManage: boolean): string {
  return renderToStaticMarkup(
    <CompanionTable companions={[ACTIVE, STOPPED]} mayManage={mayManage} />,
  );
}

describe("CompanionTable", () => {
  it('shows "Ubah" next to "Nonaktifkan" on an Aktif row', () => {
    const row = rowOf(table(true), ACTIVE.name);

    expect(row).toContain(">Ubah</button>");
    expect(row).toContain("Nonaktifkan");
  });

  it('shows "Ubah" next to "Aktifkan" on a Tidak aktif row', () => {
    const row = rowOf(table(true), STOPPED.name);

    expect(row).toContain(">Ubah</button>");
    expect(row).toContain("Aktifkan");
  });

  it('shows no "Ubah" to a role that only reads the list', () => {
    expect(table(false)).not.toContain("Ubah");
  });

  it('shows "-" for a kakak pendamping without a Keterangan', () => {
    expect(rowOf(table(false), STOPPED.name)).toContain(
      '<td data-title="Keterangan">-</td>',
    );
  });
});

describe("CompanionNoteDialog", () => {
  function dialog(shown: ListedCompanion): string {
    return renderToStaticMarkup(
      <CompanionNoteDialog
        companion={shown}
        onClose={() => undefined}
        onDone={() => undefined}
      />,
    );
  }

  it("holds the name of the student and their Keterangan", () => {
    const form = dialog(ACTIVE);

    expect(form).toContain("Dewi Contoh");
    expect(form).toContain('value="Lantai 2"');
    expect(form).toContain(`value="${ACTIVE.studentId}"`);
    expect(form).toContain(">Simpan</button>");
  });

  it("holds an empty Keterangan when there is none", () => {
    const form = dialog(STOPPED);

    expect(form).toMatch(/<input [^>]*name="note" value=""/);
  });

  it("takes no more characters than the limit of Tetapkan", () => {
    expect(dialog(ACTIVE)).toContain('maxLength="100"');
  });
});
