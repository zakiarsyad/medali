import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { ROLE_IDS } from "@/auth/role-ids";
import { SIGN_IN_RESULTS } from "@/auth/sign-in-results";
import { DORM_IDS } from "@/dorms/dorms";
import { ASSIGNMENT_METHODS } from "@/features/cohort-assignments/methods";
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_PATTERNS,
  AUDIENCES,
  LAST_MONTH_DAY,
  ORGANISERS,
  type RundownLine,
} from "@/features/dorm/activity-ids";
import { type CountMarks, NOTE_MAX_LENGTH } from "@/features/dorm/count-ids";
import {
  ATTENDANCE_MARKS,
  type MarksByStudent,
  MEETINGS_PER_PERIOD,
} from "@/mentoring/meeting-ids";
import { FOLLOW_UPS, NOTE_KINDS } from "@/mentoring/note-ids";
import {
  OLD_MENTOR_STATUSES,
  REPLACEMENT_REASONS,
} from "@/mentoring/replacement-ids";
import { SCORE_MAX, SCORE_MIN } from "@/mentoring/score-range";
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

export const emailChangeAction = pgEnum("email_change_action", [
  "added",
  "changed",
  "cleared",
]);

export const signInResult = pgEnum("sign_in_result", SIGN_IN_RESULTS);

export const academicTerm = pgEnum("academic_term", ["odd", "even"]);

export const academicPeriodChangeAction = pgEnum(
  "academic_period_change_action",
  ["added", "dates_changed"],
);

export const dorm = pgEnum("dorm", DORM_IDS);

export const dormActivityCategory = pgEnum(
  "dorm_activity_category",
  ACTIVITY_CATEGORIES,
);

export const dormActivityPattern = pgEnum(
  "dorm_activity_pattern",
  ACTIVITY_PATTERNS,
);

export const dormActivityOrganiser = pgEnum(
  "dorm_activity_organiser",
  ORGANISERS,
);

export const dormActivityAudience = pgEnum("dorm_activity_audience", AUDIENCES);

export const cohortAssignmentStatus = pgEnum("cohort_assignment_status", [
  "draft",
  "submitted",
  "fixed",
  "cancelled",
]);

export const cohortAssignmentMethod = pgEnum(
  "cohort_assignment_method",
  ASSIGNMENT_METHODS,
);

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

export const mentoringNoteKind = pgEnum("mentoring_note_kind", NOTE_KINDS);

export const mentoringFollowUp = pgEnum("mentoring_follow_up", FOLLOW_UPS);

export const attendanceMark = pgEnum("attendance_mark", ATTENDANCE_MARKS);

/** What the time allowed to upload an attendance photo is counted in. */
export const uploadUnit = pgEnum("upload_unit", ["day", "week"]);

export const mentorReplacementReason = pgEnum(
  "mentor_replacement_reason",
  REPLACEMENT_REASONS,
);

export const oldMentorStatus = pgEnum("old_mentor_status", OLD_MENTOR_STATUSES);

/**
 * Where an attendance at an activity stands: its photo waits to be
 * checked, or staff decided it.
 */
export const activityAttendanceStatus = pgEnum("activity_attendance_status", [
  "waiting",
  "valid",
  "rejected",
  "dispensation",
]);

/**
 * Where a clarification of an attendance stands: it waits for Penilai
 * Mahasiswa, or was accepted or rejected.
 */
export const activityClarificationStatus = pgEnum(
  "activity_clarification_status",
  ["submitted", "accepted", "rejected"],
);

