/**
 * The height of the main working area (picture + question + steps / exam parts) on a big screen. The question container (this plus its own 2rem
 * of inside padding) is as tall as the window less the page's own bottom padding (1.25rem, `sm:py-5` on the shell) twice: scroll down to it and
 * it fills the screen with the same space above as below. The topic chooser and the toolbar sit above it. (A window shorter than about 660px keeps a 430px floor and scrolls.)
 */
export const STAGE_H = "max(430px, calc(100dvh - 4.5rem))";

/** A tablet keeps the old, shorter working area: its fixed bottom action bar and the topic chooser leave less of the window, so the whole tool stays on one screen. */
export const STAGE_H_TABLET = "clamp(430px, calc(100dvh - 380px), 580px)";
