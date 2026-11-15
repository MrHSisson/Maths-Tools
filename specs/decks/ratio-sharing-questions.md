# Sharing in a ratio: the authored questions

Written by `src/tests/ratioSharingSets.test.ts` from `specs/decks/ratio-sharing-sets.ts` (run with `WRITE_TABLE=1`). Every answer was recomputed from the numbers shown by arithmetic that does not use the tool's builders; the tool's own builder agrees with each; the wrong method was run on each and differs from the right answer. The trap ids are in `specs/decks/ratio-sharing.md`. For a grid, the wrong result is the first share.

## Set A: sharing from a total (the 3 × 3 grid on the board)

Instruction above the grid: **Share each amount in the ratio given.** Each cell is the amount over the ratio; every cell asks for every share.

| # | Rung | As shown | Answer | Trap it is built for | The wrong method gives |
|---|---|---|---|---|---|
| A1 | 1 : n, small total | £40 · 1 : 4 | £8 and £32 | T1 divides by 2 | £20 |
| A2 | 1 : n, other multiple | £28 · 1 : 6 | £4 and £24 | T1 divides by 2 | £14 |
| A3 | a : b, two different parts | £65 · 2 : 3 | £26 and £39 | T1 divides by 2 | £32.50 |
| A4 | the larger number comes first | £42 · 5 : 2 | £30 and £12 | T2 stops at one part | £6 |
| A5 | not money | 64 kg · 3 : 5 | 24 kg and 40 kg | T1 divides by 2 | 32 kg |
| A6 | larger total and parts | £132 · 5 : 7 | £55 and £77 | T1 divides by 2 | £66 |
| A7 | ratio not in simplest form | £112 · 6 : 8 | £48 and £64 | T11 mixes the forms | £96 |
| A8 | three parts | £72 · 1 : 3 : 4 | £9, £27 and £36 | T10 misses a part | £18 |
| A9 | three parts, pounds and pence | £22.50 · 2 : 3 : 4 | £5, £7.50 and £10 | T10 misses a part | £9 |

## Set B: a known share (printed sheet of nine, textbook layout)

| # | Rung | As shown | Answer | Trap it is built for | The wrong method gives |
|---|---|---|---|---|---|
| B1 | 1 : n, the known share is the one part; find the other | Mia and Jack share money in the ratio 1:4 / Mia receives £15 / How much does Jack receive? | Jack: £60 | none: the known share is one part, where the T4 method happens to agree (the easy start) | n/a (the method agrees here, on purpose) |
| B2 | 1 : n, the known share is the larger; find the other | Priya and Leo share money in the ratio 1:5 / Leo receives £55 / How much does Priya receive? | Priya: £11 | T4 treats the known share as one part | £55 |
| B3 | a : b, find the total | Zane and Isla share money in the ratio 2:3 / Zane receives £16 / What is the total amount shared? | Total: £40 | T5 treats the known share as the total | £16 |
| B4 | the known share is the second person's | Noah and Grace share money in the ratio 3:4 / Grace receives £32 / How much does Noah receive? | Noah: £24 | T3 gives the shares to the wrong people | £32 |
| B5 | not money, find the total | Ruth and Sam share marbles in the ratio 4:3 / Ruth receives 36 marbles / What is the total amount shared? | Total: 63 marbles | T4 treats the known share as one part | 252 marbles |
| B6 | larger numbers, find the other | Finn and Olivia share money in the ratio 5:8 / Finn receives £70 / How much does Olivia receive? | Olivia: £112 | T4 treats the known share as one part | £560 |
| B7 | ratio not in simplest form, find the other | Hugo and Ella share money in the ratio 6:9 / Hugo receives £54 / How much does Ella receive? | Ella: £81 | T11 mixes the forms | £243 |
| B8 | three parts, find the total | Dev, Maya and Tom share money in the ratio 3:4:5 / Maya receives £68 / What is the total amount shared? | Total: £204 | T10 misses a part | £119 |
| B9 | three parts, find a different share | Eli, Zoe and Max share money in the ratio 2:5:6 / Eli receives £14 / How much does Max receive? | Max: £42 | T4 treats the known share as one part | £84 |

## Set C: a difference (printed sheet of nine, textbook layout)

