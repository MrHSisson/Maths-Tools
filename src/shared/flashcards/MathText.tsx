// Flashcards: text with maths between $…$, rendered with KaTeX (inline, never display mode). A string that fails to render shows as plain text rather than breaking the card.
import katex from "katex";
import "katex/dist/katex.min.css";

export function MathText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\$[^$]+\$)/g).map((part, i) => {
        if (i % 2 === 0) return <span key={i}>{part}</span>;
        let html: string;
        try { html = katex.renderToString(part.slice(1, -1), { throwOnError: false, displayMode: false }); } catch { html = part; }
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </>
  );
}
