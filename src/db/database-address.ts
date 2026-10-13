import type { SettingsEnv } from "@/settings";

const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

export function pointsAtThisComputer(url: string | undefined): boolean {
  if (!url || !URL.canParse(url)) return false;
  return LOCAL_HOSTS.includes(new URL(url).hostname);
}

/**
 * Why the setting DATABASE_URL cannot be used, or null when it can. The
 * words never show the address: it holds the database's password.
 */
export function databaseAddressRefusal(env: SettingsEnv): string | null {
  const url = env.DATABASE_URL;
  if (!url) return "The setting DATABASE_URL is empty; refused.";
  if (URL.canParse(url)) return null;
  return "The setting DATABASE_URL is not an address that can be read. Check how the database's settings are written; refused.";
}

/** The name of the database an address points at. */
export function databaseNameOf(url: string): string {
  return decodeURIComponent(new URL(url).pathname.slice(1));
}

/**
 * Refuses an address whose name is not the database it reaches: with no
 * name the connection picks a database by itself, and a "database=" part
 * replaces the name. Either could be another database than the one a
 * safety rule looked at.
 */
export function checkNamesItsDatabase(setting: string, url: string): void {
  const hasName = databaseNameOf(url) !== "";
  const hasOverride = new URL(url).searchParams.has("database");
  if (hasName && !hasOverride) return;
  throw new Error(
    `The setting ${setting} must end with the name of its database, such as /medali_two, and must not carry a "database=" part.`,
  );
}
