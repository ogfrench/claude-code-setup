---
date: 2026-10-18
source: a private project
tags: [testing, tooling, browser]
status: raw
promoted_to: []
---

# tsx's keep-names helper breaks functions sent to a browser page

**What happened.** A screenshot script run with `tsx` passed a TypeScript function to
`page.evaluate`. It failed inside the page with `ReferenceError: __name is not defined`.

**Why.** The compiler wraps named functions in a `__name()` helper that exists in Node, not
in the page the function is serialized into.

**Do instead.** Define a no-op before navigation:
`page.evaluateOnNewDocument("window.__name = (f) => f;")`. Or keep page functions in plain
`.js`, or compile without keep-names.

**Evidence.** Seen once; the error names the helper, which is the clue.
