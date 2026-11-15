# Depth Bank Spec: Ratio Sharing

**Status:** draft, for Harry's review (2026-11-15). Not built: nothing is written into `src/` until this is agreed.

Bank for the **Ratio Sharing** tool (`/ratio-sharing`; sub-tools Sharing in a Ratio, Known Amounts, Given Difference, Mixed), exposed as `__test.depthItems`, with `RatioSharingDepth.ts` beside the tool (reference bank: `RatioManipulationDepth.ts`). It pairs with the *Sharing in a ratio* deck (`specs/decks/ratio-sharing.md`), where its "who is right?" cards are the discussion slides, so they are written once.

**Structure.** Fifteen items, five a level. Levels follow the ideas, not the tool's own levels. Items with no `tool` show on every tab; four name their tab. Every level has diagnose, explain and extend items on every tab, one **Start here** per level (all three general: items 1, 6, 11). Speakers are the cast (Ruby, Kofi, Mei, Leo, Priya, Jamal, Amara, Ben); the people being shared among are other names, so a speaker is never also a sharer. No pronouns are assumed anywhere.

| Level | Idea | What goes wrong |
|---|---|---|
| 1 Sharing a total | the parts add to the total; one part, then multiply back; order; check | divides by one ratio number or by the number of people; stops at one part; shares to the wrong person; never checks |
| 2 Known share, difference | which parts the given amount stands for | takes the known share as one part or as the total; takes the difference as the total; divides it by all the parts |
| 3 Choosing and stretching | what the first step is; three parts; simplifying first; checking | picks the wrong first step; misses a part; thinks only a simplified ratio can be shared |

## 1. The misconceptions

New tags in `src/shared/misconceptions.ts` (the trap ids T1 to T11 are in the deck plan; T9, "does not check", is taught by the Check step and item 4, and has no wrong option, so no tag).

| Tag | Level | The misconception | The wrong answer it produces |
|---|---|---|---|
| `sharing-divide-by-part` (T1) | 1 | Divides the total by one ratio number, or by the number of people, not by the total number of parts | £60 in $2 : 3$: $60 \div 2 = 30$ |
| `sharing-no-multiply` (T2) | 1 | Finds the value of one part and stops, or gives it as a share | £60 in $2 : 3$: "£12 each" |
| `sharing-wrong-person` (T3) | 1 | Gives a share to the wrong person: the order of the ratio is not matched to the order of the names | Mia : Jack $= 2 : 3$, gives Mia the larger share |
| `sharing-known-as-part` (T4) | 2 | Treats the known share as the value of one part | $3 : 5$, the first has £24: other share $24 \times 5 = 120$ |
| `sharing-known-as-total` (T5) | 2 | Treats the known share as the total | the same question: "total £24" |
| `sharing-diff-as-total` (T6) | 2 | Takes the difference as a share or as the total | $3 : 7$, difference £48: "the total is £48" |
| `sharing-diff-over-total` (T7) | 2 | Divides the difference by all the parts, not by the difference in parts | £48 $\div 10 = £4.80$ |
| `sharing-wrong-question` (T8) | 2 | Answers a different question (the other share, or one part) | gives the other share when the total is asked |
| `sharing-missed-part` (T10) | 3 | In a three-part ratio, uses only two of the parts | £90 in $2 : 3 : 5$: $90 \div 5 = 18$ |
| `sharing-unsimplified` (T11) | 3 | Thinks a ratio must be simplified before it can be shared, or that simplifying changes the shares | $6 : 9$ cannot be shared as it is |

## 2. Items

`needs` is the Question Option value that must be on (Parts in the Ratio: Three Parts). Every number is asserted in `src/tests/ratioSharingDepth.test.ts` (built with the bank).

