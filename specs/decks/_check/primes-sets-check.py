# Kept with the plan so the answers can be rechecked: python3 -I specs/decks/_check/primes-sets-check.py (prints the table and any failures).
# The question sets for the Primes and divisibility deck, as data, with an independent check of every answer.
# Run: python3 -I sets.py   (prints the table and any failures)
from math import isqrt

def digits(n): return [int(c) for c in str(n)]
def ds(n): return sum(digits(n))
def alt(n):                                   # alternating sum from the left: +, -, +, ...
    return sum(d if i % 2 == 0 else -d for i, d in enumerate(digits(n)))
def seven_step(n):                            # double the last digit, subtract it from the rest
    return n // 10 - 2 * (n % 10)
def is_prime(n):
    return n > 1 and all(n % d for d in range(2, isqrt(n) + 1))
def which(n, ds_=(2, 5, 10)):                 # brute force: which of ds_ divide n (by remainder, not by the rule)
    return [d for d in ds_ if n % d == 0]
def words(lst):
    return "none of them" if not lst else (str(lst[0]) + " only" if len(lst) == 1 else ", ".join(map(str, lst[:-1])) + " and " + str(lst[-1]))

fails = []
rows = []                                     # (set, rung, question, answer, trap, wrong-method result)
def add(s, rung, q, ans, trap, wrong): rows.append((s, rung, q, ans, trap, wrong))
def check(cond, msg):
    if not cond: fails.append(msg)

# ── Set C: 2, 5, 10 ──
C = [
 (1, 47, "which", "none of them", "ends in 7: odd and not 0 or 5", "-"),
 (2, 120, "which", "2, 5 and 10", "ends in 0 passes all three", "-"),
 (3, 85, "which", "5 only", "5 and 10 are the same rule", "says 10 too"),
 (4, 346, "which", "2 only", "last digit 6 is even but not 0", "says 10 too"),
 (5, 7316483, "yn5", "No", "only the last digit matters", "-"),
 (6, 523, "which2", "neither", "it contains a 2 and a 5", "says yes to 2 and 5"),
]
for rung, n, kind, ans, trap, wrong in C:
    if kind == "which":
        got = words(which(n)); check(got == ans.replace("2, 5 and 10", "2, 5 and 10"), f"C{rung} {n}: brute force says {got}, authored {ans}")
        q = f"Which of 2, 5 and 10 does {n} divide by?"
    elif kind == "yn5":
        got = "Yes" if n % 5 == 0 else "No"; check(got == ans, f"C{rung} {n}: {got} vs {ans}"); q = f"Is {n:,} divisible by 5?".replace(",", " ")
    else:
        got = "neither" if n % 2 and n % 5 else "some"; check(got == ans, f"C{rung} {n}"); q = f"{n} has a 2 and a 5 in it. Is it divisible by 2? By 5?"
    wrong_res = "-"
    if kind == "which2": wrong_res = "yes to both (wrong)"
    if rung == 3: check(85 % 10 != 0 and 85 % 5 == 0, "C3 trap")
    if rung == 4: check(346 % 10 != 0 and 346 % 2 == 0, "C4 trap")
    add("C", rung, q, ans, trap, wrong)

# ── Set D: the rule for 3 ──
D = [
 (1, 51, "Yes", "ends in 1, so the last digit says nothing"),
 (2, 74, "No", "-"),
 (3, 524, "No", "-"),
 (4, 8799, "Yes", "one digit sum is not enough"),
 (5, 1020, "Yes", "zeros add nothing"),
 (6, 173, "No", "ends in 3, so 'last digit 3' says yes"),
]
for rung, n, ans, trap in D:
    got = "Yes" if n % 3 == 0 else "No"; check(got == ans, f"D{rung} {n}: {got} vs {ans}")
    s1 = ds(n); s2 = ds(s1) if s1 > 30 else None
    add("D", rung, f"Is {n} divisible by 3? Use the digit sum.", f"{ans} (digit sum {s1}" + (f", then {s2}" if s2 else "") + ")", trap, "last digit 3, 6 or 9 -> " + ("Yes" if n % 10 in (3, 6, 9) else "No"))
    if rung == 6: check(n % 10 == 3 and n % 3 != 0, "D6 trap must differ")
    if rung == 1: check(n % 10 not in (3, 6, 9) and n % 3 == 0, "D1: last-digit method must say No while the truth is Yes")

# ── Set E: choose the rule ──
E = [
 (1, 60, (2, 3, 5), "2, 3 and 5"), (2, 45, (2, 3, 5), "3 and 5"), (3, 84, (2, 3, 5), "2 and 3"), (4, 130, (2, 3, 5), "2 and 5"),
]
for rung, n, ds_, ans in E:
    got = words(which(n, ds_)).replace(" only", ""); check(got == ans, f"E{rung} {n}: {got} vs {ans}")
    add("E", rung, f"Which of 2, 3 and 5 does {n} divide by?", ans, "-" if rung == 1 else {2: "5 needs the last digit, not a 5 anywhere", 3: "-", 4: "-"}[rung], "-")
