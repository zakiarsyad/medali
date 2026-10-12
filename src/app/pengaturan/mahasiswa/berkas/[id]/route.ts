import { currentAccount } from "@/auth/current-account";
import { database } from "@/db/database";
import { openStudentFile } from "@/features/students/open-student-file";
import { downloadResponse, refusalResponse } from "@/files/download-response";
import { fileStorage } from "@/files/file-storage";

/** Downloads the kept file of a batch of students, to those who may. */
export async function GET(
  _request: Request,
  context: RouteContext<"/pengaturan/mahasiswa/berkas/[id]">,
): Promise<Response> {
  const { id } = await context.params;
  const account = await currentAccount();
  const opened = await openStudentFile(database(), fileStorage(), account, id);
  if (!opened.ok) return refusalResponse(opened.refusal);
  return downloadResponse(opened.file);
}
