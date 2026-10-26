import type { ToolAbout } from "../../shared";

// Plain-language copy for "About this tool", the level (i) and the Question Option notes. One place to edit what this tool says about itself.
export const ABOUT: ToolAbout = {
  purpose: "Work out how much storage text, images and sound need.",
  // What each Question Option is for (by option id; shared by every sub-tool unless a sub-tool overrides it)
  options: {
    "characters": "Whether the number of characters is given, or you count them in a message (spaces and punctuation count).",
    "answerUnit": "The unit the size is given in or the answer is wanted in.",
    "scaffoldLadder": "Switch on to show the unit ladder (bits, bytes, KB, MB) to help with conversions.",
    "resolution": "Whether the image size is given as width × height or as the total number of pixels.",
    "colours": "Whether the number of colours is a power of two (2, 4, 8, 16…) or not (5, 9, 100…). When it is not, you must round the bits up.",
    "inputs": "The units used in the question.",
  },
  tools: {
    text: {
      purpose: "Characters × bits per character gives the file size.",
      levels: [
        "One multiplication, answer in bits",
        "Answer in bytes or KB; may count a message (spaces and punctuation count)",
        "Compare ASCII and Unicode, or work back to the characters or bits per character",
      ],
      options: {
        "task@2": "Find the file size, or compare how much space ASCII and Unicode need for the same text.",
        "task@3": "Find the file size, compare ASCII and Unicode, or work backwards to the number of characters or the bits per character.",
      },
    },
    images: {
      purpose: "Pixels × colour depth gives the file size.",
      levels: [
        "Small images in bits; work out the colours from the bits",
        "Exam-size images in bytes, KB or MB; the fewest bits for a power-of-two number of colours",
        "Colours that are not powers of two, colours given first, several images, and working backwards",
      ],
      options: {
        "task@1": "Find the file size, or work out how many colours a number of bits gives.",
        "task@2": "Find the file size, or find the fewest bits needed for a number of colours.",
        "task@3": "Find the file size; colours from bits; fewest bits for N colours; whether n bits are enough; fewest bits then size; several identical images; find the colour depth; or find the number of pixels or the width.",
      },
    },
    sound: {
      purpose: "Sample rate × time × bit depth gives the file size.",
      levels: [
        "Short recordings, answer in bits",
        "Hz and seconds, answer in bytes or KB",
        "kHz and minutes to convert, comparing recordings, and working backwards",
      ],
      options: {
        "task": "Find the file size, compare two recordings, or work backwards to the duration, bit depth or sample rate.",
      },
    },
  },
};