check(78 % 6 == 0 and 78 % 2 == 0 and ds(78) % 3 == 0, "E5 78")
add("E", 5, "Is 78 divisible by 6? Use the rules for 2 and 3.", "Yes (even, and 7 + 8 = 15 is in the 3 table)", "-", "-")
check(93 % 6 != 0 and 93 % 3 == 0 and 93 % 2 != 0, "E6 93")
add("E", 6, "Is 93 divisible by 6? Use the rules for 2 and 3.", "No (digit sum 12 fits 3, but 93 is odd)", "6 needs BOTH 2 and 3", "either rule is enough -> Yes")
miss = [d for d in range(10) if (int(f"4{d}6")) % 3 == 0]
check(miss == [2, 5, 8], f"E7 missing digit {miss}")
add("E", 7, "The number 4_6 is divisible by 3. What could the missing digit be?", "2, 5 or 8 (4 + _ + 6 = 12, 15 or 18)", "-", "-")

# ── Set A: prime or not (after the rules) ──
A = [
 (1, 85, "Not prime", "ends in 5, so 5 goes in (5 x 17)", "odd means prime"),
 (2, 51, "Not prime", "digit sum 6, so 3 goes in (3 x 17)", "not in my times tables means prime"),
 (3, 87, "Not prime", "digit sum 15, so 3 goes in (3 x 29)", "not in my times tables means prime"),
 (4, 97, "Prime", "not even, digit sum 16, not 0 or 5, and 7 x 13 = 91 and 7 x 14 = 98", "-"),
 (5, 91, "Not prime", "passes 2, 3 and 5; 7 x 13 = 91", "the rules for 2, 3, 5 are not enough"),
]
for rung, n, ans, why, trap in A:
    check(("Prime" if is_prime(n) else "Not prime") == ans, f"A{rung} {n}")
    add("A", rung, f"Is {n} prime?", f"{ans}: {why}", trap, "-")
check(85 == 5 * 17 and 51 == 3 * 17 and 87 == 3 * 29 and 91 == 7 * 13, "A factor facts")
check(ds(51) == 6 and ds(87) == 15 and ds(97) == 16, "A digit sums")
check(97 % 7 and 7 * 13 == 91 and 7 * 14 == 98, "A4: 7 does not divide 97")
check(all(97 % p for p in (2, 3, 5, 7)) and 11 * 11 > 97, "A4: no prime factor up to 7, and 11x11 > 97")
add("A", 6, "Is 1 prime?", "Not prime (and not composite): it has only one factor", "1 is prime", "-")
add("A", 7, "Is 2 prime?", "Prime: its factors are 1 and 2. It is the only even prime", "2 is not prime because it is even", "-")
check(not is_prime(1) and is_prime(2), "A 1 and 2")

# ── Set F: the rule for 11 ──
F = [(1, 44, "Yes"), (2, 253, "Yes"), (3, 134, "No"), (4, 209, "Yes"), (5, 3817, "Yes"), (6, 5128, "No")]
for rung, n, ans in F:
    got = "Yes" if n % 11 == 0 else "No"; check(got == ans, f"F{rung} {n}: {got}")
    a = alt(n)
    check((a % 11 == 0) == (n % 11 == 0), f"F{rung}: rule disagrees with division for {n}")
    trap = {1: "-", 2: "result 0 means yes", 3: "-", 4: "result 11 means yes", 5: "a negative result (-11) still means yes", 6: "a negative result (-2) is not a multiple of 11"}[rung]
    add("F", rung, f"Is {n} divisible by 11? Use the alternating sum.", f"{ans} (alternating sum {a})", trap, "-")
check(alt(3817) == -11 and alt(209) == 11 and alt(253) == 0, "F special sums")

# ── Set G: the rule for 7 (an extra) ──
G = [(1, 63, "Yes", "6 - 6 = 0"), (2, 203, "Yes", "20 - 6 = 14, in the 7 table"), (3, 95, "No", "9 - 10 = -1"),
     (4, 1295, "Yes", "129 - 10 = 119, then 11 - 18 = -7"), (5, 119, "Yes", "11 - 18 = -7"), (6, 2468, "No", "246 - 16 = 230, then 23 - 0 = 23")]
for rung, n, ans, working in G:
    got = "Yes" if n % 7 == 0 else "No"; check(got == ans, f"G{rung} {n}: {got}")
    # follow the rule down to a number under 70 and compare with the division
    m = n
    while abs(m) >= 70: m = seven_step(abs(m)) if m >= 0 else -seven_step(abs(m))
    check((m % 7 == 0) == (n % 7 == 0), f"G{rung}: rule ends at {m} but division says {got}")
    trap = {1: "-", 2: "-", 3: "-", 4: "two steps needed", 5: "119 looks prime: 7 x 17", 6: "-"}[rung]
    add("G", rung, f"Is {n} divisible by 7? Double the last digit and subtract it.", f"{ans} ({working})", trap, "-")
