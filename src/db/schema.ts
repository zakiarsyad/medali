import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { ROLE_IDS } from "@/auth/role-ids";
import { SIGN_IN_RESULTS } from "@/auth/sign-in-results";
import { DORM_IDS } from "@/features/dorm/dorms";
import type { ValueKey } from "@/ui/medali-values";

export const role = pgEnum("role", ROLE_IDS);

export const entryPath = pgEnum("entry_path", ["regular", "transfer"]);

export const sex = pgEnum("sex", ["male", "female"]);

export const studentStatus = pgEnum("student_status", [
  "active",
  "on_leave",
  "inactive",
]);

export const roleChangeAction = pgEnum("role_change_action", [
  "added",
  "roles_changed",
  "removed",
]);

export const signInResult = pgEnum("sign_in_result", SIGN_IN_RESULTS);

export const academicTerm = pgEnum("academic_term", ["odd", "even"]);

export const academicPeriodChangeAction = pgEnum(
  "academic_period_change_action",
  ["added", "dates_changed"],
);

export const dorm = pgEnum("dorm", DORM_IDS);

export const cohortAssignmentStatus = pgEnum("cohort_assignment_status", [
  "draft",
  "submitted",
  "fixed",
  "cancelled",
]);

export const cohortAssignmentMethod = pgEnum("cohort_assignment_method", [
  "balanced",
  "by_nim",
  "by_class",
]);

export const cohortAssignmentChangeAction = pgEnum(
  "cohort_assignment_change_action",
  [
    "groups_formed",
    "groups_reformed",
    "draft_saved",
    "submitted",
    "fixed",
    "cancelled",
    "members_dropped",
  ],
);

/**
 * How a student was put in through Pengguna baru mahasiswa: by the form,
 * or from a file, kept with the name of that file.
 */
export type StudentInputSource = "form" | `upload:${string}`;

export const studyPrograms = pgTable("study_programs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull().unique(),
  /** The short name a mentor group's code is made with, such as D3PJK. */
  code: text().notNull().unique(),
});

export const students = pgTable("students", {
  id: uuid().primaryKey().defaultRandom(),
  nim: text().notNull().unique(),
  name: text().notNull(),
  studyProgramId: integer()
    .notNull()
    .references(() => studyPrograms.id),
  entryPath: entryPath().notNull(),
  sex: sex().notNull(),
  cohortYear: smallint().notNull(),
  className: text(),
  province: text(),
  originAgency: text(),
  isAffirmation: boolean().notNull().default(false),
  isSeedling: boolean().notNull().default(false),
  isInternational: boolean().notNull().default(false),
  isBlended: boolean().notNull().default(false),
  status: studentStatus().notNull().default("active"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  /** Set only for a student put in through Pengguna baru mahasiswa. */
  inputAt: timestamp({ withTimezone: true }),
  inputBy: uuid().references((): AnyPgColumn => accounts.id),
  inputSource: text().$type<StudentInputSource>(),
  /** Set only for a student saved from a file, once files are kept. */
  inputBatchId: uuid().references((): AnyPgColumn => studentBatches.id),
  deletedAt: timestamp({ withTimezone: true }),
  deletedBy: uuid().references((): AnyPgColumn => accounts.id),
});

/** One save of a student file: the students it added point here. */
export const studentBatches = pgTable("student_batches", {
  id: uuid().primaryKey().defaultRandom(),
  inputAt: timestamp({ withTimezone: true }).notNull(),
  inputBy: uuid()
    .notNull()
    .references((): AnyPgColumn => accounts.id),
});

/**
 * The file a batch of students was saved from, as kept in the file
 * storage. A batch has one file at most, and a file always has its batch.
 */
export const studentBatchFiles = pgTable("student_batch_files", {
  id: uuid().primaryKey().defaultRandom(),
  batchId: uuid()
    .notNull()
    .unique()
    .references(() => studentBatches.id),
  /** Where the file is in the file storage. */
  objectKey: text().notNull().unique(),
  /** The name the file had when it was sent. */
  fileName: text().notNull(),
  byteSize: integer().notNull(),
  contentType: text().notNull(),
  keptAt: timestamp({ withTimezone: true }).notNull(),
  keptBy: uuid()
    .notNull()
    .references((): AnyPgColumn => accounts.id),
});

export const accounts = pgTable(
  "accounts",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    title: text(),
    nip: text(),
    email: text(),
    unit: text(),
    studyProgramId: integer().references(() => studyPrograms.id),
    studentId: uuid()
      .unique()
      .references(() => students.id),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp({ withTimezone: true }),
    deletedBy: uuid().references((): AnyPgColumn => accounts.id),
  },
  (table) => [
    uniqueIndex("accounts_email_in_use")
      .on(table.email)
      .where(sql`${table.deletedAt} is null`),
  ],
);

