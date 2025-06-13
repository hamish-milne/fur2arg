import copydir from "copy-dir";
import path from "node:path";
import fs from "node:fs";
import pnpapi from "pnpapi";

const PACKAGE_NAME = "@3d-dice/dice-box";
const ASSETS_PATH = "dist/assets";
const TARGET_PATH = "public/assets";

const filesToCopy = path.join(
  pnpapi.getPackageInformation({
    name: PACKAGE_NAME,
    reference: pnpapi
      .getPackageInformation(pnpapi.topLevel)
      .packageDependencies.get(PACKAGE_NAME),
  }).packageLocation,
  ASSETS_PATH,
);
console.log("Copying files from:", filesToCopy);
// Creates directory if it doesn't exist
fs.mkdir(TARGET_PATH, { recursive: true }, (err) => {
  if (err) throw err;

  // Moving files to user's local directory
  copydir(
    filesToCopy,
    TARGET_PATH,
    {
      utimes: true, // keep add time and modify time
      mode: true, // keep file mode
      cover: true, // cover file when exists, default is true
    },
    (err) => {
      if (err) {
        console.error("Error copying files:", err);
      } else {
        console.log("Files copied successfully!");
      }
    },
  );
});
