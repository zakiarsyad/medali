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
  "view_dorm_activities",
  "manage_dorm_activities",
  "view_own_dorm_activities",
  "count_dorm_attendance",
  "view_dorm_attendance",
  "view_own_dorm_attendance",
  "view_dorm_leave",
  "decide_dorm_leave",
  "ask_dorm_leave",
  "report_dorm_return",
  "verify_dorm_return",
  "validate_dorm_return",
  "record_dorm_return",
  "view_student_detail",
  "view_student_room",
  "view_mentor_groups",
  "view_mentors",
  "view_mentor_evaluations",
  "evaluate_mentors",
  "replace_mentors",
  "manage_survey_periods",
  "view_cohort_assignments",
  "prepare_cohort_assignments",
  "fix_cohort_assignments",
  "view_own_profile",
  "view_mentoring_notes",
  "write_mentoring_notes",
  "view_mentoring_attendance",
  "fill_mentoring_attendance",
  "view_mentoring_scores",
  "give_mentoring_scores",
  "send_attendance_photo",
  "verify_attendance",
  "decide_activity_clarifications",
  "view_siku",
  "adjust_siku",
  "view_own_siku",
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
  view_dorm_activities: "Melihat jadwal kegiatan asrama",
  manage_dorm_activities: "Mengelola kegiatan asrama",
  view_own_dorm_activities: "Melihat kegiatan asrama sebagai penghuni",
  count_dorm_attendance: "Menghitung dan mengumumkan kehadiran kegiatan asrama",
  view_dorm_attendance: "Melihat kehadiran kegiatan asrama",
  view_own_dorm_attendance: "Melihat kehadiran kegiatan asrama sendiri",
  view_dorm_leave: "Melihat perizinan asrama",
  decide_dorm_leave: "Menyetujui dan menolak izin asrama",
  ask_dorm_leave: "Mengajukan dan membatalkan izin asrama sendiri",
  report_dorm_return: "Melapor kembali ke asrama dari izin sendiri",
  verify_dorm_return: "Memverifikasi dan menolak laporan kembali ke asrama",
  validate_dorm_return: "Memvalidasi dan menolak laporan kembali ke asrama",
  record_dorm_return: "Mencatat penghuni sudah kembali ke asrama",
  view_student_detail: "Melihat detail mahasiswa",
  view_student_room: "Melihat lantai dan kamar asrama mahasiswa",
  view_mentor_groups: "Melihat kelompok pengasuhan",
  view_mentors: "Melihat daftar pengasuh",
  view_mentor_evaluations: "Melihat evaluasi pengasuh",
  evaluate_mentors: "Mengevaluasi pengasuh",
  replace_mentors: "Menetapkan dan membatalkan penggantian pengasuh",
  manage_survey_periods:
    "Membuka, mengubah, menutup, dan membatalkan periode evaluasi oleh mahasiswa",
  view_cohort_assignments: "Melihat penetapan angkatan baru",
  prepare_cohort_assignments:
    "Menyiapkan dan mengajukan penetapan angkatan baru",
  fix_cohort_assignments: "Menetapkan dan membatalkan penetapan angkatan baru",
  view_own_profile: "Melihat data diri sendiri",
  view_mentoring_notes: "Melihat catatan pengasuhan",
  write_mentoring_notes: "Menulis catatan pengasuhan",
  view_mentoring_attendance: "Melihat daftar hadir pertemuan pengasuhan",
  fill_mentoring_attendance: "Mengisi daftar hadir pertemuan pengasuhan",
  view_mentoring_scores: "Melihat nilai pengasuhan",
  give_mentoring_scores: "Mengisi nilai pengasuhan",
  send_attendance_photo: "Presensi swafoto",
  verify_attendance: "Verifikasi presensi",
  decide_activity_clarifications:
    "Verifikasi dan validasi klarifikasi kegiatan karakter",
  view_siku: "Melihat penilaian SIKU",
  adjust_siku:
    "Penilaian SIKU: menambah, mengurangi, dan membatalkan penyesuaian nilai SIKU",
  view_own_siku: "Melihat nilai SIKU sendiri",
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

const ALL_MENTORING = ["notes", "meetings", "scores"] as const;

const VIEW_ALL_TABS: RoleTabs = {
  activities: ["ppks", "extra"],
  mentors: ALL_MENTORS,
  mentoring: ALL_MENTORING,
  assessment: ALL_ASSESSMENT,
  guidance: ["character", "discipline", "violation_notes"],
  dorm: ALL_DORM_BUT_VIOLATIONS,
};

