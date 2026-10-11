"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { StudyProgram } from "@/db/study-programs";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { addStudentAction, changeStudentAction } from "./actions";
import { ORIGIN_AGENCIES, PROVINCES } from "./fixed-lists";
import {
  CLASS_MAX_LENGTH,
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
import { FORM_ANCHOR, newStudentsAddress } from "./new-students-address";
import { SelectField } from "./select-field";
import type { StudentInput } from "./student-input";

const START: FormState = { error: null, done: null };

function sameAsShown(values: readonly (string | number)[]) {
  return values.map((value) => [String(value), String(value)] as const);
}

function Categories({ editing }: { editing: StudentInput | null }) {
  return (
    <fieldset className={shared.roles}>
      <legend className={shared.label}>Kategori</legend>
      {CATEGORIES.map(({ field, label }) => (
        <label key={field} className={shared.role}>
          <input
            type="checkbox"
            name="categories"
            value={field}
            defaultChecked={editing?.[field] ?? false}
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}

function NimField({ editing }: { editing: StudentInput | null }) {
  if (editing) {
    return (
      <label className={shared.field}>
        NIM
        <input type="hidden" name="nim" value={editing.nim} />
        <input className={shared.input} value={editing.nim} disabled />
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
        required
      />
    </label>
  );
}

interface StudentFormProps {
  programs: StudyProgram[];
  /** The Angkatan choices, the newest first. */
  cohortYears: number[];
  /** The student being changed, or null to add a new one. */
  editing: StudentInput | null;
  /** The search of the list, kept when the form is sent or left. */
  query: string;
}

export function StudentForm({
  programs,
  cohortYears,
  editing,
  query,
}: StudentFormProps) {
  const [state, action, pending] = useActionState(
    editing ? changeStudentAction : addStudentAction,
    START,
  );
  const [entryPath, setEntryPath] = useState<string>(
    editing?.entryPath ?? "regular",
  );
  return (
    <section className={shared.panel} id={FORM_ANCHOR}>
      <h2 className={shared.heading}>
        {editing ? "Ubah data mahasiswa" : "Input data mahasiswa"}
      </h2>
      <p className={shared.detail}>
        {editing ? `NIM ${editing.nim}` : "Satu per satu lewat formulir."}
      </p>
      <form action={action} className={shared.form}>
        <input type="hidden" name="q" value={query} />
        <NimField editing={editing} />
        <label className={shared.field}>
          Nama lengkap
          <input
            name="name"
            className={shared.input}
            minLength={NAME_MIN_LENGTH}
            maxLength={NAME_MAX_LENGTH}
            defaultValue={editing?.name}
            required
          />
        </label>
        <SelectField
          label="Program studi"
          name="studyProgramId"
          choices={programs.map(({ id, name }) => [String(id), name] as const)}
          chosen={String(editing?.studyProgramId ?? programs[0]?.id ?? "")}
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
          chosen={editing?.sex ?? "male"}
        />
        <SelectField
          label="Angkatan"
          name="cohortYear"
          choices={sameAsShown(cohortYears)}
          chosen={String(editing?.cohortYear ?? cohortYears[0] ?? "")}
        />
        <label className={shared.field}>
          Kelas akademik (opsional)
          <input
            name="className"
            className={shared.input}
            maxLength={CLASS_MAX_LENGTH}
            defaultValue={editing?.className ?? ""}
            placeholder="Misalnya 1-01"
          />
        </label>
        <SelectField
          label="Provinsi domisili"
          name="province"
          choices={[["", "Tidak diketahui"], ...sameAsShown(PROVINCES)]}
          chosen={editing?.province ?? ""}
        />
        {entryPath === "transfer" && (
          <SelectField
            label="Instansi asal (alih program)"
            name="originAgency"
            choices={[["", "-"], ...sameAsShown(ORIGIN_AGENCIES)]}
            chosen={editing?.originAgency ?? ""}
          />
        )}
        <SelectField
          label="Status"
          name="status"
          choices={Object.entries(STATUS_LABELS)}
          chosen={editing?.status ?? "active"}
        />
        <Categories editing={editing} />
        <FormMessage state={state} />
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
    </section>
  );
}
