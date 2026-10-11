import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
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
