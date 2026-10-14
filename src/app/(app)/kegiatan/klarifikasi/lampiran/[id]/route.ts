import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { openClarificationFile } from "@/features/activities/open-clarification-file";
import {
  downloadResponse,
  refusalResponse,
  viewResponse,
} from "@/files/download-response";
import { fileStorage } from "@/files/file-storage";

/**
 * The file of a clarification, to the student who sent it and to an
 * account that may decide clarifications. It is downloaded, or with
 * `?lihat=1` shown inside the page that asks for it.
 */
export async function GET(
  request: Request,
  context: RouteContext<"/kegiatan/klarifikasi/lampiran/[id]">,
): Promise<Response> {
  const { id } = await context.params;
  const account = await currentAccount();
  const opened = await openClarificationFile(
    database(),
    fileStorage(),
    account,
    id,
  );
  if (!opened.ok) return refusalResponse(opened.refusal);
  const isShown = new URL(request.url).searchParams.get("lihat") === "1";
  return isShown ? viewResponse(opened.file) : downloadResponse(opened.file);
}
