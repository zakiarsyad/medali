"use client";

import {
  type KeyboardEvent,
  useActionState,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  CATEGORY_WORDS,
  LEVEL_WORDS,
  PENALTY_CATEGORIES,
  PENALTY_LEVELS,
  type PenaltyCategory,
  type PenaltyLevel,
} from "@/discipline-penalties/penalty-kinds";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { FormMessage, type FormState } from "@/ui/form-message";
import { SEARCH_TEXT_MAX } from "@/ui/search-text";
import { sendForm } from "@/ui/send-form";
import { useFound } from "@/ui/use-found";
import { startChange } from "./asked-start";
import styles from "./discipline-penalties.module.css";
import {
  penaltyHistoryAction,
  saveDisciplinePenaltyAction,
  searchPenaltyStudentsAction,
} from "./penalty-actions";
import { PenaltyConsequence } from "./penalty-consequence";
import type { PenaltyHistory } from "./penalty-consequences";
import {
  DECISION_NUMBER_MAX_LENGTH,
  OTHER_SOCIAL_WORK_MAX_LENGTH,
  PENALTY_DESCRIPTION_MAX_LENGTH,
  SOCIAL_WORK_FORMS,
  SOCIAL_WORK_PLACES,
  type SocialWorkForm,
  type SocialWorkPlace,
} from "./penalty-ids";
import { CONFIRMED } from "./penalty-input";
import { type PenaltyRule, ruleOf, socialWorkEnd } from "./penalty-rules";
import type { PeriodOfDay } from "./penalty-semester";
import type { PenaltyPick, PenaltyStart } from "./penalty-student";
import {
  lengthWords,
  SOCIAL_WORK_FORM_WORDS,
  SOCIAL_WORK_PLACE_WORDS,
} from "./penalty-words";
import notes from "./violation-notes.module.css";

const START: FormState = { error: null, done: null };

export const NOBODY_FOUND = "Tidak ada mahasiswa aktif yang cocok.";
export const CONFIRMATION_WORDS =
  "Saya memahami hukuman ini memberhentikan mahasiswa secara permanen dan memerlukan Keputusan Direktur.";
export const AGENCY_ONLY = " (khusus mahasiswa dengan instansi asal)";

/**
 * The search box sits inside the form, where Enter would send the whole
 * penalty while the person only means to search.
 */
function keepFormOnEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") event.preventDefault();
}

function pickWords(pick: PenaltyPick): string {
  return `${pick.name} · NIM ${pick.nim} · ${pick.program}`;
}

function Found({
  query,
  onPick,
}: {
  query: string;
  onPick: (pick: PenaltyPick) => void;
}) {
  const found = useFound(query, searchPenaltyStudentsAction);
  if (query.trim() === "") return null;
  if (found.length === 0) {
    return <p className={shared.detail}>{NOBODY_FOUND}</p>;
  }
  return (
    <div className={notes.found}>
      {found.map((pick) => (
        <button
          key={pick.id}
          type="button"
          className={shared.quiet}
          onClick={() => onPick(pick)}
        >
          {pickWords(pick)}
        </button>
      ))}
    </div>
  );
}

/**
 * "Mahasiswa": a name or a NIM is typed, the server offers the Aktif
 * students, and one is picked. The one picked stays until "Ganti".
 */
function StudentPicker({
  picked,
  onPick,
}: {
  picked: PenaltyPick | null;
  onPick: (pick: PenaltyPick | null) => void;
}) {
  const [query, setQuery] = useState("");
  if (picked !== null) {
    return (
      <div className={shared.actions}>
        <b className={notes.picked}>{pickWords(picked)}</b>
        <button
          type="button"
          className={shared.link}
          onClick={() => onPick(null)}
        >
          Ganti
        </button>
      </div>
    );
  }
  return (
    <div>
      <input
        type="search"
        className={shared.input}
        aria-label="Cari mahasiswa"
        placeholder="Ketik nama atau NIM mahasiswa"
        value={query}
        maxLength={SEARCH_TEXT_MAX}
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={keepFormOnEnter}
      />
      <Found
        query={query}
        onPick={(pick) => {
          setQuery("");
          onPick(pick);
        }}
      />
    </div>
  );
}