/** Why a student says they were not recorded as present, as the form lists it. */
export const activityClarificationReason = pgEnum(
  "activity_clarification_reason",
  [
    "sick",
    "family_matter",
    "campus_duty",
    "technical_trouble",
    "present_not_recorded",
    "other",
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
  /**
   * Goes up with every change made on Pengguna baru mahasiswa, so a change
   * made from an older one is caught.
   */
  version: integer().notNull().default(1),
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
 * Every change to the campus address a student's account holds, so that
 * a wrong one can be traced and put back. An address that was added has
 * none before, and one that was cleared has none after. Rows here cannot
 * be changed or deleted; the database refuses it.
 */
export const emailChanges = pgTable("email_changes", {
  id: uuid().primaryKey().defaultRandom(),
  accountId: uuid()
    .notNull()
    .references(() => accounts.id),
  changedBy: uuid()
    .notNull()
    .references(() => accounts.id),
  changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  action: emailChangeAction().notNull(),
  emailBefore: text(),
  emailAfter: text(),
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
 * The activities of the curriculum, without dates: the PPKS activities of
 * each semester, and the special and additional ones, which belong to no
 * semester. A removed one keeps its row, marked with who removed it and
 * when.
 */
export const ppksActivities = pgTable(
  "ppks_activities",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Empty for a special or additional activity. */
    semester: smallint(),
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
 * One dorm activity, repeating (rutin) or one-off (non rutin). What it
 * holds is in its versions. A removed one keeps its row, marked with who
 * removed it, when, and the first day it no longer takes place: the days
 * before that one still show it.
 */
export const dormActivities = pgTable(
  "dorm_activities",
  {
    id: uuid().primaryKey().defaultRandom(),
    changedAt: timestamp({ withTimezone: true }).notNull(),
    changedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    removedFrom: date(),
    deletedAt: timestamp({ withTimezone: true }),
    deletedBy: uuid().references(() => accounts.id),
  },
  (table) => [
    check(
      "dorm_activities_removal_mark_is_whole",
      sql`(${table.deletedAt} is null) = (${table.deletedBy} is null) and (${table.deletedAt} is null) = (${table.removedFrom} is null)`,
    ),
  ],
);

/**
 * What a dorm activity holds, for the days from `shownFrom` to
 * `shownUntil`; an empty one has no limit on that side. A change to a
 * repeating activity ends its version the day before and adds a new one,
 * so the days gone by keep what they showed. An activity has one version
 * without a last day. A one-off activity repeats `once`, on `startsOn`,
 * which is then also its `endsOn`. A weekday is 0 for Minggu to 6 for
 * Sabtu.
 */
export const dormActivityVersions = pgTable(
  "dorm_activity_versions",
  {
    id: uuid().primaryKey().defaultRandom(),
    activityId: uuid()
      .notNull()
      .references(() => dormActivities.id),
    shownFrom: date(),
    shownUntil: date(),
    name: text().notNull(),
    category: dormActivityCategory().notNull(),
    /** Empty when no place was given. */
    location: text().notNull(),
    pattern: dormActivityPattern().notNull(),
    /** The days of the week of a weekly activity; empty for any other. */
    weekdays: smallint().array().notNull(),
    /** The date in each month of a monthly activity. */
    monthDay: smallint(),
    /** Berlaku mulai, or the date of a one-off activity. */
    startsOn: date().notNull(),
    /** Berlaku sampai; empty for an activity that goes on. */
    endsOn: date(),
    startTime: time().notNull(),
    endTime: time().notNull(),
    organiser: dormActivityOrganiser().notNull(),
    /** Empty when no name was given. */
    organiserName: text().notNull(),
    audience: dormActivityAudience().notNull(),
    isRequired: boolean().notNull(),
    rundown: jsonb().$type<RundownLine[]>().notNull(),
  },
  (table) => [
    uniqueIndex("dorm_activity_versions_one_without_last_day")
      .on(table.activityId)
      .where(sql`${table.shownUntil} is null`),
    index("dorm_activity_versions_activity").on(table.activityId),
    check(
      "dorm_activity_versions_shown_until_on_or_after_from",
      sql`${table.shownUntil} >= ${table.shownFrom}`,
    ),
    check(
      "dorm_activity_versions_ends_on_or_after_start",
      sql`${table.endsOn} >= ${table.startsOn}`,
    ),
    check(
      "dorm_activity_versions_end_time_after_start",
      sql`${table.endTime} > ${table.startTime}`,
    ),
    check(
      "dorm_activity_versions_once_is_one_day",
      sql`${table.pattern} <> 'once' or ${table.endsOn} is not distinct from ${table.startsOn}`,
    ),
    check(
      "dorm_activity_versions_weekly_has_weekdays",
      sql`(${table.pattern} = 'weekly') = (cardinality(${table.weekdays}) > 0)`,
    ),
    check(
      "dorm_activity_versions_weekdays_0_to_6",
      sql`${table.weekdays} <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]`,
    ),
    check(
      "dorm_activity_versions_monthly_has_month_day",
      sql`(${table.pattern} = 'monthly') = (${table.monthDay} is not null)`,
    ),
    check(
      "dorm_activity_versions_month_day_in_range",
      sql`${table.monthDay} between 1 and ${sql.raw(String(LAST_MONTH_DAY))}`,
    ),
  ],
);

/**
 * A day on which a repeating dorm activity does not take place ("Hari
 * tanpa kegiatan"). A day is marked once for an activity.
 */
export const dormActivityDaysOff = pgTable(
  "dorm_activity_days_off",
  {
    activityId: uuid()
      .notNull()
      .references(() => dormActivities.id),
    day: date().notNull(),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.day] })],
);

/**
 * The count BAM made of who was present at one dorm activity on one day:
 * an activity repeats, so it has one count for each day at most. Until it
 * is announced it is a draft, which counts for no one. Never deleted: it
 * stays when its activity is removed, and its log lines hold it.
 */
export const dormAttendanceCounts = pgTable(
  "dorm_attendance_counts",
  {
    id: uuid().primaryKey().defaultRandom(),
    activityId: uuid()
      .notNull()
      .references(() => dormActivities.id),
    day: date().notNull(),
    /** Goes up with every save, so a save made from an older one is caught. */
    version: integer().notNull().default(1),
    savedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    /** When it was saved last, as a draft or as an announcement. */
    savedAt: timestamp({ withTimezone: true }).notNull(),
    /** Who announced it last, and when; empty while it is a draft. */
    announcedBy: uuid().references(() => accounts.id),
    announcedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    unique("dorm_attendance_counts_one_per_activity_and_day").on(
      table.activityId,
      table.day,
    ),
    check(
      "dorm_attendance_counts_announcement_is_whole",
      sql`(${table.announcedBy} is null) = (${table.announcedAt} is null)`,
    ),
  ],
);

/**
 * One participant of a count, as it was saved last: Tidak hadir or not,
 * and Catatan. A count holds every resident who took part on its day, so
 * one who is not marked absent is Hadir once it is announced.
 */
export const dormAttendanceMarks = pgTable(
  "dorm_attendance_marks",
  {
    countId: uuid()
      .notNull()
      .references(() => dormAttendanceCounts.id),
    studentId: uuid()
      .notNull()
      .references(() => students.id),
    isAbsent: boolean().notNull(),
    /** Empty when no note was written. */
    note: text().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.countId, table.studentId] }),
    index("dorm_attendance_marks_student").on(table.studentId),
    check(
      "dorm_attendance_marks_note_length",
      sql`char_length(${table.note}) <= ${sql.raw(String(NOTE_MAX_LENGTH))}`,
    ),
  ],
);

