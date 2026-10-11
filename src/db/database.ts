import { readSetting } from "@/settings";
import { type Connection, connect } from "./connect";

const shared = globalThis as { medaliConnection?: Connection };

/**
 * The app's one connection. It is kept on `globalThis` because the dev
 * server reloads modules on every edit, and each reload would otherwise
 * open a new pool.
 */
export function database() {
  shared.medaliConnection ??= connect(readSetting("DATABASE_URL"));
  return shared.medaliConnection.db;
}
