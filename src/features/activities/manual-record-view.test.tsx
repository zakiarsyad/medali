import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RecordStudent } from "./manual-record";
import { ManualRecordView } from "./manual-record-view";
import { EMPTY_RECORD_FORM, type RecordForm } from "./record-form-state";
import { RecordStudentField } from "./record-student-field";
import { draw, isPressable, offered, press } from "./test-press";

const STUDENT: RecordStudent = {
  id: "student-1",
  name: "Mahasiswa Uji Catat",
  nim: "8800000002",
  program: "Akuntansi uji",
};
const WITH_ACTIVITIES: RecordForm = {
  ...EMPTY_RECORD_FORM,
  student: STUDENT,
  activities: [
    { id: "schedule-2", words: "13 Okt 2026 · Latihan uji", status: "valid" },
    { id: "schedule-1", words: "1 Sep 2026 · Orientasi uji", status: null },
  ],
  scheduleId: "schedule-2",
};

function view(form: RecordForm, busy = false) {
  const pressed: string[] = [];
  const element = (
    <ManualRecordView
      form={form}
      busy={busy}
      student={null}
      onChoose={(scheduleId) => pressed.push(`chose ${scheduleId}`)}
      onKind={(kind) => pressed.push(`kind ${kind}`)}
      onNote={(note) => pressed.push(`note ${note}`)}
      onSave={() => pressed.push("save")}
    />
  );
  return {
    drawn: draw(element),
    markup: renderToStaticMarkup(element),
    pressed,
  };
}

describe("ManualRecordView", () => {
  it("is a folded panel with its title, the three statuses, the Keterangan and Simpan", () => {
    const { markup } = view(EMPTY_RECORD_FORM);

    expect(markup).toMatch(
      /<details[^>]*><summary[^>]*>Catat kehadiran manual atau dispensasi<\/summary>/,
    );
    expect(markup).toContain(
      '<option value="present" selected="">Hadir (dicatat manual)</option>',
    );
    expect(markup).toContain('<option value="leave">Dispensasi: izin</option>');
    expect(markup).toContain('<option value="sick">Dispensasi: sakit</option>');
    expect(markup).toContain('placeholder="Misalnya nomor surat izin"');
    expect(markup).toContain('maxLength="200"');
    expect(markup).toContain(">Simpan</button>");
  });

  it("asks for the student first while nobody is picked", () => {
    const { markup } = view(EMPTY_RECORD_FORM);

    expect(markup).toContain(
      '<option value="" selected="">Pilih mahasiswa dulu</option>',
    );
  });

  it("says so when the picked student has no activity that has started", () => {
    const { markup } = view({ ...EMPTY_RECORD_FORM, student: STUDENT });

    expect(markup).toContain(
      '<option value="" selected="">Tidak ada kegiatan</option>',
    );
  });

  it("lists the activities of the student, each with the status the student has there, and shows the status of the chosen one", () => {
    const { markup } = view(WITH_ACTIVITIES);

    expect(markup).toContain(
      '<option value="schedule-2" selected="">13 Okt 2026 · Latihan uji · Hadir</option>',
    );
    expect(markup).toContain(
      '<option value="schedule-1">1 Sep 2026 · Orientasi uji</option>',
    );
    expect(markup).toContain("Status saat ini: Hadir.");
    expect(
      view({ ...WITH_ACTIVITIES, scheduleId: "schedule-1" }).markup,
    ).not.toContain("Status saat ini");
  });

  it("shows what the last Simpan answered", () => {
    const state = {
      error: null,
      done: "Kehadiran Mahasiswa Uji Catat dicatat.",
    };

    const { markup } = view({ ...WITH_ACTIVITIES, state });

    expect(markup).toContain(
      'role="status">Kehadiran Mahasiswa Uji Catat dicatat.</p>',
    );
  });

  it("sends the form with Simpan, not by the browser", () => {
    const { drawn, pressed } = view(WITH_ACTIVITIES);
    const form = drawn.find(({ type }) => type === "form");
    if (!form) throw new Error("No form is shown.");
    let prevented = false;

    (form.props.onSubmit as (event: unknown) => void)({
      preventDefault: () => {
        prevented = true;
      },
    });

    expect(prevented).toBe(true);
    expect(pressed).toEqual(["save"]);
  });

  it("switches Simpan and the fields off while something is on its way", () => {
    const { drawn } = view(WITH_ACTIVITIES, true);
    const fields = drawn.filter(
      ({ type }) => type === "select" || type === "input",
    );

    expect(isPressable(drawn, "Simpan")).toBe(false);
    expect(fields.map(({ props }) => props.disabled)).toEqual([
      true,
      true,
      true,
    ]);
  });
});

describe("RecordStudentField", () => {
  function field(more: {
    student?: RecordStudent;
    query?: string;
    found?: RecordStudent[];
  }) {
    const picked: (RecordStudent | null)[] = [];
    const element = (
      <RecordStudentField
        student={more.student ?? null}
        query={more.query ?? ""}
        found={more.found ?? []}
        busy={false}
        onQuery={() => {}}
        onPick={(student) => picked.push(student)}
      />
    );
    return {
      drawn: draw(element),
      markup: renderToStaticMarkup(element),
      picked,
    };
  }

  it("searches by name or NIM, and offers nobody before anything is typed", () => {
    const { drawn, markup } = field({ found: [STUDENT] });

    expect(markup).toContain('placeholder="Cari nama atau NIM"');
    expect(offered(drawn).filter((words) => words !== "Mahasiswa")).toEqual([]);
  });

  it("offers each student found with name, NIM and program studi, and picks the one pressed", () => {
    const { drawn, picked } = field({ query: "uji", found: [STUDENT] });
    const words = "Mahasiswa Uji Catat · NIM 8800000002 · Akuntansi uji";

    press(drawn, words);

    expect(picked).toEqual([STUDENT]);
  });

  it("says so when no Aktif student matches", () => {
    const { markup } = field({ query: "tidak ada" });

    expect(markup).toContain("Tidak ada mahasiswa aktif yang cocok.");
  });

  it('shows the picked student, and "Ganti" picks again', () => {
    const { drawn, markup, picked } = field({ student: STUDENT });

    expect(markup).toContain(
      "<b>Mahasiswa Uji Catat · NIM 8800000002 · Akuntansi uji</b>",
    );
    expect(markup).not.toContain("Cari nama atau NIM");
    press(drawn, "Ganti");

    expect(picked).toEqual([null]);
  });
});
