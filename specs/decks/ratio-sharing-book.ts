// The wording of the Sharing in a Ratio book sheet (Harry, 2026-11-26: "vary the wording, not everything should read identically").
// Every question's numbers come from ratio-sharing-sets.ts (checked there); the build script checks that each wording still carries them.
// Four questions with lettered parts: 1 sharing a total (the nine set A questions), 2 a known share (set B), 3 a difference (set C), and 4 a
// mixed ten drawn from set D (three of each kind, one more difference), kept in the order of their difficulty.
export const BOOK_A: { text: string; answer: string }[] = [
  { text: "Share £65 in the ratio $2 : 3$.", answer: "£26 and £39" },
  { text: "Cleo and Dev split £98 in the ratio $3 : 4$. How much does each person get?", answer: "£42 and £56" },
  { text: "Divide £42 between Eli and Fay in the ratio $5 : 2$.", answer: "£30 and £12" },
  { text: "A baker puts 64 kg of flour into two bags in the ratio $3 : 5$. How much flour is in each bag?", answer: "24 kg and 40 kg" },
  { text: "Ian and Jo win £132 and share it in the ratio $5 : 7$. How much does each of them receive?", answer: "£55 and £77" },
  { text: "Share £112 in the ratio $6 : 8$.", answer: "£48 and £64" },
  { text: "Max and Nia are paid £156 between them. They share it in the ratio $4 : 9$. Work out each share.", answer: "£48 and £108" },
  { text: "Omar, Pia and Quin share £72 in the ratio $1 : 3 : 4$. How much does each person get?", answer: "£9, £27 and £36" },
  { text: "£22.50 is divided between Raj, Sia and Tom in the ratio $2 : 3 : 4$. Find the three amounts.", answer: "£5, £7.50 and £10" },
];
/** Wording by question id (sets B, C, D); the answer is the set's own. */
export const BOOK_TEXT: Record<string, string> = {
  B1: "Zane and Isla share some money in the ratio $2 : 3$. Zane gets £16. How much money is there altogether?",
  B2: "The ratio of Noah's money to Grace's is $3 : 4$. Grace has £32. How much does Noah have?",
  B3: "Lena and Omar share a prize in the ratio $3 : 5$. Lena's share is £66. Work out Omar's share.",
  B4: "Ruth and Sam share some marbles in the ratio $4 : 3$. Ruth gets 36 marbles. How many marbles are there in total?",
  B5: "Finn gets £70 when he and Olivia share money in the ratio $5 : 8$. How much does Olivia get?",
  B6: "Hugo and Ella share money in the ratio $6 : 9$. Hugo receives £54. How much does Ella receive?",
  B7: "Dev, Maya and Tom share money in the ratio $3 : 4 : 5$. Maya receives £68. How much money is shared in total?",
  B8: "Eli, Zoe and Max share some money in the ratio $2 : 5 : 6$. Eli's share is £14. Work out Max's share.",
  B9: "Tess, Uri and Wen share a pack of stickers in the ratio $2 : 3 : 5$. Wen gets 55 stickers. How many stickers are in the pack?",
  C1: "Nia and Pete share money in the ratio $2 : 5$. Pete gets £45 more than Nia. How much does Nia get?",
  C2: "Joy and Alan share some money in the ratio $4 : 7$. The difference between their shares is £33. Find the total amount.",
  C3: "Ivy and Sid share money in the ratio $3 : 5$. Ivy's share is £26 less than Sid's. How much does Sid get?",
  C4: "Omar gets £30 more than Lena when they share money in the ratio $2 : 7$. How much does Lena get?",
  C5: "Tara and Will share some sweets in the ratio $5 : 3$. Tara gets 34 more sweets than Will. How many sweets are there altogether?",
  C6: "Rhys and Cleo are left some money by an aunt. They share it in the ratio $7 : 4$ and the difference between their shares is £96. How much money was there in total?",
  C7: "Abe, Beth and Cole share money in the ratio $3 : 4 : 8$. Cole gets £25 more than Abe. Work out Beth's share.",
  C8: "Dana, Eric and Fay share some money in the ratio $3 : 5 : 7$. Fay's share is £52 more than Dana's. Find the total amount of money.",
  C9: "Xia, Yan and Zed share marbles in the ratio $3 : 4 : 6$. Zed gets 28 more marbles than Yan. How many marbles are there in total?",
  D1: "Kim and Raj share £85 in the ratio $2 : 3$. How much does Raj get?",
  D2: "Ola and Pat share money in the ratio $3 : 4$. Ola's share is £39. What is the total?",
  D3: "The difference between Quin's and Rae's shares is £57. They share money in the ratio $2 : 5$. How much money is there in total?",
  D5: "Vik receives £49. Uma and Vik shared some money in the ratio $2 : 7$. How much did Uma receive?",
  D6: "Walt and Xena share £130 in the ratio $8 : 12$. Work out Walt's share.",
  D8: "Abel and Bea share flour in the ratio $4 : 9$. Bea gets 10 kg more than Abel. How much flour is there altogether?",
  D11: "£144 is shared between Gus, Hana and Ian in the ratio $1 : 2 : 3$. How much does Hana get?",
  D12: "Jo, Kai and Liv share money in the ratio $2 : 3 : 4$. Kai gets £51. Find the total.",
  D14: "Ron, Sue and Ted share money in the ratio $4 : 6 : 10$. Ted gets £44 more than Sue. How much is shared in total?",
  D15: "Una, Vic and Wes share flour in the ratio $2 : 3 : 6$. Wes gets 27 kg more than Vic. How much flour is there in total?",
};
/** The mixed question: ten of set D's fifteen, easiest first. */
export const BOOK_D_IDS = ["D1", "D2", "D3", "D5", "D6", "D8", "D11", "D12", "D14", "D15"];
