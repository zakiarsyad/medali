import { describe, expect, it } from "vitest";
import type { RecordActivity } from "./manual-record";
import {
  chosenActivity,
  EMPTY_RECORD_FORM,
  type RecordForm,
  type RecordFormEvent,
  recordFormAfter,
} from "./record-form-state";

const STUDENT = {
  id: "student-1",
  name: "Mahasiswa Uji Catat",
  nim: "8800000002",
  program: "Akuntansi uji",
};
const OTHER = { ...STUDENT, id: "student-2", name: "Mahasiswa Uji Lain" };
const NEWER: RecordActivity = {
  id: "schedule-2",
  words: "13 Okt 2026 · Latihan uji",
  status: "valid",
};
const OLDER: RecordActivity = {
  id: "schedule-1",
  words: "1 Sep 2026 · Orientasi uji",
  status: null,
};

function formAfter(...events: RecordFormEvent[]): RecordForm {
  return events.reduce(recordFormAfter, EMPTY_RECORD_FORM);
}

const PICKED: RecordFormEvent = { kind: "picked", student: STUDENT };
const LISTED: RecordFormEvent = {
  kind: "listed",
  studentId: STUDENT.id,
  activities: [NEWER, OLDER],
};
const ASKED: RecordFormEvent = {
  kind: "answered",
  answer: {
    state: { error: "Sudah berstatus Hadir.", done: null },
    confirm: "valid",
  },
};

describe("recordFormAfter", () => {
  it("starts at the newest activity of the picked student once they are listed", () => {
    const form = formAfter(PICKED, LISTED);

    expect(form.student).toBe(STUDENT);
    expect(form.scheduleId).toBe("schedule-2");
    expect(chosenActivity(form)).toBe(NEWER);
  });

  it("drops a list that arrives for a student who is no longer the picked one", () => {
    const form = formAfter(PICKED, { kind: "picked", student: OTHER }, LISTED);

    expect(form.activities).toEqual([]);
    expect(form.scheduleId).toBe("");
  });

  it("keeps what the person was asked to agree to for the next Simpan, with the Keterangan as typed", () => {
    const typed: RecordFormEvent = { kind: "typed", note: "Surat nomor 12" };

    const form = formAfter(PICKED, LISTED, typed, ASKED);

    expect(form.agreed).toBe("valid");
    expect(form.note).toBe("Surat nomor 12");
    expect(form.state.error).toBe("Sudah berstatus Hadir.");
  });

  it.each<[string, RecordFormEvent]>([
    ["another activity", { kind: "chose", scheduleId: "schedule-1" }],
    ["another student", { kind: "picked", student: OTHER }],
    ["no student", { kind: "picked", student: null }],
  ])("forgets the agreement when %s is chosen", (_what, event) => {
    expect(formAfter(PICKED, LISTED, ASKED, event).agreed).toBeNull();
  });

  it("keeps the agreement while only the status or the Keterangan changes", () => {
    const form = formAfter(
      PICKED,
      LISTED,
      ASKED,
      { kind: "set-kind", value: "sick" },
      { kind: "typed", note: "Surat dokter" },
    );

    expect(form).toMatchObject({ agreed: "valid", kind: "sick" });
  });

  it("empties the Keterangan after a record is saved, and keeps the student and the activity, also when the list is read again", () => {
    const saved: RecordFormEvent = {
      kind: "answered",
      answer: {
        state: { error: null, done: "Kehadiran Mahasiswa Uji Catat dicatat." },
        confirm: null,
      },
    };
    const chose: RecordFormEvent = { kind: "chose", scheduleId: "schedule-1" };
    const readAgain: RecordFormEvent = {
      kind: "listed",
      studentId: STUDENT.id,
      activities: [NEWER, { ...OLDER, status: "dispensation" }],
    };

    const form = formAfter(
      PICKED,
      LISTED,
      chose,
      { kind: "typed", note: "Surat nomor 12" },
      saved,
      readAgain,
    );

    expect(form).toMatchObject({
      student: STUDENT,
      scheduleId: "schedule-1",
      note: "",
      agreed: null,
    });
    expect(chosenActivity(form)?.status).toBe("dispensation");
    expect(form.state.done).toBe("Kehadiran Mahasiswa Uji Catat dicatat.");
  });
});
