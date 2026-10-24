"use client";

import {
  type FormEvent,
  startTransition,
  useActionState,
  useState,
} from "react";
import type { ScoreIndicator } from "@/mentoring/score-indicators";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { saveIndicatorsAction } from "./indicator-actions";
import {
  INDICATORS_VERSION_FIELD,
  type IndicatorFault,
  indicatorFaults,
  maySaveIndicators,
  nameField,
  sentenceField,
} from "./indicator-input";
import { IndicatorFrame } from "./indicator-panel";
import type { IndicatorsInForce } from "./indicator-set";
import styles from "./mentoring.module.css";

const START: FormState = { error: null, done: null };

/** Takes the indicators as typed after each change. */
type OnType = (typed: ScoreIndicator[]) => void;

function Fault({ fault }: { fault: string | undefined }) {
  if (!fault) return null;
  return <span className={styles.boxFault}>{fault}</span>;
}

/** The name and the sentence of one indicator, each with what is wrong with it. */
function IndicatorBoxes({
  place,
  typed,
  fault,
  onType,
}: {
  place: number;
  typed: ScoreIndicator[];
  fault: IndicatorFault;
  onType: OnType;
}) {
  const indicator = typed[place];
  if (!indicator) return null;
  const type = (change: Partial<ScoreIndicator>) =>
    onType(
      typed.map((each, at) => (at === place ? { ...each, ...change } : each)),
    );
  return (
    <li className={styles.indicator}>
      <label className={shared.field}>
        Nama indikator {place + 1}
        <input
          name={nameField(place)}
          className={shared.input}
          value={indicator.name}
          aria-invalid={Boolean(fault.name) || undefined}
          onChange={(event) => type({ name: event.target.value })}
        />
        <Fault fault={fault.name} />
      </label>
      <label className={shared.field}>
        Kalimat indikator {place + 1}
        <textarea
          name={sentenceField(place)}
          className={shared.input}
          rows={2}
          value={indicator.sentence}
          aria-invalid={Boolean(fault.sentence) || undefined}
          onChange={(event) => type({ sentence: event.target.value })}
        />
        <Fault fault={fault.sentence} />
      </label>
    </li>
  );
}

/**
 * "Indikator penilaian" for Kepala Unit: a box for the name and for the
 * sentence of each of the six, each saying at once what is wrong with
 * it, and "Simpan indikator", which is off while anything typed cannot
 * be saved and while a save is on its way.
 */
export function IndicatorForm({ inForce }: { inForce: IndicatorsInForce }) {
  const [typed, setTyped] = useState(() =>
    inForce.indicators.map((indicator) => ({ ...indicator })),
  );
  const [state, save, pending] = useActionState(saveIndicatorsAction, START);
  const faults = indicatorFaults(typed);

  // Sent from here, not by the browser: the browser would empty the
  // fields of a sent form, and refused indicators must stay to be corrected.
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => save(form));
  }

  return (
    // noValidate: the server says what is wrong, in the app's own words.
    <form onSubmit={send} noValidate>
      <IndicatorFrame
        set={inForce.set}
        end={
          <div className={styles.saveIndicators}>
            <button
              type="submit"
              className={shared.button}
              disabled={!maySaveIndicators(typed) || pending}
            >
              Simpan indikator
            </button>
            <FormMessage state={state} />
          </div>
        }
      >
        <input
          type="hidden"
          name={INDICATORS_VERSION_FIELD}
          value={inForce.version}
        />
        <ol className={styles.indicators}>
          {typed.map((_, place) => (
            <IndicatorBoxes
              // biome-ignore lint/suspicious/noArrayIndexKey: the six never change places, and a name being typed may equal another, so the place is all that tells them apart.
              key={place}
              place={place}
              typed={typed}
              fault={faults[place] ?? {}}
              onType={setTyped}
            />
          ))}
        </ol>
      </IndicatorFrame>
    </form>
  );
}
