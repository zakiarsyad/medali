import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { DatabaseKind, DeployTarget } from "./deploy-plan";

/*
 * The mark lives in its own schema, so rebuilding the tables in `public`
 * never removes it.
 */

function isDatabaseKind(kind: unknown): kind is DatabaseKind {
  return kind === "pr-preview" || kind === "main-preview";
}

async function readMark(db: PostgresJsDatabase): Promise<string | null> {
  const found = await db.execute<{ table: string | null }>(
    sql`select to_regclass('medali_deploy.database_kind')::text as table`,
  );
  if (!found[0]?.table) return null;
  const marks = await db.execute<{ kind: string }>(
    sql`select kind from medali_deploy.database_kind limit 1`,
  );
  return marks[0]?.kind ?? null;
}

export async function readDeployTarget(
  db: PostgresJsDatabase,
): Promise<DeployTarget> {
  const kind = await readMark(db);
  const tables = await db.execute<{ total: number }>(sql`
    select count(*)::int as total from information_schema.tables
    where table_schema = 'public'`);
  if (kind !== null && !isDatabaseKind(kind)) {
    throw new Error(`This database is marked ${kind}, which is unknown.`);
  }
  return { marker: kind, hasTables: (tables[0]?.total ?? 0) > 0 };
}

export async function markDatabase(
  db: PostgresJsDatabase,
  kind: DatabaseKind,
): Promise<void> {
  await db.execute(sql`create schema if not exists medali_deploy`);
  await db.execute(
    sql`create table if not exists medali_deploy.database_kind (kind text not null)`,
  );
  await db.execute(
    sql`insert into medali_deploy.database_kind (kind) values (${kind})`,
  );
}
