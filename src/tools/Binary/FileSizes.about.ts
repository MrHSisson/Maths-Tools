import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool" and the level (i). One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Work out how much storage text, images and sound need.",
  tools: {
    text: {
      purpose: "Characters × bits per character gives the file size.",
      levels: [
        "One multiplication, answer in bits",
        "Answer in bytes or KB; may count a message (spaces and punctuation count)",
        "Compare ASCII and Unicode, or work back to the characters or bits per character",
      ],
    },
    images: {
      purpose: "Pixels × colour depth gives the file size.",
      levels: [
        "Small images in bits; work out the colours from the bits",
        "Exam-size images in bytes, KB or MB; the fewest bits for a power-of-two number of colours",
        "Colours that are not powers of two, colours given first, several images, and working backwards",
      ],
    },
    sound: {
      purpose: "Sample rate × time × bit depth gives the file size.",
      levels: [
        "Short recordings, answer in bits",
        "Hz and seconds, answer in bytes or KB",
        "kHz and minutes to convert, comparing recordings, and working backwards",
      ],
    },
  },
};
