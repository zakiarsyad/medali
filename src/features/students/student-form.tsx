"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useActionState, useState } from "react";
import type { StudyProgram } from "@/db/study-programs";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import { addStudentAction, changeStudentAction } from "./actions";
import { ORIGIN_AGENCIES, PROVINCES } from "./fixed-lists";
import {
  formShows,
  formValues,
  START,
  type StudentFormState,
} from "./form-values";
import {
  CLASS_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NIM_LENGTH,
} from "./input-limits";
import {
  CATEGORIES,
  ENTRY_PATH_LABELS,
  SEX_LABELS,
  STATUS_LABELS,
} from "./labels";
import { newStudentsAddress } from "./new-students-address";
import { SelectField } from "./select-field";
import type { StudentInput } from "./student-input";
import { useNotify } from "./student-notice";

function sameAsShown(values: readonly (string | number)[]) {
  return values.map((value) => [String(value), String(value)] as const);
}

function Categories({ chosen }: { chosen: string[] }) {
  return (
    <fieldset className={shared.roles}>
      <legend className={shared.label}>Kategori</legend>
      {CATEGORIES.map(({ field, label }) => (
        <label key={field} className={shared.role}>
          <input
            type="checkbox"
            name="categories"
            value={field}
            defaultChecked={chosen.includes(field)}
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}

function NimField({ nim, locked }: { nim: string; locked: boolean }) {
  if (locked) {
    return (
      <label className={shared.field}>
        NIM
        <input type="hidden" name="nim" value={nim} />
        <input className={shared.input} value={nim} disabled />
      </label>
    );
  }
  return (
    <label className={shared.field}>
      NIM
      <input
        name="nim"
        className={shared.input}
        inputMode="numeric"
        pattern={`\\d{${NIM_LENGTH}}`}
        maxLength={NIM_LENGTH}
        placeholder={`${NIM_LENGTH} digit`}
        title={`${NIM_LENGTH} digit angka`}
        defaultValue={nim}
        required
      />
    </label>
  );
}

export interface StudentFormProps {
  programs: StudyProgram[];
  /** The Angkatan choices, the newest first. */
  cohortYears: number[];
  /** The student being changed, or null to add a new one. */
  editing: StudentInput | null;
  /** The search of the list, kept when the form is left. */
  query: string;
}

export function StudentForm({
  programs,
  cohortYears,
  editing,
  query,
}: StudentFormProps) {
  const router = useRouter();
  const notify = useNotify();
  const start = formValues(editing, {
    studyProgramId: String(programs[0]?.id ?? ""),
    cohortYear: String(cohortYears[0] ?? ""),
  });
  const [entryPath, setEntryPath] = useState(start.entryPath);

  async function send(
    before: StudentFormState,
    form: FormData,
  ): Promise<StudentFormState> {
    notify(null);
    const save = editing ? changeStudentAction : addStudentAction;
    const after = await save(before, form);
    // The browser puts a sent form back on its first choices; this keeps
    // Instansi asal in step with the Jalur the form then shows.
    setEntryPath(formShows(after, start).entryPath);
    if (after.done && editing) {
      const list = newStudentsAddress(query);
      notify(after.done, list);
      router.replace(list);
    } else if (after.done) {
      notify(after.done);
    }
    return after;
  }

  const [state, action, pending] = useActionState(send, START);
  const shown = formShows(state, start);
  return (
    <form action={action} className={shared.form}>
      {/* Drawn anew each time the form is sent: the browser empties a
          sent form, and this fills it again with what `shown` holds. */}
      <Fragment key={state.attempt}>
        <NimField nim={shown.nim} locked={editing !== null} />
        <label className={shared.field}>
          Nama lengkap
          <input
            name="name"
            className={shared.input}
            minLength={NAME_MIN_LENGTH}
            maxLength={NAME_MAX_LENGTH}
            defaultValue={shown.name}
            required
          />
        </label>
        <label className={shared.field}>
          Email kampus (opsional)
          {/* A plain text field: the server words what is wrong with an
              address, where the browser would word it its own way. */}
          <input
            name="email"
            className={shared.input}
            inputMode="email"
            autoComplete="off"
            maxLength={EMAIL_MAX_LENGTH}
            defaultValue={shown.email}
          />
        </label>
        <SelectField
          label="Program studi"
          name="studyProgramId"
          choices={programs.map(({ id, name }) => [String(id), name] as const)}
          chosen={shown.studyProgramId}
        />
        <SelectField
          label="Jalur"
          name="entryPath"
          choices={Object.entries(ENTRY_PATH_LABELS)}
          chosen={entryPath}
          onChoose={setEntryPath}
        />
        <SelectField
          label="Jenis kelamin"
          name="sex"
          choices={Object.entries(SEX_LABELS)}
          chosen={shown.sex}
        />
        <SelectField
          label="Angkatan"
          name="cohortYear"
          choices={sameAsShown(cohortYears)}
          chosen={shown.cohortYear}
        />
        <label className={shared.field}>
          Kelas akademik (opsional)
          <input
            name="className"
            className={shared.input}
            maxLength={CLASS_MAX_LENGTH}
            defaultValue={shown.className}
            placeholder="Misalnya 1-01"
          />
        </label>
        <SelectField
          label="Provinsi domisili"
          name="province"
          choices={[["", "Tidak diketahui"], ...sameAsShown(PROVINCES)]}
          chosen={shown.province}
        />
        {entryPath === "transfer" && (
          <SelectField
            label="Instansi asal (alih program)"
            name="originAgency"
            choices={[["", "-"], ...sameAsShown(ORIGIN_AGENCIES)]}
            chosen={shown.originAgency}
          />
        )}
        <SelectField
          label="Status"
          name="status"
          choices={Object.entries(STATUS_LABELS)}
          chosen={shown.status}
        />
        <Categories chosen={shown.categories} />
      </Fragment>
      {state.error && <FormMessage state={state} />}
      <div className={shared.actions}>
        <button type="submit" className={shared.button} disabled={pending}>
          {editing ? "Simpan perubahan" : "Tambah mahasiswa"}
        </button>
        {editing && (
          <Link href={newStudentsAddress(query)} className={shared.quiet}>
            Batal
          </Link>
        )}
      </div>
    </form>
  );
}
