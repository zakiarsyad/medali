import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connect } from "@/db/connect";
import { applyTableChanges } from "@/db/migrate";
import { fillWithSampleData } from "@/db/seed";
import { ensureBucket, objectStore } from "@/files/object-store";
import type { FileStorageSettings } from "@/settings";

// This check runs the real backup part in Docker, on a database and a
// file storage it starts for itself and removes again. Everything it
// starts carries this name, which is also the only thing it removes.
const STACK = `medali-backup-check-${process.pid}`;
const COMPOSE = [
  "compose",
  "--progress",
  "quiet",
  "--project-name",
  STACK,
  "--file",
  "docker/backup-check.yaml",
];

/** Pulling the images and building the backup part, the first time. */
const START_TIMEOUT_MS = 600_000;
const COMMAND_TIMEOUT_MS = 120_000;
const CASE_TIMEOUT_MS = 180_000;
const MOST_OUTPUT_BYTES = 256 * 1024 * 1024;

const BACKUP_NAME = /\d{4}-\d{2}-\d{2}-\d{6}\.medali-backup/;
const ONLY_A_BACKUP_NAME = new RegExp(`^${BACKUP_NAME.source}$`);

type Settings = Readonly<Record<string, string>>;

/** The package the backup is made of: its database and its files. */
const SOURCE = { PGDATABASE: "medali", FILE_STORAGE_BUCKET: "medali" };

/** Another package, which a backup is restored into. */
const TARGET = { PGDATABASE: "restored", FILE_STORAGE_BUCKET: "restored" };
type Package = typeof SOURCE;

const REPLACE_WORD = "GANTI-SEMUA";

/** Every setting of the backup part, filled in. Made up for this run. */
const FILLED_IN: Settings = {
  ...SOURCE,
  FILE_STORAGE_URL: "http://files:9000",
  BACKUP_FOLDER: "/a-folder-on-the-server",
  BACKUP_PASSWORD: `made-up-${randomUUID()}`,
  BACKUP_HOUR: "",
  BACKUP_KEEP: "",
};

function compose(args: string[]): string {
  return execFileSync("docker", [...COMPOSE, ...args], {
    encoding: "utf8",
    timeout: START_TIMEOUT_MS,
  });
}

interface Outcome {
  status: number | null;
  output: Buffer;
  /** Everything the command said, the refusals among it. */
  said: string;
}

/** Runs one command in a backup part of its own, with the settings given. */
function inBackupPart(
  command: string[],
  settings: Settings,
  typed = "",
): Outcome {
  const result = spawnSync(
    "docker",
    [...COMPOSE, "run", "--rm", "-T", "backup", ...command],
    {
      env: { ...process.env, ...FILLED_IN, ...settings },
      input: typed,
      timeout: COMMAND_TIMEOUT_MS,
      maxBuffer: MOST_OUTPUT_BYTES,
    },
  );
  return {
    status: result.status,
    output: result.stdout,
    said: `${result.stdout.toString()}${result.stderr.toString()}`,
  };
}

function backup(settings: Settings = {}): Outcome {
  return inBackupPart(["backup"], settings);
}

/** The names of everything in the backup folder, sorted. */
function backupFolder(): string[] {
  const listed = inBackupPart(["ls", "-1A", "/backups"], {});
  expect(listed.status).toBe(0);
  return listed.output
    .toString()
    .split("\n")
    .filter((name) => name !== "")
    .sort();
}

function bytesOfBackup(name: string): Buffer {
  const read = inBackupPart(["cat", `/backups/${name}`], {});
  expect(read.status).toBe(0);
  return read.output;
}

let databasePort = "";
let filesPort = "";

/** The port of this computer that reaches a port of the check's stack. */
function portOf(service: string, port: string): string {
  const address = compose(["port", service, port]).trim();
  return address.slice(address.lastIndexOf(":") + 1);
}

async function inDatabase<Result>(
  name: string,
  work: (db: PostgresJsDatabase) => Promise<Result>,
): Promise<Result> {
  const connection = connect(
    `postgres://medali@127.0.0.1:${databasePort}/${name}`,
  );
  try {
    return await work(connection.db);
  } finally {
    await connection.close();
  }
}

