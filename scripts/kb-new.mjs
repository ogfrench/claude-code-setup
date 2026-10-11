// Scaffold a learning:  node scripts/kb-new.mjs learning <slug> [--source owner/repo]
import { ROOT } from "../lib/kb.mjs";
import { newLearning } from "../lib/maintain.mjs";

const [kind, slug, ...rest] = process.argv.slice(2);
const at = rest.indexOf("--source");
if (kind !== "learning" || !slug) {
  console.error("usage: node scripts/kb-new.mjs learning <slug> [--source owner/repo]");
  process.exit(2);
}
try {
  console.log(newLearning(ROOT, slug, at >= 0 ? { source: rest[at + 1] } : {}));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