check(119 == 7 * 17 and 1295 == 7 * 185 and 203 == 7 * 29, "G products")
check(seven_step(1295) == 119 and seven_step(119) == -7 and seven_step(2468) == 230 and seven_step(230) == 23 and seven_step(203) == 14, "G steps")

# ── Quick grids ──
primes = [p for p in range(2, 101) if is_prime(p)]
check(len(primes) == 25, "25 primes")
check([p for p in primes if 10 < p < 30] == [11, 13, 17, 19, 23, 29], "primes 10 to 30")
check(len([p for p in primes if p < 50]) == 15, "primes under 50")
check([(a, b) for a in primes for b in primes if b == a + 2 and 40 < a < 50] == [(41, 43)], "twin pair 40 to 50")
rows += [("Sieve", 1, "Which are the primes between 10 and 30?", "11, 13, 17, 19, 23, 29", "-", "-"), ("Sieve", 2, "How many primes are there below 50?", "15", "-", "-"),
         ("Sieve", 3, "Two primes between 40 and 50 differ by 2. Which?", "41 and 43", "-", "-"), ("Sieve", 4, "How many primes are there below 100?", "25", "-", "-")]
check(len([p for p in primes if p < 10]) == 4 and 7 * 7 == 49 and [6 * k for k in range(1, 6)] == [6, 12, 18, 24, 30], "recap")
rows += [("Recap", 1, "Which prime number is even?", "2", "-", "-"), ("Recap", 2, "Which times table crosses out 49 in the sieve?", "7 (7 x 7)", "-", "-"),
         ("Recap", 3, "Write the first five multiples of 6.", "6, 12, 18, 24, 30", "-", "-"), ("Recap", 4, "How many primes are below 10?", "4 (2, 3, 5, 7)", "-", "-")]
check(132 % 6 == 0 and ds(132) == 6 and 135 % 3 == 0 and ds(135) == 9 and 2346 % 5 != 0 and is_prime(83) and all(83 % p for p in (2, 3, 5, 7)), "exit")
rows += [("Exit", 1, "Is 135 divisible by 3?", "Yes (1 + 3 + 5 = 9)", "-", "-"), ("Exit", 2, "Is 2346 divisible by 5?", "No (ends in 6)", "-", "-"),
         ("Exit", 3, "Is 83 prime?", "Prime (not 2, 3, 5 or 7)", "-", "-"), ("Exit", 4, "Is 132 divisible by 6?", "Yes (even, and 1 + 3 + 2 = 6)", "6 needs both 2 and 3", "-")]

# ── Book work: which of 2, 3 and 5 divide each number ──
BOOK = [36, 77, 70, 124, 135, 210, 255, 368, 441, 500, 623, 114]
for i, n in enumerate(BOOK, 1):
    rows.append(("Book", i, f"Which of 2, 3 and 5 does {n} divide by?", words(which(n, (2, 3, 5))).replace(" only", ""), "-", "-"))
pats = {tuple(which(n, (2, 3, 5))) for n in BOOK}
check(len(pats) >= 6, f"book work should show many different patterns, has {len(pats)}")

# ── Boards ──
check([n for n in range(2, 13) if len([d for d in range(1, n + 1) if n % d == 0]) == 2] == [2, 3, 5, 7, 11], "board factors")
for n, f in {4: 3, 6: 4, 8: 4, 9: 3, 10: 4, 12: 6}.items(): check(len([d for d in range(1, n + 1) if n % d == 0]) == f, f"factor count {n}")
for n in (30, 65, 98, 115, 240, 37): rows.append(("Board 2/5/10", n, f"{n}", words(which(n)), "-", "-"))
for n in (24, 52, 123, 400, 711, 836): check((ds(n) % 3 == 0) == (n % 3 == 0), f"board 3: {n}")
check(39 == 3 * 13 and ds(39) == 12, "board prime 39")
for n in (132, 143, 163, 319, 2728): check((alt(n) % 11 == 0) == (n % 11 == 0), f"board 11: {n}")
for n in (35, 74, 161, 392): check((seven_step(n) % 7 == 0) == (n % 7 == 0), f"board 7: {n}")

# ── Depth claims ──
check(2 % 2 == 0 and is_prime(2), "depth: 2 is even and prime")
check(121 == 11 * 11 and all(121 % p for p in (2, 3, 5, 7)) and not is_prime(121), "depth: 121 passes 2, 3, 5, 7 but is not prime")
check(9 % 3 == 0 and 9 % 6 != 0 and 14 % 2 == 0 and 14 % 6 != 0, "depth: 9 and 14 are not divisible by 6")
check(133 % 3 != 0 and ds(133) == 7 and 133 % 10 == 3 and 133 == 7 * 19, "depth: 133")

print(f"{len(rows)} rows")
for r in rows: print(" | ".join(str(x) for x in r))
print("FAILURES:" if fails else "ALL CHECKS PASSED")
for f in fails: print("  ", f)
