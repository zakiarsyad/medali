import { fileStorage } from "@/files/file-storage";
import { currentStage } from "@/settings";
import { runCommand } from "./run-command";
import { loadSamplePhotos } from "./seed-steps";

runCommand((db) => loadSamplePhotos(db, fileStorage(), currentStage()));
