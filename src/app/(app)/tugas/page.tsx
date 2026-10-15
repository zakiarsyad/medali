import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readDormTasks } from "@/features/dorm/tasks-list";
import { DormTasksScreen } from "@/features/dorm/tasks-screen";

/**
 * Tugas saya: what waits for the decision of Pengelola Asrama, among the
 * students each of its rights lets the account see.
 */
export default async function TasksPage() {
  const { account } = await openPage("tugas");
  const tasks = await readDormTasks(database(), account, new Date());
  return <DormTasksScreen tasks={tasks} />;
}
