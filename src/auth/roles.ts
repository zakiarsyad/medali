import type { PageId, TabbedPageId, TabId } from "./pages";
import type { RoleId } from "./role-ids";

/** Every action a role may be allowed. Anything not here is refused. */
export const ACTIONS = [
  "manage_users",
  "input_new_students",
  "change_curriculum",
  "manage_activities",
  "set_academic_periods",
  "view_dorm_rooms",
  "manage_dorm_rooms",
  "view_dorm_companions",
  "manage_dorm_companions",
  "view_student_detail",
  "view_student_room",
  "view_mentor_groups",
  "view_mentors",
  "view_mentor_evaluations",
  "evaluate_mentors",
  "view_cohort_assignments",
  "prepare_cohort_assignments",
  "fix_cohort_assignments",
  "view_own_profile",
] as const;

export type Action = (typeof ACTIONS)[number];

export const ACTION_TITLES: Record<Action, string> = {
  manage_users: "Mengelola pengguna dan peran",
  input_new_students: "Menginput mahasiswa baru",
  change_curriculum: "Mengubah kurikulum",
  manage_activities: "Mengelola kegiatan",
  set_academic_periods: "Mengatur periode akademik",
  view_dorm_rooms: "Melihat ploting kamar",
  manage_dorm_rooms: "Mengelola ploting kamar",
  view_dorm_companions: "Melihat kakak pendamping",
  manage_dorm_companions: "Mengelola kakak pendamping",
  view_student_detail: "Melihat detail mahasiswa",
  view_student_room: "Melihat lantai dan kamar asrama mahasiswa",
  view_mentor_groups: "Melihat kelompok pengasuhan",
  view_mentors: "Melihat daftar pengasuh",
  view_mentor_evaluations: "Melihat evaluasi pengasuh",
  evaluate_mentors: "Mengevaluasi pengasuh",
  view_cohort_assignments: "Melihat penetapan angkatan baru",
  prepare_cohort_assignments:
    "Menyiapkan dan mengajukan penetapan angkatan baru",
  fix_cohort_assignments: "Menetapkan dan membatalkan penetapan angkatan baru",
  view_own_profile: "Melihat data diri sendiri",
};

/**
 * Which rows of student data a role sees: all of them, only the students
 * of its own study program, only its own mentees, or only itself.
 */
export type RowRule = "all" | "own_program" | "own_mentees" | "self";

type RoleTabs = { [P in TabbedPageId]?: readonly TabId<P>[] };

export interface Role {
  title: string;
  initials: string;
  pages: readonly PageId[];
  /** Those of its pages the role opens only for a student who lives in the dorm. */
  residentPages?: readonly PageId[];
  tabs: RoleTabs;
  actions: readonly Action[];
  rows: RowRule;
}

const STAFF_PAGES = [
  "dashboard",
  "curriculum",
  "activities",
  "students",
  "mentors",
  "mentoring",
  "assessment",
  "guidance",
  "dorm",
] as const satisfies readonly PageId[];

const ALL_ASSESSMENT = [
  "character",
  "skpm",
  "siku",
  "character_test",
  "fitness",
  "mental_health",
] as const;

const ALL_DORM = [
  "overview",
  "activities",
  "leave",
  "clarification",
  "rooms",
  "companions",
  "cleaning",
  "violations",
  "health",
] as const;

const ALL_DORM_BUT_VIOLATIONS = ALL_DORM.filter((tab) => tab !== "violations");

const ALL_MENTORS = [
  "groups",
  "mentors",
  "student_survey",
  "replacement",
  "new_cohort",
] as const;

const VIEW_ALL_TABS: RoleTabs = {
  mentors: ALL_MENTORS,
  assessment: ALL_ASSESSMENT,
  guidance: ["character", "discipline", "violation_notes"],
  dorm: ALL_DORM_BUT_VIOLATIONS,
};

/**
 * The one list of what each role may open and do. Nothing else decides
 * access. Taken from the prototype's roles.
 */
