# Project Plan
- **Status:** building
- **Updated:** 2026-11-26

## Intention
Give Harry one place to see what Maths Tools is trying to achieve, what needs doing next and what needs his review. Keep it within reach while he is using a tool.

## Progress
- The floating button opens the current tool’s overview and checklist. Home and hubs open the project map. On larger screens the plan sits to the left of the tool in one workspace. The button can be moved and remembers its position.
- Harry, Codex and Claude can use the same live plan. The plan holds goals, nested checklists, pinned priorities and dependencies. The separate review queue holds specific requests Harry can try.
- One Developing tools unlock covers Project Plan, Admin and deck editing. Admin still shows the deck list, Feature tracker, tool facts and the previous Tasks and Pathways. Existing planning text is still available as a source for migration.

## Next steps

### Before merging
- [ ] Check the branch against the latest main and get CI green.
- [ ] Confirm the production browser password and private Blob storage are configured. Give Codex and Claude the new machine credentials through their approved secret storage and verify read access from both environments. `DEVELOPING_TOOLS_API_KEY` is for scripts that use deck and tool notes. `PROJECT_PLAN_KEY` is for the live plan. Keep them separate from the browser password.
- [ ] Harry checks the preview once using the normal Developing tools prompt. Open Work Done, confirm its plan opens without another prompt, then confirm Admin and the deck editor open in the same session.

### After deployment
- [ ] Check in production that Work Done opens its own checklist and Home opens the map. Save an agreed real action, reload, and confirm it still appears in both places. Submit and complete a specific review request. Check signed-out visitors can still open published decks and cannot open the private plan.
- [ ] Pilot the plan with Further Mechanics. Pick the active goals, lift only the live next actions out of the old notes, and name the person who needs to act or decide where useful. Check the finishes and dates against the currently shipped tools. Use a short link for background.
- [ ] Use the plan for one round of work with both agents. At the start, read the goal and next action. At the end, tick or update that same item, and request Harry’s review only for something specific he can try.
- [ ] Move the remaining active work in small batches once the pilot is easy to use. Link the old history from the live plan where it matters. Check each migrated branch with Harry before reducing the old Tasks and Pathways views. Keep the deck list and Feature tracker in Admin.

The earlier fixed readiness-checklist proposal is in the history of this pathway. Revisit it if the pilot shows a need for shared readiness checks across tools.

## Where to read more
- `AGENTS.md`, the floating project plan workflow.
- `src/projectPlan/` and `api/project-plan.ts`, the plan interface and shared service.
- `docs/TASKS.md` and `docs/pathways/`, the existing planning notes.
