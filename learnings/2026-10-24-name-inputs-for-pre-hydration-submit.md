---
date: 2026-10-24
source: a private project
tags: [frontend, testing]
status: raw
promoted_to: []
---

# A form handled in JavaScript still needs named inputs: before hydration the browser submits it

**What happened.** A library page's search box worked in every test on CI, but failed 3
of 3 on a slower runner: the URL became `/library?` and the search was lost. On master
too.

**Why.** Before the SvelteKit page hydrates, the `onsubmit` handler is not attached, so
pressing Search makes the browser submit the form natively, as GET. The input had no
`name`, so nothing went into the query string. Fast CI runners hydrate before the test
clicks, which hides it; a slow phone shows it to users.

**Do instead.** Give every input in a JavaScript-handled form the `name` its URL parameter
uses (`name="q"`), so the native submit produces the same URL. The same goes for links
whose click handler saves state: the page they land on should save it from the URL too.
Run the browser suite once on a slow machine; it finds this whole class of bug.

**Evidence.** The spec failed 3 of 3 before the change and passed after it. Only the input
gained `name="q"`.
