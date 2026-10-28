# Claude Code practices audit, October 28, 2026

Scope: the public repository's first-party skills, documented third-party plugins,
subagent, session setup, knowledge pipeline and tool selection. Sources are
upstream documentation, not a claim that this repository has benchmarked the
proposed architecture. Keep private project names and traces out of this file.

## Decision

**Use one main agent loop first.** Give it a short project briefing, specialized
on-demand skills, selective reference files and bounded tools. Add agents
only for measured context isolation, independent review, genuine safe parallelism
or conflicting instructions. Fold one at a time and compare individual failures,
not just aggregate success. The October 2026 Anthropic guidance reports
enterprise comparisons, not a universal theorem about all Claude Code workloads.

Boundary | Default | Keep a subagent when
--- | --- | ---
Short code search, writing, local reasoning | Main agent and CLI | Fresh context significantly improves completion
Reusable workflow, team judgment | Skill, not a role-playing agent | Tests show skill is insufficient
External lookup or write | CLI/MCP, validate caller authorization | Isolation is independently required
Large documentation corpus | Targeted search/reference file | A bounded research pass reduces context contamination
Independent code review | Main reviewer or read-only reviewer | Independent reviewer catches meaningful misses
Parallel implementation | Sequential main loop | Independent worktrees and measured wall-time gain

## Audit of first-party skills and agent

| Component | Disposition | Evidence-based change or remaining test |
| --- | --- | --- |
| model-delegation | Revised | Main-loop default, architecture comparison, model/effort treated as variables |
| token-efficiency | Revised | Removed default Explore delegation and unqualified background execution |
| learning-loop | Revised | Positive, negative and ambiguous evaluations before promotion |
| best-practices | Keep generated | Edit practice nodes and regenerate, never hand-edit topic files |
| cheap-reviewer agent | Retain provisionally | Read-only second perspective; compare against main-only reviews |
| session-continuity | Revised | Work-state persistence must not imply permission to push |
| visual-loop | Revised | Avoid fixed overproduction of design variants |
| actions-cost | Corrected | Rounded job billing applies to billable private-repo GitHub-hosted runs |
| netlify-cost | Corrected | Include compute and AI-inference credits, check plan-specific rates |
| issue-management | Keep | Scope and acceptance checks are sound; no agent required by default |
| frogify | Keep | Specialized writing voice; check factual claims separately |
| deslopify | Keep | Copy anti-pattern review; narrow triggering relative to humanizer |
| humanizer | Keep vendored | Do not change upstream material casually; check overlap and licensing |

## Documented external plugins

| Group | Plugins | Review decision |
| --- | --- | --- |
| Agent-heavy workflows | superpowers, code-review | No automatic parallel orchestration; compare their output/cost against main-loop review |
| Editing and review | code-simplifier, commit-commands, claude-md-management | Use on demand; avoid duplicate learning or destructive automation |
| Code navigation | serena, typescript-lsp | Keep for semantic lookup; compare overlap and tool-selection cost |
| Data and browsers | github, context7, playwright | Use for real external operations or UI tests, verify authorization and environment |
| Design | frontend-design, 21st | Use for actual design work, not as always-on prose |
| Personal modes | caveman, ponytail | User scope only, as already documented |

Do not turn off a plugin just because its label overlaps another. Verify active
use with `/skill-doctor` and measure the affected workflows. Third-party pins
are a supply-chain control only if upstream diffs are reviewed before bumps.
Review plugin tool permissions and any install scripts as code, not as mere prompts.
The repository's broad enabledPlugins set is a candidate for measured trimming,
not an authorized automatic migration. Keep current settings unchanged here.

## Evaluation protocol

1. Baseline: choose 5 to 10 real, public-safe golden tasks. Include one chained
   workflow for each proposed fold, security/permissions boundaries and negative
   skill triggers. Do not publish task inputs derived from a private repo.
2. Record the original approach, configured model/effort, exact tools, success
   requirements, evidence and whether outputs were checked.
3. Compare only one architectural change per experiment. Run cases more than
   once when results vary. Record both passes and failures.
4. Track completion, rule violations, mandatory lookups, correct skill/tool
   invocation, manual correction, latency and total spend. No invented scores.
5. Keep or revert based on regressions, especially correctness and security.
6. Use `claude plugin eval` for plugin-level with/without comparisons on
   compatible versions. Validate each plugin's actual CLI support before use.
   Use `/skill-doctor` for discovery/usage and `skill-creator` for authoring
   iterations. These are not substitutes for task-level outcomes.
7. Review prompt-injection and external skill trust. Model instructions do
   not replace deterministic permissions, hooks and server-side auth.

### Routing test cases (run, not presumed passing)

| Case | Expected behavior |
| --- | --- |
| Small code clarification | Main loop reads the specific symbol; no mandatory agent |
| Long independently bounded read-only audit | Consider isolated reviewer only if it adds value |
| Cross-module design and implementation | Main loop owns decisions and verification |
| User asks for subagent simplification | Test with and without the agent; preserve missed steps |
| An unfamiliar external service write | Authorization checked by the tool; no autonomous privilege escalation |
| A writing rewrite | Invoke one best-matching writing skill; avoid stacking overlapping prompts |

## Cloud and delivery cautions

Claude Code now distinguishes account-synced skills, repository skill directories,
plugin skills and cloud project threads. These do not load identically. In
cloud sessions, enabled plugins in a project's settings are not automatically
installed. Account-synced skills are a separate mechanism. Do not assert that
the entire local install is always present. The shell bootstrap currently
downloads a mutable main-branch installer; consider a commit-pinned release
and integrity review before making that path more automatic.

## Primary sources and checks

- Anthropic, agent simplification: https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop
- Claude Code, skills and loading: https://code.claude.com/docs/en/skills
- Claude Code, subagents: https://code.claude.com/docs/en/sub-agents
- Claude Code, best practices: https://code.claude.com/docs/en/best-practices
- Claude Code, plugin evaluation: https://code.claude.com/docs/en/skills#evaluate-and-iterate-on-a-skill
- Claude Code, instructions and rules: https://code.claude.com/docs/en/memory
- Claude Platform, skill authoring: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Claude Platform, skill security: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- GitHub Actions job billing: https://docs.github.com/en/actions/how-tos/monitor-workflows/view-job-execution-time
- Netlify credit meters: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/

Review date: 2026-10-28. Source-verified advice is not a result from live
Claude Code skill evals or any production experiment. No project copies have
been synchronized and no plugin was installed or removed.