export const ROLES: Record<RoleId, Role> = {
  head_of_unit: {
    title: "Kepala Unit Pembangunan Karakter",
    initials: "KU",
    pages: [...STAFF_PAGES, "settings"],
    tabs: {
      ...VIEW_ALL_TABS,
      dorm: ALL_DORM,
      settings: ["users", "new_students", "academic_periods"],
    },
    actions: [
      "manage_users",
      "input_new_students",
      "change_curriculum",
      "manage_activities",
      "set_academic_periods",
      "view_dorm_rooms",
      "view_dorm_companions",
      "view_student_detail",
      "view_student_room",
      "view_mentor_groups",
      "view_mentors",
      "view_mentor_evaluations",
      "evaluate_mentors",
      "view_cohort_assignments",
      "prepare_cohort_assignments",
      "fix_cohort_assignments",
    ],
    rows: "all",
  },
  director: {
    title: "Direktur / Wakil Direktur",
    initials: "DR",
    pages: STAFF_PAGES,
    tabs: VIEW_ALL_TABS,
    actions: [
      "view_dorm_rooms",
      "view_dorm_companions",
      "view_student_detail",
      "view_mentor_groups",
      "view_mentors",
      "view_mentor_evaluations",
      "view_cohort_assignments",
    ],
    rows: "all",
  },
  head_of_program: {
    title: "Ketua Program Studi",
    initials: "KP",
    pages: STAFF_PAGES,
    tabs: VIEW_ALL_TABS,
    actions: [
      "view_dorm_rooms",
      "view_dorm_companions",
      "view_student_detail",
      "view_mentor_groups",
      "view_mentors",
      "view_mentor_evaluations",
      "view_cohort_assignments",
    ],
    rows: "own_program",
  },
  mentor: {
    title: "Pengasuh",
    initials: "PG",
    pages: [
      "dashboard",
      "curriculum",
      "activities",
      "mentoring",
      "assessment",
      "guidance",
      "dorm",
    ],
    tabs: {
      dorm: ["health"],
      assessment: ALL_ASSESSMENT,
      guidance: ["character", "discipline"],
    },
    actions: [],
    rows: "own_mentees",
  },
  student: {
    title: "Mahasiswa",
    initials: "MH",
    pages: ["profile", "activities", "assessment", "counselling", "dorm"],
    residentPages: ["dorm"],
    tabs: {
      assessment: ["siku"],
      dorm: ["activities", "leave", "cleaning", "violations"],
    },
    actions: ["view_own_profile"],
    rows: "self",
  },
  dorm_manager: {
    title: "Pengelola Asrama",
    initials: "PA",
    pages: ["tasks", "dorm", "settings"],
    tabs: { dorm: ALL_DORM, settings: ["new_students"] },
    actions: [
      "input_new_students",
      "view_dorm_rooms",
      "manage_dorm_rooms",
      "view_dorm_companions",
      "manage_dorm_companions",
    ],
    rows: "all",
  },
  bam_bphk: {
    title: "BAM - BPHK",
    initials: "BA",
    pages: ["dorm"],
    tabs: { dorm: ALL_DORM },
    actions: ["view_dorm_rooms", "view_dorm_companions"],
    rows: "all",
  },
  bam_compliance: {
    title: "BAM - KI",
    initials: "BK",
    pages: ["dorm"],
    tabs: { dorm: ["overview", "activities", "clarification", "violations"] },
    actions: [],
    rows: "all",
  },
  bam_household: {
    title: "BAM - Kerumahtanggaan",
    initials: "BR",
    pages: ["dorm"],
    tabs: { dorm: ["overview", "activities", "rooms", "cleaning"] },
    actions: ["view_dorm_rooms", "manage_dorm_rooms"],
    rows: "all",
  },
  bam_spiritual: {
    title: "BAM - Kerohanian",
    initials: "BH",
    pages: ["dorm"],
    tabs: { dorm: ["overview", "activities", "violations"] },
    actions: [],
    rows: "all",
  },
  bam_catering: {
    title: "BAM - Konsumsi",
    initials: "BS",
    pages: ["dorm"],
    tabs: { dorm: ["overview", "activities", "violations"] },
    actions: [],
    rows: "all",
  },
  bam_arts_sports: {
    title: "BAM - Senipora",
    initials: "BP",
    pages: ["dorm"],
    tabs: { dorm: ["overview", "activities", "violations"] },
    actions: [],
    rows: "all",
  },
  bam_health: {
    title: "BAM - Kesehatan",
    initials: "BE",
    pages: ["dorm"],
    tabs: { dorm: ["overview", "activities", "violations", "health"] },
    actions: [],
    rows: "all",
  },
  upk_staff: {
    title: "Pegawai UPK",
    initials: "PU",
    pages: ["curriculum", "activities", "mentors", "settings"],
    tabs: { mentors: ALL_MENTORS, settings: ["new_students"] },
    actions: [
      "input_new_students",
      "change_curriculum",
      "manage_activities",
      "view_mentor_groups",
      "view_mentors",
      "view_mentor_evaluations",
      "view_cohort_assignments",
      "prepare_cohort_assignments",
    ],
    rows: "all",
  },
  counsellor: {
    title: "Konselor",
    initials: "KS",
    pages: ["assessment", "counselling"],
    tabs: { assessment: ["mental_health"] },
    actions: [],
    rows: "all",
  },
  discipline_officer: {
    title: "Pembina Disiplin Mahasiswa",
    initials: "PD",
    pages: ["guidance"],
    tabs: { guidance: ["discipline", "violation_notes"] },
    actions: [],
    rows: "all",
  },
  assessor: {
    title: "Penilai Mahasiswa",
    initials: "PN",
    pages: ["assessment", "activities"],
    tabs: {
      assessment: ["character", "skpm", "siku", "character_test", "fitness"],
    },
    actions: [],
    rows: "all",
  },
};
