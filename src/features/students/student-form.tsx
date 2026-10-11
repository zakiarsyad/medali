"use client";

import { useActionState, useState } from "react";
import type { StudyProgram } from "@/db/study-programs";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { addStudentAction } from "./actions";
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
import { SelectField } from "./select-field";

const START: FormState = { error: null, done: null };

function sameAsShown(values: readonly (string | number)[]) {
  return values.map((value) => [String(value), String(value)] as const);
}

function Categories() {
  return (
    <fieldset className={shared.roles}>
      <legend className={shared.label}>Kategori</legend>
      {CATEGORIES.map(({ field, label }) => (
        <label key={field} className={shared.role}>
          <input type="checkbox" name="categories" value={field} />
          {label}
        </label>
      ))}
    </fieldset>
  );
}

interface StudentFormProps {
  programs: StudyProgram[];
  /** The Angkatan choices, the newest first. */
  cohortYears: number[];
}

export function StudentForm({ programs, cohortYears }: StudentFormProps) {
  const [state, action, pending] = useActionState(addStudentAction, START);
  const [entryPath, setEntryPath] = useState("regular");
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Input data mahasiswa</h2>
      <p className={shared.detail}>Satu per satu lewat formulir.</p>
      <form action={action} className={shared.form}>
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
        <label className={shared.field}>
          Nama lengkap
          <input
            name="name"
            className={shared.input}
            minLength={NAME_MIN_LENGTH}
            maxLength={NAME_MAX_LENGTH}
            required
          />
        </label>
        <SelectField
          label="Program studi"
          name="studyProgramId"
          choices={programs.map(({ id, name }) => [String(id), name] as const)}
          chosen={String(programs[0]?.id ?? "")}
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
          chosen="male"
        />
        <SelectField
          label="Angkatan"
          name="cohortYear"
          choices={sameAsShown(cohortYears)}
          chosen={String(cohortYears[0] ?? "")}
        />
        <label className={shared.field}>
          Kelas akademik (opsional)
          <input
            name="className"
            className={shared.input}
            maxLength={CLASS_MAX_LENGTH}
            placeholder="Misalnya 1-01"
          />
        </label>
        <SelectField
          label="Provinsi domisili"
          name="province"
          choices={[["", "Tidak diketahui"], ...sameAsShown(PROVINCES)]}
          chosen=""
        />
        {entryPath === "transfer" && (
          <SelectField
            label="Instansi asal (alih program)"
            name="originAgency"
            choices={[["", "-"], ...sameAsShown(ORIGIN_AGENCIES)]}
            chosen=""
          />
        )}
        <SelectField
          label="Status"
          name="status"
          choices={Object.entries(STATUS_LABELS)}
          chosen="active"
        />
        <Categories />
        <FormMessage state={state} />
        <div className={shared.actions}>
          <button type="submit" className={shared.button} disabled={pending}>
            Tambah mahasiswa
          </button>
        </div>
      </form>
    </section>
  );
}
