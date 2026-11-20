# Flashcards: Further Maths, starting with Mechanics MC (Work, Energy and Power) — design and the first card set

**Status:** draft (2026-11-20). A student asked for flashcards; Harry wants a revamp of the Computer Science cards for Further Maths: key formulas, equations, properties. Nothing is built. This file holds the design and the first card set (68 cards plus 8 diagram cards), written from the textbook chapter while it was in the conversation. **The card wording is original: facts and formulae only, never the textbook's sentences.**

**Spec statements covered:** MC1 to MC7 (`specs/exam/spec/aqa-mechanics.md`). AS or A2 is a flag on each card (A2 cards are the cos θ, resolving, slope and vector ones), the same Course idea as the MC tools (`specs/further-mechanics-mc.md` §4.5).

## 1. What exists, and what is missing

The Computer Science precedent (`src/shared/cs/modes/FlashcardMode.tsx`, content in each `CSShell` topic) is a **flip card with a plain-text front and back, previous and next, shuffle and reset**. It has no maths rendering (a formula has to be typed as text), no way for a student to say "I knew that", no memory between visits, no filtering, no pictures, and it is a mode of a CS topic page rather than something the Further Maths pages can use. Its dark gradient card also differs from the quiet style the site is moving to (`CLAUDE.md`, Visual direction).

## 2. Proposal

**A shared flashcard component, `src/shared/flashcards/`, used by any page, with the cards as data.** The CS cards are left alone (they can adopt it later).

### Card model (one source, several uses)

```ts
interface Card {
  id: string;                 // "mc-kinetic-energy"
  chapter: string;            // "MC" (a Further Maths chapter code from the spec data)
  statement: string;          // "MC3"
  course: "AS" | "A2";        // A2 for the cos θ, resolving, slope and vector cards
  kind: "formula" | "units" | "condition" | "method" | "trap" | "diagram";
  front: string;              // text with $...$ for maths (KaTeX)
  back: string;
  reverse?: boolean;          // also show it back to front (formula cards: name ↔ formula)
  picture?: { template: string; params: unknown; reveal?: "front" | "back" };  // a mechanics diagram
  note?: string;              // one line of "why", behind an (i)
}
```

A formula card is written once; **Reverse** makes the second card ("which quantity has this formula?") automatically. Tests check every card's KaTeX, unique ids, a valid statement and the flags, as for the generator tools.

### How a student uses it

- **Flip, then rate.** After the answer shows: **Got it · Nearly · Not yet**. This is the part the CS cards lack.
- **Boxes, kept on the device** (a three-box Leitner: Not yet → again soon, Nearly → later, Got it → much later). No account; the same per-device storage the site already uses for settings and saved lists.
- **Pick a set:** by chapter and statement (MC1, MC3…), AS or A2, and card kind; "due today"; "all"; shuffle; **both ways round** on or off.
- **Short sessions:** 10 cards, then a summary of which statements were weakest.
- **Keyboard and swipe,** phone, tablet and laptop as for every tool (`useLayoutMode()`).

### How it looks

The site's quiet style: a white card, slate border and soft shadow, KaTeX at a large size, the statement as a small dot with its code (MC3), the kind as a small label (Formula, Units, When, Method, Watch out), the AS or A2 badge. The back is the same card with the answer, not a coloured gradient. Diagram cards show a **mechanics diagram** (the system in `src/shared/mechanics/`) on the front or the back.

### Where it lives

- **Further Mechanics hub:** a Flashcards entry next to each chapter, so a student on MC lands on the MC set.
- **A page `/further-maths-flashcards`** with the chapter chooser (Pure, Mechanics, Decision…) as sets are written.
- **Printable:** the same cards as a cut-out sheet and as a one-page formula mat (`src/shared/printables.ts`), because students also want paper.
- **Decks and lessons** can embed a card set as a retrieval slide later.

### Why a student would use it more than a list

