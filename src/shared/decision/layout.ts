/**
 * The height of the main working area (picture + question + steps / exam parts) on a big screen. The question container (this plus its own 2rem
 * of inside padding) is as tall as the window less 0.75rem above and below (the shell's bottom padding is `sm:pb-3`): scroll down to it and it fills the
 * screen with the same space above as below. Keep that gap at or under the 1rem between the blocks above it, or the bottom edge of the toolbar card shows as a sliver at the top. The topic chooser and the toolbar sit above it. (A window shorter than about 660px keeps a 430px floor and scrolls.)
 */
export const STAGE_H = "max(430px, calc(100dvh - 3.5rem))";

/** A tablet keeps the old, shorter working area: its fixed bottom action bar and the topic chooser leave less of the window, so the whole tool stays on one screen. */
export const STAGE_H_TABLET = "clamp(430px, calc(100dvh - 380px), 580px)";
