import { connect } from "@/db/connect";
import { noteFilesEmptied, startWaitsForFiles } from "@/db/deploy-start";
import {
  currentStage,
  deployBranch,
  readFileStorageSettings,
  readSetting,
} from "@/settings";
import { deployFiles } from "./deploy-files";
import { objectStore } from "./object-store";

/** The file storage step of a Vercel build. It fails loudly. */
async function deploy(): Promise<string> {
  const settings = readFileStorageSettings();
  const store = settings ? objectStore(settings) : null;
  const connection = connect(readSetting("DATABASE_URL"));
  try {
    return await deployFiles(store, currentStage(), deployBranch(), {
      waitsForFiles: () => startWaitsForFiles(connection.db),
      noteFilesEmptied: () => noteFilesEmptied(connection.db),
    });
  } finally {
    await connection.close();
  }
}

deploy()
  .then((done) => console.log(done))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