Cards are **short and single-idea, written for retrieval**, and the traps are cards of their own ("the difference of the squares, not the square of the difference"). The **method** cards ("which principle: work-energy or conservation?") are the thing the generator tools cannot teach and that students find hardest.

## 3. Open questions for Harry

1. **Content rule:** key formulas, units, conditions, methods and traps only, or also definitions in full sentences (for the written "state" questions)? Recommended: facts and short conditions; full definitions only where the spec asks students to state them.
2. **Where first:** the Further Mechanics hub (recommended; the MC set is ready) or a standalone page for all of Further Maths.
3. **Memory:** per-device boxes (recommended, no accounts) or no memory at all (simpler, but then it is only a flip deck).
4. **Printing:** cut-out cards in a first release, or later?
5. **Teacher view:** a teacher cannot see a student's boxes (they are on the student's device). Is that acceptable, or do you want a shareable "weak cards" link?

## 4. Build plan (when agreed)

1. The shared card component, the card data type, the storage of boxes, the page and its tests (no content beyond a handful of cards).
2. The MC set below as `src/flashcards/mechanicsMC.ts`, with the diagram cards added once the cards can show a picture.
3. The Further Mechanics hub entry, the printable sheets, and the dashboard and docs entries (`docs/FEATURES.md`, a pathway).
4. Further chapters (MA, MB, MD, ME, then Pure and Decision) as card sets, each authored from its own source.

## 5. The MC card set (draft)

Level: AS unless marked **A2**. **R** = also shown reversed. `$…$` is KaTeX. The statement is MC1 to MC7 as in the spec.

### MC1 Work done by a force

| ID | Kind | Level | Front | Back |
|---|---|---|---|---|
| mc1-work-line | formula R | AS | Work done by a force acting along the direction of motion | $W = F \times d$ (force in N, distance in m, work in J) |
| mc1-joule | units | AS | One joule in newtons and metres | $1\ \text{J} = 1\ \text{N m}$ |
| mc1-gravity | formula R | AS | Work done by or against gravity when a mass $m$ moves through a vertical height $h$ | $mgh$ (weight × height) |
| mc1-weight-role | condition | AS | When does weight help the motion, and when does it resist it? | Moving down it is a propulsive force (gravity does work on the object); moving up it is a resistive force (work is done against gravity) |
| mc1-total | formula | AS | Total work done on a moving object | Work done by propulsive forces minus work done against resistive forces |
| mc1-convert | trap | AS | Before multiplying force by distance, what must you check? | Everything is in SI units: kN to N and km to m (×1000). Convert the answer to kJ at the end if asked (÷1000) |
| mc1-g | units | AS | The value of $g$ to use | $g = 9.8\ \text{m s}^{-2}$ unless the question says otherwise (some say $g=10$) |
| mc1-angle | formula R | A2 | Work done by a force $F$ at angle $\theta$ to the direction of motion, moving a distance $d$ | $W = Fd\cos\theta$ |
| mc1-perp | condition | A2 | Which component of an angled force does no work? | The component perpendicular to the motion, $F\sin\theta$ |
| mc1-slope | formula | A2 | Work done against gravity moving a distance $d$ up a slope inclined at $\alpha$ to the horizontal | $mgd\sin\alpha$ (equivalently $mgd\cos(90^\circ-\alpha)$, using the angle to the vertical) |
| mc1-slope-angle | trap | A2 | On a slope, which angle goes into $Fd\cos\theta$ for the weight? | The angle between the weight (vertical) and the direction of motion: $90^\circ-\alpha$ if the slope is at $\alpha$ to the horizontal |

### MC5 Work done by a variable force

