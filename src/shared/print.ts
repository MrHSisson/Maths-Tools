import type { AnyQuestion, PrintMode } from "./types";

export const handlePrint = (
  questions: AnyQuestion[],
  toolName: string,
  difficulty: string,
  isDifferentiated: boolean,
  numColumns: number,
  instruction: string,
  pMode: PrintMode = "both",
) => {
  const FONT_PX   = 14;
  const PAD_MM    = 2;
  const MARGIN_MM = 12;
  const HEADER_MM = 14;
  const GAP_MM    = 2;
  const PAGE_H_MM = 297 - MARGIN_MM * 2;
  const PAGE_W_MM = 210 - MARGIN_MM * 2;
  const usableH_MM = PAGE_H_MM - HEADER_MM;
  const diffHdrMM  = 7;

  const cols    = isDifferentiated ? 3 : numColumns;
  const cellW_MM = isDifferentiated
    ? (PAGE_W_MM - GAP_MM * 2) / 3
    : (PAGE_W_MM - GAP_MM * (numColumns - 1)) / numColumns;

  const difficultyLabel = isDifferentiated ? "Differentiated" :
    difficulty === "level1" ? "Level 1" : difficulty === "level2" ? "Level 2" : "Level 3";
  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const totalQ  = questions.length;

  const renderLine = (line: string): string =>
    line.split(/(\$[^$]+\$)/g).map(part => {
      if (part.startsWith("$") && part.endsWith("$")) {
        const latex = part.slice(1, -1);
        const frac = latex.includes("\\frac") ? ' data-frac="1"' : "";
        return `<span class="katex-render"${frac} data-latex="${latex.replace(/"/g, "&quot;")}"></span>`;
      }
      return `<span>${part}</span>`;
    }).join("");

  const katexSpan = (latex: string, extraClass = "") => {
    const frac = latex.includes("\\frac") ? ' data-frac="1"' : "";
    const cls = ["katex-render", extraClass].filter(Boolean).join(" ");
    return `<span class="${cls}"${frac} data-latex="${latex.replace(/"/g, "&quot;")}"></span>`;
  };

  const questionToHtml = (q: AnyQuestion, idx: number, showAnswer: boolean): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyQ = q as any;
    let ansHtml = "";
    if (showAnswer) {
      if (anyQ.answerLatex) {
        const suffix = anyQ.answerSuffix ? ` ${anyQ.answerSuffix}` : "";
        ansHtml = `<div class="q-answer">${katexSpan(`= ${anyQ.answerLatex}`)}${suffix}</div>`;
      } else {
        const suffix = anyQ.answerSuffix ? ` ${anyQ.answerSuffix}` : "";
        ansHtml = `<div class="q-answer">= ${anyQ.answer ?? ""}${suffix}</div>`;
      }
    }
    const banner = `<div class="q-banner">Question ${idx + 1}</div>`;
    const instrHtml = instruction ? `<div class="q-instruction">${instruction}</div>` : "";
    let body = "";
    if (anyQ.kind === "frac") {
      body = `${instrHtml}<div style="text-align:center">${katexSpan(`\\text{Find } ${anyQ.latex}`, "q-math")}</div>${ansHtml}`;
    } else if (q.kind === "simple") {
      const mathHtml = anyQ.displayLatex
        ? katexSpan(anyQ.displayLatex, "q-math")
        : `<span class="q-math">${anyQ.display ?? ""}</span>`;
      body = `${instrHtml}<div style="text-align:center">${mathHtml}</div>${ansHtml}`;
    } else {
      body = `${instrHtml}<div style="text-align:center"><span class="q-math">${renderLine(anyQ.lines[0])}</span></div>`
           + `<div class="q-lines">${anyQ.lines.slice(1).map((l: string) => `<div class="q-line">${renderLine(l)}</div>`).join("")}</div>`
           + ansHtml;
    }
    return `${banner}<div class="qbody">${body}</div>`;
  };

  const probeHtml = questions.map((q, i) =>
    `<div class="q-inner" id="probe-${i}">${questionToHtml(q, i, false)}</div>`
  ).join("");

  const answerOnlyToHtml = (q: AnyQuestion, idx: number): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyQ = q as any;
    const suffix = anyQ.answerSuffix ? ` ${anyQ.answerSuffix}` : "";
    const banner = `<div class="q-banner">Question ${idx + 1}</div>`;
    const ansHtml = anyQ.answerLatex
      ? `<div class="q-answer q-answer-only">${katexSpan(`= ${anyQ.answerLatex}`)}${suffix}</div>`
      : `<div class="q-answer q-answer-only">= ${anyQ.answer ?? ""}${suffix}</div>`;
    return `${banner}<div class="qbody">${ansHtml}</div>`;
  };

  const qHtmlData = questions.map((q, i) => ({
    q: questionToHtml(q, i, false),
    a: answerOnlyToHtml(q, i),
    difficulty: q.difficulty,
  }));

  void (difficulty as unknown); void (instruction as unknown); void (pMode as unknown);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${toolName} — Worksheet</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: ${MARGIN_MM}mm; }
  body { font-family: "Segoe UI", Arial, sans-serif; background: #fff; }

  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  .page { width: ${PAGE_W_MM}mm; height: ${PAGE_H_MM}mm; overflow: hidden; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .page-header {
    display: flex; justify-content: space-between; align-items: baseline;
    border-bottom: 0.4mm solid #1e3a8a; padding-bottom: 1.5mm; margin-bottom: 2mm;
  }
  .page-header h1 { font-size: 5mm; font-weight: 700; color: #1e3a8a; }
  .page-header .meta { font-size: 3mm; color: #6b7280; }

  .grid { display: grid; gap: ${GAP_MM}mm; }
  .cell {
    border: 0.3mm solid #d1d5db; border-radius: 3mm;
    overflow: hidden; display: flex; flex-direction: column;
    align-items: stretch; justify-content: flex-start;
  }
  .diff-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: ${GAP_MM}mm; }
  .diff-col  { display: flex; flex-direction: column; gap: ${GAP_MM}mm; }
  .diff-header {
    height: ${diffHdrMM}mm; display: flex; align-items: center; justify-content: center;
    font-size: 3mm; font-weight: 700; border-radius: 1mm;
  }
  .diff-header.level1 { background: #dcfce7; color: #166534; }
  .diff-header.level2 { background: #fef9c3; color: #854d0e; }
  .diff-header.level3 { background: #fee2e2; color: #991b1b; }
  .diff-cell {
    border: 0.3mm solid #d1d5db; border-radius: 3mm;
    overflow: hidden; display: flex; flex-direction: column;
    align-items: stretch; justify-content: flex-start;
  }

  #probe {
    position: fixed; left: -9999px; top: 0; visibility: hidden;
    font-family: "Segoe UI", Arial, sans-serif; font-size: ${FONT_PX}px; line-height: 1.4;
    width: ${cellW_MM}mm;
  }

  .q-inner  { width: 100%; display: flex; flex-direction: column; flex: 1; }
  .q-banner { width: 100%; text-align: center; font-size: ${Math.round(FONT_PX * 0.65)}px; font-weight: 700; color: #000; padding: 1mm 0; border-bottom: 0.3mm solid #000; }
  .qbody    { padding: ${PAD_MM * 0.4}mm ${PAD_MM}mm ${PAD_MM}mm; text-align: center; flex: 1; }
  .q-instruction { font-size: ${Math.round(FONT_PX * 0.8)}px; color: #000; text-align: center; margin-bottom: 1mm; font-weight: 600; }
  .q-math   { font-size: ${FONT_PX}px; display: inline; }
  .q-lines  { font-size: ${FONT_PX}px; line-height: 1.4; text-align: center; }
  .q-line   { display: block; text-align: center; margin-bottom: 0.2mm; }
  .q-answer { font-size: ${FONT_PX}px; color: #059669; display: block; margin-top: 0.8mm; text-align: center; }
  .q-answer-only { margin-top: 0; font-size: ${Math.round(FONT_PX * 1.4)}px; }
  .katex-render { display: inline-block; vertical-align: baseline; }
  .katex-render .katex { font-size: ${FONT_PX}px; }
  .katex-render.frac .katex { font-size: ${FONT_PX}px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div id="probe">${probeHtml}</div>
<div id="pages"></div>
<script>
document.addEventListener("DOMContentLoaded", function() {
  var pxPerMm   = 3.7795;
  var PAD_MM    = ${PAD_MM};
  var GAP_MM    = ${GAP_MM};
  var usableH   = ${usableH_MM};
  var diffHdrMM = ${diffHdrMM};
  var PAGE_W_MM = ${PAGE_W_MM};
  var cols      = ${cols};
  var isDiff    = ${isDifferentiated ? "true" : "false"};
  var totalQ    = ${totalQ};
  var diffLabel = "${difficultyLabel}";
  var dateStr   = "${dateStr}";
  var toolName  = "${toolName}";
  var printMode = "${pMode}";

  var rowHeights = [];
  for (var r = 1; r <= 10; r++) {
    rowHeights.push((usableH - GAP_MM * (r - 1)) / r);
  }

  var qData = ${JSON.stringify(qHtmlData)};

  var probe = document.getElementById('probe');
  probe.querySelectorAll('.katex-render').forEach(function(el) {
    try { katex.render(el.getAttribute('data-latex'), el, { throwOnError: false, output: 'html' }); }
    catch(e) { el.textContent = el.getAttribute('data-latex'); }
  });

  var maxH_px = 0;
  probe.querySelectorAll('.q-inner').forEach(function(el) {
    if (el.scrollHeight > maxH_px) maxH_px = el.scrollHeight;
  });
  var maxH_mm = maxH_px / pxPerMm;
  var needed_mm = maxH_mm + PAD_MM * 2 + 6;

  var diffPerCol   = Math.floor(totalQ / 3);
  var diffUsableH  = usableH - diffHdrMM - GAP_MM;
  var diffRowsPerPage = 1;
  var diffCellH_mm = diffUsableH;
  for (var rd = 0; rd < diffPerCol; rd++) {
    var rows2 = rd + 1;
    var h = (diffUsableH - GAP_MM * rd) / rows2;
    var dNeeded = needed_mm - diffHdrMM / rows2;
    if (h >= dNeeded) {
      diffRowsPerPage = rows2;
      diffCellH_mm = h;
    }
  }

  var chosenH_mm = rowHeights[0];
  var rowsPerPage = 1;

  var found = false;
  for (var r = 0; r < rowHeights.length; r++) {
    var capacity = (r + 1) * cols;
    if (capacity >= totalQ && rowHeights[r] >= needed_mm) {
      chosenH_mm = rowHeights[r];
      rowsPerPage = r + 1;
      found = true;
      break;
    }
  }

  if (!found) {
    for (var r2 = 0; r2 < rowHeights.length; r2++) {
      if (rowHeights[r2] >= needed_mm) {
        chosenH_mm = rowHeights[r2];
        rowsPerPage = r2 + 1;
      }
    }
  }

  var pageCapacity = isDiff ? diffRowsPerPage : rowsPerPage * cols;
  var pages = [];
  if (isDiff) {
    var numDiffPages = Math.ceil(diffPerCol / diffRowsPerPage);
    for (var p = 0; p < numDiffPages; p++) {
      pages.push(p);
    }
  } else {
    for (var s = 0; s < qData.length; s += pageCapacity) {
      pages.push(qData.slice(s, s + pageCapacity));
    }
  }
  var totalPages = pages.length;

  function makeCellW(c) {
    return (PAGE_W_MM - GAP_MM * (c - 1)) / c;
  }

  function buildCell(inner, cW, cH, isDiffCell) {
    var cls = isDiffCell ? 'diff-cell' : 'cell';
    return '<div class="' + cls + '" style="width:' + cW + 'mm;height:' + cH + 'mm;">'
         + '<div class="q-inner">' + inner + '</div></div>';
  }

  function buildGrid(pageData, showAnswer, cH) {
    if (isDiff) {
      var pgIdx = pageData;
      var start = pgIdx * diffRowsPerPage;
      var end   = start + diffRowsPerPage;
      var cW = makeCellW(3);
      var lvls = ['level1','level2','level3'];
      var lbls = ['Level 1','Level 2','Level 3'];
      var cols3 = lvls.map(function(lv, li) {
        var lqs = qData.filter(function(q) { return q.difficulty === lv; }).slice(start, end);
        var cells = lqs.map(function(q) {
          return buildCell(showAnswer ? q.a : q.q, cW, cH, true);
        }).join('');
        return '<div class="diff-col"><div class="diff-header ' + lv + '">' + lbls[li] + '</div>' + cells + '</div>';
      }).join('');
      return '<div class="diff-grid" style="grid-template-columns:repeat(3,' + cW + 'mm);">' + cols3 + '</div>';
    }
    var cW = makeCellW(cols);
    var gridRows = Math.ceil(pageData.length / cols);
    var cells = pageData.map(function(item) {
      return buildCell(showAnswer ? item.a : item.q, cW, cH, false);
    }).join('');
    return '<div class="grid" style="grid-template-columns:repeat(' + cols + ',' + cW + 'mm);grid-template-rows:repeat(' + gridRows + ',' + cH + 'mm);">' + cells + '</div>';
  }

  function buildPage(pageData, showAnswer, pgIdx) {
    var cH  = isDiff ? diffCellH_mm : chosenH_mm;
    var lbl = totalPages > 1
      ? (isDiff ? diffPerCol + ' per level' : totalQ + ' questions') + ' (' + (pgIdx+1) + '/' + totalPages + ')'
      : isDiff ? diffPerCol + ' per level' : totalQ + ' questions';
    var title = toolName + (showAnswer ? ' — Answers' : '');
    return '<div class="page">'
      + '<div class="page-header"><h1>' + title + '</h1>'
      + '<div class="meta">' + diffLabel + ' &nbsp;&middot;&nbsp; ' + dateStr + ' &nbsp;&middot;&nbsp; ' + lbl + '</div></div>'
      + buildGrid(pageData, showAnswer, cH)
      + '</div>';
  }

  var qPages = pages.map(function(pg, i) { return buildPage(pg, false, i); }).join('');
  var aPages = pages.map(function(pg, i) { return buildPage(pg, true,  i); }).join('');
  var html = printMode === 'questions' ? qPages
           : printMode === 'answers'   ? aPages
           : qPages + aPages;

  document.getElementById('pages').innerHTML = html;

  document.getElementById('pages').querySelectorAll('.katex-render').forEach(function(el) {
    try { katex.render(el.getAttribute('data-latex'), el, { throwOnError: false, output: 'html' }); }
    catch(e) { el.textContent = el.getAttribute('data-latex'); }
  });

  probe.remove();

  setTimeout(function() { window.print(); }, 300);
});
<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(html);
  win.document.close();
};
