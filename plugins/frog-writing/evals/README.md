# Writing skill evaluations

Each writing skill has an example that should trigger it and a general request
that should trigger none of them. Compare the output and routing against runs
with the plugin disabled, not only whether the skill activated.

From `plugins/frog-writing`:

```sh
claude plugin eval . --case 'editorial-voice' --runs 1 --no-publish --max-cost-usd 5
claude plugin eval . --runs 3 --no-publish --max-cost-usd 20
```

These are billable model calls. Do not put user-supplied private copy into
public eval cases or commit reports. Inspect the result for meaning changes,
invented claims and overlapping skill selection.
