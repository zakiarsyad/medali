"use client";

import { useEffect, useState } from "react";
import styles from "@/ui/data-screen.module.css";
import { searchStudentsAction } from "./actions";
import type { FoundStudent } from "./search-students";

/** Waits for a pause in the typing, so not every letter asks the server. */
const SEARCH_DELAY_MS = 250;

function useFoundStudents(query: string): FoundStudent[] {
  const [found, setFound] = useState<FoundStudent[]>([]);
  useEffect(() => {
    let isLatest = true;
    const timer = setTimeout(async () => {
      const isBlank = query.trim() === "";
      const students = isBlank ? [] : await searchStudentsAction(query);
      // An answer to an earlier text must not replace a later one.
      if (isLatest) setFound(students);
    }, SEARCH_DELAY_MS);
    return () => {
      isLatest = false;
      clearTimeout(timer);
    };
  }, [query]);
  return found;
}

function Offered({ query, found }: { query: string; found: FoundStudent[] }) {
  if (query.trim() === "") return null;
  if (found.length === 0) {
    return (
      <p className={styles.detail}>
        Tidak ada mahasiswa aktif yang cocok. Mahasiswa yang sudah memegang
        peran BAM diubah lewat "Edit peran".
      </p>
    );
  }
  return (
    <fieldset className={styles.roles}>
      <legend className={styles.label}>Pilih mahasiswa</legend>
      {found.map((student) => (
        <label key={student.accountId} className={styles.role}>
          <input type="radio" name="accountId" value={student.accountId} />
          {student.name} · NIM {student.nim} · {student.studyProgram}
        </label>
      ))}
    </fieldset>
  );
}

/** Finds a student on the server as the person types, and offers a pick. */
export function StudentSearch() {
  const [query, setQuery] = useState("");
  const found = useFoundStudents(query);
  return (
    <>
      <label className={styles.field}>
        Cari nama atau NIM
        <input
          type="search"
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          maxLength={100}
          autoComplete="off"
        />
      </label>
      <Offered query={query} found={found} />
    </>
  );
}
