import type { ReactNode } from "react";
import { ModalDialog } from "@/ui/modal-dialog";
import { NotFoundDialog } from "@/ui/not-found-dialog";
import type { RunningPeriod } from "./semester-now";
import type { DetailOrBrief } from "./student-brief";
import { StudentDetailView } from "./student-detail-view";
import { StudentHead } from "./student-head";
import type { GroupAddressOf, MentorAddressOf } from "./student-mentor-group";

/**
 * The panels another area adds under a student's own record, such as the
 * notes of their mentor. Each area decides who is shown its panel.
 */
export type MorePanelsOf = (studentId: string) => ReactNode;

/** The page a student's detail was opened from, where Tutup returns. */
export type DetailOpenedFrom =
  | "student_list"
  | "group_page"
  | "mentor_page"
  | "notes_list"
  | "scores_list"
  | "siku_lists"
  | "coaching_list"
  | "grade_list"
  | "fitness_list"
  | "skpm_list"
  | "screening_list"
  | "penalty_list"
  | "character_coaching_list"
  | "dashboard";

const RETURN_PLACE: Record<DetailOpenedFrom, string> = {
  student_list: "daftar mahasiswa",
  group_page: "halaman kelompok",
  mentor_page: "halaman pengasuh",
  notes_list: "daftar catatan",
  scores_list: "daftar nilai",
  siku_lists: "Penilaian SIKU",
  coaching_list: "Asesmen karakter",
  grade_list: "Penilaian karakter",
  fitness_list: "Penilaian jasmani",
  skpm_list: "Data SKPM",
  screening_list: "Kesehatan mental",
  penalty_list: "Pelanggaran disiplin",
  character_coaching_list: "Pembinaan karakter",
  dashboard: "Dashboard",
};

/** The detail of one student, over the list it was opened from. */
export function StudentDetailDialog({
  detail,
  period,
  openedFrom,
  closeAddress,
  groupAddressOf,
  mentorAddressOf,
  morePanelsOf,
  briefPanelsOf,
  headTagsOf,
}: {
  detail: DetailOrBrief;
  period: RunningPeriod;
  openedFrom: DetailOpenedFrom;
  /** The address of the list as it was left. */
  closeAddress: string;
  groupAddressOf: GroupAddressOf;
  mentorAddressOf: MentorAddressOf;
  morePanelsOf: MorePanelsOf;
  /**
   * The only panels under the brief of a student, which shows nothing
   * else of the detail. None when not given.
   */
  briefPanelsOf?: MorePanelsOf;
  /**
   * What another area adds beside the student's status, in the detail
   * and the brief alike, such as the badge of a suspension. None when not
   * given.
   */
  headTagsOf?: MorePanelsOf;
}) {
  if (detail.kind === "not_found") {
    return (
      <NotFoundDialog
        thing="student"
        returnPlace={RETURN_PLACE[openedFrom]}
        closeAddress={closeAddress}
      />
    );
  }
  if (detail.kind === "brief") {
    return (
      <ModalDialog label="Profil mahasiswa" closeAddress={closeAddress}>
        <StudentHead
          student={detail.student}
          tags={headTagsOf?.(detail.student.id)}
        />
        {briefPanelsOf?.(detail.student.id)}
      </ModalDialog>
    );
  }
  return (
    <ModalDialog label="Profil mahasiswa" closeAddress={closeAddress}>
      <StudentDetailView
        student={detail.student}
        period={period}
        groupAddressOf={groupAddressOf}
        mentorAddressOf={mentorAddressOf}
        headTags={headTagsOf?.(detail.student.id)}
      />
      {morePanelsOf(detail.student.id)}
    </ModalDialog>
  );
}
