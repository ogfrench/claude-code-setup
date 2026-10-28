# Agent workflow evaluations

These are end-to-end plugin evaluation cases, not static unit tests. They check
skill routing and output quality with and without this plugin. The scores are
not proof of downstream performance and should never be invented.

From `plugins/agent-workflow` on an authorized Claude Code machine:

```sh
claude plugin eval . --case 'fold-specialists' --runs 1 --no-publish --max-cost-usd 5
claude plugin eval . --runs 3 --no-publish --max-cost-usd 30
```

The first is a cheap smoke test. Repeat the full suite only when the account
can cover model use and the plugin directory is trusted. Check grader output,
skipped runs, task-level regressions and with-minus-without deltas. Invocation
graders are diagnostic in two-arm runs, not evidence that output improved.
Reports under `evals/results/` stay local and must not enter this public repo.

Documentation: https://code.claude.com/docs/en/plugin-evals
