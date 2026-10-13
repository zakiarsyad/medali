"use client";

import { useState } from "react";
import styles from "@/ui/data-screen.module.css";
import { SEARCH_TEXT_MAX } from "@/ui/search-text";
import { useFound } from "@/ui/use-found";
import { searchStudentsAction } from "./actions";
import type { FoundStudent } from "./search-students";

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
  const found = useFound(query, searchStudentsAction);
  return (
    <>
      <label className={styles.field}>
        Cari nama atau NIM
        <input
          type="search"
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          maxLength={SEARCH_TEXT_MAX}
          autoComplete="off"
        />
      </label>
      <Offered query={query} found={found} />
    </>
  );
}
