import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import type { NoteRow } from "./note-board";
import { penaltyFormAddress } from "./penalty-address";

/**
 * "Hukuman ringan" on a Pelanggaran lanjutan still in force: opens
 * "Catat pelanggaran" on Pelanggaran disiplin with its student picked.
 * Nothing on any other note.
 */
export function LightPenaltyLink({ row }: { row: NoteRow }) {
  if (row.category !== "further" || !row.isActive) return null;
  return (
    <Link href={penaltyFormAddress(row.studentId)} className={shared.link}>
      Hukuman ringan
    </Link>
  );
}
