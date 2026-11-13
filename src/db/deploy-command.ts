import { currentStage, deployBranch, deployCommit } from "@/settings";
import { deployDatabase } from "./deploy-database";
import { runCommand } from "./run-command";

runCommand((db) =>
  deployDatabase(db, currentStage(), deployBranch(), deployCommit()),
);
