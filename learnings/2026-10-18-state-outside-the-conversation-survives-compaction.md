---
date: 2026-10-18
source: ogfrench/frogQuiz
tags: [agents, context, compaction, issues]
status: promoted
promoted_to:
  - plugins/agent-workflow/skills/session-continuity/SKILL.md
---

# Long work survives compaction when its state lives outside the conversation

**What happened.** One session ran a release over many hours and several compactions: a
cleanup across dozens of files, a migration, four merged PRs, a rename, and a string of the
user's decisions. Each time it picked up where it stopped, with no recap and no re-asked
question. The user said they loved that and asked for it as a skill.

**Why.** The state was never only in the conversation. A release issue held the checklist
and what waited on whom. The decision log held each call with the user's words and date.
Plan files held the current step, the changelog and commits held what changed, and branches
were pushed. Check-in prompts named the PR, head commit, what to do if red or green, and the
quoted authority. After each summary the session fetched the PR and git state before acting.
The one near-miss was a paraphrase: "don't delete my account" had to be recorded as
exactly that, with the other accounts written down as an open question for two people.

**Do instead.** Use the `session-continuity` skill: one durable home per kind of state,
updated when it changes; the user's exact words for every decision; check-ins that stand
alone; and a re-check of the world after every summary.

**Then the user added two rules.** Raise inconsistencies and points that need a decision
without being asked, and check the work actually done against the plan. The first check
found a plan that said 124 files cite a document, where the real number was 59, and two
tasks in the task list that the summary's pending list had dropped.

**Evidence.** ogfrench/frogQuiz, 18 Oct: the release tracker issue, the decision log
entries for that day, and PRs merged across compactions without a re-asked question.
