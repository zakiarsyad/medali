import { cookies } from "next/headers";
import { database } from "@/db/database";
import { SESSION_COOKIE } from "./session-token";
import { endSession } from "./sessions";

/** Ends the Google sign-in of this browser, when it has one. */
export async function signOut(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return;
  await endSession(database(), token, new Date());
  jar.delete(SESSION_COOKIE);
}