export const accountRoles = pgTable(
  "account_roles",
  {
    accountId: uuid()
      .notNull()
      .references(() => accounts.id),
    role: role().notNull(),
  },
  (table) => [primaryKey({ columns: [table.accountId, table.role] })],
);

/** Rows here cannot be changed or deleted; the database refuses it. */
export const roleChanges = pgTable("role_changes", {
  id: uuid().primaryKey().defaultRandom(),
  accountId: uuid()
    .notNull()
    .references(() => accounts.id),
  changedBy: uuid()
    .notNull()
    .references(() => accounts.id),
  changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  action: roleChangeAction().notNull(),
  rolesBefore: role().array().notNull(),
  rolesAfter: role().array().notNull(),
});

/**
 * Who is signed in with Google. The browser holds a random token and this
 * table only its hash, so a copy of the table opens nobody's session.
 */
export const sessions = pgTable("sessions", {
  id: uuid().primaryKey().defaultRandom(),
  tokenHash: text().notNull().unique(),
  accountId: uuid()
    .notNull()
    .references(() => accounts.id),
  lastSeenAt: timestamp({ withTimezone: true }).notNull(),
});

/**
 * Every sign-in, sign-out and refusal. A refused line names no account
 * and no address. Rows here cannot be changed or deleted; the database
 * refuses it.
 */
export const signInLog = pgTable("sign_in_log", {
  id: uuid().primaryKey().defaultRandom(),
  happenedAt: timestamp({ withTimezone: true }).notNull(),
  result: signInResult().notNull(),
  /** Set for a sign-in and a sign-out only. */
  accountId: uuid().references(() => accounts.id),
});

/**
 * The main indicators whose text was changed. One that is not here still
 * has its starting text.
 */
export const mainIndicators = pgTable("main_indicators", {
  code: text().primaryKey(),
  text: text().notNull(),
  changedAt: timestamp({ withTimezone: true }).notNull(),
  changedBy: uuid()
    .notNull()
    .references(() => accounts.id),
});

/** One row at most: the SIKU base score, once it has been set. */
export const sikuBaseScore = pgTable(
  "siku_base_score",
  {
    id: smallint().primaryKey().default(1),
    score: smallint().notNull(),
    setAt: timestamp({ withTimezone: true }).notNull(),
    setBy: uuid()
      .notNull()
      .references(() => accounts.id),
  },
  (table) => [check("siku_base_score_one_row", sql`${table.id} = 1`)],
);

/**
 * The PPKS activities of each semester, without dates. A removed one keeps
 * its row, marked with who removed it and when.
 */
export const ppksActivities = pgTable(
  "ppks_activities",
  {
    id: uuid().primaryKey().defaultRandom(),
    semester: smallint().notNull(),
    name: text().notNull(),
    /** The letters of the MEDALI values the activity builds. */
    valueKeys: text().array().$type<ValueKey[]>().notNull(),
    /** The codes of the main indicators the activity aims at. */
    indicatorCodes: text().array().notNull(),
    /** Empty while no target is set. */
    targetParticipants: integer(),
    isRequired: boolean().notNull(),
    description: text().notNull(),
    changedAt: timestamp({ withTimezone: true }).notNull(),
    changedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    deletedAt: timestamp({ withTimezone: true }),
    deletedBy: uuid().references(() => accounts.id),
  },
  (table) => [
    check(
      "ppks_activities_semester_1_to_8",
      sql`${table.semester} between 1 and 8`,
    ),
  ],
);

/**
 * What each MEDALI value means at each tahap, once it has been changed.
 * A tahap and value without a row shows its starting content.
 */
export const stageBreakdowns = pgTable(
  "stage_breakdowns",
  {
    tahap: smallint().notNull(),
    /** The letter of the MEDALI value. */
    valueKey: text().$type<ValueKey>().notNull(),
    text: text().notNull(),
    /** The names of the kegiatan acuan. */
    activities: text().array().notNull(),
    /** The codes of the main indicators chosen for the tahap. */
    indicatorCodes: text().array().notNull(),
    changedAt: timestamp({ withTimezone: true }).notNull(),
    changedBy: uuid()
      .notNull()
      .references(() => accounts.id),
  },
  (table) => [
    primaryKey({ columns: [table.tahap, table.valueKey] }),
    check("stage_breakdowns_tahap_1_to_4", sql`${table.tahap} between 1 and 4`),
  ],
);

/**
 * The academic periods, each with its first and its last day. The
 * database also refuses two periods whose days overlap.
 */