/** What every BAM role may do with the dorm activities. */
const BAM_DORM_ACTIVITY_ACTIONS = [
  "view_dorm_activities",
  "view_dorm_attendance",
  "count_dorm_attendance",
] as const satisfies readonly Action[];

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
      "view_dorm_activities",
      "view_dorm_attendance",
      "view_dorm_leave",
      "view_student_detail",
      "view_student_room",
      "view_mentor_groups",
      "view_mentors",
      "view_mentor_evaluations",
      "evaluate_mentors",
      "replace_mentors",
      "manage_survey_periods",
      "view_cohort_assignments",
      "prepare_cohort_assignments",
      "fix_cohort_assignments",
      "view_mentoring_notes",
      "view_mentoring_attendance",
      "view_mentoring_scores",
      "view_siku",
      "adjust_siku",
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
      "view_dorm_activities",
      "view_dorm_attendance",
      "view_dorm_leave",
      "view_student_detail",
      "view_mentor_groups",
      "view_mentors",
      "view_mentor_evaluations",
      "view_cohort_assignments",
      "view_mentoring_notes",
      "view_mentoring_attendance",
      "view_mentoring_scores",
      "view_siku",
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
      "view_dorm_activities",
      "view_dorm_attendance",
      "view_dorm_leave",
      "view_student_detail",
      "view_mentor_groups",
      "view_mentors",
      "view_mentor_evaluations",
      "view_cohort_assignments",
      "view_mentoring_notes",
      "view_mentoring_attendance",
      "view_mentoring_scores",
      "view_siku",
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
      activities: ["ppks", "extra"],
      mentoring: ALL_MENTORING,
      dorm: ["health"],
      assessment: ALL_ASSESSMENT,
      guidance: ["character", "discipline"],
    },
    actions: [
      "view_student_detail",
      "view_mentoring_notes",
      "write_mentoring_notes",
      "view_mentoring_attendance",
      "fill_mentoring_attendance",
      "view_mentoring_scores",
      "give_mentoring_scores",
      "view_siku",
    ],
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
    actions: [
      "view_own_profile",
      "send_attendance_photo",
      "view_own_dorm_activities",
      "view_own_dorm_attendance",
      "ask_dorm_leave",
      "report_dorm_return",
      "view_own_siku",
    ],
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
      "view_dorm_activities",
      "manage_dorm_activities",
      "view_dorm_attendance",
      "view_dorm_leave",
      "decide_dorm_leave",
      "validate_dorm_return",
      "record_dorm_return",
    ],
    rows: "all",
  },
  bam_bphk: {
    title: "BAM - BPHK",
    initials: "BA",
    pages: ["dorm"],
    tabs: { dorm: ALL_DORM },
    actions: [
      "view_dorm_rooms",
      "view_dorm_companions",
      "view_dorm_leave",
      "verify_dorm_return",
      "record_dorm_return",
      ...BAM_DORM_ACTIVITY_ACTIONS,
    ],
    rows: "all",
  },
  bam_compliance: {
    title: "BAM - KI",
    initials: "BK",
    pages: ["dorm"],
    tabs: { dorm: ["overview", "activities", "clarification", "violations"] },
    actions: BAM_DORM_ACTIVITY_ACTIONS,
    rows: "all",
  },
  bam_household: {
    title: "BAM - Kerumahtanggaan",
    initials: "BR",
    pages: ["dorm"],
    tabs: { dorm: ["overview", "activities", "rooms", "cleaning"] },
    actions: [
      "view_dorm_rooms",
      "manage_dorm_rooms",
      ...BAM_DORM_ACTIVITY_ACTIONS,
    ],
    rows: "all",
  },
  bam_spiritual: {
    title: "BAM - Kerohanian",
    initials: "BH",
    pages: ["dorm"],
    tabs: { dorm: ["overview", "activities", "violations"] },
    actions: BAM_DORM_ACTIVITY_ACTIONS,
    rows: "all",
  },
  bam_catering: {
    title: "BAM - Konsumsi",
    initials: "BS",
    pages: ["dorm"],
    tabs: { dorm: ["overview", "activities", "violations"] },
    actions: BAM_DORM_ACTIVITY_ACTIONS,
    rows: "all",
  },
  bam_arts_sports: {
    title: "BAM - Senipora",
    initials: "BP",
    pages: ["dorm"],
    tabs: { dorm: ["overview", "activities", "violations"] },
    actions: BAM_DORM_ACTIVITY_ACTIONS,
    rows: "all",
  },
  bam_health: {
    title: "BAM - Kesehatan",
    initials: "BE",
    pages: ["dorm"],
    tabs: { dorm: ["overview", "activities", "violations", "health"] },
    actions: BAM_DORM_ACTIVITY_ACTIONS,
    rows: "all",
  },
  upk_staff: {
    title: "Pegawai UPK",
    initials: "PU",
    pages: ["curriculum", "activities", "mentors", "settings"],
    tabs: {
      activities: ["verification", "ppks", "extra"],
      mentors: ALL_MENTORS,
      settings: ["new_students"],
    },
    actions: [
      "input_new_students",
      "change_curriculum",
      "manage_activities",
      "verify_attendance",
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
      activities: ["clarification"],
      assessment: ["character", "skpm", "siku", "character_test", "fitness"],
    },
    actions: ["decide_activity_clarifications", "view_siku", "adjust_siku"],
    rows: "all",
  },
};
