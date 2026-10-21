// One size for every 16:9 slide out of full screen: a Teach deck's slide and a Depth question's stage use the same width rule, so a lesson
// that moves from a deck to a Depth question keeps the same picture on the screen. The width comes from the height left over once the page's
// own chrome (header, tabs, the row of buttons under the slide) is taken off; presenting (full screen) uses almost all of the window.
export const SLIDE_CHROME_REM = 16;
export const PRESENT_CHROME_REM = 6;
/** A lesson step's deck/Depth slide: the page drops its title, tabs and top padding, so the slide gets more of the screen. */
export const LESSON_CHROME_REM = 12.5;
/** CSS width of a 16:9 slide slot. */
export const slideSlotWidth = (present = false): string =>
  `min(100%, calc((100vh - ${present ? PRESENT_CHROME_REM : SLIDE_CHROME_REM}rem) * 16 / 9))`;
