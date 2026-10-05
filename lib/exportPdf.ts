import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportDocumentToPdf({
  title,
  businessName,
  sections,
  metadata,
}: {
  title: string;
  businessName: string;
  sections: { title: string; content: string }[];
  metadata?: Record<string, string | number>;
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(79, 70, 229); // #4F46E5 Indigo
  doc.rect(0, 0, pageWidth, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("BIZMIND AI", 14, 15);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Intelligent Business Planning & Management Platform", pageWidth - 14, 15, { align: "right" });

  // Document Title & Subheader
  let y = 36;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, y);

  y += 7;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Company: ${businessName} | Date: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, 14, y);

  // Metadata Table if provided
  if (metadata && Object.keys(metadata).length > 0) {
    y += 10;
    const tableData = Object.entries(metadata).map(([key, val]) => [key, String(val)]);
    autoTable(doc, {
      startY: y,
      head: [["Metric / Dimension", "Value"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 12;
  } else {
    y += 12;
  }

  // Sections
  sections.forEach((sec, idx) => {
    // Check if new page needed
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(`${idx + 1}. ${sec.title}`, 14, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);

    const splitText = doc.splitTextToSize(sec.content, pageWidth - 28);
    for (let i = 0; i < splitText.length; i++) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(splitText[i], 14, y);
      y += 5;
    }

    y += 6;
  });

  // Footer on all pages
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `BizMind AI Confidential — Page ${i} of ${pageCount} — Generated automatically`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  const safeFileName = `${businessName.toLowerCase().replace(/\s+/g, "-")}-${title.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  doc.save(safeFileName);
}
