import type { PageId, TabbedPageId, TabId } from "./pages";
import type { RoleId } from "./role-ids";

/** Every action a role may be allowed. Anything not here is refused. */
export const ACTIONS = ["manage_users"] as const;

export type Action = (typeof ACTIONS)[number];

export const ACTION_TITLES: Record<Action, string> = {
  manage_users: "Mengelola pengguna dan peran",
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

const VIEW_ALL_TABS: RoleTabs = {
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
      settings: ["users", "new_students"],
    },
    actions: ["manage_users"],
    rows: "all",
  },
  director: {
    title: "Direktur / Wakil Direktur",
    initials: "DR",
    pages: STAFF_PAGES,
    tabs: VIEW_ALL_TABS,
    actions: [],
    rows: "all",
  },
  head_of_program: {
    title: "Ketua Program Studi",
    initials: "KP",
    pages: STAFF_PAGES,
    tabs: VIEW_ALL_TABS,
    actions: [],
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
    tabs: {
      assessment: ["siku"],
      dorm: ["activities", "leave", "cleaning", "violations"],
    },
    actions: [],
    rows: "self",
  },
  dorm_manager: {
    title: "Pengelola Asrama",
    initials: "PA",
    pages: ["tasks", "dorm", "settings"],
    tabs: { dorm: ALL_DORM, settings: ["new_students"] },
    actions: [],
    rows: "all",
  },
  bam_bphk: {
    title: "BAM - BPHK",
    initials: "BA",
    pages: ["dorm"],
    tabs: { dorm: ALL_DORM },
    actions: [],
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
    actions: [],
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
    tabs: { settings: ["new_students"] },
    actions: [],
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
