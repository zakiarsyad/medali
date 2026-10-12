"use client";

import {
  type FormEvent,
  startTransition,
  useActionState,
  useState,
} from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import type { Term } from "./academic-period";
import { addPeriodAction } from "./actions";
import { parseStartYear } from "./period-input";
import { academicYear, TERM_LABELS } from "./period-labels";
import { suggestedStart } from "./suggested-start";

const START: FormState = { error: null, done: null };

export function AddPeriodForm({
  startYear,
}: {
  /** The first year of the Tahun akademik the form opens with. */
  startYear: number;
}) {
  const [state, save, pending] = useActionState(addPeriodAction, START);
  const [year, setYear] = useState(academicYear(startYear));
  const [term, setTerm] = useState<Term>("odd");
  const [startsOn, setStartsOn] = useState(suggestedStart(startYear, "odd"));

  function suggestStart(typedYear: string, chosenTerm: Term) {
    const first = parseStartYear(typedYear);
    if (first !== null) setStartsOn(suggestedStart(first, chosenTerm));
  }

  function changeYear(typed: string) {
    setYear(typed);
    suggestStart(typed, term);
  }

  function changeTerm(chosen: string) {
    const next: Term = chosen === "even" ? "even" : "odd";
    setTerm(next);
    suggestStart(year, next);
  }

  // Sent from here, not by the browser: the browser empties a sent form,
  // and a refused date must stay to be corrected.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => save(form));
  }

  return (
    <details className={shared.panel}>
      <summary className={shared.button}>Tambah periode</summary>
      {/* noValidate: a wrong year or date gets the app's own message. */}
      <form onSubmit={send} className={shared.form} noValidate>
        <h2 className={shared.heading}>Periode baru</h2>
        <label className={shared.field}>
          Tahun akademik
          <input
            name="year"
            className={shared.input}
            placeholder="2026/2027"
            value={year}
            onChange={(event) => changeYear(event.target.value)}
          />
        </label>
        <label className={shared.field}>
          Ganjil atau Genap
          <select
            name="term"
            className={shared.input}
            value={term}
            onChange={(event) => changeTerm(event.target.value)}
          >
            <option value="odd">{TERM_LABELS.odd}</option>
            <option value="even">{TERM_LABELS.even}</option>
          </select>
        </label>
        <label className={shared.field}>
          Mulai
          <input
            name="startsOn"
            type="date"
            className={shared.input}
            value={startsOn}
            onChange={(event) => setStartsOn(event.target.value)}
          />
        </label>
        <label className={shared.field}>
          Selesai
          <input name="endsOn" type="date" className={shared.input} />
        </label>
        <FormMessage state={state} />
        <div className={shared.actions}>
          <button type="submit" className={shared.button} disabled={pending}>
            Simpan periode
          </button>
        </div>
      </form>
    </details>
  );
}
