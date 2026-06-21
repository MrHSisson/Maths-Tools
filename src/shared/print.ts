import type { AnyQuestion, PrintMode } from "./types";
import { ansEq } from "./helpers";
import { computeWorksheetLayout } from "./worksheetLayout";

export const handlePrint = (
  questions: AnyQuestion[],
  toolName: string,
  difficulty: string,
  isDifferentiated: boolean,
  numColumns: number,
  instruction: string,
  pMode: PrintMode = "both",
  layout: "grid" | "list" = "grid",
  showBorders: boolean = true,
) => {
  if (difficulty === "advanced") isDifferentiated = false;
  const FONT_PX   = 14;
  const PAD_MM    = 2;
  const MARGIN_MM = 12;
  const HEADER_MM = 14;
  const GAP_MM    = 2;
  const DIV_MM    = 4;
  const HDR_MM    = 6;
  const PAGE_H_MM = 297 - MARGIN_MM * 2;
  const PAGE_W_MM = 210 - MARGIN_MM * 2;
  const usableH_MM = PAGE_H_MM - HEADER_MM;
  const diffHdrMM  = 7;

  const cols    = isDifferentiated ? 3 : numColumns;

  const difficultyLabel = isDifferentiated ? "Differentiated" :
    difficulty === "level1" ? "Level 1" : difficulty === "level2" ? "Level 2" :
    difficulty === "level3" ? "Level 3" : difficulty === "advanced" ? "Advanced" : "Level 1";
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
        ansHtml = `<div class="q-answer">${katexSpan(ansEq(anyQ.answerLatex))}${suffix}</div>`;
      } else {
        const suffix = anyQ.answerSuffix ? ` ${anyQ.answerSuffix}` : "";
        ansHtml = `<div class="q-answer">${ansEq(anyQ.answer ?? "")}${suffix}</div>`;
      }
    }
    const numHtml = `<div class="q-num">${idx + 1}</div>`;
    const suppressInstr = !!anyQ._sectionHeader;
    const instrHtml = instruction && !suppressInstr ? `<div class="q-instruction">${instruction}</div>` : "";
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
    return `${numHtml}<div class="qbody">${body}</div>`;
  };

  const listQuestionToHtml = (q: AnyQuestion, idx: number, showAnswer: boolean): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyQ = q as any;
    let ansHtml = "";
    if (showAnswer) {
      if (anyQ.answerLatex) {
        const suffix = anyQ.answerSuffix ? ` ${anyQ.answerSuffix}` : "";
        ansHtml = `<span class="list-answer">${katexSpan(ansEq(anyQ.answerLatex))}${suffix}</span>`;
      } else {
        const suffix = anyQ.answerSuffix ? ` ${anyQ.answerSuffix}` : "";
        ansHtml = `<span class="list-answer">${ansEq(anyQ.answer ?? "")}${suffix}</span>`;
      }
    }
    const num = `<span class="list-num">${idx + 1})</span>`;
    const suppressInstr = !!(q as any)._sectionHeader;
    const instrHtml = instruction && !suppressInstr ? `<span class="list-instr">${instruction}</span> ` : "";
    let content = "";
    if (anyQ.kind === "frac") {
      content = `${instrHtml}${katexSpan(`\\text{Find } ${anyQ.latex}`, "q-math")}`;
    } else if (q.kind === "simple") {
      content = anyQ.displayLatex
        ? `${instrHtml}${katexSpan(anyQ.displayLatex, "q-math")}`
        : `${instrHtml}<span class="q-math">${anyQ.display ?? ""}</span>`;
    } else {
      content = `${instrHtml}<span class="q-math">${renderLine(anyQ.lines[0])}</span>`;
      if (anyQ.lines.length > 1) {
        content += anyQ.lines.slice(1).map((l: string) => `<span class="list-subline">${renderLine(l)}</span>`).join("");
      }
    }
    return `<div class="list-item">${num}<span class="list-content">${content}</span>${ansHtml}</div>`;
  };

  const listAnswerOnlyToHtml = (q: AnyQuestion, idx: number): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyQ = q as any;
    const suffix = anyQ.answerSuffix ? ` ${anyQ.answerSuffix}` : "";
    const num = `<span class="list-num">${idx + 1})</span>`;
    const ansHtml = anyQ.answerLatex
      ? `<span class="list-answer-only">${katexSpan(ansEq(anyQ.answerLatex))}${suffix}</span>`
      : `<span class="list-answer-only">${ansEq(anyQ.answer ?? "")}${suffix}</span>`;
    return `<div class="list-item list-item-answer">${num}${ansHtml}</div>`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sectionIndices = questions.map(q => (q as any)._sectionIdx as number | undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sectionHeadersArr = questions.map(q => (q as any)._sectionHeader as string | undefined);
  const hasSections = sectionIndices.some(s => s !== undefined && s > 0) || sectionHeadersArr.some(h => !!h);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sectionColsArr = questions.map(q => (q as any)._sectionCols as number | undefined);

  const probeHtml = questions.map((q, i) => {
    const secCols = sectionColsArr[i] ?? cols;
    const probeW = (PAGE_W_MM - GAP_MM * (secCols - 1)) / secCols;
    return layout === "list"
      ? `<div class="list-item" id="probe-${i}" style="width:${probeW}mm">${listQuestionToHtml(q, i, false)}</div>`
      : `<div class="q-inner" id="probe-${i}" style="width:${probeW}mm">${questionToHtml(q, i, false)}</div>`;
  }).join("");

  const answerOnlyToHtml = (q: AnyQuestion, idx: number): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyQ = q as any;
    const suffix = anyQ.answerSuffix ? ` ${anyQ.answerSuffix}` : "";
    const numHtml = `<div class="q-num">${idx + 1}</div>`;
    const ansHtml = anyQ.answerLatex
      ? `<div class="q-answer q-answer-only">${katexSpan(ansEq(anyQ.answerLatex))}${suffix}</div>`
      : `<div class="q-answer q-answer-only">${ansEq(anyQ.answer ?? "")}${suffix}</div>`;
    return `${numHtml}<div class="qbody">${ansHtml}</div>`;
  };

  const qHtmlData = questions.map((q, i) => ({
    q: layout === "list" ? listQuestionToHtml(q, i, false) : questionToHtml(q, i, false),
    a: layout === "list" ? listAnswerOnlyToHtml(q, i) : answerOnlyToHtml(q, i),
    difficulty: q.difficulty,
    sectionIdx: sectionIndices[i] ?? 0,
    sectionCols: sectionColsArr[i] ?? cols,
    sectionHeader: sectionHeadersArr[i] ?? "",
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
    ${showBorders ? "border: 0.3mm solid #d1d5db; border-radius: 3mm;" : ""}
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

  .section-divider { width: 100%; }
  .section-header { font-size: ${Math.round(FONT_PX * 1.1)}px; font-weight: 600; color: #000; margin-bottom: 1mm; }

  #probe {
    position: fixed; left: -9999px; top: 0; visibility: hidden;
    font-family: "Segoe UI", Arial, sans-serif; font-size: ${FONT_PX}px; line-height: 1.4;
    width: ${PAGE_W_MM}mm;
  }

  .q-inner  { width: 100%; display: flex; flex-direction: column; flex: 1; position: relative; }
  .q-num    { position: absolute; top: 0.5mm; left: 1mm; font-size: ${Math.round(FONT_PX * 0.6)}px; font-weight: 700; color: #9ca3af; }
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

  .list-item {
    display: flex; align-items: baseline; gap: 2mm; padding: 1.2mm 0;
  }
  .list-item-answer { padding: 0.6mm 0; }
  .list-num { font-size: ${Math.round(FONT_PX * 0.85)}px; font-weight: 700; color: #000; flex-shrink: 0; min-width: 5mm; }
  .list-content { font-size: ${FONT_PX}px; color: #000; }
  .list-instr { font-size: ${Math.round(FONT_PX * 0.85)}px; font-weight: 600; color: #000; }
  .list-answer { font-size: ${FONT_PX}px; color: #059669; margin-left: 2mm; }
  .list-answer-only { font-size: ${Math.round(FONT_PX * 1.1)}px; color: #059669; }
  .list-subline { display: block; margin-left: 7mm; font-size: ${FONT_PX}px; }
  .list-col { display: flex; flex-direction: column; }
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
  var DIV_MM    = ${DIV_MM};
  var usableH   = ${usableH_MM};
  var diffHdrMM = ${diffHdrMM};
  var PAGE_W_MM = ${PAGE_W_MM};
  var cols      = ${cols};
  var isDiff    = ${isDifferentiated ? "true" : "false"};
  var isListLayout = ${layout === "list" ? "true" : "false"};
  var hasSections  = ${hasSections ? "true" : "false"};
  var totalQ    = ${totalQ};
  var diffLabel = "${difficultyLabel}";
  var dateStr   = "${dateStr}";
  var toolName  = "${toolName}";
  var printMode = "${pMode}";

  var qData = ${JSON.stringify(qHtmlData)};

  var probe = document.getElementById('probe');
  probe.querySelectorAll('.katex-render').forEach(function(el) {
    try { katex.render(el.getAttribute('data-latex'), el, { throwOnError: false, output: 'html' }); }
    catch(e) { el.textContent = el.getAttribute('data-latex'); }
  });

  // Measure per-question heights for per-section cell sizing
  var probeHts = [];
  for (var pi = 0; pi < qData.length; pi++) {
    var pel = document.getElementById('probe-' + pi);
    probeHts.push(pel ? pel.scrollHeight : 0);
  }
  // Hand the measured heights to the shared, unit-tested page-fill engine in the
  // opener window. Measurement stays here (the popup is the real print surface);
  // the engine — the same compiled code vitest exercises — returns the full
  // layout plan (cell heights, rows per page, per-section heights, page groups).
  if (!window.opener || !window.opener.__mtWorksheetLayout) {
    alert('Worksheet layout engine unavailable — please keep the original tab open while printing.');
    return;
  }
  var plan = window.opener.__mtWorksheetLayout({
    isList: isListLayout, isDiff: isDiff, hasSections: hasSections,
    cols: cols, totalQ: totalQ, heightsPx: probeHts,
    sectionIdx: qData.map(function(d) { return d.sectionIdx; }),
    sectionCols: qData.map(function(d) { return d.sectionCols; }),
    itemHasHeader: qData.map(function(d) { return !!d.sectionHeader; }),
    usableH: usableH, GAP_MM: GAP_MM, PAD_MM: PAD_MM, DIV_MM: DIV_MM,
    HDR_MM: ${HDR_MM}, diffHdrMM: diffHdrMM, pxPerMm: pxPerMm
  });

  var chosenH_mm      = plan.chosenH_mm;
  var rowsPerPage     = plan.rowsPerPage;
  var sectionCellH    = plan.sectionCellH;
  var diffPerCol      = plan.diffPerCol;
  var diffRowsPerPage = plan.diffRowsPerPage;
  var diffCellH_mm    = plan.diffCellH_mm;
  var numDiffPages    = plan.numDiffPages;
  var planPages       = plan.pages;

  function makeCellW(c) {
    return (PAGE_W_MM - GAP_MM * (c - 1)) / c;
  }

  function buildCell(inner, cW, cH, isDiffCell) {
    var cls = isDiffCell ? 'diff-cell' : 'cell';
    return '<div class="' + cls + '" style="width:' + cW + 'mm;height:' + cH + 'mm;">'
         + '<div class="q-inner">' + inner + '</div></div>';
  }

  function buildSectionDivider(header) {
    var div = '<div class="section-divider" style="height:' + DIV_MM + 'mm;display:flex;align-items:center;">'
         + '<div style="width:60%;margin:0 auto;border-top:0.3mm solid #d1d5db;"></div></div>';
    if (header) div += '<div class="section-header">' + header + '</div>';
    return div;
  }

  // ── List layout builder ──
  function buildListSection(sectionItems, showAnswer, secCols) {
    var colW = makeCellW(secCols);
    var itemsHtml = '';
    for (var i = 0; i < sectionItems.length; i++) {
      itemsHtml += showAnswer ? sectionItems[i].a : sectionItems[i].q;
    }
    return '<div style="display:grid;grid-template-columns:repeat(' + secCols + ',' + colW + 'mm);gap:0 ' + GAP_MM + 'mm;">' + itemsHtml + '</div>';
  }
  function buildListPage(pageItems, showAnswer) {
    if (!hasSections) return buildListSection(pageItems, showAnswer, cols);
    var segments = [];
    var curSeg = [];
    var curSec = -1;
    for (var i = 0; i < pageItems.length; i++) {
      if (pageItems[i].divider) continue;
      var si = pageItems[i].sectionIdx;
      if (si !== curSec && curSeg.length > 0) {
        segments.push({ items: curSeg, cols: curSeg[0].sectionCols });
        curSeg = [];
      }
      curSeg.push(pageItems[i]);
      curSec = si;
    }
    if (curSeg.length > 0) segments.push({ items: curSeg, cols: curSeg[0].sectionCols });
    var out = '';
    for (var sg = 0; sg < segments.length; sg++) {
      var segHdr = segments[sg].items[0] ? segments[sg].items[0].sectionHeader : '';
      if (sg > 0) out += buildSectionDivider(segHdr);
      else if (segHdr) out += '<div class="section-header">' + segHdr + '</div>';
      out += buildListSection(segments[sg].items, showAnswer, segments[sg].cols);
    }
    return out;
  }

  // ── Grid layout builder (with section dividers) ──
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
    // Non-differentiated grid: build sub-grids per section with dividers between
    if (hasSections && Array.isArray(pageData)) {
      var segments = [];
      var curSeg = [];
      var curSec = pageData.length > 0 ? pageData[0].sectionIdx : 0;
      for (var si = 0; si < pageData.length; si++) {
        if (pageData[si].sectionIdx !== curSec) {
          segments.push({ items: curSeg, section: curSec });
          curSeg = [];
          curSec = pageData[si].sectionIdx;
        }
        curSeg.push(pageData[si]);
      }
      if (curSeg.length > 0) segments.push({ items: curSeg, section: curSec });

      var out = '';
      for (var sg = 0; sg < segments.length; sg++) {
        var segHdr = segments[sg].items.length > 0 ? segments[sg].items[0].sectionHeader : '';
        if (sg > 0) out += buildSectionDivider(segHdr);
        else if (segHdr) out += '<div class="section-header">' + segHdr + '</div>';
        var segItems = segments[sg].items;
        var segCols = segItems.length > 0 ? segItems[0].sectionCols : cols;
        var segCW = makeCellW(segCols);
        var segH = sectionCellH[segments[sg].section] !== undefined ? sectionCellH[segments[sg].section] : cH;
        var gridRows = Math.ceil(segItems.length / segCols);
        var cells = segItems.map(function(item) {
          return buildCell(showAnswer ? item.a : item.q, segCW, segH, false);
        }).join('');
        out += '<div class="grid" style="grid-template-columns:repeat(' + segCols + ',' + segCW + 'mm);grid-template-rows:repeat(' + gridRows + ',' + segH + 'mm);">' + cells + '</div>';
      }
      return out;
    }
    var cW = makeCellW(cols);
    var gridRows = Math.ceil(pageData.length / cols);
    var cells = pageData.map(function(item) {
      return buildCell(showAnswer ? item.a : item.q, cW, cH, false);
    }).join('');
    return '<div class="grid" style="grid-template-columns:repeat(' + cols + ',' + cW + 'mm);grid-template-rows:repeat(' + gridRows + ',' + cH + 'mm);">' + cells + '</div>';
  }

  // ── Pagination ──
  if (isListLayout) {
    // Map the engine's page groupings (question indices; -1 = divider spacer)
    // back to qData entries so the renderers below are unchanged.
    var pages = planPages.map(function(pg) {
      return pg.map(function(idx) {
        return idx === -1 ? { divider: true, q: '', a: '' } : qData[idx];
      });
    });
    if (pages.length === 0) pages.push([]);
    var totalPages = pages.length;

    function buildListPageFull(pageData, showAnswer, pgIdx) {
      var lbl = totalPages > 1
        ? totalQ + ' questions (' + (pgIdx+1) + '/' + totalPages + ')'
        : totalQ + ' questions';
      var title = toolName + (showAnswer ? ' — Answers' : '');
      return '<div class="page">'
        + '<div class="page-header"><h1>' + title + '</h1>'
        + '<div class="meta">' + diffLabel + ' &nbsp;\\u00b7&nbsp; ' + dateStr + ' &nbsp;\\u00b7&nbsp; ' + lbl + '</div></div>'
        + buildListPage(pageData, showAnswer)
        + '</div>';
    }

    var qPages = pages.map(function(pg, i) { return buildListPageFull(pg, false, i); }).join('');
    var aPages = pages.map(function(pg, i) { return buildListPageFull(pg, true,  i); }).join('');
    var finalHtml = printMode === 'questions' ? qPages
             : printMode === 'answers'   ? aPages
             : qPages + aPages;

    document.getElementById('pages').innerHTML = finalHtml;
  } else {
    // The engine returns either page index numbers (differentiated) or page
    // groupings of question indices (section + non-section grids). Map the
    // latter back to qData entries so the renderers below are unchanged.
    var pages;
    if (isDiff) {
      pages = [];
      for (var p = 0; p < numDiffPages; p++) pages.push(p);
    } else {
      pages = planPages.map(function(pg) {
        return pg.map(function(idx) { return qData[idx]; });
      });
    }
    var totalPages = pages.length;

    function buildPage(pageData, showAnswer, pgIdx) {
      var cH  = isDiff ? diffCellH_mm : chosenH_mm;
      var lbl = totalPages > 1
        ? (isDiff ? diffPerCol + ' per level' : totalQ + ' questions') + ' (' + (pgIdx+1) + '/' + totalPages + ')'
        : isDiff ? diffPerCol + ' per level' : totalQ + ' questions';
      var title = toolName + (showAnswer ? ' — Answers' : '');
      return '<div class="page">'
        + '<div class="page-header"><h1>' + title + '</h1>'
        + '<div class="meta">' + diffLabel + ' &nbsp;\\u00b7&nbsp; ' + dateStr + ' &nbsp;\\u00b7&nbsp; ' + lbl + '</div></div>'
        + buildGrid(pageData, showAnswer, cH)
        + '</div>';
    }

    var qPages = pages.map(function(pg, i) { return buildPage(pg, false, i); }).join('');
    var aPages = pages.map(function(pg, i) { return buildPage(pg, true,  i); }).join('');
    var finalHtml = printMode === 'questions' ? qPages
             : printMode === 'answers'   ? aPages
             : qPages + aPages;

    document.getElementById('pages').innerHTML = finalHtml;
  }

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

  // Expose the shared, unit-tested page-fill engine so the print popup can call
  // back into it (the popup measures heights against the real print surface,
  // then paginates via this same compiled code — see the bridge in the script).
  (window as unknown as { __mtWorksheetLayout: typeof computeWorksheetLayout }).__mtWorksheetLayout = computeWorksheetLayout;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to use the PDF export."); return; }
  win.document.write(html);
  win.document.close();
};
