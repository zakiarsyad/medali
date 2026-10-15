import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { openAppealProof } from "@/features/dorm/open-appeal-proof";
import { downloadResponse, refusalResponse } from "@/files/download-response";
import { fileStorage } from "@/files/file-storage";

/**
 * The proof of an appeal of a dorm violation, downloaded, to the
 * resident who sent it and to BAM - BPHK and BAM - KI only.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/asrama/pel/bukti/[id]">,
): Promise<Response> {
  const { id } = await context.params;
  const account = await currentAccount();
  const opened = await openAppealProof(database(), fileStorage(), account, id);
  if (!opened.ok) return refusalResponse(opened.refusal);
  return downloadResponse(opened.file);
}
