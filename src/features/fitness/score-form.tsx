"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { isDay } from "@/db/is-day";
import { CategoryBadge } from "@/health-notes/category-badge";
import { categoryOf } from "@/health-notes/fitness-category";
import {
  type FitnessLimits,
  SCORE_MAX,
  SCORE_MIN,
} from "@/health-notes/fitness-ids";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sendForm } from "@/ui/send-form";
import styles from "./fitness.module.css";
import { groupMembersAction, saveScoresAction } from "./fitness-actions";
import type { GroupChoice, GroupMember } from "./fitness-groups";
import {
  DAY_IN_FUTURE,
  SCORE_NOT_WHOLE,
  scoreOf,
  testYearOf,
} from "./fitness-input";
import { readyLine } from "./fitness-words";

const START: FormState = { error: null, done: null };

/** "Skor baru" as typed, by student. */
type Typed = Record<string, string>;

function TypedCategory({
  typed,
  limits,
}: {
  typed: string;
  limits: FitnessLimits;
}) {
  if (typed.trim() === "") return null;
  const score = scoreOf(typed);
  if (score === null)
    return <span className={styles.fault}>{SCORE_NOT_WHOLE}</span>;
  return <CategoryBadge category={categoryOf(score, limits)} />;
}

function MemberRow({
  member,
  typed,
  limits,
  onType,
}: {
  member: GroupMember;
  typed: string;
  limits: FitnessLimits;
  onType: (typed: string) => void;
}) {
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <b className={shared.typed}>{member.name}</b>
        <small className={shared.detail}>{member.nim}</small>
        <input type="hidden" name="student" value={member.id} />
      </td>
      <td data-title="Skor saat ini">{member.latestScore ?? "-"}</td>
      <td data-title="Skor baru">
        <input
          name="score"
          // Not a number box: what is no whole number stays to be read and corrected.
          inputMode="numeric"
          className={`${shared.input} ${styles.numberInput}`}
          value={typed}
          aria-label={`Skor ${member.name}`}
          placeholder={`${SCORE_MIN}–${SCORE_MAX}`}
          onChange={(event) => onType(event.target.value)}
        />
      </td>
      <td data-title="Kategori">
        <TypedCategory typed={typed} limits={limits} />
      </td>
    </tr>
  );
}

export function MemberTable({
  members,
  typed,
  limits,
  onType,
}: {
  members: readonly GroupMember[];
  typed: Typed;
  limits: FitnessLimits;
  onType: (studentId: string, typed: string) => void;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Skor saat ini</th>
            <th>Skor baru</th>
            <th>Kategori</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              typed={typed[member.id] ?? ""}
              limits={limits}
              onType={(text) => onType(member.id, text)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function filledCount(members: readonly GroupMember[], typed: Typed): number {
  return members.filter((member) => (typed[member.id] ?? "").trim() !== "")
    .length;
}

/**
 * The group form of "Input hasil tes kebugaran": a group is picked, and
 * each of its Aktif members shows with "Skor saat ini" and a field
 * "Skor baru", whose category follows the typing. "Tahun tes" is the
 * year of "Tanggal tes" and is never typed; the server works it out
 * again. After a save the fields are emptied, "Skor saat ini" is read
 * again, and the form gets a new key for the next save.
 */
export function ScoreForm({
  groups,
  today,
  limits,
  newKey,
}: {
  groups: readonly GroupChoice[];
  /** Today on campus, where "Tanggal tes" starts. */
  today: string;
  limits: FitnessLimits;
  /** The key of the first save; two presses of "Simpan skor" send the same one. */
  newKey: string;
}) {
  const [key, setKey] = useState(newKey);
  const [groupId, setGroupId] = useState("");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [testedOn, setTestedOn] = useState(today);
  const [typed, setTyped] = useState<Typed>({});
  const [loading, startLoading] = useTransition();
  // The group asked for last: the members of one picked before must not
  // replace those of a later pick that answers sooner.
  const askedGroup = useRef("");

  function loadMembers(id: string) {
    askedGroup.current = id;
    startLoading(async () => {
      const found = await groupMembersAction(id);
      if (askedGroup.current === id) setMembers(found);
    });
  }

  function choose(id: string) {
    setGroupId(id);
    setTyped({});
    setMembers([]);
    askedGroup.current = id;
    if (id === "") return;
    loadMembers(id);
  }

  async function save(before: FormState, sent: FormData): Promise<FormState> {
    const after = await saveScoresAction(before, sent);
    if (after.done) {
      setTyped({});
      setKey(crypto.randomUUID());
      loadMembers(groupId);
    }
    return after;
  }

  const [state, action, pending] = useActionState(save, START);
  const year = isDay(testedOn) ? String(testYearOf(testedOn)) : "";
  const isFuture = isDay(testedOn) && testedOn > today;

  return (
    // noValidate: the server says what is wrong, in the app's own words.
    <form onSubmit={(event) => sendForm(event, action)} noValidate>
      <input type="hidden" name="id" value={key} />
      <div className={shared.form}>
        <label className={`${shared.field} ${styles.full}`}>
          Kelompok mahasiswa
          <select
            name="groupId"
            className={shared.input}
            value={groupId}
            onChange={(event) => choose(event.target.value)}
          >
            <option value="">Pilih kelompok pengasuhan…</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.code} ({group.members})
              </option>
            ))}
          </select>
        </label>
        <label className={shared.field}>
          Tanggal tes
          <input
            type="date"
            name="testedOn"
            className={shared.input}
            value={testedOn}
            max={today}
            onChange={(event) => setTestedOn(event.target.value)}
          />
          {isFuture && <span className={styles.fault}>{DAY_IN_FUTURE}</span>}
        </label>
        <label className={shared.field}>
          Tahun tes
          <input className={shared.input} value={year} readOnly tabIndex={-1} />
        </label>
      </div>
      {groupId === "" && (
        <p className={styles.note}>
          Pilih kelompok untuk mengisi skor seluruh anggotanya sekaligus.
        </p>
      )}
      {groupId !== "" && loading && members.length === 0 && (
        <p className={styles.note}>Memuat anggota kelompok…</p>
      )}
      {members.length > 0 && (
        <>
          <MemberTable
            members={members}
            typed={typed}
            limits={limits}
            onType={(studentId, text) =>
              setTyped((before) => ({ ...before, [studentId]: text }))
            }
          />
          <div className={styles.saveRow}>
            <button type="submit" className={shared.button} disabled={pending}>
              Simpan skor
            </button>
            <span className={styles.ready}>
              {readyLine(filledCount(members, typed))}
            </span>
          </div>
        </>
      )}
      <FormMessage state={state} />
    </form>
  );
}
