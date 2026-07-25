import React, { useState } from "react";
import { HiOutlineArrowDownTray, HiOutlineChevronDown } from "react-icons/hi2";

export default function DownloadButton({ targetRef, filename }) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport(format) {
    setOpen(false);
    if (!targetRef.current) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(targetRef.current, { backgroundColor: "#ffffff", scale: 2 });

      if (format === "png") {
        const link = document.createElement("a");
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } else {
        const { jsPDF } = await import("jspdf");
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`${filename}.pdf`);
      }
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 rounded-button border border-border text-body font-semibold text-ink hover:bg-bg transition-colors disabled:opacity-50"
      >
        <HiOutlineArrowDownTray size={16} />
        {isExporting ? "Exporting\u2026" : "Download"}
        <HiOutlineChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-36 card p-1.5 z-10 shadow-floating">
          <button
            type="button"
            onClick={() => handleExport("png")}
            className="w-full text-left px-3 py-2 rounded-[12px] text-body hover:bg-bg transition-colors"
          >
            Export PNG
          </button>
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="w-full text-left px-3 py-2 rounded-[12px] text-body hover:bg-bg transition-colors"
          >
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
