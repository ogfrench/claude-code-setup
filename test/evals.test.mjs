// Non-billable checks for the plugin eval definitions. These do not run Claude.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../lib/kb.mjs";

const TYPES = new Set(["llm", "regex", "tool_used", "tool_order", "file_exists", "baseline"]);
const read = (file) => fs.readFileSync(file, "utf8");
const unquote = (value) => value?.trim().replace(/^(['"])([\s\S]*)\1$/, "$2");
function header(file) {
  const match = read(file).match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  assert.ok(match, `${file}: missing YAML frontmatter`);
  const fields = {};
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([a-z_]+):\s*(.*)$/);
    assert.ok(field, `${file}: unsupported frontmatter line ${line}`);
    assert.ok(!(field[1] in fields), `${file}: duplicate field ${field[1]}`);
    fields[field[1]] = unquote(field[2]);
  }
  return { fields, body: match[2].trim() };
}

test("each local plugin skill has an eval and each plugin has a no-skill case", () => {
  const pluginRoot = path.join(ROOT, "plugins");
  for (const plugin of fs.readdirSync(pluginRoot)) {
    const base = path.join(pluginRoot, plugin);
    const skills = path.join(base, "skills");
    if (!fs.existsSync(skills)) continue;
    const evals = path.join(base, "evals");
    assert.ok(fs.existsSync(evals), `${plugin}: missing evals/`);
    const cases = fs.readdirSync(evals, { withFileTypes: true })
      .filter((item) => item.isDirectory() && item.name !== "results");
    assert.ok(cases.length > 0, `${plugin}: no eval cases`);
    const invocationMatchers = [];
    let negativeCase = false;
    for (const item of cases) {
      const dir = path.join(evals, item.name);
      const promptFile = path.join(dir, "prompt.md");
      assert.ok(fs.existsSync(promptFile), `${item.name}: missing prompt.md`);
      const prompt = header(promptFile);
      assert.ok(prompt.body.length > 20, `${item.name}: too little task context`);
      assert.ok(Number(prompt.fields.max_turns) > 0, `${item.name}: missing max_turns`);
      assert.ok(prompt.fields.allowed_tools?.includes("Skill"), `${item.name}: Skill tool must be allowed`);
      const graderDir = path.join(dir, "graders");
      assert.ok(fs.existsSync(graderDir), `${item.name}: missing graders/`);
      const graders = fs.readdirSync(graderDir).filter((name) => name.endsWith(".md"));
      assert.ok(graders.length > 0, `${item.name}: no graders`);
      let hasOutcome = false;
      for (const name of graders) {
        const { fields, body } = header(path.join(graderDir, name));
        assert.ok(TYPES.has(fields.type), `${item.name}/${name}: unknown grader type`);
        if (fields.type === "llm") {
          assert.match(body, /PASS/i, `${name}: missing positive criterion`);
          assert.match(body, /FAIL/i, `${name}: missing failure criterion`);
          hasOutcome = true;
        }
        if (fields.type === "regex") {
          assert.ok(fields.pattern, `${name}: regex pattern missing`);
          assert.doesNotThrow(() => new RegExp(fields.pattern, fields.flags ?? ""), `${name}: invalid regex`);
          hasOutcome = true;
        }
        if (fields.type === "tool_used") {
          assert.ok(fields.tool, `${name}: missing tool name`);
          if (fields.input_match) {
            assert.doesNotThrow(() => new RegExp(fields.input_match), `${name}: invalid input_match`);
            if (fields.tool === "Skill") invocationMatchers.push(fields.input_match);
          }
          if (fields.min !== undefined && fields.max !== undefined) {
            assert.ok(Number(fields.min) <= Number(fields.max), `${name}: min exceeds max`);
          }
          if (fields.tool === "Skill" && fields.min === "0" && fields.max === "0") negativeCase = true;
        }
      }
      assert.ok(hasOutcome || item.name.includes("unrelated"), `${item.name}: no outcome grader`);
    }
    assert.ok(negativeCase, `${plugin}: no negative skill-routing case`);
    for (const name of fs.readdirSync(skills)) {
      const skill = path.join(skills, name, "SKILL.md");
      if (!fs.existsSync(skill)) continue;
      assert.ok(invocationMatchers.some((pattern) => pattern.includes(name)),
        `${plugin}: missing invocation eval for ${name}`);
    }
  }
});