| id | Lvl | Purpose | Tab | Title (no answer in it) |
|---|---|---|---|---|
| `rs-who-is-right` | 1 | diagnose, **start here** | all | Who is right? |
| `rs-what-is-12` | 1 | diagnose | sharing, mixed | What does the £12 show? |
| `rs-which-name` | 1 | explain | all | Whose share is it? |
| `rs-check-first` | 1 | explain (spot the error) | sharing, mixed | The first mistake |
| `rs-whole-pounds` | 1 | extend | all | Always, sometimes or never? |
| `rs-known-share` | 2 | diagnose, **start here** | all | Who is right? |
| `rs-known-total` | 2 | diagnose | known, mixed | What is the total? |
| `rs-diff-total` | 2 | diagnose | difference, mixed | What is the total? |
| `rs-diff-divisor` | 2 | explain (spot the error) | all | The first mistake |
| `rs-one-part-gap` | 2 | extend | all | A handy shortcut? |
| `rs-first-step` | 3 | diagnose, **start here** | all | Which first step? |
| `rs-three-parts` | 3 | diagnose | all, **needs** Three Parts | What is one part worth? |
| `rs-simplify-first` | 3 | explain | all | Do they agree? |
| `rs-check-three` | 3 | explain (spot the error) | all, **needs** Three Parts | The first mistake |
| `rs-biggest-share` | 3 | extend | all | Always, sometimes or never? |

