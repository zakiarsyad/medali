import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { openAttendancePhoto } from "@/features/activities/open-attendance-photo";
import { refusalResponse, viewResponse } from "@/files/download-response";
import { fileStorage } from "@/files/file-storage";

/**
 * The photo of an attendance, shown in the browser tab, to the student who
 * sent it and to staff who may verify attendance.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/kegiatan/ppks/foto/[id]">,
): Promise<Response> {
  const { id } = await context.params;
  const account = await currentAccount();
  const opened = await openAttendancePhoto(
    database(),
    fileStorage(),
    account,
    id,
  );
  if (!opened.ok) return refusalResponse(opened.refusal);
  return viewResponse(opened.file);
}
