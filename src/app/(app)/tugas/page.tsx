import { openPage } from "@/auth/open-page";
import { DormTasksScreen } from "@/features/dorm/tasks-screen";

/** Tugas saya: what waits for the decision of Pengelola Asrama. */
export default async function TasksPage() {
  await openPage("tugas");
  return <DormTasksScreen waiting={0} />;
}
