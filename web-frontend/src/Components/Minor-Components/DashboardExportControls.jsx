import React, { useState, useRef, useEffect } from "react";
import {
  CalendarDays,
  RefreshCw,
  FileSpreadsheet,
  FileDown,
  ChevronDown,
  Layers,
} from "lucide-react";

/**
 * Standardized Dashboard Header Controls matching the Farmer Dashboard.
 *
 * Provides:
 * 1. Optional children (branch/farm selector, period filter pills)
 * 2. Date pill
 * 3. Refresh button (spinning when isRefreshing)
 * 4. Export CSV dropdown ("All Dashboard Data" + individual datasets)
 * 5. Export PDF button
 *
 * @param {Object} props
 * @param {string} [props.formattedDate] - Display date string (defaults to today)
 * @param {Function} [props.onRefresh] - Async/sync callback to refetch API data
 * @param {boolean} [props.isRefreshing] - Refresh loading state
 * @param {string} [props.refreshTitle] - Tooltip for refresh button
 * @param {Array<{id: string, label: string, icon?: React.ComponentType}>} [props.csvDatasets] - Selectable CSV dataset options
 * @param {Function} [props.onExportCsv] - Callback (datasetId) => void
 * @param {Function} [props.onExportPdf] - Callback () => void
 * @param {React.ReactNode} [props.children] - Left-aligned extra controls (selectors, filters)
 */
export default function DashboardExportControls({
  formattedDate,
  onRefresh,
  isRefreshing = false,
  refreshTitle = "Refresh dashboard data",
  csvDatasets = [],
  onExportCsv,
  onExportPdf,
  children,
}) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const displayDate =
    formattedDate ||
    new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const handleSelectDataset = (datasetId) => {
    setExportMenuOpen(false);
    if (typeof onExportCsv === "function") {
      onExportCsv(datasetId);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 self-start">
      {/* Optional Branch / Farm / Range Selectors */}
      {children}

      {/* Date Pill */}
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm">
        <CalendarDays size={14} className="text-slate-500" />
        <span>{displayDate}</span>
      </div>

      {/* Refresh Button */}
      {typeof onRefresh === "function" && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-60 cursor-pointer"
          title={refreshTitle}
        >
          <RefreshCw
            size={13}
            className={isRefreshing ? "animate-spin text-emerald-600" : "text-slate-500"}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      )}

      {/* Export CSV Dropdown */}
      {typeof onExportCsv === "function" && (
        <div className="relative" ref={exportDropdownRef}>
          <button
            type="button"
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100 active:scale-95 cursor-pointer"
            title="Export dashboard data to CSV"
          >
            <FileSpreadsheet size={14} className="text-emerald-700" />
            <span>Export CSV</span>
            <ChevronDown size={12} className="text-emerald-700" />
          </button>

          {exportMenuOpen && (
            <div className="absolute right-0 z-50 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Select Dataset
              </div>
              <button
                type="button"
                onClick={() => handleSelectDataset("all")}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer text-left"
              >
                <Layers size={13} />
                <span>All Dashboard Data</span>
              </button>

              {csvDatasets.length > 0 && <div className="my-1 border-t border-slate-100" />}

              {csvDatasets.map((ds) => {
                return (
                  <button
                    key={ds.id}
                    type="button"
                    onClick={() => handleSelectDataset(ds.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer text-left"
                  >
                    {React.isValidElement(ds.icon) ? (
                      ds.icon
                    ) : typeof ds.icon === "function" ? (
                      <ds.icon size={13} className="shrink-0 text-slate-500" />
                    ) : null}
                    <span className="truncate">{ds.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Export PDF Button */}
      {typeof onExportPdf === "function" && (
        <button
          type="button"
          onClick={onExportPdf}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-900 active:scale-95 cursor-pointer"
          title="Download executive PDF summary"
        >
          <FileDown size={14} />
          <span>Export PDF</span>
        </button>
      )}
    </div>
  );
}
