// node --test   (no dependencies)
// The sync workflow runs in this public repo, whose Actions logs anyone can read, and the
// repo list is private. Quiet mode must print no repo name. `gh` is stubbed, so nothing
// leaves the machine: a fake clone is a fresh local git repo.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NAMES = ["hidden-owner/hidden-client-repo", "other-owner/codename-x"];

function stubbedGh() {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), "ccs-gh-"));
  fs.writeFileSync(
    path.join(bin, "gh"),
    `#!/usr/bin/env bash
case "$1 $2" in
  "repo view") echo main ;;
  "repo clone") git init -q -b main "$4" && git -C "$4" commit -q --allow-empty -m init ;;
  "label list") echo skip-e2e ;;
  *) echo "unexpected gh call: $*" >&2; exit 1 ;;
esac
`,
    { mode: 0o755 },
  );
  return bin;
}

function run(env) {
  const bin = stubbedGh();
  return spawnSync("bash", [path.join(ROOT, "sync-to-repos.sh")], {
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      DRY_RUN: "1",
      SYNC_REPOS: `${NAMES[0]} nextjs\n# a comment\n\n${NAMES[1]}\n`,
      GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.com",
      GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.com",
      ...env,
    },
  });
}

test("quiet mode reads the list from SYNC_REPOS and prints no repo name", () => {
  const r = run({ SYNC_QUIET: "1" });
  assert.equal(r.status, 0, r.stderr);
  const all = r.stdout + r.stderr;
  for (const name of NAMES) {
    assert.ok(!all.includes(name), "a repo name reached the output");
    assert.ok(!all.includes(name.split("/")[1]), "a repo's short name reached the output");
  }
  assert.match(r.stdout, /== repo 1 of 2/);
  assert.match(r.stdout, /== repo 2 of 2/);
  assert.match(r.stdout, /^2 repos: /m);
});

test("without quiet mode the names do print, so the test above can fail", () => {
  const r = run({});
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes(NAMES[0]));
});