| ID | Kind | Level | Front | Back |
|---|---|---|---|---|
| mc5-integral | formula R | AS | Work done by a force $f(x)$ moving an object in a straight line from $x_1$ to $x_2$ | $\displaystyle\int_{x_1}^{x_2} f(x)\,dx$ |
| mc5-units-k | units | AS | If the force is $kx$ and all quantities are in SI units, what are the units of $k$? | $\text{N m}^{-1}$ |
| mc5-method | method | AS | A constant driving force works against a resistance that depends on $x$. How do you find the final speed? | Work by driving force $-\int$ (resistance) $dx$ equals the change in kinetic energy; solve for $v$ |
| mc5-why | condition | AS | Why can you not use force × distance when the force varies? | Force changes along the path, so the work is the sum of force × small distance: the integral |

### MC3 Kinetic energy and the work-energy principle

| ID | Kind | Level | Front | Back |
|---|---|---|---|---|
| mc3-ke | formula R | AS | Kinetic energy of mass $m$ moving at speed $v$ | $\tfrac12 mv^2$ (joules, for kg and m s$^{-1}$) |
| mc3-wep | formula R | AS | The work-energy principle | Total work done on an object $=$ change in its kinetic energy $=\tfrac12mv^2-\tfrac12mu^2$ |
| mc3-kmh | units | AS | Convert km h$^{-1}$ to m s$^{-1}$, and back | Divide by $3.6$ (that is $\tfrac{1000}{3600}$); multiply by $3.6$ to go back |
| mc3-root | trap | AS | Solving $v^2 = 64$ for a speed: which root? | The positive one: speed cannot be negative, so $v=8$ |
| mc3-gravity-ke | condition | AS | What does gravity do to kinetic energy going down, and going up? | Down: it does positive work, so KE increases. Up: work is done against it, so KE decreases |
| mc3-vectors | trap | A2 | Kinetic energy from a velocity such as $(3\mathbf i+4\mathbf j)\ \text{m s}^{-1}$ | Use the speed squared, $v^2=3^2+4^2=25$, not the vector |
| mc3-which | method | AS | A question gives forces and distances and asks for a speed, not a time. Which approach? | An energy method (work-energy): it links forces, distance and speed without needing the time |

### MC2 Gravitational potential energy and conservation of energy

| ID | Kind | Level | Front | Back |
|---|---|---|---|---|
| mc2-gpe | formula R | AS | Gravitational potential energy | $mgh$, with $h$ the height above the chosen zero level |
| mc2-zero | condition | AS | Which zero level for GPE is usually best? | The lowest height the object reaches (any level may be chosen, but the working must use it consistently) |
| mc2-conserve | formula R | AS | Conservation of mechanical energy when only the weight acts | $\text{GPE}+\text{KE}=mgh+\tfrac12mv^2=\text{constant}$ |
| mc2-full | formula | AS | The energy equation with a driving force and resistances | $(\text{GPE}_1+\text{KE}_1)+\text{work by driving forces}-\text{work against resistances}=\text{GPE}_2+\text{KE}_2$ |
| mc2-no-double | trap | AS | In that equation, do you also count the work done by gravity? | No: gravity is already accounted for by the GPE terms; counting it again double counts it |
| mc2-vertical | condition | AS | An object moves diagonally up a slope. What changes its GPE? | Only the vertical component of its movement, the height gained; the horizontal part makes no difference |
| mc2-max-height | condition | AS | An object thrown up stops rising. Where has its kinetic energy gone? | All of it has become GPE: $\tfrac12mu^2=mgh_{\max}$, so $h_{\max}=\dfrac{u^2}{2g}$ with no resistance |
| mc2-path | condition | AS | Why is an energy method good for a bumpy or winding journey? | Only the start and end states matter, not the path between them |
| mc2-which | method | AS | Conservation of energy or the work-energy principle: which when? | Conservation ($\text{GPE}+\text{KE}$ constant) only when the weight (and an elastic force) are the only forces doing work; otherwise include the work of the other forces |

### MC7 Power

