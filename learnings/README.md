# Learnings

Raw notes, one per file, named `YYYY-MM-DD-short-slug.md`. Cheap to write: the point is to
catch the lesson while it is fresh. Curating comes later (see `../CLAUDE.md`).

**The repo is public.** No client names, private-repo content, secrets, hostnames or people.

## Template

```markdown
---
date: 2026-10-11
source: ogfrench/frogQuiz          # public repo, or "a client project" with no detail
tags: [testing, concurrency]
status: raw                        # raw | practice | promoted | retired
promoted_to: []                    # paths this went to, once practice or promoted
---

# One line that states the lesson

**What happened.** The concrete case, in two or three sentences.

**Why.** The mechanism, not the symptom.

**Do instead.** What to do next time.

**Evidence.** A commit, a test that failed first, a measurement. "Seen once" is fine.
```

## Statuses

| Status | Means | `promoted_to` |
| --- | --- | --- |
| `raw` | Captured, not curated yet | empty |
| `practice` | Folded into a `best-practices` topic | the topic file |
| `promoted` | Became a skill, agent, hook, command or plugin (and usually a practice too) | every file it went to |
| `retired` | No longer true, or the tool fixed it; say why in the note | where it was, if anywhere |
