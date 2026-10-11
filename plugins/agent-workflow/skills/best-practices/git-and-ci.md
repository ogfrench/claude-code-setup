# Git and CI

- **Reproduce a CI failure with the exact version CI runs.** Pin scanners and linters in CI,
  download that version locally, and scan what you are about to push with it.
  *(2026-10-11-pin-ci-tool-versions-locally)*
- **Checks missing from a PR usually mean a merge conflict.** Look at the mergeable state
  first; merge the base in and push. *(2026-10-11-conflicted-pr-runs-no-workflows)*
- **Merge commits on shared branches; never rewrite someone else's history.**
- **Keep the logs CI needs to explain itself.** Upload the files its own errors point to,
  hidden folders included.
