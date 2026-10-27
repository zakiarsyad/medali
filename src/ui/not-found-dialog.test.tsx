import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NotFoundDialog } from "./not-found-dialog";

vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));

describe("the window of a record the address names that is not found", () => {
  it("names a student, and where Tutup returns", () => {
    const box = renderToStaticMarkup(
      <NotFoundDialog
        thing="student"
        returnPlace="daftar mahasiswa"
        closeAddress="/mahasiswa"
      />,
    );

    expect(box).toContain('aria-label="Mahasiswa tidak ditemukan"');
    expect(box).toContain("Mahasiswa tidak ditemukan</h2>");
    expect(box).toContain(
      "Data mahasiswa ini tidak ada atau tidak dapat Anda lihat. Pilih Tutup untuk kembali ke daftar mahasiswa.",
    );
  });

  it("names a group in the same way", () => {
    const box = renderToStaticMarkup(
      <NotFoundDialog
        thing="group"
        returnPlace="daftar kelompok"
        closeAddress="/pengasuh/kelompok"
      />,
    );

    expect(box).toContain('aria-label="Kelompok tidak ditemukan"');
    expect(box).toContain("Kelompok tidak ditemukan</h2>");
    expect(box).toContain(
      "Data kelompok ini tidak ada atau tidak dapat Anda lihat. Pilih Tutup untuk kembali ke daftar kelompok.",
    );
  });
});
