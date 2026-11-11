import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

/*
 * The commit whose sample data the database of the Render preview holds.
 * The preview starts its database over when it starts, and a free app at
 * Render starts again each time it wakes from sleep; the commit tells a
 * new deploy from a wake. It lives beside the mark of the database's
 * kind, in the schema that making the tables again never removes.
 */

async function hasCommitTable(db: PostgresJsDatabase): Promise<boolean> {
  const found = await db.execute<{ table: string | null }>(
    sql`select to_regclass('medali_deploy.sample_data_commit')::text as table`,
  );
  return Boolean(found[0]?.table);
}

export async function readStartedCommit(
  db: PostgresJsDatabase,
): Promise<string | null> {
  if (!(await hasCommitTable(db))) return null;
  const commits = await db.execute<{ commit: string }>(
    sql`select git_commit as commit from medali_deploy.sample_data_commit limit 1`,
  );
  return commits[0]?.commit ?? null;
}

/**
 * Removes the commit noted, so the database reads as not started over
 * until the next start finishes and notes its own.
 */
export async function forgetStartedCommit(
  db: PostgresJsDatabase,
): Promise<void> {
  if (!(await hasCommitTable(db))) return;
  await db.execute(sql`delete from medali_deploy.sample_data_commit`);
}

export async function noteStartedCommit(
  db: PostgresJsDatabase,
  commit: string,
): Promise<void> {
  await db.execute(sql`create schema if not exists medali_deploy`);
  await db.execute(sql`
    create table if not exists medali_deploy.sample_data_commit (
      git_commit text not null
    )`);
  await db.execute(
    sql`insert into medali_deploy.sample_data_commit (git_commit) values (${commit})`,
  );
}