function storageOf(bucket: string): FileStorageSettings {
  return {
    url: `http://127.0.0.1:${filesPort}`,
    bucket,
    accessKey: "backup-check",
    secretKey: "backup-check-only",
  };
}

/** The one uploaded file of the source, with bytes no other file holds. */
const KEPT_FILE = {
  key: `campus/check/${randomUUID()}`,
  bytes: randomBytes(4096),
};

async function fillSource(): Promise<void> {
  await inDatabase(SOURCE.PGDATABASE, async (db) => {
    await applyTableChanges(db);
    await fillWithSampleData(db);
  });
  const storage = storageOf(SOURCE.FILE_STORAGE_BUCKET);
  await ensureBucket(storage);
  await objectStore(storage).put(KEPT_FILE.key, {
    bytes: KEPT_FILE.bytes,
    contentType: "application/octet-stream",
  });
}

async function sampleEmail(): Promise<string> {
  const rows = await inDatabase(SOURCE.PGDATABASE, (db) =>
    db.execute<{ email: string }>(
      sql`select email from accounts where email is not null limit 1`,
    ),
  );
  return rows[0]?.email ?? "";
}

/** What only the target holds before a restore replaces everything. */
const ONLY_IN_TARGET = {
  accountName: "Akun Contoh Sasaran",
  key: `campus/check/${randomUUID()}`,
  bytes: randomBytes(64),
};

async function emptyBucket(bucket: string): Promise<void> {
  const storage = storageOf(bucket);
  await ensureBucket(storage);
  const files = objectStore(storage);
  for (const key of await files.list("")) {
    await files.remove(key);
  }
}

/** The target as a package that was started and never used. */
async function makeTargetEmpty(): Promise<void> {
  const database = sql.identifier(TARGET.PGDATABASE);
  await inDatabase(SOURCE.PGDATABASE, async (db) => {
    await db.execute(sql`drop database if exists ${database} with (force)`);
    await db.execute(sql`create database ${database}`);
  });
  await inDatabase(TARGET.PGDATABASE, applyTableChanges);
  await emptyBucket(TARGET.FILE_STORAGE_BUCKET);
}

interface PackageState {
  /** How many rows each table holds, by "schema.table". */
  rows: Record<string, number>;
  /** The bytes of each uploaded file, by its key. */
  files: Record<string, string>;
}

async function rowCounts(database: string): Promise<Record<string, number>> {
  return inDatabase(database, async (db) => {
    const tables = await db.execute<{ schema: string; name: string }>(sql`
      select table_schema as schema, table_name as name
      from information_schema.tables
      where table_type = 'BASE TABLE'
        and table_schema not in ('pg_catalog', 'information_schema')
      order by table_schema, table_name`);
    const rows: Record<string, number> = {};
    for (const { schema, name } of tables) {
      const table = sql`${sql.identifier(schema)}.${sql.identifier(name)}`;
      const counted = await db.execute<{ total: number }>(
        sql`select count(*)::int as total from ${table}`,
      );
      rows[`${schema}.${name}`] = counted[0]?.total ?? -1;
    }
    return rows;
  });
}

async function filesIn(bucket: string): Promise<Record<string, string>> {
  const store = objectStore(storageOf(bucket));
  const files: Record<string, string> = {};
  for (const key of await store.list("")) {
    const bytes = await store.get(key);
    files[key] = Buffer.from(bytes ?? []).toString("base64");
  }
  return files;
}

async function stateOf(of: Package): Promise<PackageState> {
  return {
    rows: await rowCounts(of.PGDATABASE),
    files: await filesIn(of.FILE_STORAGE_BUCKET),
  };
}

/**
 * The target as a package in use, with an account and a file the source
 * does not have. Gives its state, to compare with after a refusal.
 */
