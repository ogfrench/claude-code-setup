# Agents and models

- **Hand a task to the cheapest model whose mistake would be caught before it lands.** The
  full split is the `model-delegation` skill.
  *(2026-10-11-cheap-reviews-catch-real-bugs)*
- **Review every commit before pushing it,** read-only, on a mid-size model, with a fixed
  brief: correctness and safety, `file:line`, a concrete scenario, a word cap. The
  `cheap-reviewer` subagent does exactly this. Verify each finding before acting on it.
  *(2026-10-11-cheap-reviews-catch-real-bugs)*
- **Ask for work that survives being cut short.** Agents share the session's usage limits;
  have them write findings as they go, resume rather than restart, and clean up what they
  started. *(2026-10-11-background-agents-hit-usage-limits)*
- **Agents that share a stack, a database or rate limits run one at a time.**
  *(2026-10-11-second-stack-reloads-pages)*
