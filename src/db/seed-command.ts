import { currentStage } from "@/settings";
import { runCommand } from "./run-command";
import { loadSampleData } from "./seed-steps";

runCommand((db) => loadSampleData(db, currentStage()));
