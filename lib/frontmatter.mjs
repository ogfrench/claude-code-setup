// A small reader for the frontmatter the knowledge files use:
// `key: value`, `key: [a, b]`, and block lists (`key:` then `  - item` lines).
// Returns { data, body }, or null when the file has no frontmatter.
export function parseFrontmatter(text) {
  const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  const data = {};
  let list = null;
  for (const raw of m[1].split("\n")) {
    const line = raw.replace(/\s+#.*$/, "");
    const item = line.match(/^\s+-\s+(.+)$/);
    if (item && list) {
      data[list].push(item[1].trim());
      continue;
    }
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    if (value === "") {
      data[key] = [];
      list = key;
    } else if (value.startsWith("[")) {
      data[key] = value.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
      list = null;
    } else {
      data[key] = value.trim().replace(/^(["'])(.*)\1$/, "$2");
      list = null;
    }
  }
  return { data, body: m[2] };
}
