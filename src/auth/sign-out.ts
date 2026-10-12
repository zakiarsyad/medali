import { cookies } from "next/headers";
import { database } from "@/db/database";
import { currentStage } from "@/settings";
import { sessionCookieName } from "./session-token";
import { endSession } from "./sessions";
import { removedCookieOptions } from "./sign-in-cookies";

/** Ends the Google sign-in of this browser, when it has one. */
export async function signOut(): Promise<void> {
  const stage = currentStage();
  const jar = await cookies();
  const name = sessionCookieName(stage);
  const token = jar.get(name)?.value;
  if (!token) return;
  await endSession(database(), token, new Date());
  jar.set(name, "", removedCookieOptions(stage));
}
