---
date: 2026-10-24
source: a private project
tags: [frontend, testing]
status: raw
promoted_to: []
---

# A loader that picks fields to pass on drops every field added later, without an error

**What happened.** A new feature flag was added to the server-side layout loader. The editor
never offered the feature. The flag reached the browser's data, but the universal layout
loader returned `{ email, loggedIn, flagA, flagB }`, a hand-picked list,
so the page saw `undefined`, which reads as off.

**Why.** An explicit pick is an allow-list. Nothing fails when a field is missing from it: the
type is widened, and `undefined` is falsy. Unit tests of the flag logic passed. Only an
end-to-end test of the whole page found it.

**Do instead.** When adding a field that flows through layers, trace every hop from source to
use, and look for picks and spreads that rebuild the object. Prefer passing `...data` through
where nothing needs hiding. Cover the flag with one end-to-end test that asserts the feature
appears, not only the flag's value.

**Evidence.** The e2e spec that expects the new option in the editor timed out waiting for the button;
adding the field to the pick fixed it.