export const academicPeriods = pgTable(
  "academic_periods",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** The first year of the Tahun akademik: 2026 for 2026/2027. */
    startYear: smallint().notNull(),
    term: academicTerm().notNull(),
    startsOn: date().notNull(),
    endsOn: date().notNull(),
  },
  (table) => [
    unique("academic_periods_year_and_term").on(table.startYear, table.term),
    check(
      "academic_periods_ends_after_start",
      sql`${table.endsOn} > ${table.startsOn}`,
    ),
  ],
);

/**
 * Rows here cannot be changed or deleted; the database refuses it. A
 * period that was added has no days before.
 */
export const academicPeriodChanges = pgTable("academic_period_changes", {
  id: uuid().primaryKey().defaultRandom(),
  periodId: uuid()
    .notNull()
    .references(() => academicPeriods.id),
  changedBy: uuid()
    .notNull()
    .references(() => accounts.id),
  changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  action: academicPeriodChangeAction().notNull(),
  startsOnBefore: date(),
  endsOnBefore: date(),
  startsOnAfter: date().notNull(),
  endsOnAfter: date().notNull(),
});

/**
 * One room of a dorm. Its number is used once in its dorm, its floor is 1
 * to 8 and it holds 1 to 12 people.
 */
export const dormRooms = pgTable(
  "dorm_rooms",
  {
    id: uuid().primaryKey().defaultRandom(),
    dorm: dorm().notNull(),
    floor: smallint().notNull(),
    number: text().notNull(),
    capacity: smallint().notNull(),
  },
  (table) => [
    unique("dorm_rooms_number_in_dorm").on(table.dorm, table.number),
    check("dorm_rooms_floor_in_range", sql`${table.floor} between 1 and 8`),
    check(
      "dorm_rooms_capacity_in_range",
      sql`${table.capacity} between 1 and 12`,
    ),
  ],
);

/**
 * The place a resident has in a room. The student is the key, so a
 * resident is in one room at most.
 */
export const dormRoomPlaces = pgTable(
  "dorm_room_places",
  {
    studentId: uuid()
      .primaryKey()
      .references(() => students.id),
    roomId: uuid()
      .notNull()
      .references(() => dormRooms.id),
  },
  (table) => [index("dorm_room_places_room").on(table.roomId)],
);

/**
 * A senior student named kakak pendamping of a dorm. The student is the
 * key, so a student is kakak pendamping once at most. Only Dana Rakca and
 * Cipta Bakti have them, and only an active one has a room.
 */
export const dormCompanions = pgTable(
  "dorm_companions",
  {
    studentId: uuid()
      .primaryKey()
      .references(() => students.id),
    dorm: dorm().notNull(),
    note: text(),
    isActive: boolean().notNull().default(true),
    roomId: uuid().references(() => dormRooms.id),
  },
  (table) => [
    index("dorm_companions_room").on(table.roomId),
    check(
      "dorm_companions_dorm_has_companions",
      sql`${table.dorm} in ('dana_rakca', 'cipta_bakti')`,
    ),
    check(
      "dorm_companions_room_only_while_active",
      sql`${table.isActive} or ${table.roomId} is null`,
    ),
  ],
);

/**
 * A kelompok pengasuhan: students of one program studi, angkatan and
 * jalur, formed when they enter. A group is never erased: one whose
 * penetapan was cancelled is ended, with who and when. Its number is used
 * once among the groups of those three that are not ended.
 */
export const mentorGroups = pgTable(
  "mentor_groups",
  {
    id: uuid().primaryKey().defaultRandom(),
    studyProgramId: integer()
      .notNull()
      .references(() => studyPrograms.id),
    cohortYear: smallint().notNull(),
    entryPath: entryPath().notNull(),
    number: smallint().notNull(),
    startsOn: date().notNull(),
    endedAt: timestamp({ withTimezone: true }),
    endedBy: uuid().references(() => accounts.id),
  },
  (table) => [
    uniqueIndex("mentor_groups_number_in_cohort")
      .on(table.studyProgramId, table.cohortYear, table.entryPath, table.number)
      .where(sql`${table.endedAt} is null`),
    check("mentor_groups_number_from_1", sql`${table.number} >= 1`),
    check(
      "mentor_groups_ended_with_who_and_when",
      sql`(${table.endedAt} is null) = (${table.endedBy} is null)`,
    ),
  ],
);

/**
 * The students of a group. The student is the key, so a student is in one
 * group at most, and a group that still has members cannot be erased.
 */
export const mentorGroupMembers = pgTable(
  "mentor_group_members",
  {
    studentId: uuid()
      .primaryKey()
      .references(() => students.id),
    groupId: uuid()
      .notNull()
      .references(() => mentorGroups.id),
  },
  (table) => [index("mentor_group_members_group").on(table.groupId)],
);

/**
 * Who the members of an ended group were. Ending a group moves its
 * members here, so each of them is free for a new group.
 */
