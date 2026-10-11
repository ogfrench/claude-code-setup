# Data and concurrency

- **No whole-row writes from a stale read.** Counters are one statement
  (`SET n = n + 1`). Other writers name their columns. A whole-row `update()` is a bug
  unless the writer really sets every field, and even then it puts back counters and
  ownership changed meanwhile. *(2026-10-11-whole-row-orm-writes-revert-saves)*
- **Claim shared work in one step.** Read-and-delete is two steps; use one atomic operation
  (a Redis `MULTI`, `SPOP`, or an `UPDATE ... WHERE` that reports the rows it changed), and
  put items back if the work after the claim fails.
  *(2026-10-11-claim-shared-state-atomically)*
- **A conditional update is the check.** "Check, then write" lets two callers both pass the
  check. Put the condition in the `WHERE` and act only if a row changed.
- **A hold must be known to every deleter.** List every path that deletes the thing, cron
  jobs included, and make each respect the hold. Test the sweep, not only the paths you
  changed. *(2026-10-11-sweeps-must-know-about-holds)*