async function makeTargetHoldData(): Promise<PackageState> {
  await makeTargetEmpty();
  await inDatabase(TARGET.PGDATABASE, (db) =>
    db.execute(
      sql`insert into accounts (name) values (${ONLY_IN_TARGET.accountName})`,
    ),
  );
  await objectStore(storageOf(TARGET.FILE_STORAGE_BUCKET)).put(
    ONLY_IN_TARGET.key,
    { bytes: ONLY_IN_TARGET.bytes, contentType: "application/octet-stream" },
  );
  const state = await stateOf(TARGET);
  expect(state.rows["public.accounts"]).toBe(1);
  expect(Object.keys(state.files)).toEqual([ONLY_IN_TARGET.key]);
  return state;
}

interface RestoreWith {
  word?: string;
  typed?: string;
  settings?: Settings;
}

/** Runs the restore command on the target. */
function restore(name: string, options: RestoreWith = {}): Outcome {
  const { word, typed = "", settings = {} } = options;
  const command = word ? ["restore", name, word] : ["restore", name];
  return inBackupPart(command, { ...TARGET, ...settings }, typed);
}

/** The word given and typed once more: all a package in use asks for. */
const REPLACING = { word: REPLACE_WORD, typed: `${REPLACE_WORD}\n` };

/** Runs a script on the backup folder, which only Docker can reach. */
function inBackupFolder(script: string, names: string[]): void {
  const done = inBackupPart(["bash", "-euc", script, "--", ...names], {});
  expect(done.said).toBe("");
  expect(done.status).toBe(0);
}

const DAMAGED = [
  {
    kind: "broken",
    name: "2000-01-01-000000.medali-backup",
    damage: `cp "/backups/$1" "/backups/$2"
      size=$(stat --format=%s "/backups/$2")
      head --bytes=64 /dev/zero |
        dd of="/backups/$2" bs=1 seek=$((size / 2)) conv=notrunc status=none`,
  },
  {
    kind: "cut short",
    name: "2000-01-02-000000.medali-backup",
    damage: `size=$(stat --format=%s "/backups/$1")
      head --bytes=$((size / 2)) "/backups/$1" > "/backups/$2"`,
  },
];

/** The first backup of the source, which the cases below read. */
let made: Outcome;
let madeName = "";

beforeAll(async () => {
  compose(["build", "backup"]);
  compose(["up", "--detach", "--wait", "db", "files"]);
  databasePort = portOf("db", "5432");
  filesPort = portOf("files", "9000");
  await fillSource();
  made = backup();
  madeName = made.said.match(BACKUP_NAME)?.[0] ?? "";
}, START_TIMEOUT_MS);

afterAll(() => {
  compose(["down", "--volumes", "--remove-orphans", "--rmi", "local"]);
}, START_TIMEOUT_MS);

describe("the backup command", () => {
  it(
    "makes one dated backup and says its name and size",
    () => {
      expect(made.status).toBe(0);
      expect(made.said).toMatch(
        /^Cadangan selesai: \d{4}-\d{2}-\d{2}-\d{6}\.medali-backup \(\d+(\.\d)?[KMG]?B\)\.$/m,
      );
      expect(madeName).toMatch(ONLY_A_BACKUP_NAME);
      expect(backupFolder()).toEqual([madeName]);
    },
    CASE_TIMEOUT_MS,
  );

  it(
    "locks the backup: it shows neither an account nor an uploaded file",
    async () => {
      const email = await sampleEmail();
      const bytes = bytesOfBackup(madeName);

      expect(email).toContain("@");
      expect(bytes.length).toBeGreaterThan(KEPT_FILE.bytes.length);
      expect(bytes.includes(email)).toBe(false);
      expect(bytes.includes(KEPT_FILE.bytes)).toBe(false);
    },
    CASE_TIMEOUT_MS,
  );

  it.each(["BACKUP_PASSWORD", "BACKUP_FOLDER"])(
    "refuses while %s is empty, names it, and writes nothing",
    (name) => {
      const before = backupFolder();

      const refused = backup({ [name]: "" });

      expect(refused.status).toBe(1);
      expect(refused.said).toContain(`Pengaturan ${name} masih kosong.`);
      expect(before).toContain(madeName);
      expect(backupFolder()).toEqual(before);
    },
    CASE_TIMEOUT_MS,
  );
});

