import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ScheduleForm } from "./schedule-form";
import { TEST_FORM_PARTS } from "./test-screen-parts";

vi.mock("./actions", () => ({ saveScheduleAction: vi.fn() }));

function nothing() {}

function newForm(): string {
  return renderToStaticMarkup(
    <ScheduleForm
      parts={TEST_FORM_PARTS}
      onSaved={nothing}
      onCancel={nothing}
    />,
  );
}

describe("the form for a new schedule", () => {
  it("asks every field under its own words, with Simpan jadwal and Batal", () => {
    const form = newForm();

    for (const words of [
      "Jadwalkan kegiatan PPKS",
      "Kegiatan dari Kurikulum",
      "Tanggal mulai",
      "Tanggal selesai",
      "Jam mulai",
      "Jam selesai",
      "Rentang unggah foto kehadiran",
      "Dibuka sejak kegiatan dimulai sampai",
      "setelah tanggal selesai.",
      "Lokasi",
      "Wajib, dihitung dalam nilai kehadiran",
      "Simpan jadwal",
      "Batal",
    ]) {
      expect(form).toContain(words);
    }
    expect(form).not.toContain("Hapus jadwal");
    expect(form).not.toContain("Simpan perubahan");
  });

  it("offers the activities grouped by semester, with nothing chosen at the start", () => {
    const form = newForm();

    expect(form).toContain('<option value="" selected="">Pilih kegiatan…');
    expect(form).toContain('<optgroup label="Semester 1 (Penanaman)">');
    expect(form).toContain('<optgroup label="Semester 3 (Penumbuhan)">');
    expect(form).not.toContain('<optgroup label="Semester 2');
    expect(form).toContain("Orientasi uji</option>");
  });

  it("starts today, from 07:30 to 11:30, with 1 hari to upload, required", () => {
    const form = newForm();

    expect(form).toMatch(/name="startsOn"[^>]* value="2026-10-13"/);
    expect(form).toMatch(/name="endsOn"[^>]* value="2026-10-13"/);
    expect(form).toMatch(/name="startTime"[^>]* value="07:30"/);
    expect(form).toMatch(/name="endTime"[^>]* value="11:30"/);
    expect(form).toMatch(/name="uploadCount"[^>]* value="1"/);
    expect(form).toContain('<option value="day" selected="">hari</option>');
    expect(form).toContain('<option value="week">minggu</option>');
    expect(form).toMatch(/name="required"[^>]* checked=""/);
  });

  it("holds the upload range to 0 up to 52 and the place to 100 characters", () => {
    const form = newForm();
    const count = form.match(/<input[^>]*name="uploadCount"[^>]*>/)?.[0];
    const place = form.match(/<input[^>]*name="location"[^>]*>/)?.[0];

    expect(count).toContain('min="0"');
    expect(count).toContain('max="52"');
    expect(place).toContain('maxLength="100"');
  });

  it("sends the key made for the schedule it adds", () => {
    expect(newForm()).toContain(
      '<input type="hidden" name="id" value="00000000-0000-4000-8000-0000000000f1"/>',
    );
  });

  it("says the schedule is for nobody while no activity is chosen", () => {
    expect(newForm()).toContain("Sasaran: 0 mahasiswa. Mahasiswa mengunggah");
  });

  it("leaves the checks to the server, so the app's own message is the one shown", () => {
    expect(/<form[^>]* novalidate=""/i.test(newForm())).toBe(true);
  });
});