| # | Rung | As shown | Answer | Trap it is built for | The wrong method gives |
|---|---|---|---|---|---|
| C1 | 1 : 3, "more than", find the larger share | Rosa and Carl share money in the ratio 1:3 / Carl receives £22 more than Rosa / How much does Carl receive? | Carl: £33 | T6 treats the difference as a share | £22 |
| C2 | 1 : 3, "less than", find the total | Ivy and Sid share money in the ratio 1:3 / Ivy receives £26 less than Sid / What is the total amount shared? | Total: £52 | T6 treats the difference as the total | £26 |
| C3 | 2 : 5, three parts apart, find the smaller share | Nia and Pete share money in the ratio 2:5 / Pete receives £45 more than Nia / How much does Nia receive? | Nia: £30 | T7 divides by all the parts | £12.86 |
| C4 | "the difference between their shares", find the total | Joy and Alan share money in the ratio 4:7 / The difference in their amounts is £33 / What is the total amount shared? | Total: £121 | T6/T7 the difference comes out as the total | £33 |
| C5 | the first named has less; find the first's share | Lena and Omar share money in the ratio 2:7 / Omar receives £30 more than Lena / How much does Lena receive? | Lena: £12 | T3 gives the shares to the wrong people | £42 |
| C6 | not money, the first has more; find the total | Tara and Will share sweets in the ratio 5:3 / Tara receives 34 more sweets than Will / What is the total amount shared? | Total: 136 sweets | T6/T7 the difference comes out as the total | 34 sweets |
| C7 | larger numbers, find the total | Rhys and Cleo share money in the ratio 7:4 / The difference in their amounts is £96 / What is the total amount shared? | Total: £352 | T6 treats the difference as the total | £96 |
| C8 | three parts, the difference between two people, find the third | Abe, Beth and Cole share money in the ratio 3:4:8 / The difference between Abe's and Cole's shares is £25 / How much does Beth receive? | Beth: £20 | T10 compares the wrong parts | £100 |
| C9 | three parts, the difference, find the total | Dana, Eric and Fay share money in the ratio 3:5:7 / Fay receives £52 more than Dana / What is the total amount shared? | Total: £195 | T10 compares the wrong parts | £390 |

## Worksheet D: mixed, fifteen (printed, textbook layout)

The kinds are not labelled. Five sharing, five known share, five difference, interleaved and climbing.

| # | Rung | As shown | Answer | Trap it is built for | The wrong method gives |
|---|---|---|---|---|---|
| D1 | sharing, two parts, one share asked | Kim and Raj share £85 in the ratio 2:3 / How much does Raj receive? | Raj: £51 | T8 answers a different question | £17 |
| D2 | known share, find the total | Ola and Pat share money in the ratio 3:4 / Ola receives £39 / What is the total amount shared? | Total: £91 | T5 treats the known share as the total | £39 |
| D3 | difference, "less than", find the total | Quin and Rae share money in the ratio 1:4 / Quin receives £57 less than Rae / What is the total amount shared? | Total: £95 | T6 treats the difference as the total | £57 |
| D4 | sharing, the larger number first | Sia and Tim share £104 in the ratio 5:3 / How much does Sia receive? | Sia: £65 | T3 gives the shares to the wrong people | £39 |
| D5 | known share, the larger part is known | Uma and Vik share money in the ratio 2:7 / Vik receives £49 / How much does Uma receive? | Uma: £14 | T4 treats the known share as one part | £98 |
| D6 | sharing, ratio not in simplest form | Walt and Xena share £130 in the ratio 8:12 / How much does Walt receive? | Walt: £52 | T11 mixes the forms | £208 |
| D7 | known share, not money | Yara and Zack share paint in the ratio 3:5 / Zack receives 20 litres / What is the total amount shared? | Total: 32 litres | T5 treats the known share as the total | 20 litres |
| D8 | difference, not money | Abel and Bea share flour in the ratio 4:9 / Bea receives 10 kg more than Abel / What is the total amount shared? | Total: 26 kg | T6/T7 the difference comes out as the total | 10 kg |
| D9 | sharing, larger numbers, the second share asked | Cy and Di share £228 in the ratio 7:5 / How much does Di receive? | Di: £95 | T3 gives the shares to the wrong people | £133 |
| D10 | known share, unsimplified, the second is known | Eve and Fox share money in the ratio 10:4 / Fox receives £12 / How much does Eve receive? | Eve: £30 | T11 mixes the forms | £60 |
| D11 | sharing, three parts | Gus, Hana and Ian share £144 in the ratio 1:2:3 / How much does Hana receive? | Hana: £48 | T10 misses a part | £96 |
| D12 | known share, three parts, find the total | Jo, Kai and Liv share money in the ratio 2:3:4 / Kai receives £51 / What is the total amount shared? | Total: £153 | T5 treats the known share as the total | £51 |
| D13 | difference, three parts, a middle share | Mo, Ned and Pia share money in the ratio 3:5:7 / The difference between Mo's and Pia's shares is £8 / How much does Ned receive? | Ned: £10 | T7 divides by all the parts | £2.67 |
| D14 | difference, three parts, unsimplified, find the total | Ron, Sue and Ted share money in the ratio 4:6:10 / Ted receives £44 more than Sue / What is the total amount shared? | Total: £220 | T11 mixes the forms | £440 |
| D15 | difference, three parts, not money (the stretch) | Una, Vic and Wes share flour in the ratio 2:3:6 / The difference between Vic's and Wes's shares is 27 kg / What is the total amount shared? | Total: 99 kg | T10 compares the wrong parts | 297 kg |

