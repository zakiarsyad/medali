import { readSetting } from "@/settings";
import { connect } from "./connect";
import { applyTableChanges } from "./migrate";

export default async function setup(): Promise<void> {
  const connection = connect(readSetting("DATABASE_URL"));
  try {
    await applyTableChanges(connection.db);
  } catch (error) {
    throw new Error(
      "The checks need the database. Start it with: pnpm db:start",
      { cause: error },
    );
  } finally {
    await connection.close();
  }
}
