# Sources — where the copyrighted source material is kept

**Why this file exists.** The textbooks, past papers, mark schemes and examiner reports that briefs are built from are copyright, and this repository is public, so **none of them is ever committed** (`.gitignore` already keeps `specs/exam/sources/` out for the same reason). They live in Harry's private Google Drive. This index says where, what each source is, and what has already been taken from it, so a session can find a source when asked and never needs to re-read one that has been used up. It holds no copyrighted content.

**The rule.** A session reads a source (with the Google Drive connector, or from a file Harry attaches) only when asked. What a build needs from a source goes into the repo in our own words: a corpus of question *shapes* (`specs/corpus/`), the conventions and acceptance examples in the brief, never the wording or numbers of the source's questions. Attaching a PDF in chat shows every page as an image, which is better than reading it through Drive (Drive gives text, and diagrams and tables may be lost: untested), so Drive is the backup, attach when pictures matter.

## The Drive folders (private)

| Folder | What goes in it | Link |
|---|---|---|
| **Maths Tools — sources (private)** | the parent of the three below; inherited sharing is switched off, so it is visible only to Harry | https://drive.google.com/drive/folders/1oFNNr0XFy1I_MMkHNA5OKXItZyooaGDB |
| Textbooks | chapters of the textbooks used for a build | https://drive.google.com/drive/folders/1CQsBoy8UF0L7Bcj6KqSktgIvQL-4aJeL |
| Past papers | exam-board question papers | https://drive.google.com/drive/folders/1I7VV-gal_emiqZB2M3ntxMdhHG-2ami3 |
| Mark schemes and examiner reports | mark schemes and examiner reports | https://drive.google.com/drive/folders/10RE7Lmu3VH2Mf9EVQYwj2qA_dQ7xPZPG |

**Naming.** Topic or tool short code, then the source, then what it is: `LP · Textbook A · Ch 4 Linear programming.pdf`; for papers `Board · Paper · Year · Series` (for example `AQA · 7367-3D · 2023 · June`). Textbooks are lettered A, B, … by topic until a publisher and title are recorded here.

**Adding a source.** Only when a build needs it. Harry drops the file in (the connector will not take an upload over about 3 MB), the session renames it to the pattern and adds a row below.

## The sources

| Source | Drive file | Used for | Taken from it (in the repo) |
|---|---|---|---|
| **LP · Textbook A** · Ch 4 "Linear programming" (Further Maths, Decision; sections 1 to 3, Exercises 4A to 4C, Work it out 4.1, Mixed practice 4, two AQA past-paper questions) | Textbooks: `LP · Textbook A · Ch 4 Linear programming.pdf` | Linear Programming, all three tools | `specs/corpus/linear-programming-styles.md` rows L01 to L57; `specs/linear-programming.md` section 9a (conventions, simplex layout, acceptance examples); `specs/linear-programming-formulate.md` |
| **LP · Textbook B** · Ch 14 "Linear programming and game theory 1" (read section 14.1 only, pages 1 to 13; the rest is game theory) | Textbooks: `LP · Textbook B · Ch 14 Linear programming and game theory 1.pdf` | Linear Programming: the constraint types the first book lacked (blends, decimals, fractions, "each") | corpus rows L60 to L76; `specs/linear-programming-formulate.md` sections 2 and 4 |
| Past papers | none uploaded yet | the exam-style passes (Decision, Mechanics) | local copies are kept in the git-ignored `specs/exam/sources/`; none yet in Drive |
| Mark schemes and examiner reports | none uploaded yet | the Linear Programming misconceptions (AQA 7367/3D June 2023 and June 2025 examiner reports, still unread in full) | |

Textbook publisher and title: not yet recorded; add them here when Harry says.
