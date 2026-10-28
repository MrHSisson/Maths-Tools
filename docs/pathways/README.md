# Development pathways

A **pathway** is a large development: something that needs a new environment, or changes how most tools work or are used, and is not yet fully built. One file per pathway, so two agents rarely collide. Smaller work (a check, a consistency fix, building one tool) is a **task** in `docs/TASKS.md`.

**Route a pathway follows:** idea → building → rolling out → done. A paused or not-doing pathway sits outside the route, with a reason.

**File shape** (the dashboard reads this, so keep the headings and the two header lines):

```
# Title
- **Status:** idea | building | rolling out | done | paused
- **Measure:** (rolling out only) the fact that gives x/n live, e.g. calibrated, depth
- **Updated:** YYYY-MM-DD

## Intention        what it is and why
## Progress         a running note of what is done; kept until the pathway is done
## Next steps       options, pruned as they are done
## Where to read more   specs, reference docs, tools
```

When a pathway is done, add a short summary to the planner Build Log and delete the file (git keeps it). Do not type counts the code can produce: use `Measure`.
