// Runs after `npm install` (the "prepare" script): tells git to keep OUR copy of a generated file when a merge touches it on both sides, instead
// of stopping with a conflict. The merge is then finished by running `npm run facts`, which rebuilds them (see .gitattributes and AGENTS.md).
// Does nothing outside a git checkout and never fails an install.
import { execSync } from "node:child_process";
try {
  execSync("git config merge.regenerate.name \"generated file: keep ours, then run npm run facts\"", { stdio: "ignore" });
  execSync("git config merge.regenerate.driver true", { stdio: "ignore" });
} catch { /* not a git checkout (a build server): nothing to set */ }