/**
 * Every announcement of a count: who, when, and the participants who
 * were absent or had a note, before and after. The first announcement
 * has none before. Rows here cannot be changed or deleted; the database
 * refuses it.
 */
export const dormAttendanceChanges = pgTable(
  "dorm_attendance_changes",
  {
    id: uuid().primaryKey().defaultRandom(),
    countId: uuid()
      .notNull()
      .references(() => dormAttendanceCounts.id),
    changedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    marksBefore: jsonb().$type<CountMarks>(),
    marksAfter: jsonb().$type<CountMarks>().notNull(),
  },
  (table) => [index("dorm_attendance_changes_count").on(table.countId)],
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
 * Every placement made on Pengguna baru mahasiswa: a student who joins a
 * group has none before, one who goes back to no group or is removed has
 * none after, and one who moves has both. Rows here cannot be changed or
 * deleted; the database refuses it.
 */
export const mentorGroupMemberChanges = pgTable(
  "mentor_group_member_changes",
  {
    id: uuid().primaryKey().defaultRandom(),
    studentId: uuid()
      .notNull()
      .references(() => students.id),
    groupBefore: uuid().references(() => mentorGroups.id),
    groupAfter: uuid().references(() => mentorGroups.id),
    changedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("mentor_group_member_changes_student").on(table.studentId),
    check(
      "mentor_group_member_changes_group_differs",
      sql`${table.groupBefore} is distinct from ${table.groupAfter}`,
    ),
  ],
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

/**
 * The evaluation of the mentor of a group for one academic period: four
 * values of 0 to 100, by Kepala Unit. A group has one for each period at
 * most; saving again corrects it. The mentor is the one who held the
 * group when it was first saved. Never deleted: its log lines hold it.
 */
export const mentorEvaluations = pgTable(
  "mentor_evaluations",
  {
    id: uuid().primaryKey().defaultRandom(),
    groupId: uuid()
      .notNull()
      .references(() => mentorGroups.id),
    mentorId: uuid()
      .notNull()
      .references(() => accounts.id),
    periodId: uuid()
      .notNull()
      .references(() => academicPeriods.id),
    /** "Keaktifan pendampingan". */
    activity: smallint().notNull(),
    /** "Kehadiran pada kegiatan kelompok". */
    attendance: smallint().notNull(),
    /** "Capaian karakter kelompok". */
    achievement: smallint().notNull(),
    /** "Umpan balik mahasiswa". */
    feedback: smallint().notNull(),
    note: text(),
    evaluatedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    /** When it was saved last, the first time or as a correction. */
    evaluatedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    unique("mentor_evaluations_one_per_group_and_period").on(
      table.groupId,
      table.periodId,
    ),
    index("mentor_evaluations_mentor").on(table.mentorId),
    check(
      "mentor_evaluations_values_0_to_100",
      sql`${table.activity} between 0 and 100 and ${table.attendance} between 0 and 100 and ${table.achievement} between 0 and 100 and ${table.feedback} between 0 and 100`,
    ),
  ],
);

/**
 * Every save of an evaluation: who, when, and its values and note before
 * and after. The first save has none before. Rows here cannot be changed
 * or deleted; the database refuses it.
 */
export const mentorEvaluationChanges = pgTable(
  "mentor_evaluation_changes",
  {
    id: uuid().primaryKey().defaultRandom(),
    evaluationId: uuid()
      .notNull()
      .references(() => mentorEvaluations.id),
    changedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    activityBefore: smallint(),
    attendanceBefore: smallint(),
    achievementBefore: smallint(),
    feedbackBefore: smallint(),
    noteBefore: text(),
    activityAfter: smallint().notNull(),
    attendanceAfter: smallint().notNull(),
    achievementAfter: smallint().notNull(),
    feedbackAfter: smallint().notNull(),
    noteAfter: text(),
  },
  (table) => [
    index("mentor_evaluation_changes_evaluation").on(table.evaluationId),
  ],
);

/**
 * One replacement of the mentor of a group, set by Kepala Unit: the whole
 * group goes from the old mentor to the new one on its start date. Until
 * that day it waits, neither carried out nor cancelled; a group has one
 * such replacement at most, and a new mentor is named in one at most.
 * Never deleted: a cancelled one stays, with who and when.
 */
export const mentorReplacements = pgTable(
  "mentor_replacements",
  {
    id: uuid().primaryKey().defaultRandom(),
    groupId: uuid()
      .notNull()
      .references(() => mentorGroups.id),
    oldMentorId: uuid()
      .notNull()
      .references(() => accounts.id),
    newMentorId: uuid()
      .notNull()
      .references(() => accounts.id),
    /** "Tanggal efektif". */
    startsOn: date().notNull(),
    reason: mentorReplacementReason().notNull(),
    /** "Nomor surat keputusan atau nota dinas". */
    letterNumber: text().notNull(),
    oldMentorStatus: oldMentorStatus().notNull(),
    note: text(),
    setBy: uuid()
      .notNull()
      .references(() => accounts.id),
    setAt: timestamp({ withTimezone: true }).notNull(),
    /** When the group got its new mentor. Empty while it waits for its day. */
    carriedOutAt: timestamp({ withTimezone: true }),
    cancelledBy: uuid().references(() => accounts.id),
    cancelledAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("mentor_replacements_one_waiting_per_group")
      .on(table.groupId)
      .where(
        sql`${table.carriedOutAt} is null and ${table.cancelledAt} is null`,
      ),
    uniqueIndex("mentor_replacements_one_waiting_per_new_mentor")
      .on(table.newMentorId)
      .where(
        sql`${table.carriedOutAt} is null and ${table.cancelledAt} is null`,
      ),
    index("mentor_replacements_old_mentor").on(table.oldMentorId),
    check(
      "mentor_replacements_cancelled_with_who_and_when",
      sql`(${table.cancelledAt} is null) = (${table.cancelledBy} is null)`,
    ),
    check(
      "mentor_replacements_not_carried_out_and_cancelled",
      sql`${table.carriedOutAt} is null or ${table.cancelledAt} is null`,
    ),
    check(
      "mentor_replacements_two_mentors",
      sql`${table.oldMentorId} <> ${table.newMentorId}`,
    ),
    check(
      "mentor_replacements_letter_number_given",
      sql`btrim(${table.letterNumber}) <> ''`,
    ),
  ],
);

/**
 * One period in which students rate their mentor in the satisfaction
 * survey, opened by Kepala Unit for an academic period. It runs from the
 * day it is opened until its last day, unless it is closed by hand or
 * cancelled before. One runs at a time: the database refuses a second one
 * while another still runs. Never deleted: a cancelled one stays, with who
 * and when.
 */
export const studentSurveyPeriods = pgTable(
  "student_survey_periods",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** "Periode": the academic period the survey is about. */
    periodId: uuid()
      .notNull()
      .references(() => academicPeriods.id),
    /** "Tanggal dibuka". */
    startsOn: date().notNull(),
    /** "Tanggal ditutup": the last day students can answer. */
    endsOn: date().notNull(),
    /**
     * "Bobot capaian karakter (%)". The weight of the students' feedback
     * is the rest of 100.
     */
    achievementWeight: smallint().notNull(),
    /** "Keterangan untuk mahasiswa". */
    note: text(),
    openedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    openedAt: timestamp({ withTimezone: true }).notNull(),
    /** Set by "Tutup periode sekarang". Empty for one that ends by its date. */
    closedBy: uuid().references(() => accounts.id),
    closedAt: timestamp({ withTimezone: true }),
    cancelledBy: uuid().references(() => accounts.id),
    cancelledAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    check(
      "student_survey_periods_ends_on_or_after_start",
      sql`${table.endsOn} >= ${table.startsOn}`,
    ),
    check(
      "student_survey_periods_weight_0_to_100",
      sql`${table.achievementWeight} between 0 and 100`,
    ),
    check(
      "student_survey_periods_closed_with_who_and_when",
      sql`(${table.closedAt} is null) = (${table.closedBy} is null)`,
    ),
    check(
      "student_survey_periods_cancelled_with_who_and_when",
      sql`(${table.cancelledAt} is null) = (${table.cancelledBy} is null)`,
    ),
    check(
      "student_survey_periods_not_closed_and_cancelled",
      sql`${table.closedAt} is null or ${table.cancelledAt} is null`,
    ),
  ],
);

/**
 * A note a mentor wrote after accompanying one student. Its key is made
 * by the form it was written on, so a form that is sent twice is kept
 * once. The writer stays the one who wrote it when the group gets another
 * mentor. A note is never changed or removed.
 */
export const mentoringNotes = pgTable(
  "mentoring_notes",
  {
    id: uuid().primaryKey(),
    studentId: uuid()
      .notNull()
      .references(() => students.id),
    writtenBy: uuid()
      .notNull()
      .references(() => accounts.id),
    kind: mentoringNoteKind().notNull(),
    /** "Tanggal": the day of the contact. */
    happenedOn: date().notNull(),
    valueKeys: text().array().$type<ValueKey[]>().notNull(),
    note: text().notNull(),
    followUp: mentoringFollowUp().notNull(),
    writtenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("mentoring_notes_student").on(table.studentId),
    index("mentoring_notes_written_at").on(table.writtenAt),
  ],
);

/**
 * One of the meetings a group has with its mentor in an academic period,
 * once its attendance list is saved. A group has each number once in a
 * period. Saving the list again corrects it. Never deleted: its log lines
 * hold it.
 */
export const mentoringMeetings = pgTable(
  "mentoring_meetings",
  {
    id: uuid().primaryKey().defaultRandom(),
    groupId: uuid()
      .notNull()
      .references(() => mentorGroups.id),
    periodId: uuid()
      .notNull()
      .references(() => academicPeriods.id),
    /** "Pertemuan 1" to the last one of the period. */
    number: smallint().notNull(),
    /** "Tanggal": the day the group met. */
    heldOn: date().notNull(),
    topic: text().notNull(),
    /** Goes up with every save, so a save made from an older one is caught. */
    version: integer().notNull().default(1),
    savedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    /** When the list was saved last, the first time or as a correction. */
    savedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    unique("mentoring_meetings_one_per_group_period_and_number").on(
      table.groupId,
      table.periodId,
      table.number,
    ),
    check(
      "mentoring_meetings_number_in_range",
      sql`${table.number} between 1 and ${sql.raw(String(MEETINGS_PER_PERIOD))}`,
    ),
  ],
);

/**
 * The mark of one student at one meeting. A student has one mark at a
 * meeting at most.
 */
export const mentoringAttendance = pgTable(
  "mentoring_attendance",
  {
    meetingId: uuid()
      .notNull()
      .references(() => mentoringMeetings.id),
    studentId: uuid()
      .notNull()
      .references(() => students.id),
    mark: attendanceMark().notNull(),
  },
  (table) => [primaryKey({ columns: [table.meetingId, table.studentId] })],
);

/**
 * Every save of an attendance list: who, when, and the day, the topic and
 * each student's mark before and after. The first save has none before.
 * Rows here cannot be changed or deleted; the database refuses it.
 */
export const mentoringMeetingChanges = pgTable(
  "mentoring_meeting_changes",
  {
    id: uuid().primaryKey().defaultRandom(),
    meetingId: uuid()
      .notNull()
      .references(() => mentoringMeetings.id),
    changedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    heldOnBefore: date(),
    topicBefore: text(),
    marksBefore: jsonb().$type<MarksByStudent>(),
    heldOnAfter: date().notNull(),
    topicAfter: text().notNull(),
    marksAfter: jsonb().$type<MarksByStudent>().notNull(),
  },
  (table) => [index("mentoring_meeting_changes_meeting").on(table.meetingId)],
);

/**
 * The score a mentor gave one student for how they took part in mentoring
 * in an academic period. A student has one in a period at most. Giving it
 * again changes it. Never deleted: its log lines hold it.
 */
export const mentoringScores = pgTable(
  "mentoring_scores",
  {
    id: uuid().primaryKey().defaultRandom(),
    studentId: uuid()
      .notNull()
      .references(() => students.id),
    periodId: uuid()
      .notNull()
      .references(() => academicPeriods.id),
    score: smallint().notNull(),
    scoredBy: uuid()
      .notNull()
      .references(() => accounts.id),
    /** When it was saved last, the first time or as a change. */
    scoredAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    unique("mentoring_scores_one_per_student_and_period").on(
      table.studentId,
      table.periodId,
    ),
    check(
      "mentoring_scores_score_in_range",
      sql`${table.score} between ${sql.raw(String(SCORE_MIN))} and ${sql.raw(String(SCORE_MAX))}`,
    ),
  ],
);

/**
 * Every save of a mentoring score: who, when, and the score before and
 * after. The first save has none before. Rows here cannot be changed or
 * deleted; the database refuses it.
 */
export const mentoringScoreChanges = pgTable(
  "mentoring_score_changes",
  {
    id: uuid().primaryKey().defaultRandom(),
    scoreId: uuid()
      .notNull()
      .references(() => mentoringScores.id),
    changedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    scoreBefore: smallint(),
    scoreAfter: smallint().notNull(),
  },
  (table) => [index("mentoring_score_changes_score").on(table.scoreId)],
);

/**
 * One holding of an activity of the curriculum, PPKS or special and
 * additional: its days, its hours, its place and how long after its last
 * day an attendance photo may be uploaded. It keeps the academic period
 * that ran on its first day: for a PPKS activity that decides who its
 * participants are, and for a special or additional one, whose
 * participants are chosen, the period whose attendance score it counts
 * in. A removed one keeps its row, marked with who removed it and when.
 */
export const activitySchedules = pgTable(
  "activity_schedules",
  {
    id: uuid().primaryKey().defaultRandom(),
    activityId: uuid()
      .notNull()
      .references(() => ppksActivities.id),
    academicPeriodId: uuid()
      .notNull()
      .references(() => academicPeriods.id),
    startsOn: date().notNull(),
    endsOn: date().notNull(),
    startTime: time().notNull(),
    endTime: time().notNull(),
    /** How many days or weeks after the last day a photo may be uploaded. */
    uploadCount: smallint().notNull(),
    uploadUnit: uploadUnit().notNull(),
    /** Empty when no place was given. */
    location: text().notNull(),
    /** Whether it counts in the attendance score, for this holding alone. */
    isRequired: boolean().notNull(),
    changedAt: timestamp({ withTimezone: true }).notNull(),
    changedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    deletedAt: timestamp({ withTimezone: true }),
    deletedBy: uuid().references(() => accounts.id),
  },
  (table) => [
    check(
      "activity_schedules_ends_on_or_after_start",
      sql`${table.endsOn} >= ${table.startsOn}`,
    ),
    check(
      "activity_schedules_end_time_after_start",
      sql`${table.endTime} > ${table.startTime}`,
    ),
    check(
      "activity_schedules_upload_count_0_to_52",
      sql`${table.uploadCount} between 0 and 52`,
    ),
  ],
);

/**
 * Whom a schedule of a special or additional activity is for: each row
 * names one student, one class or one angkatan. A student takes part when
 * a row of the schedule names them, their class or their angkatan, also
 * when they joined that class or angkatan after the schedule was made. A
 * schedule of a PPKS activity has none: the semester of its activity
 * decides.
 */
export const activityScheduleParticipants = pgTable(
  "activity_schedule_participants",
  {
    id: uuid().primaryKey().defaultRandom(),
    scheduleId: uuid()
      .notNull()
      .references(() => activitySchedules.id),
    studentId: uuid().references(() => students.id),
    className: text(),
    cohortYear: smallint(),
  },
  (table) => [
    uniqueIndex("activity_schedule_participants_student").on(
      table.scheduleId,
      table.studentId,
    ),
    uniqueIndex("activity_schedule_participants_class").on(
      table.scheduleId,
      table.className,
    ),
    uniqueIndex("activity_schedule_participants_cohort").on(
      table.scheduleId,
      table.cohortYear,
    ),
    check(
      "activity_schedule_participants_names_one",
      sql`num_nonnulls(${table.studentId}, ${table.className}, ${table.cohortYear}) = 1`,
    ),
  ],
);

/**
 * The attendance of one student at one schedule: the photo they sent and
 * when, where it stands, and who decided it and when. A student has one
 * waiting or valid attendance for a schedule at most. Nothing here is
 * removed: the attendance of a removed schedule stays and is not counted.
 */
export const activityAttendances = pgTable(
  "activity_attendances",
  {
    id: uuid().primaryKey().defaultRandom(),
    scheduleId: uuid()
      .notNull()
      .references(() => activitySchedules.id),
    studentId: uuid()
      .notNull()
      .references(() => students.id),
    status: activityAttendanceStatus().notNull(),
    /** Where the photo is in the file storage. Empty when none is kept. */
    photoKey: text().unique(),
    sentAt: timestamp({ withTimezone: true }),
    /** What the history shows as Keterangan. Empty when nothing was noted. */
    note: text().notNull(),
    decidedAt: timestamp({ withTimezone: true }),
    decidedBy: uuid().references(() => accounts.id),
  },
  (table) => [
    uniqueIndex("activity_attendances_one_waiting_or_valid")
      .on(table.scheduleId, table.studentId)
      .where(sql`${table.status} in ('waiting', 'valid')`),
    index("activity_attendances_student").on(table.studentId),
    check(
      "activity_attendances_waiting_is_sent",
      sql`${table.status} <> 'waiting' or ${table.sentAt} is not null`,
    ),
    check(
      "activity_attendances_decided_unless_waiting",
      sql`(${table.status} = 'waiting') = (${table.decidedAt} is null) and (${table.decidedAt} is null) = (${table.decidedBy} is null)`,
    ),
  ],
);

/**
 * Every decision on an attendance and every record made by hand: who,
 * when, and the status and Keterangan before and after. A first record
 * made by hand has none before. Rows here cannot be changed or deleted;
 * the database refuses it.
 */
export const activityAttendanceChanges = pgTable(
  "activity_attendance_changes",
  {
    id: uuid().primaryKey().defaultRandom(),
    attendanceId: uuid()
      .notNull()
      .references(() => activityAttendances.id),
    changedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    statusBefore: activityAttendanceStatus(),
    noteBefore: text(),
    statusAfter: activityAttendanceStatus().notNull(),
    noteAfter: text().notNull(),
  },
  (table) => [
    index("activity_attendance_changes_attendance").on(table.attendanceId),
  ],
);

/**
 * What a student asks about an attendance they were not given: the
 * reason, their explanation and the file that supports it, and what
 * Penilai Mahasiswa decided, when and with which note. An accepted one
 * keeps the status it gave the attendance: Hadir or Dispensasi. A student
 * has one waiting clarification for a schedule at most; one asked again
 * after a rejection is a new row. Nothing here is removed: the
 * clarification of a removed schedule stays and is not shown.
 */
export const activityClarifications = pgTable(
  "activity_clarifications",
  {
    id: uuid().primaryKey().defaultRandom(),
    scheduleId: uuid()
      .notNull()
      .references(() => activitySchedules.id),
    studentId: uuid()
      .notNull()
      .references(() => students.id),
    reason: activityClarificationReason().notNull(),
    explanation: text().notNull(),
    /**
     * Where the file is in the file storage. Empty only for sample data
     * where no file storage is set.
     */
    fileKey: text().unique(),
    fileName: text().notNull(),
    fileContentType: text().notNull(),
    /** In bytes. */
    fileSize: integer().notNull(),
    status: activityClarificationStatus().notNull(),
    /** The status an accepted one gave the attendance. */
    acceptedAs: activityAttendanceStatus(),
    /** What Penilai Mahasiswa noted. Empty when nothing was noted. */
    note: text().notNull(),
    sentAt: timestamp({ withTimezone: true }).notNull(),
    decidedAt: timestamp({ withTimezone: true }),
    decidedBy: uuid().references(() => accounts.id),
  },
  (table) => [
    uniqueIndex("activity_clarifications_one_submitted")
      .on(table.scheduleId, table.studentId)
      .where(sql`${table.status} = 'submitted'`),
    index("activity_clarifications_student").on(table.studentId),
    check(
      "activity_clarifications_decided_unless_submitted",
      sql`(${table.status} = 'submitted') = (${table.decidedAt} is null) and (${table.decidedAt} is null) = (${table.decidedBy} is null)`,
    ),
    check(
      "activity_clarifications_accepted_as_present_or_dispensation",
      sql`(${table.status} = 'accepted') = (${table.acceptedAs} is not null) and (${table.acceptedAs} is null or ${table.acceptedAs} in ('valid', 'dispensation'))`,
    ),
  ],
);

/**
 * Every decision on a clarification: who, when, the status before and
 * after, how it was accepted and the note. Rows here cannot be changed or
 * deleted; the database refuses it.
 */
export const activityClarificationChanges = pgTable(
  "activity_clarification_changes",
  {
    id: uuid().primaryKey().defaultRandom(),
    clarificationId: uuid()
      .notNull()
      .references(() => activityClarifications.id),
    changedBy: uuid()
      .notNull()
      .references(() => accounts.id),
    changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    statusBefore: activityClarificationStatus().notNull(),
    statusAfter: activityClarificationStatus().notNull(),
    acceptedAs: activityAttendanceStatus(),
    note: text().notNull(),
  },
  (table) => [
    index("activity_clarification_changes_clarification").on(
      table.clarificationId,
    ),
  ],
);
