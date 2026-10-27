# CS Topic Spec: Embedded Systems

**Status:** implemented

---

## 1. Overview

| Field | Value |
|---|---|
| Topic name | Embedded Systems |
| Spec sub-topic | 1.1.3 |
| Topic id / URL path | `/embedded-systems` (id `1.1.3`) |
| Paper / component | Component 1 (J277/01) — Computer Systems |
| Card description | The purpose and characteristics of embedded systems, with examples — and how they differ from a general-purpose computer. |
| Activities provided | All six: Learn · Study · Cards · Quiz (+ Spot the Mistake) · Fill · Exam |

**Revision intent:** After this session a student should be able to say what an embedded system is (a computer built into a larger device to carry out one dedicated function), give its typical characteristics (low cost, low power, small, reliable, program in ROM), give examples, and decide whether a given device is an embedded system or a general-purpose computer. It connects backward to 1.1.1 (the CPU inside still runs the fetch-decode-execute cycle) and 1.1.2 (performance traded against cost and power), and sideways to 1.2.1 (ROM and RAM).

This topic replaces the 1.1.3 strand of the original all-in-one System Architectures tool, which was retired on 2026-10-27 once 1.1.1, 1.1.2 and 1.1.3 each had their own tool.

---

## 2. Spec tags (spec fidelity)

| Tag id | Spec statement |
|---|---|
| `1.1.3-R1` | The purpose of embedded systems. |
| `1.1.3-R2` | The characteristics of embedded systems. |
| `1.1.3-R3` | Examples of embedded systems. |

Real-time operating systems, firmware and microcontrollers are **not** in the GCSE specification. The old tool taught RTOS as if it were; here they are clearly flagged `beyondSpec` and off in default sessions.

---

## 3. Glossary

embedded system · general-purpose computer · dedicated function · ROM · non-volatile · volatile · RAM; beyond spec: firmware · microcontroller · RTOS.

---

## 4. Learn — taught lessons

| Lesson | Covers | Representation |
|---|---|---|
| What is an embedded system? | `1.1.3-R1` | One focused box schematic: inputs → CPU (with its ROM program) → outputs inside a washing machine; flow tokens for program, water level and "start motor" |
| Characteristics of embedded systems | `1.1.3-R2` | Text; predict why low power matters and whether the program lives in RAM or ROM |
| Examples of embedded systems | `1.1.3-R3` | Text; home, vehicles, public places and medicine; predict whether a laptop is one, and whether "embedded" means tiny |
| Embedded or general-purpose? | `1.1.3-R1`, `1.1.3-R2` | Text; the dishwasher and the spreadsheet-machine decisions |

---

## 5–11. Content

Authored verbatim in `src/tools/ComputerScience/EmbeddedSystems.tsx`: 13 core flashcards (+3 beyond spec), 4 cloze exercises, 6 misconception checks (one true), 8 exam questions (mcq → 6-mark discussion, with mark schemes and model answers; contexts with model notes for the explain and discuss questions) + 1 beyond-spec RTOS evaluation, and 3 synoptic questions (1.1.3 with 1.2.1, 1.1.1 and 1.1.2, with per-tag mark attribution). Correctness (each exam answer ↔ its mark scheme, each cloze slot ↔ its word pool) is guarded by `validateTopic` through `src/tests/cs-topics.test.ts`.

---

## 12. Out of scope / future ideas

- Sensors and actuators as named terms: useful for the "examples" lessons, but not in the 1.1.3 wording, so only the schematic's Inputs and Outputs labels carry the idea.
- Natural next synoptic partner: **1.2.1 Primary storage** (RAM, ROM, volatile and non-volatile), which this topic leans on.
