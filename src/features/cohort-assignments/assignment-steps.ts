import type { Action } from "@/auth/roles";
import type {
  cohortAssignmentChangeAction,
  cohortAssignmentStatus,
} from "@/db/schema";

export type AssignmentStatus =
  (typeof cohortAssignmentStatus.enumValues)[number];

export type ChangeAction =
  (typeof cohortAssignmentChangeAction.enumValues)[number];

export const STATUS_TITLES: Record<AssignmentStatus, string> = {
  draft: "Draf",
  submitted: "Diajukan",
  fixed: "Ditetapkan",
  cancelled: "Dibatalkan",
};

/** What an angkatan without a penetapan shows in place of a status. */
export const NOT_FORMED_TITLE = "Belum dibentuk";

/** What "Riwayat proses" says for each line of the log. */
export const CHANGE_TITLES: Record<ChangeAction, string> = {
  groups_formed: "Membentuk kelompok",
  groups_reformed: "Membentuk ulang kelompok",
  draft_saved: "Menyimpan draf",
  submitted: "Mengajukan ke Kepala UPK",
  fixed: "Menetapkan",
  cancelled: "Membatalkan",
  members_dropped:
    "Mengeluarkan mahasiswa yang sudah dihapus atau tidak aktif lagi",
};

/** What can be done to the penetapan of an angkatan. */
export const ASSIGNMENT_STEPS = [
  "form",
  "save",
  "submit",
  "fix",
  "cancel",
] as const;

export type AssignmentStep = (typeof ASSIGNMENT_STEPS)[number];

/** The right each step asks for, from the one list of what a role may do. */
export const STEP_ACTIONS: Record<AssignmentStep, Action> = {
  form: "prepare_cohort_assignments",
  save: "prepare_cohort_assignments",
  submit: "prepare_cohort_assignments",
  fix: "fix_cohort_assignments",
  cancel: "fix_cohort_assignments",
};

function isFixed(status: AssignmentStatus | null): boolean {
  return status === "fixed";
}

/**
 * The status of a penetapan after a step, or null when the step cannot be
 * taken from where it stands. `status` is null for an angkatan that has
 * no penetapan yet.
 *
 * Forming groups starts a draft, and forming them again replaces one that
 * is not fixed and makes it a draft, since its mentors are gone. Saving
 * keeps a submitted one submitted and makes a cancelled one a draft
 * again. A fixed one is changed by nothing but its cancelling, and only a
 * fixed one can be cancelled. Nothing sends a submitted one back to draft
 * with its groups kept.
 */
export function statusAfter(
  status: AssignmentStatus | null,
  step: AssignmentStep,
): AssignmentStatus | null {
  if (step === "cancel") return isFixed(status) ? "cancelled" : null;
  if (isFixed(status)) return null;
  if (step === "form") return "draft";
  if (status === null) return null;
  if (step === "submit") return "submitted";
  if (step === "fix") return "fixed";
  return status === "submitted" ? "submitted" : "draft";
}

/**
 * The line a step adds to "Riwayat proses". Forming groups reads as
 * forming them again once the angkatan has a penetapan.
 */
export function changeActionOf(
  step: AssignmentStep,
  status: AssignmentStatus | null,
): ChangeAction {
  if (step === "form") {
    return status === null ? "groups_formed" : "groups_reformed";
  }
  if (step === "save") return "draft_saved";
  if (step === "submit") return "submitted";
  if (step === "fix") return "fixed";
  return "cancelled";
}
