import { describe, expect, it } from "vitest";
import { isFinished, isRunning, isTimerMinutes, pauseCountdown, resumeCountdown, secondsLeft, startCountdown, timeText, timerColour, toggleCountdown, TIMER_MINUTES } from "../decks/timerMath";
import { checkDeck } from "../../api/_decks";

describe("the deck timer", () => {
  it("offers 1 to 10 minutes and nothing else", () => {
    expect([...TIMER_MINUTES]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect([0, 11, 2.5, "3", null].map(isTimerMinutes)).toEqual([false, false, false, false, false]);
    expect(isTimerMinutes(7)).toBe(true);
  });

  it("counts down from the clock, not from how often anything redraws", () => {
    const c = startCountdown(2, 1_000_000);
    expect(secondsLeft(c, 1_000_000)).toBe(120);
    expect(secondsLeft(c, 1_000_000 + 30_000)).toBe(90);
    expect(isRunning(c)).toBe(true);
    expect(secondsLeft(c, 1_000_000 + 500_000)).toBe(0);
    expect(isFinished(c, 1_000_000 + 120_000)).toBe(true);
  });

  it("pauses where it is and resumes from there", () => {
    const c = startCountdown(3, 0);
    const paused = pauseCountdown(c, 60_000);
    expect(paused.left).toBe(120);
    expect(secondsLeft(paused, 999_999)).toBe(120);                       // time passing changes nothing while paused
    const again = resumeCountdown(paused, 500_000);
    expect(secondsLeft(again, 500_000 + 20_000)).toBe(100);
  });

  it("the one control pauses a running timer, resumes a paused one and starts a finished one over", () => {
    let c = startCountdown(1, 0);
    c = toggleCountdown(c, 10_000);
    expect(isRunning(c)).toBe(false);
    c = toggleCountdown(c, 50_000);
    expect(isRunning(c)).toBe(true);
    expect(secondsLeft(c, 50_000)).toBe(50);
    expect(secondsLeft(toggleCountdown(c, 200_000), 200_000)).toBe(60);    // it had run out: a fresh minute
    const idle = startCountdown(5, 0, false);                              // a slide's timer that waits to be started
    expect([isRunning(idle), secondsLeft(idle, 1_000_000)]).toEqual([false, 300]);
    expect(secondsLeft(toggleCountdown(idle, 1_000_000), 1_010_000)).toBe(290);
  });

  it("shows m:ss rounded up, and goes amber then red near the end", () => {
    expect([timeText(300), timeText(61), timeText(59.2), timeText(0.4), timeText(0), timeText(-3)]).toEqual(["5:00", "1:01", "1:00", "0:01", "0:00", "0:00"]);
    expect([timerColour(1), timerColour(0.2), timerColour(0.05)]).toEqual(["#2563eb", "#d97706", "#dc2626"]);
  });

  it("a deck accepts a slide timer of 1 to 10 whole minutes and refuses anything else", () => {
    const deck = (timer: unknown) => ({ id: "t", title: "T", slides: [{ id: "s", els: [], timer }] });
    expect("deck" in checkDeck(deck({ minutes: 5 }))).toBe(true);
    expect("deck" in checkDeck(deck({ minutes: 10, auto: false }))).toBe(true);
    for (const bad of [{ minutes: 0 }, { minutes: 11 }, { minutes: 2.5 }, { minutes: "5" }, { minutes: 3, auto: "yes" }, null, 5]) expect("error" in checkDeck(deck(bad))).toBe(true);
  });
});