Items in full (a speaker's lines are the first-person claim; options list the misconception of each wrong one; the answer lines show one at a time):

1. **`rs-who-is-right`** (L1, diagnose). Kofi: "£60 shared in the ratio $2 : 3$. $60 \div 2 = 30$ and $60 \div 3 = 20$." Mei: "$2 + 3 = 5$ parts. $60 \div 5 = 12$, so £24 and £36." Options: Kofi (`sharing-divide-by-part`) · **Mei** · Both (`sharing-divide-by-part`). Answer: the parts add to $2 + 3 = 5$ and the £60 is split into 5 equal parts, £12 each. Kofi's two amounts add to £50, not £60. Mei's £24 and £36 add to £60. Links: not secure `rs-which-name`, secure `rs-whole-pounds`.
2. **`rs-what-is-12`** (L1, diagnose). Leo shares £60 in the ratio $2 : 3$ and works out £60 $\div$ 5 $=$ £12. What is the £12? Options: the smaller share (`sharing-no-multiply`) · **the value of one part** · the larger share (`sharing-no-multiply`). Answer: £12 is one part. The smaller share is 2 parts, £24; the larger is 3 parts, £36. Links: not `rs-who-is-right`, secure `rs-which-name`.
3. **`rs-which-name`** (L1, explain). Mia and Jack share £60 in the ratio Mia : Jack $= 2 : 3$. Priya says Jack gets £24 "because £24 is the smaller amount and Jack's name comes second". Explain the mistake. Answer: the ratio is written in the order Mia, Jack, so Mia has 2 parts and Jack 3. Jack has the larger share, £36 (`sharing-wrong-person`). Links: not `rs-who-is-right`, secure `rs-whole-pounds`.
4. **`rs-check-first`** (L1, explain, spot the error). £75 shared $2 : 3$. Lines: $2 + 3 = 5$ parts · £75 $\div$ 5 $=$ £15 · first: $2 \times$ £15 $=$ £30 · second: $3 \times$ £15 $=$ £35. First wrong line: the last ($3 \times 15 = 45$). Answer: the second share is £45. A check finds it: £30 + £35 = £65, not £75; £30 + £45 = £75. Links: not `rs-what-is-12`, secure `rs-whole-pounds`.
5. **`rs-whole-pounds`** (L1, extend). Always, sometimes or never: sharing a whole number of pounds in a ratio gives whole-pound shares. Answer: sometimes. £60 in $2 : 3$: £24 and £36. £50 in $3 : 4$: 7 parts, and $50 \div 7$ is not a whole number. It works when the total is a multiple of the number of parts. Links: not `rs-which-name`, secure `rs-known-share`.
6. **`rs-known-share`** (L2, diagnose, **start here**). Ruby: "The ratio is $3 : 5$ and the first person has £24. The other has $24 \times 5 =$ £120." Leo: "$24 \div 3 = 8$ is one part, so the other has $8 \times 5 =$ £40." Options: Ruby (`sharing-known-as-part`) · **Leo** · Both (`sharing-known-as-part`). Answer: £24 is 3 parts, so one part is £8 and the other person's 5 parts are £40. Ruby treated £24 as one part. Links: not `rs-which-name`, secure `rs-diff-divisor`.
7. **`rs-known-total`** (L2, diagnose, tabs known and mixed). Ana and Ola share money in the ratio $3 : 5$. Ana gets £24. What is the total? Options: £24 (`sharing-known-as-total`) · £40 (`sharing-wrong-question`) · £192 (`sharing-known-as-part`) · **£64**. Answer: one part is £8; the total is $8 \times 8 =$ £64 (£24 + £40). £40 is Ola's share; £192 is $24 \times 8$. Links: not `rs-known-share`, secure `rs-diff-divisor`.
8. **`rs-diff-total`** (L2, diagnose, tabs difference and mixed). Ana and Ola share money in the ratio $3 : 7$. Ola gets £48 more than Ana. What is the total? Options: £48 (`sharing-diff-as-total`) · £84 (`sharing-wrong-question`) · **£120**. Answer: the difference is $7 - 3 = 4$ parts, so one part is $48 \div 4 = 12$. Ana £36, Ola £84, total £120. £84 is Ola's share. Links: not `rs-known-share`, secure `rs-diff-divisor`.
9. **`rs-diff-divisor`** (L2, explain, spot the error). Same question as item 8. Lines: ratio $3 : 7$ · difference $7 - 3 = 4$ parts · 4 parts $=$ £48 · 1 part $=$ £48 $\div$ 10 $=$ £4.80 · smaller share $3 \times$ £4.80 $=$ £14.40. First wrong line: the fourth (`sharing-diff-over-total`). Answer: £48 is the difference, 4 parts, so one part is £48 $\div$ 4 $=$ £12. The 10 is the total number of parts, which the difference does not show. Links: not `rs-known-share`, secure `rs-one-part-gap`.
10. **`rs-one-part-gap`** (L2, extend). Jamal: "The difference is £9 and the ratio is $4 : 5$, so one part is £9." Is Jamal right? Would the same shortcut work for $3 : 7$ and £48? Answer: right here, because $5 - 4 = 1$ part, so the difference is one part: £9, shares £36 and £45. For $3 : 7$ the difference is 4 parts, so £48 is 4 parts, not one: one part is £12. The shortcut only works when the parts differ by exactly 1. Links: not `rs-diff-divisor`, secure `rs-first-step`.
11. **`rs-first-step`** (L3, diagnose, **start here**). Three questions each use the ratio $2 : 3$ and the amount £30. (a) "£30 is shared." (b) "The first person gets £30." (c) "The difference is £30." Which one starts with £30 $\div$ 5? Options: **(a)** · (b) (`sharing-known-as-total`) · (c) (`sharing-diff-as-total`). Answer: £30 $\div$ 5 is the first step only when £30 is the whole thing shared (5 parts). In (b) £30 is 2 parts, so one part is £15. In (c) £30 is 1 part (3 - 2), so one part is £30. Links: not `rs-known-share`, secure `rs-simplify-first`.
12. **`rs-three-parts`** (L3, diagnose, **needs** Three Parts). £90 is shared in the ratio $2 : 3 : 5$. What is one part worth? Options: £18 (`sharing-missed-part`) · **£9** · £30 (`sharing-divide-by-part`). Answer: $2 + 3 + 5 = 10$ parts, so one part is £9, and the shares are £18, £27 and £45. £18 is $90 \div 5$, which uses only two of the parts; £30 is $90 \div 3$, the number of people. Links: not `rs-first-step`, secure `rs-check-three`.
13. **`rs-simplify-first`** (L3, explain). £120 shared in the ratio $6 : 9$. Jamal simplifies to $2 : 3$ and gets £48 and £72. Amara uses $6 + 9 = 15$ parts, one part £8, and gets £48 and £72. Explain why they agree. Answer: $6 : 9$ and $2 : 3$ are the same ratio. Amara has 15 parts of £8 and Jamal has 5 parts of £24; 3 of Amara's parts make one of Jamal's. Neither has to simplify first (`sharing-unsimplified`: the idea that it has to be done first). Links: not `rs-first-step`, secure `rs-biggest-share`.
14. **`rs-check-three`** (L3, explain, spot the error, **needs** Three Parts). £84 shared in the ratio $1 : 2 : 4$. Lines: $1 + 2 + 4 = 7$ parts · £84 $\div$ 7 $=$ £12 · $1 \times$ £12 $=$ £12 · $2 \times$ £12 $=$ £24 · $4 \times$ £12 $=$ £58. First wrong line: the last. Answer: $4 \times 12 = 48$. The check shows it: £12 + £24 + £58 = £94, not £84; £12 + £24 + £48 = £84. Links: not `rs-three-parts`, secure `rs-biggest-share`.
15. **`rs-biggest-share`** (L3, extend). Always, sometimes or never: the person with the biggest share gets more than half of the total. Answer: with two different parts, always ($a > b$ gives $\frac{a}{a+b} > \frac12$). With three parts, sometimes: $1 : 2 : 4$ gives $\frac47$, more than half; $2 : 3 : 5$ gives exactly $\frac12$; $3 : 4 : 5$ gives $\frac5{12}$, less. Links: not `rs-simplify-first`, no secure link.

## 3. Acceptance reference

Every number asserted in `src/tests/ratioSharingDepth.test.ts`, each recomputed from the question, and each wrong option's value computed by running its method and checked to differ from the right answer:

- Item 1: $60 \div 5 = 12$; £24 + £36 = £60; $30 + 20 = 50 \neq 60$. Item 2: £12 one part, shares £24 and £36. Item 3: Mia £24, Jack £36. Item 4: $75 \div 5 = 15$; $2 \times 15 = 30$; $3 \times 15 = 45$; $30 + 35 = 65$.
- Item 5: $60 \div 5 = 12$ (whole); $50 \div 7$ is not whole. Item 6: $24 \div 3 = 8$; $8 \times 5 = 40$; $24 \times 5 = 120$. Item 7: total 64; wrong 24, 40, 192. Item 8: $48 \div 4 = 12$; 36, 84; total 120; wrong 48, 84. Item 9: $48 \div 10 = 4.80$; $3 \times 4.80 = 14.40$. Item 10: $5 - 4 = 1$; shares 36, 45; $7 - 3 = 4$.
- Item 11: (a) $30 \div 5 = 6$; (b) $30 \div 2 = 15$; (c) $30 \div 1 = 30$. Item 12: $90 \div 10 = 9$; 18, 27, 45; $90 \div 5 = 18$; $90 \div 3 = 30$. Item 13: $120 \div 5 = 24$, 48 and 72; $120 \div 15 = 8$, 48 and 72. Item 14: $84 \div 7 = 12$; $4 \times 12 = 48$; $12 + 24 + 58 = 94$. Item 15: $4/7$, $5/10$, $5/12$.

Also checked by the tests that apply to every bank (`depth.test.ts`): unique ids, one correct option per multiple-choice item with a named misconception for every wrong one, links that resolve within a tab, diagnose, explain and extend at every level, one Start here a level, every `$…$` renders.

## 4. Open points for Harry

- **Names of the people being shared among** (Mia, Jack, Ana, Ola…) may clash with cast names in a card. In the bank they will be Mia, Jack, Ana and Ola; no cast name is used as a sharer.
- **Item 13's "neither has to simplify first"** is the point of the card. Say if you would rather it were a diagnose question.
- **Quantities and unsimplified ratios** have no card of their own (the unsimplified switch is a variable, which a card's `needs` cannot name); item 13 covers the idea.
