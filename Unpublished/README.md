# Unpublished

Holding area for tools that are **not** ready for v2.3 migration — kept for
reference and future work, but deliberately kept out of the build.

## Why these are safe to keep here

This folder lives at the **repo root**, outside `src/`, so:

- `tsconfig.json` only includes `src` (and now explicitly excludes
  `Unpublished`) — `tsc` never type-checks these files.
- Vite's build follows the module graph from `src/main.tsx` — nothing here
  is imported, so nothing here is bundled.
- The generator smoke tests (`src/tests/generators.test.ts`) glob
  `src/tools/**/*.tsx` — this folder isn't under that path.
- None of these tools are registered in `src/registry.ts`, so no routes
  exist for them.

CI and Vercel deploys are therefore unaffected by anything in here, however
broken or in-progress it is.

## Rules

- **Do not** move these files into `src/`, register them in
  `src/registry.ts`, or migrate them to the v2.3 `ToolShell` pattern unless
  explicitly asked to do so for a specific tool.
- It's fine to **read** these files for reference (e.g. porting maths logic
  into a new v2.3 tool written from scratch), but treat them as archive
  material, not working code.
