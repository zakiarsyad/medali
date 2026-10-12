import { SIGN_IN_PATH } from "@/auth/sign-in-messages";
import { signOut } from "@/auth/sign-out";

/**
 * "Keluar". It is answered here and not by an action of a page, so that
 * the browser loads the sign-in page anew: the back button then asks the
 * server again and cannot show a page it kept.
 */
export async function POST(): Promise<Response> {
  await signOut();
  return new Response(null, {
    status: 303,
    headers: { Location: SIGN_IN_PATH, "Cache-Control": "no-store" },
  });
}
