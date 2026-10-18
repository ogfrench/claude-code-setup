---
date: 2026-10-18
source: a private project
tags: [tooling, refactoring]
status: raw
promoted_to: []
---

# A script that inserts an import after the last match can land inside a string

**What happened.** A one-off script added an import to several files by inserting it after
the last line matching `^import `. In one file a template literal held generated code that
started with `import`, so the new import landed inside the string. The type check caught it;
in a plain JavaScript file it would have shipped.

**Why.** A line regex does not know what is code and what is a string.

**Do instead.** Insert imports at a fixed anchor (the top of the file, after a header
comment) or with the language's parser. Then type-check, or run each file's test, before
committing a scripted edit across many files.

**Evidence.** Seen once; the type check failed on the file with the template literal.
