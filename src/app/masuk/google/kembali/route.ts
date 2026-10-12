import { returnFromGoogle } from "@/auth/return-from-google";

/** Where Google sends a person back to after its own sign-in page. */
export async function GET(request: Request): Promise<Response> {
  return returnFromGoogle(request);
}
