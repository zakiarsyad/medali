import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { ROLE_IDS } from "@/auth/role-ids";
import { SIGN_IN_RESULTS } from "@/auth/sign-in-results";
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

/**
 * How a student was put in through Pengguna baru mahasiswa: by the form,
 * or from a file, kept with the name of that file.
 */
export type StudentInputSource = "form" | `upload:${string}`;

export const studyPrograms = pgTable("study_programs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull().unique(),
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