describe("the restore command", () => {
  it(
    "puts a backup into a package that holds no data, and names the command that starts the app again",
    async () => {
      await makeTargetEmpty();
      const source = await rowCounts(SOURCE.PGDATABASE);

      const restored = restore(madeName);

      expect(restored.said).toContain("Pemulihan selesai");
      expect(restored.said).toContain(
        "docker compose --file compose.campus.yaml restart app",
      );
      expect(restored.status).toBe(0);
      const target = await rowCounts(TARGET.PGDATABASE);
      expect(source["public.accounts"]).toBeGreaterThan(0);
      expect(target["public.accounts"]).toBe(source["public.accounts"]);
    },
    CASE_TIMEOUT_MS,
  );

  it(
    "refuses a name that is no backup in the folder",
    () => {
      const noBackupName = restore("../etc/passwd");
      const notThere = restore("1999-01-01-000000.medali-backup");

      expect(noBackupName.status).toBe(1);
      expect(noBackupName.said).toContain("Sebutkan nama cadangan");
      expect(notThere.status).toBe(1);
      expect(notThere.said).toContain("tidak ada di folder cadangan");
    },
    CASE_TIMEOUT_MS,
  );

  it(
    "refuses a wrong password, says so, and changes nothing",
    async () => {
      const before = await makeTargetHoldData();

      const refused = restore(madeName, {
        ...REPLACING,
        settings: { BACKUP_PASSWORD: "not-the-password" },
      });

      expect(refused.status).toBe(1);
      expect(refused.said).toContain(
        "Cadangan tidak bisa dibuka dengan BACKUP_PASSWORD yang sekarang.",
      );
      expect(await stateOf(TARGET)).toEqual(before);
    },
    CASE_TIMEOUT_MS,
  );

  it.each(DAMAGED)(
    "refuses a backup that is $kind, says so, and changes nothing",
    async ({ name, damage }) => {
      inBackupFolder(damage, [madeName, name]);
      const before = await makeTargetHoldData();

      const refused = restore(name, REPLACING);
      inBackupFolder('rm "/backups/$1"', [name]);

      expect(refused.status).toBe(1);
      expect(refused.said).toContain(`Cadangan ${name} rusak atau terpotong.`);
      expect(await stateOf(TARGET)).toEqual(before);
    },
    CASE_TIMEOUT_MS,
  );

  it(
    "refuses a package that holds data while the word is not given, and changes nothing",
    async () => {
      const before = await makeTargetHoldData();

      const refused = restore(madeName);

      expect(refused.status).toBe(1);
      expect(refused.said).toContain("Paket ini sudah berisi data");
      expect(refused.said).toContain(`restore ${madeName} ${REPLACE_WORD}`);
      expect(await stateOf(TARGET)).toEqual(before);
    },
    CASE_TIMEOUT_MS,
  );

  it.each([
    ["another answer", "ya\n"],
    ["no answer", ""],
  ])(
    "asks for the word once more, and with %s changes nothing",
    async (_answer, typed) => {
      const before = await makeTargetHoldData();

      const refused = restore(madeName, { word: REPLACE_WORD, typed });

      expect(refused.status).toBe(1);
      expect(refused.said).toContain(`Ketik ${REPLACE_WORD} sekali lagi`);
      expect(refused.said).toContain("Dibatalkan. Tidak ada yang diubah.");
      expect(await stateOf(TARGET)).toEqual(before);
    },
    CASE_TIMEOUT_MS,
  );

  it(
    "replaces everything once the word is given and typed once more",
    async () => {
      await makeTargetHoldData();

      const restored = restore(madeName, REPLACING);

      expect(restored.said).toContain("Pemulihan selesai");
      expect(restored.status).toBe(0);
      const target = await stateOf(TARGET);
      expect(target.files[ONLY_IN_TARGET.key]).toBeUndefined();
      expect(Object.keys(target.files)).toEqual([KEPT_FILE.key]);
      const kept = await inDatabase(TARGET.PGDATABASE, (db) =>
        db.execute(
          sql`select id from accounts
              where name = ${ONLY_IN_TARGET.accountName}`,
        ),
      );
      expect(kept.length).toBe(0);
      expect(target.rows["public.accounts"]).toBeGreaterThan(1);
    },
    CASE_TIMEOUT_MS,
  );
});
