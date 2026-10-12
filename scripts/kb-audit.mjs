// What needs a human: stale nodes, old raw learnings, promotion candidates, token headroom.
//   node scripts/kb-audit.mjs [--json]
// Always exits 0 (it reports, it does not gate). Meant for a weekly look, by hand or by a Routine.
import { loadKb } from "../lib/kb.mjs";
import { audit, formatAudit } from "../lib/maintain.mjs";

const report = audit(loadKb());
console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatAudit(report));