| ID | Kind | Level | Front | Back |
|---|---|---|---|---|
| mc7-avg | formula R | AS | Average power | Work done $\div$ time taken |
| mc7-watt | units | AS | One watt | $1\ \text{W} = 1\ \text{J s}^{-1}$ |
| mc7-pfv | formula R | AS | Power in terms of force and speed | $P = Fv$ (tractive force × speed; gives the power at an instant) |
| mc7-constant | condition | AS | A vehicle travels at constant speed on level ground. How are the tractive force and the resistance related? | They are equal (resultant force zero), so $P = Rv$ |
| mc7-accel | method | AS | Power $P$, speed $v$, resistance $R$ and mass $m$ are given at an instant. How do you find the acceleration? | Tractive force $T=P/v$, then $T-R=ma$ |
| mc7-falls | condition | AS | At constant power, what happens to the tractive force as the speed rises? | It falls ($T=P/v$), so the acceleration falls until $T=R$ and the speed stops rising |
| mc7-vmax | condition | AS | When is the maximum speed reached? | When the resultant force is zero: $T=R$, so $v_{\max}=P/R$ |
| mc7-kw | units | AS | A power rating is given in kW. What do you do before using $P=Fv$? | Convert to watts (×1000) |
| mc7-kv | method | AS | Resistance $kv$ and a maximum speed $v_{\max}$ at power $P$: find $k$ | At maximum speed $T=kv_{\max}$, so $P=kv_{\max}^2$ and $k=P/v_{\max}^2$ |
| mc7-pump | method | AS | A pump raises water and ejects it at speed $v$. How do you find its power? | Energy gained per second: GPE $+$ KE per second (mass per second from the volume: 1 litre of water has mass 1 kg) |
| mc7-water | units | AS | The density of water, and the mass of one litre | $1000\ \text{kg m}^{-3}$; one litre has mass $1\ \text{kg}$ |
| mc7-hill | formula | A2 | Constant speed up a hill of angle $\alpha$ with resistance $R$ and power $P$ | Tractive force $T=R+mg\sin\alpha$, and $P=Tv$ |
| mc7-time | method | A2 | A car at constant power goes from rest to speed $v$ up a slope in distance $s$. How do you find the time? | Work by engine $=$ work against resistance $+$ KE gained $+$ GPE gained; then time $=$ work $\div$ power |

### MC4 Hooke's law

| ID | Kind | Level | Front | Back |
|---|---|---|---|---|
| mc4-k | formula R | AS | Hooke's law with stiffness $k$ | $T = kx$ |
| mc4-lambda | formula R | AS | Hooke's law with the modulus of elasticity $\lambda$ and natural length $l$ | $T=\dfrac{\lambda x}{l}$ |
| mc4-units | units | AS | Units of stiffness and of modulus of elasticity | $k$: $\text{N m}^{-1}$; $\lambda$: $\text{N}$ |
| mc4-modulus | condition | AS | What is the modulus of elasticity, in words? | The force needed to double the length of the string or spring (extension equal to $l$) |
| mc4-link | formula | AS | How are $k$ and $\lambda$ related? | $k=\lambda/l$ |
| mc4-x | trap | AS | In Hooke's law, what is $x$? | The extension (or compression) from the natural length, not the total length |
| mc4-string-spring | condition | AS | Elastic string or spring: what can each do? | A string can only be stretched (tension; it goes slack if compressed); a spring can be stretched or compressed (tension or thrust) |
| mc4-light | condition | AS | Why do questions say "light" string or spring? | Its mass is ignored, so the tension or thrust is the same all along it |
| mc4-direction | condition | AS | Which way does the tension or thrust act? | Towards restoring the natural length |
| mc4-hang | method | AS | A mass hangs in equilibrium from an elastic string. What equation? | $T=mg$, so $\dfrac{\lambda x}{l}=mg$ |
| mc4-vmax | method | AS | A mass falls on an elastic string. When is its speed greatest? | When acceleration is zero: $T=mg$, at the equilibrium extension $x=\dfrac{mgl}{\lambda}$ |
| mc4-two | method | AS | A mass hangs from two vertical strings. What equation? | $T_1+T_2=mg$, with each $T=\lambda x/l$ and each extension $=$ length $-$ natural length |
| mc4-ab | method | A2 | A mass hangs from two strings fixed at two points A and B on a level. How do you proceed? | Find the angles (cosine rule), resolve horizontally then vertically, then Hooke's law for each string |

