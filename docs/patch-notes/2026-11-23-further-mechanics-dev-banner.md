Strand: Maths

## 2026-11-23 — Further Mechanics: open to everyone, with a "still in development" banner

Branch `claude/vigilant-cerf-3a5oah`. Area: `src/shared/components/DevNotice.tsx`, `src/shared/decision/` (a `devNotice` setting), `src/tools/FurtherMechanics/`, `SpecLanding.tsx`.

- The Work, Energy and Power range (Work Done, Energy, Power, Elastic Strings and Springs, the flashcards and the MC chapter on the hub) is not dev-gated, but each now opens with an amber **Still in development** banner saying it is open to use but still being built and checked, so questions, wording and pictures may change. The banner can be closed with the cross and stays closed for the rest of the visit in that tab (it comes back on the next visit). It is a new shared piece (`DevNotice`) that any tool can use: a Decision-shell tool sets `config.devNotice`, a hub chapter sets `notice`.
- Test: `mcNotice.test.ts` (each tool carries the notice and is not dev-gated). Checked in Chromium as a visitor: the banner shows on all four tools, the flashcards and the MC chapter, closes, stays closed on reload, and does not close the other tools' banners; phone width checked.
- To take the range out of "in development" later: delete the `devNotice` line from the four tools, the `notice` on the chapter and the banner in the flashcards (all use `MC_NOTICE` in `mcNotice.ts`).

Agent: Claude Code
Notes: Build Log block "Further Mechanics: development banner (Claude Code)" (tag agent:claude-code), branch `claude/vigilant-cerf-3a5oah`.
