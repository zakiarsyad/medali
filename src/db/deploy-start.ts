import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

/*
 * The mark of a start: one row for each time the database of the preview
 * of `main` was started over with sample data. It lives beside the mark
 * of the database's kind, in the schema that making the tables again
 * never removes. A database filled before this mark existed has none,
 * which is how its one start over is known to be still due.
 */

async function hasStartTable(db: PostgresJsDatabase): Promise<boolean> {
  const found = await db.execute<{ table: string | null }>(
    sql`select to_regclass('medali_deploy.sample_data_start')::text as table`,
  );
  return Boolean(found[0]?.table);
}

export async function hasStartMark(db: PostgresJsDatabase): Promise<boolean> {
  if (!(await hasStartTable(db))) return false;
  const starts = await db.execute(
    sql`select 1 from medali_deploy.sample_data_start limit 1`,
  );
  return starts.length > 0;
}

/**
 * Notes that the database was started over just now. Its files in the
 * file storage are not emptied yet: that is another step of the build.
 */
export async function noteStart(db: PostgresJsDatabase): Promise<void> {
  await db.execute(sql`create schema if not exists medali_deploy`);
  await db.execute(sql`
    create table if not exists medali_deploy.sample_data_start (
      started_at timestamptz not null default now(),
      files_emptied boolean not null default false
    )`);
  await db.execute(
    sql`insert into medali_deploy.sample_data_start default values`,
  );
}

/** Whether a start still waits for its files to be emptied. */
export async function startWaitsForFiles(
  db: PostgresJsDatabase,
): Promise<boolean> {
  if (!(await hasStartTable(db))) return false;
  const waiting = await db.execute(sql`
    select 1 from medali_deploy.sample_data_start
    where not files_emptied limit 1`);
  return waiting.length > 0;
}

export async function noteFilesEmptied(db: PostgresJsDatabase): Promise<void> {
  await db.execute(sql`
    update medali_deploy.sample_data_start set files_emptied = true
    where not files_emptied`);
}
