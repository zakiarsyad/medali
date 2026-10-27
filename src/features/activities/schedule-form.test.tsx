import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FormParts } from "./form-values";
import { ScheduleForm } from "./schedule-form";
import type { ScheduleRow } from "./schedule-row";
import {
  TEST_EXTRA_FORM_PARTS,
  TEST_EXTRA_SCHEDULE,
  TEST_FORM_PARTS,
  TEST_SCHEDULE,
} from "./test-screen-parts";

vi.mock("./actions", () => ({
  saveScheduleAction: vi.fn(),
  removeScheduleAction: vi.fn(),
  searchParticipantStudentsAction: vi.fn(),
}));

function nothing() {}

function formFor(
  schedule: ScheduleRow | null,
  parts: FormParts = TEST_FORM_PARTS,
): string {
  return renderToStaticMarkup(
    <ScheduleForm
      schedule={schedule}
      parts={parts}
      onSaved={nothing}
      onRemoved={nothing}
      onCancel={nothing}
    />,
  );
}

function newForm(): string {
  return formFor(null);
}

/** The field of that name as the form holds it. */
function fieldOf(form: string, name: string): string {
  return form.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0] ?? "";
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

  it("sends no version, so the server adds a schedule", () => {
    expect(newForm()).not.toContain('name="version"');
  });

  it("says it is on the PPKS tab, and has no Peserta", () => {
    expect(fieldOf(newForm(), "kind")).toContain('value="ppks"');
    expect(newForm()).not.toContain("Per mahasiswa");
  });
});

describe("the form for a new schedule of an extra activity", () => {
  const form = formFor(null, TEST_EXTRA_FORM_PARTS);

  it("is titled Jadwalkan kegiatan tambahan and says it is on that tab", () => {
    expect(form).toContain("Jadwalkan kegiatan tambahan");
    expect(fieldOf(form, "kind")).toContain('value="extra"');
  });

  it("offers the extra activities in one list, with no semester groups", () => {
    expect(form).toContain("Mentoring sebaya uji</option>");
    expect(form).not.toContain("<optgroup");
  });

  it("offers the four kinds of Peserta, on Per angkatan at the start", () => {
    for (const words of [
      "Per mahasiswa",
      "Per kelas",
      "Per angkatan",
      "Lintas angkatan",
    ]) {
      expect(form).toContain(words);
    }
    expect(form).toContain('aria-pressed="true">Per angkatan</button>');
    expect(fieldOf(form, "participantMode")).toContain('value="cohort"');
  });

  it("shows Peserta above the four kinds, in the shared choose-one row named Jenis peserta", () => {
    expect(form).toMatch(
      /<legend class="[^"]*label[^"]*">Peserta<\/legend><fieldset class="[^"]*modes[^"]*"><legend class="[^"]*hidden[^"]*">Jenis peserta<\/legend>/,
    );
    expect(form).toMatch(
      /<button type="button" class="[^"]*mode[^"]*mode[^"]*" aria-pressed="true">Per angkatan<\/button>/,
    );
    expect(form).toMatch(
      /<button type="button" class="[^"]*mode[^"]*" aria-pressed="false">Per mahasiswa<\/button>/,
    );
  });

  it("offers each angkatan with its count, the newest first, and counts nobody while none is picked", () => {
    expect(form.indexOf("Angkatan 2026")).toBeLessThan(
      form.indexOf("Angkatan 2025"),
    );
    expect(form).toContain("(120)");
    expect(form).toContain("Sasaran: 0 mahasiswa.");
    expect(form).not.toContain('name="participant"');
    expect(form).not.toContain("(target");
  });
});

describe("the form that changes a schedule of an extra activity", () => {
  const form = formFor(TEST_EXTRA_SCHEDULE, TEST_EXTRA_FORM_PARTS);

  it("opens on Lintas angkatan with the two angkatan it holds, counted", () => {
    expect(form).toContain('aria-pressed="true">Lintas angkatan</button>');
    expect(form).toContain(
      '<input type="hidden" name="participant" value="2024"/>',
    );
    expect(form).toContain(
      '<input type="hidden" name="participant" value="2025"/>',
    );
    expect(form).toContain("Angkatan 2024");
    expect(form).toContain("Pilih dua angkatan atau lebih.");
    expect(form).toContain("Sasaran: 96 mahasiswa.");
  });

  it("offers the activity it holds, chosen", () => {
    expect(form).toContain(
      `<option value="${TEST_EXTRA_SCHEDULE.activity.id}" selected="">`,
    );
  });
});

describe("the form that changes a schedule", () => {
  const form = formFor(TEST_SCHEDULE);

  it("is titled Ubah jadwal, with Simpan perubahan and Batal", () => {
    expect(form).toContain("Ubah jadwal</h2>");
    expect(form).toContain("Simpan perubahan</button>");
    expect(form).toContain("Batal</button>");
    expect(form).not.toContain("Simpan jadwal");
    expect(form).not.toContain("Jadwalkan kegiatan PPKS");
  });

  it("has Hapus jadwal, which the form for a new schedule has not", () => {
    expect(form).toContain("Hapus jadwal</button>");
    expect(newForm()).not.toContain("Hapus jadwal");
  });

  it("opens filled in with what the schedule holds", () => {
    expect(fieldOf(form, "startsOn")).toContain('value="2026-10-13"');
    expect(fieldOf(form, "endsOn")).toContain('value="2026-10-14"');
    expect(fieldOf(form, "startTime")).toContain('value="07:30"');
    expect(fieldOf(form, "endTime")).toContain('value="11:30"');
    expect(fieldOf(form, "uploadCount")).toContain('value="1"');
    expect(form).toContain('<option value="week" selected="">minggu</option>');
    expect(fieldOf(form, "location")).toContain('value="Aula asrama"');
  });

  it("keeps Wajib as the schedule has it, not as Kurikulum says of the activity", () => {
    expect(TEST_SCHEDULE.activity.isRequired).toBe(true);
    expect(fieldOf(form, "required")).not.toContain("checked");
  });

  it("still offers the activity the schedule holds after it was removed from Kurikulum, and has it chosen", () => {
    expect(form).toContain(
      `<option value="${TEST_SCHEDULE.activity.id}" selected="">Latihan dasar kepemimpinan organisasi</option>`,
    );
    expect(newForm()).not.toContain(TEST_SCHEDULE.activity.id);
  });

  it("shows the nilai, the indicators and the target of the activity, and whom the schedule is for", () => {
    for (const words of ["Mandiri", "Disiplin", "target 110 peserta"]) {
      expect(form).toContain(words);
    }
    expect(form).toContain(">M2</span>");
    expect(form).toContain("Sasaran: 96 mahasiswa (target 110).");
  });

  it("sends no number of attendances agreed to before it was asked", () => {
    expect(fieldOf(form, "agreedAttendances")).toContain('value=""');
  });

  it("sends the key and the version of the schedule it was opened for", () => {
    expect(fieldOf(form, "id")).toContain(`value="${TEST_SCHEDULE.id}"`);
    expect(fieldOf(form, "version")).toContain(
      `value="${TEST_SCHEDULE.version}"`,
    );
  });
});
