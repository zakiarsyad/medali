import { may, rowLimitForAction } from "@/auth/access";
import { currentAccount } from "@/auth/current-account";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { openRequestPhoto } from "@/features/siku/open-request-photo";
import { asksSmall } from "@/features/siku/request-photo";
import { refusalResponse, viewResponse } from "@/files/download-response";
import { fileStorage } from "@/files/file-storage";

/**
 * A proof photo of a request for a SIKU gain, shown in the page, large
 * or as its small copy with "?ukuran=kecil": to the student who sent it,
 * and to staff who read that student's SIKU, for Ketua Program Studi
 * only of their own program and for Pengasuh only of their own mentees.
 */
export async function GET(
  request: Request,
  context: RouteContext<"/penilaian/siku/foto/[id]">,
): Promise<Response> {
  const { id } = await context.params;
  const account = await currentAccount();
  const visible =
    account && may(account.roles, "view_siku")
      ? visibleTo(rowLimitForAction(account, "view_siku"))
      : null;
  const size = new URL(request.url).searchParams.get("ukuran") ?? "";
  const opened = await openRequestPhoto(
    database(),
    fileStorage(),
    account,
    visible,
    id,
    asksSmall(size),
  );
  if (!opened.ok) return refusalResponse(opened.refusal);
  return viewResponse(opened.file);
}
