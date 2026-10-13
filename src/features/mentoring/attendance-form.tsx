"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ATTENDANCE_MARKS,
  type AttendanceMark,
  type MarksByStudent,
} from "@/mentoring/meeting-ids";
import { MEETING_TOPICS } from "@/mentoring/meeting-topics";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sendForm } from "@/ui/send-form";
import { saveAttendanceAction } from "./actions";
import { useAskBeforeLeaving } from "./ask-before-leaving";
import {
  type AttendanceValues,
  allMarked,
  hasUnsavedChanges,
  marksOf,
} from "./attendance-form-values";
import { markField, TOPIC_MAX_LENGTH } from "./attendance-input";
import { countMarks, countWords, MARK_TITLES } from "./attendance-marks";
import type { GroupMember } from "./group-meetings";
import { MemberName } from "./member-name";
import styles from "./mentoring.module.css";

const START: FormState = { error: null, done: null };
const TOPICS_ID = "topik-pertemuan";

function MemberRow({
  member,
  mark,
  onMark,
}: {
  member: GroupMember;
  mark: AttendanceMark | undefined;
  onMark: (studentId: string, mark: AttendanceMark) => void;
}) {
  return (
    <li className={styles.member}>
      <MemberName member={member} />
      <fieldset className={styles.marks}>
        <legend className={shared.hidden}>Kehadiran {member.name}</legend>
        {ATTENDANCE_MARKS.map((each) => (
          <label key={each} className={styles.mark}>
            <input
              type="radio"
              name={markField(member.id)}
              value={each}
              checked={mark === each}
              onChange={() => onMark(member.id, each)}
            />
            {MARK_TITLES[each]}
          </label>
        ))}
      </fieldset>
    </li>
  );
}

function MemberList({
  members,
  marks,
  onMark,
}: {
  members: GroupMember[];
  marks: MarksByStudent;
  onMark: (studentId: string, mark: AttendanceMark) => void;
}) {
  if (members.length === 0) {
    return (
      <p className={styles.quiet}>
        Kelompok ini belum memiliki anak asuh aktif.
      </p>
    );
  }
  return (
    <ul className={styles.members}>
      {members.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
          mark={marks[member.id]}
          onMark={onMark}
        />
      ))}
    </ul>
  );
}

/**
 * The form "Daftar hadir pertemuan": the day, the topic and a mark for
 * each member, with a count that follows the marks. The button is off
 * while a save is on its way, so two presses send once. Leaving with
 * changes that are not saved asks first.
 */
export function AttendanceForm({
  groupId,
  number,
  members,
  start,
  firstDay,
  lastDay,
  closeAddress,
}: {
  groupId: string;
  /** Which meeting of the period the list is of. */
  number: number;
  /** The Aktif members of the group, by name. */
  members: GroupMember[];
  /** What the form opens with. */
  start: AttendanceValues;
  /** The first and the last day "Tanggal" takes. */
  firstDay: string;
  lastDay: string;
  /** The address of the tab without the form. */
  closeAddress: string;
}) {
  const [values, setValues] = useState(start);
  const [kept, setKept] = useState(start);
  const memberIds = members.map((member) => member.id);

  async function send(before: FormState, form: FormData): Promise<FormState> {
    const sent = values;
    const after = await saveAttendanceAction(before, form);
    if (after.done) setKept(sent);
    return after;
  }

  const [state, save, pending] = useActionState(send, START);
  useAskBeforeLeaving(hasUnsavedChanges(kept, values));

  function setMark(studentId: string, mark: AttendanceMark) {
    setValues({ ...values, marks: { ...values.marks, [studentId]: mark } });
  }

  const counts = countMarks(marksOf(values.marks, memberIds));
  return (
    // noValidate: the server says what is missing, in the app's own words.
    <form
      onSubmit={(event) => sendForm(event, save)}
      className={shared.form}
      noValidate
    >
      <div className={`${styles.panelHead} ${styles.whole}`}>
        <h2 className={shared.heading}>Daftar hadir pertemuan {number}</h2>
        <button
          type="button"
          className={shared.link}
          onClick={() =>
            setValues({ ...values, marks: allMarked(memberIds, "present") })
          }
        >
          Tandai semua hadir
        </button>
      </div>
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="number" value={number} />
      <label className={shared.field}>
        Tanggal
        <input
          name="heldOn"
          type="date"
          className={shared.input}
          value={values.heldOn}
          min={firstDay}
          max={lastDay}
          onChange={(event) =>
            setValues({ ...values, heldOn: event.target.value })
          }
        />
      </label>
      <label className={shared.field}>
        Topik
        <input
          name="topic"
          className={shared.input}
          list={TOPICS_ID}
          maxLength={TOPIC_MAX_LENGTH}
          value={values.topic}
          onChange={(event) =>
            setValues({ ...values, topic: event.target.value })
          }
        />
        <datalist id={TOPICS_ID}>
          {MEETING_TOPICS.map((topic) => (
            <option key={topic} value={topic} />
          ))}
        </datalist>
      </label>
      <div className={styles.whole}>
        <MemberList members={members} marks={values.marks} onMark={setMark} />
      </div>
      <div className={shared.actions}>
        <button type="submit" className={shared.button} disabled={pending}>
          Simpan daftar hadir
        </button>
        <Link href={closeAddress} className={shared.quiet} scroll={false}>
          Tutup
        </Link>
        <span className={styles.quiet} role="status">
          {countWords(counts, ", ")}
        </span>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
