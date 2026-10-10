// Depth bank for Speed, Distance & Time — fixed, hand-written questions (see src/shared/depth.ts and specs/depth/speed-distance-time.md).
// Levels follow the IDEAS, not the tool's time-presentation levels:
//   1  Which calculation?     speed = distance ÷ time, what a speed means, which way round
//   2  Minutes and hours      30 minutes is half an hour (not 0.30), scale to one hour, speeds are "per hour"
//   3  Awkward times & averages  1 h 20 min is not 1.2 h, 1.75 h is not 1 h 75 min, average speed, unit conversion
// Items with no `tool` show on every tab (Speed · Distance · Time · Mixed); tab-specific ones name `tool`.
// General items only link to general items, so a follow-up button is never missing on a tab.
// Every numeric claim below is asserted in src/tests/speedDistanceTimeDepth.test.ts.

import type { DepthItem } from "../../shared";

export const DEPTH_ITEMS: DepthItem[] = [
  // ───────────────────────── Level 1 — Which calculation? ─────────────────────────
  {
    id: "sdt-which-op", level: "level1", tool: ["speed","mixed"], purpose: "diagnose", startHere: true,
    title: "Who is right?",
    speakers: [
      { name: "Mei", says: ["A car travels $150$ miles in $3$ hours.", "$150 \\times 3 = 450$, so it travels at $450$ mph."] },
      { name: "Ben", says: ["A car travels $150$ miles in $3$ hours.", "$150 \\div 3 = 50$, so it travels at $50$ mph."] },
    ],
    question: ["Who is right?"],
    options: [
      { text: "Mei", misconception: "Multiplies the two numbers because both are given — never asks what a speed is" },
      { text: "Ben", correct: true },
      { text: "They are both right", misconception: "Thinks the operation doesn't matter as long as it is done to the two numbers" },
    ],
    answer: [
      "Ben is right: speed $= \\text{distance} \\div \\text{time} = 150 \\div 3 = 50$ mph.",
      "A speed is how far you go in one hour, so share the $150$ miles between the $3$ hours.",
      "Mei's $450$ mph would mean $450$ miles in every single hour: far too fast for a car that only covered $150$ miles in total.",
    ],
    teacherNote: "Ask what $450$ mph would mean. Listen for 'multiply because there are two numbers'.",
    ifNotSecure: "sdt-speed-means", ifSecure: "sdt-double-time",
  },
  {
    id: "sdt-speed-means", level: "level1", tool: ["speed","mixed"], purpose: "diagnose",
    title: "What does a speed tell you?",
    question: ["A van travels at $60$ mph. What does that tell you?"],
    options: [
      { text: "It travels $60$ miles every hour", correct: true },
      { text: "The journey is $60$ miles long", misconception: "Confuses the speed with the distance" },
      { text: "The journey takes $60$ hours", misconception: "Confuses the speed with the time" },
    ],
    answer: [
      "A speed of $60$ mph means $60$ miles for every hour travelled.",
      "It says nothing about how long the journey is or how far it goes: that depends on how many hours the van keeps going.",
      "After $1$ hour: $60$ miles. After $2$ hours: $120$ miles. After $3$ hours: $180$ miles.",
    ],
    teacherNote: "Have the class say 'per hour' out loud. Every later mistake in this topic starts with not knowing what a speed measures.",
    ifSecure: "sdt-which-op",
  },
  {
    id: "sdt-time-way", level: "level1", tool: "time", purpose: "diagnose",
    title: "Which way round?",
    question: ["A cyclist rides $60$ km at $15$ km/h. How long does the ride take?"],
    options: [
      { text: "$4$ hours", correct: true },
      { text: "$0.25$ hours", misconception: "Divides the speed by the distance ($15 \\div 60$) — the right numbers, the wrong way round" },
      { text: "$900$ hours", misconception: "Multiplies the two numbers because both are given" },
    ],
    answer: [
      "$60 \\div 15 = 4$ hours.",
      "At $15$ km every hour, ask how many lots of $15$ fit into $60$: that is a division, distance $\\div$ speed.",
      "Sense check: $0.25$ hours is only $15$ minutes — far too short to ride $60$ km at $15$ km/h.",
    ],
    teacherNote: "Ask for the sense check before the calculation: should the time be a few hours, or a few minutes?",
    ifNotSecure: "sdt-speed-means", ifSecure: "sdt-double-time",
  },
  {
    id: "sdt-dist-way", level: "level1", tool: "distance", purpose: "diagnose",
    title: "Which calculation?",
    question: ["A train travels at $80$ km/h for $3$ hours. How far does it go?"],
    options: [
      { text: "$240$ km", correct: true },
      { text: "$26.7$ km", misconception: "Divides ($80 \\div 3$) as if finding a speed — the same habit as 'speed = distance $\\div$ time' applied to every question" },
      { text: "$83$ km", misconception: "Adds the two numbers" },
    ],
    answer: [
      "$80 \\times 3 = 240$ km.",
      "The train covers $80$ km in each of the $3$ hours, so multiply: distance $=$ speed $\\times$ time.",
      "Sense check: in the first hour alone it has already gone $80$ km, so $26.7$ km or $83$ km can't be the total for three hours.",
    ],
    teacherNote: "Ask 'how far in 1 hour? in 2 hours?' to build the multiplication from repeated addition.",
    ifNotSecure: "sdt-speed-means", ifSecure: "sdt-double-time",
  },
  {
    id: "sdt-speed-mps", level: "level1", tool: "speed", needs: ["mps"], purpose: "diagnose",
    title: "Where do the units come from?",
    question: ["A runner covers $100$ m in $20$ seconds. Which is her speed?"],
    options: [
      { text: "$5$ m/s", correct: true },
      { text: "$5$ km/h", misconception: "Right number, but takes the unit from habit rather than from the question — the units come from the quantities" },
      { text: "$2000$ m/s", misconception: "Multiplies the distance by the time" },
    ],
    answer: [
      "$100 \\div 20 = 5$, and the question gave metres and seconds, so the speed is $5$ m/s.",
      "$5$ m/s means $5$ metres every second. Speeds are always 'distance unit per time unit'.",
      "Changing the units changes the number: the same speed is $18$ km/h.",
    ],
    teacherNote: "Ask what $5$ km/h would be like to run. It is a brisk walk, not a sprint.",
    ifNotSecure: "sdt-speed-means", ifSecure: "sdt-decimal-minutes",
  },
  {
    id: "sdt-mix-which-calc", level: "level1", tool: "mixed", purpose: "diagnose",
    title: "Which question fits?",
    question: ["Which of these questions can be answered by working out $150 \\div 3$?"],
    options: [
      { text: "A bus travels $150$ km in $3$ hours. How fast is it going?", correct: true },
      { text: "A bus travels at $150$ km/h for $3$ hours. How far does it go?", misconception: "Sees the numbers $150$ and $3$ and divides without checking which quantity is being asked for ($150 \\times 3 = 450$ km)" },
      { text: "A bus travels $3$ km at $150$ km/h. How long does it take?", misconception: "Divides in the order the numbers appear; the time is distance $\\div$ speed, so $3 \\div 150 = 0.02$ hours" },
    ],
    answer: [
      "Only the first question needs $150 \\div 3$: speed $= \\text{distance} \\div \\text{time} = 50$ km/h.",
      "In the second, a speed and a time are given and the distance is wanted: $150 \\times 3 = 450$ km.",
      "In the third, the time is wanted: $\\text{distance} \\div \\text{speed} = 3 \\div 150 = 0.02$ hours (about $1$ minute and $12$ seconds).",
    ],
    teacherNote: "Always ask first: which two do we know, and which one do we want? The numbers don't decide the operation, the question does.",
    ifNotSecure: "sdt-speed-means", ifSecure: "sdt-mix-half-hour",
  },
  {
    id: "sdt-explain-multiply", level: "level1", tool: ["distance","mixed"], purpose: "explain",
    title: "Spot the error in working",
    working: {
      intro: "A student finds how far a cyclist rides at $12$ km/h for $5$ hours:",
      lines: ["\\text{distance} = 12 \\div 5", "= 2.4 \\text{ km}"],
      wrongLine: 0,
    },
    question: ["Which line is the first mistake, and what should the answer be?"],
    answer: [
      "Line 1 is the first mistake: speed and time should be multiplied, not divided.",
      "Correct: $\\text{distance} = 12 \\times 5 = 60$ km.",
      "Line 2 follows correctly from line 1, but $2.4$ km is less than the $12$ km she covers in the first hour alone.",
    ],
    teacherNote: "Ask which line is the first one that is wrong. Then ask how the student could have known the answer was too small.",
    ifNotSecure: "sdt-speed-means", ifSecure: "sdt-explain-sense",
  },
  {
    id: "sdt-explain-sense", level: "level1", tool: ["distance","mixed"], purpose: "explain",
    title: "Without calculating",
    speakers: [
      { name: "Jamal", says: ["A car travels at $60$ mph for $2$ hours.", "So it goes $60 \\div 2 = 30$ miles."] },
    ],
    question: ["How can you tell Jamal is wrong without doing any calculation? What is the correct distance?"],
    answer: [
      "In the first hour alone the car travels $60$ miles, so after $2$ hours it must be further than $60$ miles, not $30$.",
      "Jamal divided; the distance is speed $\\times$ time $= 60 \\times 2 = 120$ miles.",
      "Estimating first ('more than $60$') catches a wrong operation before it costs marks.",
    ],
    teacherNote: "Listen for 'it can't be less than the first hour'. That sense check works for every distance question.",
    ifNotSecure: "sdt-explain-multiply", ifSecure: "sdt-journeys-40",
  },
  {
    id: "sdt-mix-rule", level: "level1", tool: "mixed", purpose: "explain",
    title: "Does the rule always work?",
    speakers: [
      { name: "Priya", says: ["To find speed, distance or time, I just divide the bigger number by the smaller one."] },
    ],
    question: ["Test Priya's rule on this one: a runner goes at $5$ m/s for $20$ seconds. How far does she run?"],
    answer: [
      "Priya's rule gives $20 \\div 5 = 4$ m: a runner moving $5$ metres every second can't run only $4$ metres in $20$ seconds.",
      "The distance is speed $\\times$ time $= 5 \\times 20 = 100$ m.",
      "The rule happens to work for $150$ km in $3$ hours (speed $= 150 \\div 3 = 50$ km/h) and fails when the distance is the unknown, so you must decide what is wanted first.",
    ],
    teacherNote: "Ask the class to find a question where Priya's rule works and one where it doesn't. The skill is naming the unknown.",
    ifNotSecure: "sdt-mix-which-calc", ifSecure: "sdt-mix-explain-inverse",
  },
  {
    id: "sdt-double-time", level: "level1", tool: ["distance","mixed"], purpose: "extend",
    title: "Always, sometimes or never?",
    question: [
      "Always, sometimes or never true?",
      "\"If you travel for twice as long, you go twice as far.\"",
    ],
    answer: [
      "Sometimes: it is true only if the speed stays the same.",
      "At a steady $40$ mph, $1$ hour gives $40$ miles and $2$ hours gives $80$ miles: twice as long, twice as far.",
      "If the traveller slows down or stops, twice as long can be less than twice as far. The word 'average' in 'average speed' is there for exactly this reason.",
    ],
    teacherNote: "Ask for a counter-example (traffic, a stop at a station). Distance is proportional to time only at a constant speed.",
    ifNotSecure: "sdt-speed-means", ifSecure: "sdt-mile-a-minute",
  },
  {
    id: "sdt-journeys-40", level: "level1", tool: ["speed","mixed"], purpose: "extend",
    title: "Make your own",
    question: ["Write three different journeys that all have a speed of $40$ mph."],
    answer: [
      "For example: $40$ miles in $1$ hour, $80$ miles in $2$ hours, $120$ miles in $3$ hours.",
      "Each time distance $\\div$ time $= 40$: the distance is always $40$ times the number of hours.",
      "Any pair of numbers with a ratio of $40$ to $1$ works; the journeys look different but the speed is the same.",
    ],
    teacherNote: "Ask for the strangest journey with this speed. A sharp class will offer $20$ miles in half an hour: a bridge to Level 2.",
    ifNotSecure: "sdt-which-op", ifSecure: "sdt-which-faster",
  },

  // ───────────────────────── Level 2 — Minutes and hours ─────────────────────────
  {
    id: "sdt-decimal-minutes", level: "level2", purpose: "diagnose", startHere: true,
    title: "Minutes as hours",
    question: ["Which is $45$ minutes written as a number of hours?"],
    options: [
      { text: "$0.75$ hours", correct: true },
      { text: "$0.45$ hours", misconception: "Treats the minutes as the decimal part of an hour, as if an hour had $100$ minutes" },
      { text: "$45$ hours", misconception: "Ignores the change of unit" },
    ],
    answer: [
      "There are $60$ minutes in an hour, so $45$ minutes is $\\dfrac{45}{60} = \\dfrac{3}{4} = 0.75$ hours.",
      "$0.45$ hours would be $0.45 \\times 60 = 27$ minutes.",
      "Speeds are 'per hour', so the time has to be in hours before you multiply or divide.",
    ],
    teacherNote: "Ask 'how many minutes is $0.5$ hours?', then 'is $30$ minutes written as $0.30$ hours?' to expose the $0.30$ habit.",
    ifNotSecure: "sdt-speed-means", ifSecure: "sdt-who-30min",
  },
  {
    id: "sdt-who-30min", level: "level2", tool: ["distance","mixed"], purpose: "diagnose",
    title: "Who is right?",
    speakers: [
      { name: "Leo", says: ["A car travels at $60$ mph for $30$ minutes.", "$60 \\times 30 = 1800$ miles."] },
      { name: "Priya", says: ["$30$ minutes is half an hour.", "$60 \\times 0.5 = 30$ miles."] },
    ],
    question: ["Who is right?"],
    options: [
      { text: "Leo", misconception: "Multiplies a speed per HOUR by a time in MINUTES without converting" },
      { text: "Priya", correct: true },
      { text: "They are both right", misconception: "Thinks the unit of the time doesn't matter" },
    ],
    answer: [
      "Priya is right: $30$ minutes $= 0.5$ hours, and $60 \\times 0.5 = 30$ miles.",
      "Leo's $1800$ miles would be $60$ miles an hour for $30$ hours, not $30$ minutes.",
      "The speed says 'per hour', so the time must be in hours.",
    ],
    teacherNote: "Ask Leo's group what Leo's answer would be in a car: $1800$ miles is London to Moscow in half an hour.",
    ifNotSecure: "sdt-decimal-minutes", ifSecure: "sdt-mile-a-minute",
  },
  {
    id: "sdt-scale-hour", level: "level2", tool: "speed", purpose: "diagnose",
    title: "Scale up to one hour",
    question: ["A cyclist travels $8$ km in $20$ minutes. What is her speed?"],
    options: [
      { text: "$24$ km/h", correct: true },
      { text: "$0.4$ km/h", misconception: "Divides distance by minutes ($8 \\div 20$): that is km per minute, not km per hour" },
      { text: "$160$ km/h", misconception: "Multiplies the distance by the minutes" },
    ],
    answer: [
      "$20$ minutes $\\times\\ 3 = 60$ minutes, so scale the distance by $3$ too: $8 \\times 3 = 24$ km in one hour.",
      "The speed is $24$ km/h. Equivalently, $20$ minutes is $\\tfrac{1}{3}$ of an hour, and $8 \\div \\tfrac{1}{3} = 24$.",
      "The $0.4$ is real but means $0.4$ km every minute; multiply by $60$ minutes to get $24$ km/h.",
    ],
    teacherNote: "A ratio table (minutes, km) scaling to 60 minutes is the cleanest picture here.",
    ifNotSecure: "sdt-decimal-minutes", ifSecure: "sdt-two-ways",
  },
  {
    id: "sdt-dist-20min", level: "level2", tool: "distance", purpose: "diagnose",
    title: "Speed for part of an hour",
    question: ["A train travels at $90$ km/h for $20$ minutes. How far does it go?"],
    options: [
      { text: "$30$ km", correct: true },
      { text: "$1800$ km", misconception: "Multiplies the speed by the minutes without converting to hours" },
      { text: "$4.5$ km", misconception: "Divides the speed by the minutes ($90 \\div 20$)" },
    ],
    answer: [
      "$20$ minutes is $\\tfrac{1}{3}$ of an hour, so the train goes $\\tfrac{1}{3}$ of $90$ km.",
      "$90 \\div 3 = 30$ km.",
      "Check by scaling: $3$ lots of $20$ minutes make an hour, and $3 \\times 30 = 90$ km: the speed we started with.",
    ],
    teacherNote: "Ask for the sense check: if it covers $90$ km in an hour, should $20$ minutes give more or less than $90$ km?",
    ifNotSecure: "sdt-decimal-minutes", ifSecure: "sdt-hours-minutes",
  },
  {
    id: "sdt-time-30min", level: "level2", tool: "time", purpose: "diagnose",
    title: "Hours or minutes?",
    question: ["A car travels $40$ miles at $80$ mph. How long does it take?"],
    options: [
      { text: "$30$ minutes", correct: true },
      { text: "$0.5$ minutes", misconception: "Finds $0.5$ but forgets it is in hours (the units come from the speed's 'per hour')" },
      { text: "$2$ minutes", misconception: "Divides the speed by the distance ($80 \\div 40$), the wrong way round" },
    ],
    answer: [
      "$40 \\div 80 = 0.5$ hours, which is $30$ minutes.",
      "Dividing a distance in miles by a speed in miles per hour gives a time in hours.",
      "Sense check: at $80$ mph the car covers $80$ miles in an hour, so only $40$ miles takes half that time.",
    ],
    teacherNote: "Make them say the unit of the answer before calculating: miles $\\div$ miles per hour $=$ hours.",
    ifNotSecure: "sdt-decimal-minutes", ifSecure: "sdt-hours-minutes",
  },
  {
    id: "sdt-mix-half-hour", level: "level2", tool: "mixed", purpose: "diagnose",
    title: "Half an hour",
    question: ["A train covers $45$ miles in $30$ minutes. What is its speed?"],
    options: [
      { text: "$90$ mph", correct: true },
      { text: "$1.5$ mph", misconception: "Divides by the minutes ($45 \\div 30$): that is miles per minute" },
      { text: "$22.5$ mph", misconception: "Halves the distance because 'half an hour' — should scale it up to a full hour, not down" },
    ],
    answer: [
      "$30$ minutes is half an hour, so in a whole hour the train covers twice as far: $45 \\times 2 = 90$ miles.",
      "The speed is $90$ mph.",
      "$22.5$ mph would be a slower speed than the $45$ miles in $30$ minutes we started with: the answer must be larger than $45$.",
    ],
    teacherNote: "'Half an hour' means the full hour is double. Ask if the speed should be bigger or smaller than $45$.",
    ifNotSecure: "sdt-decimal-minutes", ifSecure: "sdt-mix-explain-inverse",
  },
  {
    id: "sdt-explain-15", level: "level2", tool: ["distance","mixed"], purpose: "explain",
    title: "Spot the error in working",
    working: {
      intro: "A student finds how far a car goes at $48$ mph for $15$ minutes:",
      lines: ["15 \\text{ minutes} = 0.15 \\text{ hours}", "\\text{distance} = 48 \\times 0.15", "= 7.2 \\text{ miles}"],
      wrongLine: 0,
    },
    question: ["Which line is the first mistake, and what should the answer be?"],
    answer: [
      "Line 1 is the first mistake: $15$ minutes is $\\dfrac{15}{60} = 0.25$ hours, not $0.15$.",
      "Correct: $48 \\times 0.25 = 12$ miles.",
      "$0.15$ hours is only $9$ minutes, so the student has found the distance for the wrong time. Lines 2 and 3 follow correctly from line 1.",
    ],
    teacherNote: "Ask what $0.15$ hours is in minutes. $15$ minutes is a quarter of an hour, which is $0.25$, not $0.15$.",
    ifNotSecure: "sdt-decimal-minutes", ifSecure: "sdt-explain-2-4",
  },
  {
    id: "sdt-explain-mo", level: "level2", tool: ["speed","mixed"], purpose: "explain",
    title: "What does that number measure?",
    speakers: [
      { name: "Kofi", says: ["A runner goes $6$ km in $30$ minutes.", "$6 \\div 30 = 0.2$, so her speed is $0.2$ km/h."] },
    ],
    question: ["What does Kofi's $0.2$ actually measure? What is the speed in km/h?"],
    answer: [
      "$0.2$ is kilometres per MINUTE: she runs $0.2$ km every minute.",
      "There are $60$ minutes in an hour, so $0.2 \\times 60 = 12$ km every hour.",
      "Check the other way: $30$ minutes is $0.5$ hours, and $6 \\div 0.5 = 12$ km/h.",
    ],
    teacherNote: "Kofi's arithmetic is right; it's the unit that's wrong. Ask: how far would $0.2$ km/h get you in an hour? A walk to the end of the road.",
    ifNotSecure: "sdt-decimal-minutes", ifSecure: "sdt-two-ways",
  },
  {
    id: "sdt-mix-explain-inverse", level: "level2", tool: "mixed", purpose: "explain",
    title: "Spot the error in working",
    working: {
      intro: "A student finds how long a car takes to go $90$ miles at $60$ mph:",
      lines: ["\\text{time} = \\text{distance} \\times \\text{speed}", "= 90 \\times 60", "= 5400 \\text{ hours}"],
      wrongLine: 0,
    },
    question: ["Which line is the first mistake, and what should the answer be?"],
    answer: [
      "Line 1 is the first mistake: time $= \\text{distance} \\div \\text{speed}$, not distance $\\times$ speed.",
      "Correct: $90 \\div 60 = 1.5$ hours, which is $1$ hour $30$ minutes.",
      "$5400$ hours is over $200$ days, a sign that something went wrong before the car had even left.",
    ],
    teacherNote: "Ask what the units would be: miles $\\times$ miles per hour doesn't give hours. A units check catches the wrong operation.",
    ifNotSecure: "sdt-mix-half-hour", ifSecure: "sdt-mix-make-own",
  },
  {
    id: "sdt-mile-a-minute", level: "level2", tool: ["speed","mixed"], purpose: "extend",
    title: "Speed per minute",
    question: [
      "A car travels at $60$ mph.",
      "Show that it travels exactly $1$ mile every minute. How far does it go in $25$ minutes? In $90$ minutes?",
    ],
    answer: [
      "In one hour ($60$ minutes) it goes $60$ miles, so in one minute it goes $60 \\div 60 = 1$ mile.",
      "In $25$ minutes: $25$ miles.",
      "In $90$ minutes: $90$ miles. Check: $90$ minutes is $1.5$ hours and $60 \\times 1.5 = 90$.",
    ],
    teacherNote: "Ask why this only works at $60$ mph. What would a speed of $30$ mph give per minute? (half a mile)",
    ifNotSecure: "sdt-who-30min", ifSecure: "sdt-double-speed",
  },
  {
    id: "sdt-which-faster", level: "level2", tool: ["speed","mixed"], purpose: "extend",
    title: "Which is faster?",
    question: [
      "Journey A: $20$ miles in $30$ minutes.",
      "Journey B: $35$ miles in $1$ hour.",
      "Which is faster? Convince me.",
    ],
    answer: [
      "A: $30$ minutes is half an hour, so $20$ miles in $30$ minutes is $40$ mph.",
      "B: $35$ miles in $1$ hour is $35$ mph.",
      "A is faster even though it covers less distance: the distance means little unless the time is the same, so compare the speeds.",
    ],
    teacherNote: "Many pick B because 35 > 20. Ask what you'd need to know to compare the distances fairly.",
    ifNotSecure: "sdt-explain-mo", ifSecure: "sdt-two-ways",
  },

  // ───────────────────────── Level 3 — Awkward times & averages ─────────────────────────
  {
    id: "sdt-hours-minutes", level: "level3", purpose: "diagnose", startHere: true,
    title: "Hours and minutes",
    question: ["Which is $1$ hour $20$ minutes written as a number of hours?"],
    options: [
      { text: "$1.2$ hours", misconception: "Writes the $20$ minutes as $0.2$ hours" },
      { text: "$1\\dfrac{1}{3}$ hours", correct: true },
      { text: "$80$ hours", misconception: "Converts to $80$ minutes but then names the unit hours" },
    ],
    answer: [
      "$20$ minutes is $\\dfrac{20}{60} = \\dfrac{1}{3}$ of an hour, so $1$ hour $20$ minutes is $1\\dfrac{1}{3}$ hours ($1.\\dot{3}$ as a decimal).",
      "$1.2$ hours is $1$ hour and $0.2 \\times 60 = 12$ minutes.",
      "That is why times such as $1$ hour $20$ minutes are best kept as a fraction, or converted to minutes for the whole calculation.",
    ],
    teacherNote: "Ask 'how many minutes is $1.2$ hours?' and let the class convert it back to catch the slip themselves.",
    ifNotSecure: "sdt-decimal-minutes", ifSecure: "sdt-units-ms",
  },
  {
    id: "sdt-compound-speed", level: "level3", tool: "speed", needs: ["compoundTime"], purpose: "diagnose",
    title: "A compound time",
    question: ["A cyclist rides $30$ km in $1$ hour $30$ minutes. What is her speed?"],
    options: [
      { text: "$20$ km/h", correct: true },
      { text: "$30$ km/h", misconception: "Ignores the extra $30$ minutes and divides by $1$ hour" },
      { text: "$0.23$ km/h", misconception: "Reads $1$ hour $30$ minutes as $130$ ($30 \\div 130$)" },
    ],
    answer: [
      "$1$ hour $30$ minutes $= 1.5$ hours.",
      "$30 \\div 1.5 = 20$ km/h.",
      "Sense check: in $1.5$ hours at $30$ km/h she would go $45$ km, not $30$, so the speed must be lower than $30$.",
    ],
    teacherNote: "Make them write the time in hours before any dividing. Never combine the 1 and the 30 into a single 'digit string'.",
    ifNotSecure: "sdt-hours-minutes", ifSecure: "sdt-double-speed",
  },
  {
    id: "sdt-awkward-dist", level: "level3", tool: "distance", needs: ["awkwardMinutes"], purpose: "diagnose",
    title: "An awkward number of minutes",
    question: ["A runner goes at $12$ km/h for $40$ minutes. How far does she run?"],
    options: [
      { text: "$8$ km", correct: true },
      { text: "$4.8$ km", misconception: "Writes $40$ minutes as $0.4$ hours" },
      { text: "$480$ km", misconception: "Multiplies the speed by the minutes without converting" },
    ],
    answer: [
      "$40$ minutes is $\\dfrac{40}{60} = \\dfrac{2}{3}$ of an hour.",
      "$\\dfrac{2}{3}$ of $12 = 12 \\div 3 \\times 2 = 8$ km.",
      "$0.4$ hours is only $24$ minutes, and $12 \\times 0.4 = 4.8$ km is the distance for that shorter time.",
    ],
    teacherNote: "Scaling up: $20$ minutes gives $4$ km, so $40$ minutes gives $8$ km, and $60$ minutes gives the $12$ km we started with.",
    ifNotSecure: "sdt-hours-minutes", ifSecure: "sdt-double-speed",
  },
  {
    id: "sdt-time-hm", level: "level3", tool: "time", purpose: "diagnose",
    title: "Hours and minutes for the answer",
    question: ["A lorry travels $140$ km at $80$ km/h. How long does it take?"],
    options: [
      { text: "$1$ hour $45$ minutes", correct: true },
      { text: "$1$ hour $75$ minutes", misconception: "Reads the decimal part of $1.75$ hours as $75$ minutes" },
      { text: "$1.75$ minutes", misconception: "Finds $1.75$ but forgets the answer is in hours" },
    ],
    answer: [
      "$140 \\div 80 = 1.75$ hours.",
      "$0.75$ hours $= 0.75 \\times 60 = 45$ minutes, so the time is $1$ hour $45$ minutes.",
      "'$1$ hour $75$ minutes' can't be right: there are only $60$ minutes in an hour.",
    ],
    teacherNote: "Ask where the $75$ minutes would go. Anything over $60$ can't be the minutes part.",
    ifNotSecure: "sdt-hours-minutes", ifSecure: "sdt-double-speed",
  },
  {
    id: "sdt-units-ms", level: "level3", tool: ["speed","mixed"], purpose: "diagnose",
    title: "Same speed, different units",
    question: ["A car travels at $72$ km/h. What is its speed in m/s?"],
    options: [
      { text: "$20$ m/s", correct: true },
      { text: "$72\\,000$ m/s", misconception: "Changes km into metres but leaves the hours alone" },
      { text: "$259.2$ m/s", misconception: "Multiplies by $3.6$ instead of dividing" },
    ],
    answer: [
      "In one hour the car goes $72\\,000$ m.",
      "One hour is $3600$ seconds, so $72\\,000 \\div 3600 = 20$ m/s.",
      "A quick rule: km/h $\\div\\ 3.6 =$ m/s. Faster in km/h always means a smaller number in m/s, because a second is a much smaller unit than an hour.",
    ],
    teacherNote: "Ask whether a car doing $259$ m/s is plausible (that's faster than a jet airliner).",
    ifNotSecure: "sdt-hours-minutes", ifSecure: "sdt-double-speed",
  },
  {
    id: "sdt-explain-avg", level: "level3", tool: ["speed","mixed"], purpose: "explain",
    title: "Average speed",
    speakers: [
      { name: "Ben", says: ["I drove $60$ miles to a town at $30$ mph, then $60$ miles back at $60$ mph.", "So my average speed was $(30 + 60) \\div 2 = 45$ mph."] },
    ],
    question: ["Explain what is wrong with Ben's method. What was the actual average speed?"],
    answer: [
      "Average speed $= \\text{total distance} \\div \\text{total time}$, not the average of the speeds.",
      "Out: $60 \\div 30 = 2$ hours. Back: $60 \\div 60 = 1$ hour. Total: $120$ miles in $3$ hours.",
      "$120 \\div 3 = 40$ mph. Ben spent more time going slowly, so the slow speed counts for more.",
    ],
    teacherNote: "Ask which speed was kept up for longer. The average has to lean towards it.",
    ifNotSecure: "sdt-hours-minutes", ifSecure: "sdt-two-ways",
  },
  {
    id: "sdt-explain-2-4", level: "level3", purpose: "explain",
    title: "Spot the error in working",
    working: {
      intro: "A student writes $2.4$ hours as hours and minutes:",
      lines: ["0.4 \\times 100 = 40", "2.4 \\text{ hours} = 2 \\text{ hours } 40 \\text{ minutes}"],
      wrongLine: 0,
    },
    question: ["Which line is the first mistake, and what should the answer be?"],
    answer: [
      "Line 1 is the first mistake: to turn a fraction of an hour into minutes, multiply by $60$, not $100$.",
      "Correct: $0.4 \\times 60 = 24$, so $2.4$ hours is $2$ hours $24$ minutes.",
      "$2$ hours $40$ minutes is $2\\tfrac{2}{3}$ hours, about $2.67$ hours: a different time.",
    ],
    teacherNote: "The same slip as 'minutes as a decimal', run in reverse. Ask the class to use the $0.5$ hours = $30$ minutes fact to check.",
    ifNotSecure: "sdt-decimal-minutes", ifSecure: "sdt-double-speed",
  },
  {
    id: "sdt-double-speed", level: "level3", tool: ["time","mixed"], purpose: "extend",
    title: "Always, sometimes or never?",
    question: [
      "Always, sometimes or never true?",
      "\"For the same distance, doubling the speed halves the time.\"",
    ],
    answer: [
      "Always: speed and time are in inverse proportion when the distance is fixed.",
      "For $120$ miles: at $40$ mph it takes $120 \\div 40 = 3$ hours; at $80$ mph it takes $120 \\div 80 = 1.5$ hours.",
      "Doubling the speed halves the time, and trebling it divides the time by $3$. The distance fixes the product speed $\\times$ time.",
    ],
    teacherNote: "Contrast with the Level 1 item: distance is proportional to time at a fixed speed, but time is inversely proportional to speed at a fixed distance.",
    ifNotSecure: "sdt-explain-avg",
  },
  {
    id: "sdt-two-ways", level: "level3", tool: ["speed","mixed"], purpose: "extend",
    title: "Two routes to one speed",
    question: [
      "A cyclist rides $16$ km in $1$ hour $20$ minutes.",
      "Find her speed in km per minute, and in km/h. Which route do you prefer?",
    ],
    answer: [
      "In minutes: $1$ hour $20$ minutes $= 80$ minutes, so the speed is $16 \\div 80 = 0.2$ km per minute.",
      "Then $0.2 \\times 60 = 12$ km/h.",
      "Via hours: $80$ minutes $= \\tfrac{4}{3}$ hours, so $16 \\div \\tfrac{4}{3} = 16 \\times \\tfrac{3}{4} = 12$ km/h: the same answer, with no awkward decimal on the way.",
    ],
    teacherNote: "Both routes give $12$. Ask which has the least rounding danger when the minutes are awkward.",
    ifNotSecure: "sdt-explain-mo",
  },
  {
    id: "sdt-mix-make-own", level: "level3", tool: "mixed", purpose: "extend",
    title: "One journey, three questions",
    question: [
      "A cyclist rides at $16$ km/h for $1$ hour $30$ minutes. How far does she go?",
      "Now write a speed question and a time question about the SAME journey.",
    ],
    answer: [
      "Distance: $1.5$ hours at $16$ km/h gives $16 \\times 1.5 = 24$ km.",
      "Speed question: 'A cyclist rides $24$ km in $1$ hour $30$ minutes. What is her speed?' $24 \\div 1.5 = 16$ km/h.",
      "Time question: 'A cyclist rides $24$ km at $16$ km/h. How long does it take?' $24 \\div 16 = 1.5$ hours, which is $1$ hour $30$ minutes.",
    ],
    teacherNote: "Swap questions between pairs. A good set of three always shows each quantity as the unknown once.",
    ifNotSecure: "sdt-two-ways",
  },

  // ───────────── Added so every sub-tool tab keeps explain and extend at each level ─────────────
  {
    id: "sdt-speed-flip", level: "level1", tool: ["speed", "mixed"], purpose: "explain",
    title: "Divide which way?",
    speakers: [{ name: "Amara", says: ["A train goes $120$ miles in $2$ hours.", "So its speed is $2 \\div 120$."] }],
    question: ["Explain why Amara's calculation cannot give the speed. What should she do?"],
    answer: [
      "Speed is how far you go in one hour, so it is distance $\\div$ time $= 120 \\div 2 = 60$ mph.",
      "$2 \\div 120$ is about $0.017$: that is hours for each mile, how long one mile takes, which is not a speed.",
      "A sense check: a train covering $120$ miles in $2$ hours must be going faster than $1$ mph.",
    ],
    teacherNote: "Ask what the units of her answer would be. 'Hours per mile' sounds odd because it is the inverse of a speed.",
  },
  {
    id: "sdt-dist-same-6", level: "level2", tool: ["distance", "mixed"], purpose: "extend",
    title: "Who goes further?",
    question: [
      "Ruby cycles at $18$ km/h for $20$ minutes. Leo cycles at $12$ km/h for $30$ minutes.",
      "Who goes further? Convince me.",
    ],
    answer: [
      "Ruby: $20$ minutes is $\\dfrac{1}{3}$ of an hour, so $18 \\times \\dfrac{1}{3} = 6$ km.",
      "Leo: $30$ minutes is half an hour, so $12 \\times 0.5 = 6$ km.",
      "They go the same distance: the faster rider rides for a shorter time.",
    ],
    teacherNote: "Many say Ruby (faster) or Leo (longer). The tie surprises them: ask them to invent another pair that ties.",
  },
  {
    id: "sdt-dist-two-ways", level: "level3", tool: ["distance", "mixed"], purpose: "extend",
    title: "Two ways to the distance",
    question: ["A car travels at $45$ mph for $1$ hour $20$ minutes.", "Find the distance in two different ways."],
    answer: [
      "Way 1: $1$ h $20$ min $= 1\\dfrac{1}{3}$ hours, so $45 \\times 1\\dfrac{1}{3} = 60$ miles.",
      "Way 2: split it up: $45 \\times 1 = 45$ miles in the hour, plus $45 \\times \\dfrac{1}{3} = 15$ miles in the $20$ minutes, $= 60$ miles.",
      "Both give $60$ miles. Writing $1.2$ hours would have given $54$ miles.",
    ],
    teacherNote: "A third route is miles per minute: $0.75 \\times 80 = 60$. Which would they choose with awkward numbers?",
  },
  {
    id: "sdt-time-flip", level: "level1", tool: ["time", "mixed"], purpose: "explain",
    title: "Time from a speed",
    speakers: [{ name: "Jamal", says: ["A bus travels $90$ km at $30$ km/h.", "So the time is $30 \\times 90 = 2700$ hours."] }],
    question: ["Explain what is wrong with Jamal's answer. What is the time?"],
    answer: [
      "$2700$ hours is more than three months for a $90$ km trip: it cannot be right.",
      "Time $=$ distance $\\div$ speed $= 90 \\div 30 = 3$ hours.",
      "Check: $3$ hours at $30$ km/h is $30 \\times 3 = 90$ km.",
    ],
    teacherNote: "Ask how long the trip 'should' take before calculating. A sense of size catches the multiplication error.",
  },
  {
    id: "sdt-time-faster-less", level: "level1", tool: ["time", "mixed"], purpose: "extend",
    title: "Always, sometimes or never?",
    question: ["Always, sometimes or never true?", "\"For the same journey, going faster takes more time.\""],
    answer: [
      "Never: for a fixed distance, a higher speed means less time.",
      "$120$ km at $60$ km/h takes $2$ hours; at $80$ km/h it takes $1.5$ hours.",
      "Time $=$ distance $\\div$ speed: dividing by a bigger number gives a smaller answer.",
    ],
    teacherNote: "Ask why a car in traffic might still arrive later: the speed was not the same all the way.",
  },
  {
    id: "sdt-time-unit-slip", level: "level2", tool: ["time", "mixed"], purpose: "explain",
    title: "What are the units?",
    speakers: [{ name: "Mei", says: ["A car travels $30$ miles at $60$ mph.", "$30 \\div 60 = 0.5$, so it takes $0.5$ minutes."] }],
    question: ["Explain Mei's mistake. How long does the journey take?"],
    answer: [
      "$0.5$ is in hours, because the speed is in miles per HOUR: the journey takes $0.5$ hours.",
      "$0.5$ hours is $30$ minutes.",
      "Half a minute for $30$ miles would be $3600$ mph.",
    ],
    teacherNote: "The unit of the answer comes from the unit of the speed. Ask what unit you get dividing miles by miles per hour.",
  },
  {
    id: "sdt-time-two-ways", level: "level2", tool: ["time", "mixed"], purpose: "extend",
    title: "Minutes two ways",
    question: ["How long does $15$ km take at $20$ km/h?", "Give the answer in minutes in two different ways."],
    answer: [
      "Way 1: $15 \\div 20 = 0.75$ hours, and $0.75 \\times 60 = 45$ minutes.",
      "Way 2: $20$ km takes $60$ minutes, so $1$ km takes $3$ minutes and $15$ km takes $15 \\times 3 = 45$ minutes.",
      "Both give $45$ minutes.",
    ],
    teacherNote: "Ask which way they trust when the numbers are awkward, and why the second never needs a decimal.",
  },
];
