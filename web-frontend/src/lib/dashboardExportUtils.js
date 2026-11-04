import { jsPDF } from "jspdf";

/**
 * Escapes a cell value for CSV output following RFC 4180.
 */
export const escapeCsvField = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Triggers a browser download of a CSV file given an array of row arrays.
 * Prepends the UTF-8 Byte Order Mark (\uFEFF) for Excel compatibility.
 */
export const downloadCsv = (filename, rows) => {
  const csvContent =
    "\uFEFF" +
    rows
      .map((row) => (Array.isArray(row) ? row.map(escapeCsvField).join(",") : escapeCsvField(row)))
      .join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Formats standard dashboard date for reports.
 */
export const formatReportDate = (d = new Date()) => {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Formats standard dashboard time for reports.
 */
export const formatReportTime = (d = new Date()) => {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Standard Multi-Page PDF Exporter matching Farmer Dashboard styling.
 *
 * @param {Object} options
 * @param {string} options.title - Report title
 * @param {string} options.subtitle - Subtitle / description
 * @param {string} [options.dateStr] - Formatted date string
 * @param {string} [options.timeStr] - Formatted time string
 * @param {Array<{label: string, value: string}>} [options.metadata] - Header key-value pairs (Branch, Role, Period)
 * @param {Array<{title: string, value: string|number, footer?: string}>} [options.kpis] - KPI boxes (max 4 per row)
 * @param {Array<Object>} [options.sections] - Sections: tables, lists, text blocks
 * @param {string} [options.filename] - Target PDF file name
 */
export const generateDashboardPdf = ({
  title = "GRAINRISE AGRICULTURAL PLATFORM",
  subtitle = "Executive Performance & Operations Summary",
  dateStr = formatReportDate(),
  timeStr = formatReportTime(),
  metadata = [],
  kpis = [],
  sections = [],
  filename = `grainrise-report-${new Date().toISOString().split("T")[0]}.pdf`,
}) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const printableWidth = pageWidth - margin * 2; // 182mm

  const primaryColor = [22, 101, 52]; // Dark green #166534
  const slateColor = [51, 65, 85]; // Slate-700
  const lightSlate = [100, 116, 139]; // Slate-500

  let y = 0;

  const renderHeaderBanner = (isFirstPage = false) => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const bannerHeight = isFirstPage ? 26 : 14;
    doc.rect(0, 0, pageWidth, bannerHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);

    if (isFirstPage) {
      doc.setFontSize(15);
      doc.text(title, margin, 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(subtitle, margin, 18);
      doc.text(`Generated: ${dateStr} · ${timeStr}`, pageWidth - margin, 18, { align: "right" });
    } else {
      doc.setFontSize(10);
      doc.text(title, margin, 9);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(`${subtitle} (Cont.)`, pageWidth - margin, 9, { align: "right" });
    }
  };

  const renderFooter = (pageNumber, totalPages) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(
      "Disclaimer: GrainRise agricultural decision-support platform. Official system record generated for authorized personnel only.",
      margin,
      pageHeight - 8
    );
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 8, {
      align: "right",
    });
  };

  const ensureSpace = (neededHeight) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      renderHeaderBanner(false);
      y = 22;
    }
  };

  // 1. First Page Header
  renderHeaderBanner(true);
  y = 33;

  // 2. Metadata details (e.g. Branch, User, Period)
  if (Array.isArray(metadata) && metadata.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);

    metadata.forEach((m) => {
      ensureSpace(6);
      doc.setFont("helvetica", "bold");
      doc.text(`${m.label}: `, margin, y);
      const labelWidth = doc.getTextWidth(`${m.label}: `);
      doc.setFont("helvetica", "normal");
      doc.text(String(m.value || "—"), margin + labelWidth, y);
      y += 5;
    });
    y += 2;
  }

  // 3. KPIs Section
  if (Array.isArray(kpis) && kpis.length > 0) {
    ensureSpace(28);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("KEY PERFORMANCE INDICATORS", margin, y);
    y += 4;

    const visibleKpis = kpis.slice(0, 4);
    const count = visibleKpis.length;
    const cardGap = 2;
    const totalGap = (count - 1) * cardGap;
    const cardWidth = (printableWidth - totalGap) / count;
    const cardHeight = 18;

    visibleKpis.forEach((kpi, idx) => {
      const cardX = margin + idx * (cardWidth + cardGap);
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(cardX, y, cardWidth, cardHeight, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
      const titleLines = doc.splitTextToSize(String(kpi.title || "").toUpperCase(), cardWidth - 4);
      doc.text(titleLines[0] || "", cardX + 2.5, y + 5);

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      const valStr = String(kpi.value ?? "—");
      doc.text(valStr, cardX + 2.5, y + 13);
    });

    y += cardHeight + 6;
  }

  // 4. Custom Sections (Tables, Lists, Text Boxes)
  sections.forEach((sec, sIdx) => {
    if (!sec) return;

    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const secTitle = sec.title ? `${sIdx + 1}. ${sec.title.toUpperCase()}` : `SECTION ${sIdx + 1}`;
    doc.text(secTitle, margin, y);
    y += 4.5;

    // Optional section subtitle/context
    if (sec.subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
      doc.text(sec.subtitle, margin, y);
      y += 4;
    }

    // A. TABLE TYPE
    if (sec.type === "table" && Array.isArray(sec.rows)) {
      const headers = sec.headers || [];
      const colWidths = sec.colWidths || headers.map(() => printableWidth / (headers.length || 1));
      const rowHeight = 5.5;

      // Table Header
      ensureSpace(rowHeight + 4);
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, printableWidth, rowHeight, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);

      let curX = margin;
      headers.forEach((h, hIdx) => {
        const w = colWidths[hIdx] || printableWidth / headers.length;
        doc.text(String(h), curX + 2, y + 4);
        curX += w;
      });
      y += rowHeight;

      // Table Rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);

      if (sec.rows.length === 0) {
        ensureSpace(rowHeight);
        doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
        doc.text(sec.emptyMessage || "No records available.", margin + 2, y + 4);
        y += rowHeight + 2;
      } else {
        sec.rows.forEach((row, rIdx) => {
          ensureSpace(rowHeight);
          if (rIdx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y, printableWidth, rowHeight, "F");
          }
          doc.setTextColor(30, 41, 59);

          let cellX = margin;
          row.forEach((cell, cIdx) => {
            const w = colWidths[cIdx] || printableWidth / headers.length;
            const text = String(cell ?? "—");
            const truncated = doc.splitTextToSize(text, w - 3)[0] || "";
            doc.text(truncated, cellX + 2, y + 4);
            cellX += w;
          });
          y += rowHeight;
        });
        y += 3;
      }
    }

    // B. KEY-VALUE LIST TYPE
    else if (sec.type === "key-value" && Array.isArray(sec.items)) {
      sec.items.forEach((item) => {
        ensureSpace(5.5);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(`• ${item.label}:`, margin + 2, y + 3.5);

        const lblW = doc.getTextWidth(`• ${item.label}: `);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(String(item.value ?? "—"), margin + 2 + lblW, y + 3.5);
        y += 5;
      });
      y += 2;
    }

    // C. TEXT / PARAGRAPH TYPE
    else if (sec.type === "text" && sec.text) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(sec.text, printableWidth);
      lines.forEach((line) => {
        ensureSpace(4.5);
        doc.text(line, margin, y + 3.5);
        y += 4.5;
      });
      y += 2;
    }

    y += 3;
  });

  // Footer for all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    renderFooter(i, totalPages);
  }

  doc.save(filename);
  return true;
};

