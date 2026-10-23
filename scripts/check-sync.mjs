#!/usr/bin/env node
// Read-only. Run from the central setup checkout:
//   node scripts/check-sync.mjs /path/to/project
//   node scripts/check-sync.mjs /path/to/project --json
import path from "node:path";
import { checkSync } from "../lib/sync-status.mjs";

const target = process.argv[2];
if (!target || target.startsWith("--")) {
  console.error("Usage: node scripts/check-sync.mjs <project-dir> [--json]");
  process.exit(2);
}
const report = checkSync(path.resolve(target));
if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
else console.log(`${report.status}: ${report.reason ?? "Shared skill copies match the central source revision."}`);
if (report.status !== "current") process.exitCode = 1;