export const mentorGroupPastMembers = pgTable(
  "mentor_group_past_members",
  {
    groupId: uuid()
      .notNull()
      .references(() => mentorGroups.id),
    studentId: uuid()
      .notNull()
      .references(() => students.id),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.studentId] })],
);

/**
 * Who has looked after a group, one line per mentor and time. The line
 * without a last day is the mentor of today, and a group has one such
 * line at most. Only a line that has ended carries a reason.
 */
export const mentorGroupMentors = pgTable(
  "mentor_group_mentors",
  {
    id: uuid().primaryKey().defaultRandom(),
    groupId: uuid()
      .notNull()
      .references(() => mentorGroups.id),
    mentorId: uuid()
      .notNull()
      .references(() => accounts.id),
    startsOn: date().notNull(),
    endsOn: date(),
    endReason: text(),
  },
  (table) => [
    uniqueIndex("mentor_group_mentors_one_current")
      .on(table.groupId)
      .where(sql`${table.endsOn} is null`),
    index("mentor_group_mentors_mentor").on(table.mentorId),
    check(
      "mentor_group_mentors_ends_after_start",
      sql`${table.endsOn} >= ${table.startsOn}`,
    ),
    check(
      "mentor_group_mentors_reason_only_when_ended",
      sql`${table.endReason} is null or ${table.endsOn} is not null`,
    ),
  ],
);

/**
 * The penetapan of one angkatan: the groups being prepared for its new
 * students, until Kepala Unit fixes them. An angkatan has one at most. A
 * fixed one carries its decree number and the day its groups start.
 */
export const cohortAssignments = pgTable(
  "cohort_assignments",
  {
    id: uuid().primaryKey().defaultRandom(),
    cohortYear: smallint().notNull(),
    status: cohortAssignmentStatus().notNull().default("draft"),
    targetSize: smallint().notNull(),
    method: cohortAssignmentMethod().notNull(),
    decreeNumber: text(),
    /** "Berlaku mulai": the day the groups start once they are fixed. */
    effectiveOn: date(),
    /** Goes up with every save, so a save made from an older one is caught. */
    version: integer().notNull().default(1),
    savedAt: timestamp({ withTimezone: true }).notNull(),
    savedBy: uuid()
      .notNull()
      .references(() => accounts.id),
  },
  (table) => [
    unique("cohort_assignments_one_per_cohort").on(table.cohortYear),
    check(
      "cohort_assignments_target_size_in_range",
      sql`${table.targetSize} between 25 and 35`,
    ),
    check(
      "cohort_assignments_fixed_with_decree_and_day",
      sql`${table.status} <> 'fixed' or (${table.decreeNumber} is not null and ${table.effectiveOn} is not null)`,
    ),
  ],
);

/**
 * A group of a penetapan while it is prepared, with the mentor chosen for
 * it. Its number is used once among the groups of its penetapan, program
 * studi and jalur. While fixed it names the kelompok pengasuhan it became.
 */
export const cohortAssignmentGroups = pgTable(
  "cohort_assignment_groups",
  {
    id: uuid().primaryKey().defaultRandom(),
    assignmentId: uuid()
      .notNull()
      .references(() => cohortAssignments.id),
    studyProgramId: integer()
      .notNull()
      .references(() => studyPrograms.id),
    entryPath: entryPath().notNull(),
    number: smallint().notNull(),
    mentorId: uuid().references(() => accounts.id),
    mentorGroupId: uuid().references(() => mentorGroups.id),
  },
  (table) => [
    unique("cohort_assignment_groups_number_in_program").on(
      table.assignmentId,
      table.studyProgramId,
      table.entryPath,
      table.number,
    ),
    check("cohort_assignment_groups_number_from_1", sql`${table.number} >= 1`),
  ],
);

/**
 * The students of a group being prepared. The student is the key, so a
 * student is in one such group at most.
 */
export const cohortAssignmentMembers = pgTable(
  "cohort_assignment_members",
  {
    studentId: uuid()
      .primaryKey()
      .references(() => students.id),
    groupId: uuid()
      .notNull()
      .references(() => cohortAssignmentGroups.id),
  },
  (table) => [index("cohort_assignment_members_group").on(table.groupId)],
);

/**
 * "Riwayat proses": who did what to a penetapan and when. Rows here
 * cannot be changed or deleted; the database refuses it.
 */
export const cohortAssignmentChanges = pgTable(
  "cohort_assignment_changes",
  {
    id: uuid().primaryKey().defaultRandom(),
    assignmentId: uuid()
      .notNull()
      .references(() => cohortAssignments.id),
    changedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    action: cohortAssignmentChangeAction().notNull(),
  },
  (table) => [
    index("cohort_assignment_changes_assignment").on(table.assignmentId),
  ],
);