/** "Kategori hukuman disiplin": Ringan, Sedang or Berat. */
function CategoryChoice({
  category,
  onChoose,
}: {
  category: PenaltyCategory;
  onChoose: (category: PenaltyCategory) => void;
}) {
  return (
    <fieldset className={`${styles.choices} ${notes.full}`}>
      <legend className={shared.label}>Kategori hukuman disiplin</legend>
      {PENALTY_CATEGORIES.map((each) => (
        <label key={each} className={styles.choice}>
          <input
            type="radio"
            name="category"
            value={each}
            checked={each === category}
            onChange={() => onChoose(each)}
          />
          {CATEGORY_WORDS[each]}
        </label>
      ))}
    </fieldset>
  );
}

function levelHint(rule: PenaltyRule): string {
  if (rule.socialWork === null) return rule.penalty;
  return `${rule.penalty}; kerja sosial ${lengthWords(rule.socialWork)}`;
}

/** "Jenjang": the three of the Kategori, each with its penalty. */
function LevelChoice({
  category,
  level,
  onChoose,
}: {
  category: PenaltyCategory;
  level: PenaltyLevel;
  onChoose: (level: PenaltyLevel) => void;
}) {
  return (
    <fieldset className={`${styles.choices} ${notes.full}`}>
      <legend className={shared.label}>Jenjang</legend>
      {PENALTY_LEVELS.map((each) => (
        <label key={each} className={styles.choice}>
          <input
            type="radio"
            name="level"
            value={String(each)}
            checked={each === level}
            onChange={() => onChoose(each)}
          />
          <span>
            <b>Jenjang {LEVEL_WORDS[each]}</b>
            <small className={shared.detail}>
              {levelHint(ruleOf(category, each))}
            </small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/** What the kerja sosial part asks, as the person fills it. */
export interface SocialWorkChoice {
  forms: SocialWorkForm[];
  other: string;
  place: SocialWorkPlace;
  start: string;
}

/**
 * The kerja sosial part of a Jenjang that carries it: Bentuk, with a text
 * for "lainnya", Lokasi, Mulai, and the day it ends. The Instansi asal is
 * offered only for a student who has one.
 */
function SocialWorkPart({
  rule,
  choice,
  day,
  hasAgency,
  onChange,
}: {
  rule: PenaltyRule;
  choice: SocialWorkChoice;
  day: string;
  hasAgency: boolean;
  onChange: (choice: SocialWorkChoice) => void;
}) {
  const length = rule.socialWork;
  if (length === null) return null;
  function toggle(form: SocialWorkForm) {
    const forms = choice.forms.includes(form)
      ? choice.forms.filter((each) => each !== form)
      : [...choice.forms, form];
    onChange({ ...choice, forms });
  }
  return (
    <>
      <fieldset className={`${styles.choices} ${notes.full}`}>
        <legend className={shared.label}>Bentuk kerja sosial</legend>
        {SOCIAL_WORK_FORMS.map((form) => (
          <label key={form} className={styles.choice}>
            <input
              type="checkbox"
              name="socialWorkForms"
              value={form}
              checked={choice.forms.includes(form)}
              onChange={() => toggle(form)}
            />
            {SOCIAL_WORK_FORM_WORDS[form]}
          </label>
        ))}
      </fieldset>
      {choice.forms.includes("other") && (
        <label className={`${shared.field} ${notes.field} ${notes.full}`}>
          Bentuk kerja sosial lainnya
          <input
            name="socialWorkOther"
            className={shared.input}
            placeholder="Sebutkan bentuk kerja sosial lainnya"
            maxLength={OTHER_SOCIAL_WORK_MAX_LENGTH}
            value={choice.other}
            onChange={(event) =>
              onChange({ ...choice, other: event.target.value })
            }
            onKeyDown={keepFormOnEnter}
          />
        </label>
      )}
      <label className={`${shared.field} ${notes.field} ${notes.full}`}>
        Lokasi kerja sosial
        <select
          name="socialWorkPlace"
          className={shared.input}
          value={choice.place}
          onChange={(event) => {
            const place = SOCIAL_WORK_PLACES.find(
              (each) => each === event.target.value,
            );
            if (place) onChange({ ...choice, place });
          }}
        >
          {SOCIAL_WORK_PLACES.map((place) => {
            const closed = place === "home_agency" && !hasAgency;
            return (
              <option key={place} value={place} disabled={closed}>
                {SOCIAL_WORK_PLACE_WORDS[place]}
                {closed ? AGENCY_ONLY : ""}
              </option>
            );
          })}
        </select>
      </label>
      <label className={`${shared.field} ${notes.field}`}>
        Mulai kerja sosial
        <input
          name="socialWorkStart"
          type="date"
          min={day}
          className={shared.input}
          value={choice.start}
          onChange={(event) =>
            onChange({ ...choice, start: event.target.value })
          }
        />
      </label>
      <p className={`${shared.detail} ${notes.full}`}>
        {choice.start === ""
          ? "Isi tanggal mulai untuk melihat kapan kerja sosial selesai."
          : `Selesai pada ${shownDay(socialWorkEnd(choice.start, length))}.`}
      </p>
    </>
  );
}

/** The kerja sosial choices a new penalty starts with. */
function freshSocialWork(today: string): SocialWorkChoice {
  return { forms: [], other: "", place: "campus", start: today };
}

/**
 * "Catat pelanggaran": Mahasiswa, Tanggal pelanggaran, Nomor keputusan,
 * Uraian pelanggaran, Kategori and Jenjang, the kerja sosial part when
 * the Jenjang carries it, and the tick for a penalty that ends the
 * status. Who recorded it is the signed-in account. After a save the
 * student and the kerja sosial choices are cleared, so the next penalty
 * does not reuse them by mistake, and the form gets a new key.
 */
export function PenaltyForm({
  newKey,
  today,
  periods,
  start,
}: {
  /** The key of the first save; two presses of "Simpan pelanggaran" send the same one. */
  newKey: string;
  today: string;
  /** The academic periods, for the semester of a suspension. */
  periods: PeriodOfDay[];
  /**
   * The student the address asks the form to pick, from "Hukuman ringan"
   * or "Catat pelanggaran"; null for none.
   */
  start: PenaltyStart | null;
}) {
  const [key, setKey] = useState(newKey);
  const [picked, setPicked] = useState<PenaltyPick | null>(start?.pick ?? null);
  const [day, setDay] = useState(today);
  const [decisionNumber, setDecisionNumber] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PenaltyCategory>("light");
  const [level, setLevel] = useState<PenaltyLevel>(1);
  const [work, setWork] = useState(freshSocialWork(today));
  const [confirmed, setConfirmed] = useState(false);
  const [history, setHistory] = useState<PenaltyHistory | null>(
    start?.history ?? null,
  );
  const [, startLoading] = useTransition();
  // The student asked for last: the history of one picked before must
  // not replace that of a later pick that answers sooner.
  const asked = useRef(start?.pick.id ?? "");
  const [takenId, setTakenId] = useState<string | null>(start?.pick.id ?? null);
  const rule = ruleOf(category, level);

  // The page keeps this form when its address asks for another student.
  const change = startChange(start, takenId);
  if (change.remember !== takenId) setTakenId(change.remember);
  if (change.take !== null) takeStart(change.take);

  function takeStart(started: PenaltyStart) {
    setPicked(started.pick);
    setHistory(started.history);
    if (work.place === "home_agency" && !started.pick.hasAgency) {
      setWork({ ...work, place: "campus" });
    }
    asked.current = started.pick.id;
  }

  function pick(student: PenaltyPick | null) {
    setPicked(student);
    setHistory(null);
    if (work.place === "home_agency" && !student?.hasAgency) {
      setWork({ ...work, place: "campus" });
    }
    asked.current = student?.id ?? "";
    if (student === null) return;
    startLoading(async () => {
      const found = await penaltyHistoryAction(student.id);
      if (asked.current === student.id) setHistory(found);
    });
  }

  async function save(before: FormState, sent: FormData): Promise<FormState> {
    const after = await saveDisciplinePenaltyAction(before, sent);
    if (after.done) {
      setKey(crypto.randomUUID());
      pick(null);
      setDecisionNumber("");
      setDescription("");
      setWork(freshSocialWork(today));
      setConfirmed(false);
    }
    return after;
  }

  const [state, action, pending] = useActionState(save, START);

  return (
    <div className={notes.parts}>
      {/* noValidate: the server says what is wrong, in the app's own words. */}
      <form
        className={shared.panel}
        onSubmit={(event) => sendForm(event, action)}
        noValidate
      >
        <h2 className={shared.heading}>Catat pelanggaran</h2>
        <input type="hidden" name="id" value={key} />
        <input type="hidden" name="studentId" value={picked?.id ?? ""} />
        <div className={shared.form}>
          <div className={`${shared.field} ${notes.field} ${notes.full}`}>
            <span className={shared.label}>Mahasiswa</span>
            <StudentPicker picked={picked} onPick={pick} />
          </div>
          <label className={`${shared.field} ${notes.field}`}>
            Tanggal pelanggaran
            <input
              name="day"
              type="date"
              max={today}
              className={shared.input}
              value={day}
              onChange={(event) => setDay(event.target.value)}
            />
          </label>
          <label className={`${shared.field} ${notes.field}`}>
            Nomor keputusan
            <input
              name="decisionNumber"
              className={shared.input}
              placeholder="Opsional"
              maxLength={DECISION_NUMBER_MAX_LENGTH}
              value={decisionNumber}
              onChange={(event) => setDecisionNumber(event.target.value)}
              onKeyDown={keepFormOnEnter}
            />
          </label>
          <label className={`${shared.field} ${notes.field} ${notes.full}`}>
            Uraian pelanggaran
            <textarea
              name="description"
              rows={3}
              className={shared.input}
              placeholder="Apa yang dilakukan, kapan, dan di mana"
              maxLength={PENALTY_DESCRIPTION_MAX_LENGTH}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <CategoryChoice
            category={category}
            onChoose={(chosen) => {
              setCategory(chosen);
              setLevel(1);
              setConfirmed(false);
            }}
          />
          <LevelChoice
            category={category}
            level={level}
            onChoose={(chosen) => {
              setLevel(chosen);
              setConfirmed(false);
            }}
          />
          <SocialWorkPart
            rule={rule}
            choice={work}
            day={day}
            hasAgency={picked?.hasAgency ?? false}
            onChange={setWork}
          />
          {rule.outcome === "dismissed" && (
            <label className={`${styles.choice} ${notes.full}`}>
              <input
                type="checkbox"
                name="confirmed"
                value={CONFIRMED}
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              {CONFIRMATION_WORDS}
            </label>
          )}
          <div className={`${shared.actions} ${notes.full}`}>
            <button type="submit" className={shared.button} disabled={pending}>
              Simpan pelanggaran
            </button>
          </div>
          <div className={notes.full}>
            <FormMessage state={state} />
          </div>
        </div>
      </form>
      <PenaltyConsequence
        choice={{
          category,
          level,
          start: work.start,
          day,
          cohortYear: picked?.cohortYear ?? null,
          periods,
        }}
        isPicked={picked !== null}
        history={history}
      />
    </div>
  );
}
