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
function inBackupPart(command: string[], settings: Settings): Outcome {
  const result = spawnSync(
    "docker",
    [...COMPOSE, "run", "--rm", "-T", "backup", ...command],
    {
      env: { ...process.env, ...FILLED_IN, ...settings },
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
