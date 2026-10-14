import { may, rowLimitForAction } from "@/auth/access";
import { currentAccount } from "@/auth/current-account";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { openReturnPhoto } from "@/features/dorm/open-return-photo";
import { refusalResponse, viewResponse } from "@/files/download-response";
import { fileStorage } from "@/files/file-storage";

/**
 * The photo of a report of a return from dorm leave, shown in the page:
 * to the resident who sent it, and to staff who may see that leave, for
 * Ketua Program Studi only of their own program.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/asrama/izin/foto/[id]">,
): Promise<Response> {
  const { id } = await context.params;
  const account = await currentAccount();
  const visible =
    account && may(account.roles, "view_dorm_leave")
      ? visibleTo(rowLimitForAction(account, "view_dorm_leave"))
      : null;
  const opened = await openReturnPhoto(
    database(),
    fileStorage(),
    account,
    visible,
    id,
  );
  if (!opened.ok) return refusalResponse(opened.refusal);
  return viewResponse(opened.file);
}
