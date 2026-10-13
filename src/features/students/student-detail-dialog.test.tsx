// No sample NIM: the box under test is the one shown for no student.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  type DetailOpenedFrom,
  StudentDetailDialog,
} from "./student-detail-dialog";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

function notFoundBox(openedFrom: DetailOpenedFrom): string {
  return renderToStaticMarkup(
    <StudentDetailDialog
      detail={{ kind: "not_found" }}
      period={{ startYear: 2026, term: "odd" }}
      openedFrom={openedFrom}
      closeAddress="/kembali"
      groupAddressOf={() => null}
      mentorAddressOf={() => null}
      morePanelsOf={() => null}
    />,
  );
}

const PLACES_OUTSIDE_THE_STUDENT_LIST: [DetailOpenedFrom, string][] = [
  ["group_page", "kembali ke halaman kelompok."],
  ["mentor_page", "kembali ke halaman pengasuh."],
  ["notes_list", "kembali ke daftar catatan."],
  ["scores_list", "kembali ke daftar nilai."],
];

describe("the box Mahasiswa tidak ditemukan", () => {
  it("sends the reader back to the Mahasiswa list from the Mahasiswa list", () => {
    expect(notFoundBox("student_list")).toContain(
      "Data mahasiswa ini tidak ada atau tidak dapat Anda lihat. Pilih Tutup untuk kembali ke daftar mahasiswa.",
    );
  });

  it.each(PLACES_OUTSIDE_THE_STUDENT_LIST)(
    "names the place Tutup returns to when opened from %s",
    (openedFrom, words) => {
      const box = notFoundBox(openedFrom);

      expect(box).toContain(`Pilih Tutup untuk ${words}`);
      expect(box).not.toContain("daftar mahasiswa");
    },
  );
});
