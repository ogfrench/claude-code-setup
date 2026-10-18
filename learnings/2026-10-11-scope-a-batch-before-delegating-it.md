---
date: 2026-10-11
source: a private project
tags: [agents, delegation]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/agents-and-models.md
---

# A cheap read-only scoping pass can show a batch is not the batch you planned

**What happened.** A batch was planned as "five more ports, like the last six". A cheaper
agent, read-only, scoped each item first. It found four different renderers, one item
already built, two that needed a design decision, and one that depended on a feature that
existed only in a schema.

**Why.** The plan was written from the items' names, not from what each item was made of.

**Do instead.** Before delegating a batch of "the same thing again", spend one cheap
read-only pass checking that each item really is the same thing, and re-plan from its report.

**Evidence.** The batch was re-planned before any code was written.
