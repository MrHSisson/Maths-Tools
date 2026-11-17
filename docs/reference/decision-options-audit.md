# Decision Question Options audit

**Read when:** Auditing or extending independent Question Options for Decision sub-tools and levels.

Reviewed 2026-11-16–17 on `codex/gantt-print-layouts`. Scope: every sub-tool and level in the six tools using DecisionShell, including Dimensional Analysis. Mixed Strategies uses ToolShell and is outside this shell audit.

The shell previously supported level restrictions only for entire groups. Defaults did not restrict choices, and selections carried across levels and sub-tools. It now filters individual choices, remembers settings separately per sub-tool and level, and validates options at generation boundaries (including saved questions and old links). Course/practice selectors stay shared. Exam-part practice links select the target’s course/practice filters and a level offering the requested task, rather than silently substituting a different question. The level guide also reads the options for the level it describes.

| Tool | Findings and changes |
| --- | --- |
| Critical Path | Explain and justify: delay/removal at L1, claimed finish/add durations at L2. Float and critical paths: start-first only at L2; removed the path-count selector that the level already fixes. Unknown duration: where-x only at L1. Gantt: partial-chart choice only at L1/L3. Allocation: question-type choice only at L3; earlier levels retain their fixed tasks. Histogram block style only at L1/L2 (L3 cutting uses stepped blocks); the same option remains available at every levelling level. Existing histogram, levelling and network-size restrictions retained. |
| Network Flows | Reviewed skills, reasoning and exam routes, AS/A conditions and all levels. Removed capacity scaling from reasoning/exam routes, where the generator ignored it. Reverse-step options are supported at all augment/max-flow levels; retained. Capacity/shape/scale are Numbers, backward steps Method, and question ideas Questions. |
| Minimum Spanning Tree | Network-size override is already restricted to network algorithms, excluding table Prim. Existing setting and ask-for choices work at all levels. Size is Numbers; task/context Questions. |
| Travelling Salesperson | Two-start choice is already restricted to upper-bound questions; the generator only uses it there. All levels support the weight/context choices. Starts is Method, weights Numbers, context Questions. |
| Route Inspection | Triangle/context controls already exclude route classification. Odd-vertex choices are supported at all levels. Odd counts/weights are Numbers; context Questions. |
| Dimensional Analysis | Constant-from-formula only at Dimensions L2, as specified. Show-one-power-zero only at Powers L2/L3; the generator previously promoted L1 silently to a three-power question. Short-formula odd-term/missing-power and contextual questions remain valid customisations at L1. Working/givens are Display; consistency numbers Numbers; task/context Questions. |

Touch option buttons and tabs have at least 40px hit areas. Category tabs use the normal-tool threshold: more than eight visible choices and at least two categories. Smaller menus stay together. Examples benefiting include Gantt charts, resource histograms, levelling, flow construction and dimensions. Categories are explicit config metadata, rather than guessed from labels.

Regression coverage in `src/tests/decisionOptions.test.ts` reads the actual six configurations and traverses every sub-tool/level (including Developing-tools routes), checking legal defaults and rejection of foreign choices. Browser checks cover the exact Explain and justify choices, independent restoration on return, stale URLs, category selection and viewport containment at phone/tablet/laptop sizes.