### MC6 Elastic potential energy

| ID | Kind | Level | Front | Back |
|---|---|---|---|---|
| mc6-epe | formula R | AS | Elastic potential energy of a string or spring with extension $x$ | $\dfrac{kx^2}{2}=\dfrac{\lambda x^2}{2l}$ |
| mc6-work | formula R | AS | Work done stretching from extension $x_1$ to $x_2$ | $\dfrac{\lambda}{2l}\left(x_2^2-x_1^2\right)$ |
| mc6-trap | trap | AS | The common error in that formula | Use the difference of the squares, $x_2^2-x_1^2$, not the square of the difference, $(x_2-x_1)^2$ |
| mc6-why | condition | AS | Why is the work found by integration? | The tension changes with the extension, so it is $\int \dfrac{\lambda x}{l}\,dx$ |
| mc6-conserve | formula | AS | Conservation of energy with gravity and an elastic string or spring | $\text{GPE}+\text{EPE}+\text{KE}=\text{constant}$ |
| mc6-release | condition | AS | A spring on a smooth table is released. What happens at its natural length? | All the elastic energy has become kinetic: $\dfrac{\lambda x^2}{2l}=\tfrac12mv^2$ |
| mc6-drop | method | AS | A mass is dropped from the fixed end of a string. How do you find the greatest extension? | Energy: $mg(l+x)=\dfrac{\lambda x^2}{2l}$ (distance fallen is $l+x$); solve the quadratic and take the positive root |
| mc6-lowest | method | AS | How do you find the acceleration at the lowest point? | $T-mg=ma$ with $T=\lambda x/l$ at the greatest extension |

### Units and values used throughout

| ID | Kind | Level | Front | Back |
|---|---|---|---|---|
| gen-si | units | AS | Convert: tonne, gram, centimetre, kilometre | $1\ \text{tonne}=1000\ \text{kg}$; $1\ \text{g}=0.001\ \text{kg}$; $1\ \text{cm}=0.01\ \text{m}$; $1\ \text{km}=1000\ \text{m}$ |
| gen-energy-power | units | AS | The units of energy and of power | Energy: joule (J). Power: watt (W) |

**Count:** 68 cards (11 + 4 + 7 + 9 + 13 + 13 + 8 + 2, with the A2 ones flagged), of which about 30 are reversible formula and value cards, so the student meets roughly 100 prompts.

## 6. Diagram cards (when the cards can show a picture)

These reuse `src/shared/mechanics/`; each is a card whose front or back is a generated picture.

| Kind | Front | Back | Picture (template) |
|---|---|---|---|
| diagram | Name every force on this block on a slope | Weight $mg$ (down), normal reaction $R$ (perpendicular to the slope), driving force and resistance (along the slope) | incline with unlabelled arrows |
| diagram A2 | Resolve the weight on this slope | $mg\sin\alpha$ down the slope, $mg\cos\alpha$ into it | incline with the components |
| diagram | Which bars change as the ball falls? | GPE falls, KE rises by the same amount; the total stays the same | energy bars, conserved |
| diagram | What does the shaded area under this force-displacement graph represent? | The work done by the force | force-displacement graph |
| diagram | Mark the natural length and the extension | $l$ from the fixed end to the natural position, $x$ from there to the mass | spring on a table |
| diagram A2 | Which angle goes into $Fd\cos\theta$? | The angle $\theta$ between the force and the direction of motion | force at an angle |
| diagram | How much height does this slope gain? | $h=d\sin\alpha$ for a distance $d$ along the slope | incline with height |
| diagram | At what point is the speed greatest on this string? | Where $T=mg$ (the equilibrium extension), not at the lowest point | hanging string, three positions |
