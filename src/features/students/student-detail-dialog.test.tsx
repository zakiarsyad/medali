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
  ["siku_lists", "kembali ke Penilaian SIKU."],
  ["coaching_list", "kembali ke Asesmen karakter."],
  ["grade_list", "kembali ke Penilaian karakter."],
  ["fitness_list", "kembali ke Penilaian jasmani."],
  ["skpm_list", "kembali ke Data SKPM."],
  ["screening_list", "kembali ke Kesehatan mental."],
];

describe("the brief of a student", () => {
  it("shows the name, NIM, program studi, status and the panels of other areas, and nothing else of the detail", () => {
    const box = renderToStaticMarkup(
      <StudentDetailDialog
        detail={{
          kind: "brief",
          student: {
            id: "00000000-0000-4000-8000-000000000001",
            name: "Mahasiswa Uji Ringkas",
            nim: "NIM-UJI",
            studyProgram: "Prodi Uji Ringkas",
            status: "on_leave",
          },
        }}
        period={{ startYear: 2026, term: "odd" }}
        openedFrom="siku_lists"
        closeAddress="/kembali"
        groupAddressOf={() => null}
        mentorAddressOf={() => null}
        morePanelsOf={() => <p>Catatan pengasuhan</p>}
        briefPanelsOf={(studentId) => <p>Rincian nilai SIKU {studentId}</p>}
      />,
    );

    expect(box).toContain("Mahasiswa Uji Ringkas");
    expect(box).toContain("NIM-UJI · Prodi Uji Ringkas");
    expect(box).toContain("Cuti");
    expect(box).toContain(
      "Rincian nilai SIKU 00000000-0000-4000-8000-000000000001",
    );
    // A Ketua Program Studi who is also Penilai Mahasiswa, opening a
    // student of another program: the notes panel of the whole detail
    // would say "0 catatan" of a student whose notes they may not read.
    expect(box).not.toContain("Catatan pengasuhan");
    expect(box).not.toContain("Asrama");
    expect(box).not.toContain("Pengasuh");
    expect(box).not.toContain("Angkatan");
  });
});

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
