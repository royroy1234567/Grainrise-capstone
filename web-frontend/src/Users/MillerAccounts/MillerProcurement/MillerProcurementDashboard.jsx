import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Package,
  CornerUpLeft,
  CreditCard,
  CalendarDays,
  CloudRain,
  Thermometer,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Info,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import Breadcrumbs from "../../../Components/Minor-Components/Breadcrumbs";
import DateDisplay from "../../../Components/Minor-Components/DateDisplay";
import DashboardExportControls from "../../../Components/Minor-Components/DashboardExportControls";
import Toast from "../../../Components/Modals/Toast";
import useToast from "../../../Components/hooks/useToast";
import {
  downloadCsv,
  generateDashboardPdf,
  formatReportDate,
  formatReportTime,
} from "../../../lib/dashboardExportUtils";
import SectionedTableCard from "../../../Components/Minor-Components/SectionedTableCard";
import useProcurementDashboard from "../../../Components/hooks/MillerProcurement/useProcurementDashboard";

// ── Risk Badge Style Helper ──────────────────────────────────────────────────
const RISK_STYLES = {
  LOW: {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    icon: ShieldCheck,
  },
  MODERATE: {
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    icon: ShieldAlert,
  },
  HIGH: {
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    dot: "bg-rose-500",
    icon: ShieldAlert,
  },
};

// ── KPI Card (Figma-style: label / big number / caption link) ──────────────
const ProcurementKPICard = ({
  label,
  value,
  caption,
  captionColor = "#1a7a3a",
  icon: Icon,
  iconBg = "#e8f5ee",
  iconColor = "#0B7A2A",
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`flex-1 min-w-0 rounded-[14px] border border-slate-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 transition-transform duration-200 ${
      onClick ? "cursor-pointer group" : ""
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: iconBg }}>
        <Icon size={16} strokeWidth={2.2} style={{ color: iconColor }} />
      </div>
    </div>
    <div className="mt-2 text-[clamp(1.5rem,2.5vw,2rem)] font-extrabold leading-none tracking-[-0.02em] text-slate-900">
      {value}
    </div>
    {caption && (
      <p className="mt-1.5 text-[11px] font-semibold flex items-center justify-between" style={{ color: captionColor }}>
        <span>{caption}</span>
        {onClick && (
          <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        )}
      </p>
    )}
  </div>
);

// ── Inline two-column summary card (Supplier Performance / Returns Summary) ─
const SummaryCard = ({ title, columns, onView, viewLabel = "View" }) => (
  <div className="flex-1 min-w-0 rounded-[14px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
    <div className="px-4 pt-3 pb-1 border-b border-slate-100">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    </div>
    <div className="flex divide-x divide-slate-100 px-4 py-2.5">
      {columns.map((col, i) => (
        <div key={i} className="flex-1 px-2.5 first:pl-0 last:pr-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">{col.label}</p>
          <p className="mt-0.5 text-[13px] font-bold text-slate-800 truncate" title={col.value}>{col.value}</p>
        </div>
      ))}
    </div>
    <div className="border-t border-dashed border-slate-200 px-4 py-1.5 text-center">
      <button
        type="button"
        className="text-[11px] font-semibold text-[#1a7a3a] hover:underline cursor-pointer"
        onClick={onView}
      >
        {viewLabel}
      </button>
    </div>
  </div>
);

// ── Activity item row ────────────────────────────────────────────────────────
const ActivityItem = ({ title, description, time }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
    <div className="min-w-0">
      <p className="text-[12px] font-bold text-slate-800 leading-tight">{title}</p>
      {description && (
        <p className="mt-0.5 text-[10px] text-slate-500 leading-snug">{description}</p>
      )}
    </div>
    {time && (
      <span className="whitespace-nowrap text-[10px] font-semibold text-emerald-700 pt-0.5">{time}</span>
    )}
  </div>
);

// ── Date group header with calendar icon ─────────────────────────────────────
const ActivityGroup = ({ date, items }) => (
  <div className="mb-1">
    <div className="flex items-center gap-2 py-1.5">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0B7A2A]">
        <CalendarDays size={13} strokeWidth={2.2} className="text-white" />
      </div>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">{date}</span>
    </div>
    <div className="ml-8">
      {items.map((item, i) => (
        <ActivityItem key={i} {...item} />
      ))}
    </div>
  </div>
);

// ── Custom Title Wrapper for SectionedTableCard ──────────────────────────────
const SmallCardHeader = ({ title }) => (
  <span className="text-sm md:text-base font-bold text-gray-900 block px-1 py-0.5">
    {title}
  </span>
);

// ── Main Procurement Dashboard ───────────────────────────────────────────────

const MILLER_PROCUREMENT_CSV_DATASETS = [
  { id: "kpi", label: "Procurement KPIs", icon: Package },
  { id: "supplier_perf", label: "Supplier Performance", icon: Truck },
  { id: "returns", label: "Returns Summary", icon: CornerUpLeft },
  { id: "climate", label: "Copernicus Climate Outlook", icon: CloudRain },
  { id: "shelf_health", label: "AI Moisture & Shelf Health", icon: Sparkles },
  { id: "recent_orders", label: "Recent Activities", icon: CheckCircle2 },
];

const MillerProcurementDashboard = () => {
  const navigate = useNavigate();
  const { fetchDashboardData, loading, error } = useProcurementDashboard();

  const [dashboardData, setDashboardData] = useState(null);

  const { toasts, showToast, removeToast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const data = await fetchDashboardData();
      if (data) {
        setDashboardData(data);
      }
      if (isManual) {
        showToast({
          type: "success",
          title: "Dashboard Refreshed",
          message: "Procurement dashboard data updated.",
        });
      }
    } catch (err) {
      if (isManual) {
        showToast({
          type: "error",
          title: "Refresh Failed",
          message: "Unable to refresh procurement dashboard data.",
        });
      }
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, [fetchDashboardData, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const lastUpdatedTime = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  // ── Real Data Extraction ───────────────────────────────────────────────────
  const kpisData = dashboardData?.kpis || {};
  const receivingOrdersRows = dashboardData?.receiving_orders_preview || [];
  const pendingPayablesRows = dashboardData?.pending_payables_preview || [];
  const supplierPerfColumns = dashboardData?.supplier_performance || [
    { label: "Top Suppliers", value: "None Yet" },
    { label: "Deliveries", value: "0" },
    { label: "Acceptance", value: "100.0%" },
  ];
  const returnsSummaryColumns = dashboardData?.returns_summary || [
    { label: "Pending", value: "0 Batch(es)" },
    { label: "Deliveries", value: "None" },
    { label: "Acceptance", value: "None" },
  ];
  const activityGroups = dashboardData?.recent_activity || [];
  const weeklySnapshot = dashboardData?.weekly_cds_snapshot || null;

  // KPI cards with navigation
  const kpis = [
    {
      label: "Suppliers",
      value: kpisData.suppliers?.value ?? "0",
      caption: kpisData.suppliers?.caption ?? "Registered Suppliers",
      icon: Truck,
      iconBg: "#e8f5ee",
      iconColor: "#0B7A2A",
      onClick: () => navigate("/miller-procurement/suppliers"),
    },
    {
      label: "Receiving Orders",
      value: kpisData.receiving_orders?.value ?? "0",
      caption: kpisData.receiving_orders?.caption ?? "Incoming Orders",
      icon: Package,
      iconBg: "#e8f5ee",
      iconColor: "#0B7A2A",
      onClick: () => navigate("/miller-procurement/receiving-orders"),
    },
    {
      label: "Returns",
      value: kpisData.returns?.value ?? "0",
      caption: kpisData.returns?.caption ?? "Open Return Cases",
      icon: CornerUpLeft,
      iconBg: "#fff8e1",
      iconColor: "#d4a017",
      captionColor: "#d4a017",
      onClick: () => navigate("/miller-procurement/returns"),
    },
    {
      label: "Pending Payables",
      value: kpisData.pending_payables?.value ?? "0",
      caption: kpisData.pending_payables?.caption ?? "Payment Requests",
      icon: CreditCard,
      iconBg: "#fff3e0",
      iconColor: "#e67e22",
      captionColor: "#e67e22",
      onClick: () => navigate("/miller-procurement/payment-history"),
    },
  ];

  // Receiving Orders preview table columns
  const receivingOrdersColumns = [
    { key: "batchNo", label: "Batch No." },
    { key: "supplier", label: "Supplier" },
    { key: "eta", label: "ETA" },
    { key: "status", label: "Status" },
  ];

  // Pending Payables preview table columns
  const pendingPayablesColumns = [
    { key: "batchNo", label: "Batch No." },
    { key: "supplier", label: "Supplier" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
  ];

  // ── Climate Months Preparation (Reused from Encoder CDS weekly snapshot) ──
  const climateMonths = useMemo(() => {
    if (!weeklySnapshot) return [];
    if (Array.isArray(weeklySnapshot.rainfall_data) && weeklySnapshot.rainfall_data.length > 0) {
      return weeklySnapshot.rainfall_data.map((r, idx) => {
        const t = (weeklySnapshot.temperature_data || [])[idx] || {};
        return {
          month: r.month,
          short_month: r.short_month || r.month.split(" ")[0],
          rainfall_mm: Number(r.rainfall_mm ?? 0),
          temperature_c: Number(t.temperature_c ?? 28),
        };
      });
    }
    const months = weeklySnapshot.climate_data?.months || [];
    return months.slice(0, 3).map((m) => ({
      month: m.month,
      short_month: m.short_month || (m.month ? m.month.split(" ")[0] : `M${m.lead_month}`),
      rainfall_mm: Number(m.total_precipitation_mm ?? 0),
      temperature_c: Number(m.average_temperature_c ?? 28),
    }));
  }, [weeklySnapshot]);

  const maxRainfall = useMemo(() => {
    if (climateMonths.length === 0) return 100;
    const maxVal = Math.max(...climateMonths.map((m) => m.rainfall_mm));
    return maxVal > 0 ? maxVal : 100;
  }, [climateMonths]);

  const riskLevel = String(weeklySnapshot?.shelf_health_risk_level || "MODERATE").toUpperCase();
  const riskConfig = RISK_STYLES[riskLevel] || RISK_STYLES.MODERATE;
  const RiskIcon = riskConfig.icon;
  const climateLocation = weeklySnapshot?.location_name || weeklySnapshot?.city || "Warehouse Hub";

  const forecastRangeLabel = useMemo(() => {
    if (climateMonths.length >= 2) {
      return `${climateMonths[0].month} → ${climateMonths[climateMonths.length - 1].month}`;
    }
    return "3-Month Seasonal Forecast";
  }, [climateMonths]);

  // ── Synchronize AI Card Height with 3-Month Climate Forecast Card ─────────
  const climateCardRef = useRef(null);
  const [climateCardHeight, setClimateCardHeight] = useState(null);

  useEffect(() => {
    if (!climateCardRef.current) return;
    const updateHeight = () => {
      if (climateCardRef.current) {
        const h = climateCardRef.current.offsetHeight;
        if (h > 0) {
          setClimateCardHeight((prev) => (prev === h ? prev : h));
        }
      }
    };

    updateHeight();

    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(climateCardRef.current);
    }

    window.addEventListener("resize", updateHeight);
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [weeklySnapshot, climateMonths]);

  const csvDatasets = MILLER_PROCUREMENT_CSV_DATASETS;

  const handleExportCsv = (section = "all") => {
    try {
      const rows = [];
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `grainrise-miller-procurement-dashboard-${section}-${dateStr}.csv`;

      rows.push(["GRAINRISE MILLER PROCUREMENT DASHBOARD REPORT"]);
      rows.push(["Generated At", `${formatReportDate()} ${formatReportTime()}`]);
      rows.push([]);

      if (section === "kpi" || section === "all") {
        rows.push(["KEY PROCUREMENT INDICATORS (KPIS)"]);
        rows.push(["Metric", "Value", "Description"]);
        rows.push(["Pending Purchase Orders", kpis.pending_pos ?? 0, "Awaiting supplier fulfillment"]);
        rows.push(["Received Goods", kpis.received_goods ?? 0, "Delivered and inspected"]);
        rows.push(["Active Returns", kpis.active_returns ?? 0, "Under review or in transit"]);
        rows.push(["Pending Payments", kpis.pending_payments ?? 0, "Payment processing"]);
        rows.push([]);
      }

      if (section === "supplier_perf" || section === "all") {
        rows.push(["SUPPLIER PERFORMANCE"]);
        rows.push(["Metric", "Rate / Count"]);
        rows.push(["On-Time Delivery Rate", supplierPerf.on_time_rate]);
        rows.push(["Quality Pass Rate", supplierPerf.quality_pass_rate]);
        rows.push(["Active Registered Suppliers", supplierPerf.active_suppliers]);
        rows.push([]);
      }

      if (section === "returns" || section === "all") {
        rows.push(["RETURNS SUMMARY"]);
        rows.push(["Metric", "Value"]);
        rows.push(["Pending Review", returnsSummary.pending_review]);
        rows.push(["Total Returned Quantity", returnsSummary.total_returned_qty]);
        rows.push(["Supplier Refund Rate", returnsSummary.supplier_refund_rate]);
        rows.push([]);
      }

      if (section === "climate" || section === "all") {
        rows.push(["COPERNICUS CDS 3-MONTH CLIMATE OUTLOOK"]);
        rows.push(["Location", climateLocation]);
        rows.push(["Month", "Projected Rainfall (mm)", "Projected Temperature (°C)"]);
        climateMonths.forEach((m) => {
          rows.push([m.month, m.rain, m.temp]);
        });
        rows.push([]);
      }

      if (section === "shelf_health" || section === "all") {
        rows.push(["AI MOISTURE & SHELF HEALTH GUIDANCE"]);
        rows.push(["Risk Level", riskLevel]);
        rows.push(["Storage Guidance", weeklySnapshot?.shelf_health_explanation || ""]);
        rows.push([]);
      }

      if (section === "recent_orders" || section === "all") {
        rows.push(["RECENT PROCUREMENT ACTIVITIES"]);
        rows.push(["Date", "Time", "Action", "Detail"]);
        activityGroups.forEach((group) => {
          (group.items || []).forEach((item) => {
            rows.push([group.date, item.time, item.action, item.detail]);
          });
        });
        rows.push([]);
      }

      downloadCsv(filename, rows);
      showToast({
        type: "success",
        title: "Report Exported",
        message: "Procurement CSV report downloaded successfully.",
      });
    } catch (err) {
      console.error("CSV Export error:", err);
      showToast({
        type: "error",
        title: "Export Failed",
        message: "Failed to generate CSV export.",
      });
    }
  };

  const handleExportPdf = () => {
    try {
      generateDashboardPdf({
        title: "GRAINRISE AGRICULTURAL PLATFORM",
        subtitle: "Executive Miller Procurement & Sourcing Operations Report",
        metadata: [
          { label: "Account Role", value: "Miller Procurement" },
          { label: "Forecast Location", value: climateLocation },
        ],
        kpis: [
          { title: "PENDING POS", value: kpis.pending_pos ?? 0 },
          { title: "RECEIVED GOODS", value: kpis.received_goods ?? 0 },
          { title: "ACTIVE RETURNS", value: kpis.active_returns ?? 0 },
          { title: "PENDING PAYMENTS", value: kpis.pending_payments ?? 0 },
        ],
        sections: [
          {
            title: "Supplier Performance & Sourcing Quality",
            type: "table",
            headers: ["Metric", "Performance Level"],
            colWidths: [90, 92],
            rows: [
              ["On-Time Delivery Rate", supplierPerf.on_time_rate],
              ["Quality Pass Rate", supplierPerf.quality_pass_rate],
              ["Active Registered Suppliers", supplierPerf.active_suppliers],
            ],
          },
          {
            title: "Returns & Quality Claims Summary",
            type: "table",
            headers: ["Metric", "Value"],
            colWidths: [90, 92],
            rows: [
              ["Pending Review", returnsSummary.pending_review],
              ["Total Returned Quantity", returnsSummary.total_returned_qty],
              ["Supplier Refund Rate", returnsSummary.supplier_refund_rate],
            ],
          },
          {
            title: `3-Month Copernicus Climate Outlook (${climateLocation})`,
            type: "table",
            headers: ["Month", "Projected Rainfall (mm)", "Projected Temperature (°C)"],
            colWidths: [62, 60, 60],
            rows: climateMonths.map((m) => [m.month, `${m.rain} mm`, `${m.temp}°C`]),
          },
          {
            title: `AI Moisture & Shelf Health Guidance [${riskLevel} RISK]`,
            type: "text",
            text: weeklySnapshot?.shelf_health_explanation || "Procurement grain storage environment conditions are currently stable.",
          },
        ],
        filename: `grainrise-miller-procurement-report-${new Date().toISOString().split("T")[0]}.pdf`,
      });
      showToast({
        type: "success",
        title: "Report Exported",
        message: "Procurement summary PDF report downloaded successfully.",
      });
    } catch (err) {
      console.error("PDF Export error:", err);
      showToast({
        type: "error",
        title: "Export Failed",
        message: "Failed to generate PDF report.",
      });
    }
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Main", path: "/miller-procurement/dashboard" },
          { label: "Dashboard" },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Last Updated: Today, {lastUpdatedTime}</p>
        </div>
        <DashboardExportControls
          formattedDate={formatReportDate()}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing || loading}
          refreshTitle="Refresh Procurement Dashboard Data"
          csvDatasets={csvDatasets}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
        />
      </div>

      {/* Error Banner if Fetch Fails */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 mt-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition cursor-pointer"
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && !dashboardData ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-[0_6px_18px_rgba(15,23,42,0.06)] mt-4">
          <Loader2 size={36} className="animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-800">Loading Procurement Dashboard...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving branch records, incoming orders, and weekly climate snapshot.</p>
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {kpis.map((kpi) => (
              <ProcurementKPICard key={kpi.label} {...kpi} />
            ))}
          </div>

          {/* ── Climate & AI Row: Copernicus CDS (Left) & AI Moisture & Shelf Health (Right) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-5 mt-5">
            {/* ── Left Card: 3-Month Climate Forecast (Above Receiving Orders Preview) ── */}
            <article
              ref={climateCardRef}
              className="dark-readable-graph w-full overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)] flex flex-col"
            >
              <header className="border-b border-slate-100 px-4 py-3 sm:px-5 flex items-center justify-between gap-3 shrink-0">
                <div>
                  <h3 className="text-[17px] font-bold leading-tight tracking-[-0.02em] text-slate-900">
                    3-Month Climate Forecast
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                    {weeklySnapshot?.climate_data?.location || "Regional Forecast"} • {forecastRangeLabel}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-[10px] font-bold text-blue-700 uppercase tracking-wider shrink-0">
                  <CloudRain size={12} className="text-blue-600" />
                  <span>Copernicus CDS</span>
                </div>
              </header>

              <div className="p-4 sm:p-5 space-y-4">
                {climateMonths.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                    <CloudRain size={28} className="mb-2 text-slate-300" />
                    <p className="text-xs">Climate forecast data is currently unavailable.</p>
                  </div>
                ) : (
                  <>
                    {/* Graph 1: Monthly Rainfall */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[12px] font-bold text-slate-700 flex items-center gap-1.5">
                          <CloudRain size={14} className="text-blue-500" />
                          Monthly Rainfall
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">Total mm</span>
                      </div>

                      <div className="flex items-end gap-3 h-24 pt-2 border-b border-slate-100 pb-2">
                        {climateMonths.map((m, idx) => {
                          const heightPct = Math.max(12, (m.rainfall_mm / maxRainfall) * 100);
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-[11px] font-bold text-blue-700">
                                {Math.round(m.rainfall_mm)} mm
                              </span>
                              <div
                                className="w-full rounded-t-sm bg-blue-500/85 hover:bg-blue-600 transition-all cursor-pointer"
                                style={{ height: `${heightPct}%`, minHeight: 6 }}
                                title={`${m.month}: ${m.rainfall_mm} mm`}
                              />
                              <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[65px]">
                                {m.short_month}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Graph 2: Average Monthly Temperature */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[12px] font-bold text-slate-700 flex items-center gap-1.5">
                          <Thermometer size={14} className="text-orange-500" />
                          Average Monthly Temperature
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">Mean °C</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        {climateMonths.map((m, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col items-center justify-center rounded-xl border border-orange-100 bg-orange-50/50 p-2.5 text-center"
                          >
                            <span className="text-[10px] font-semibold text-slate-500">
                              {m.short_month}
                            </span>
                            <span className="mt-0.5 text-base font-extrabold text-orange-700 tracking-tight">
                              {m.temperature_c.toFixed(1)}°C
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <footer className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 sm:px-5 flex items-center justify-between text-[11px] text-slate-400 shrink-0 mt-auto">
                <span>Weekly Snapshot • Valid for 7 days</span>
                <span className="font-medium text-slate-500">Auto-refreshes weekly</span>
              </footer>
            </article>

            {/* ── Right Card: AI Moisture & Shelf Health Insight (Above Pending Payables Preview) ── */}
            <article
              className="dark-readable-graph w-full overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)] flex flex-col"
              style={climateCardHeight ? { height: `${climateCardHeight}px` } : undefined}
            >
              <header className="border-b border-slate-100 px-4 py-3 sm:px-5 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold leading-tight tracking-[-0.02em] text-slate-900">
                      AI Moisture & Shelf Health Insight
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      Climate-Driven Storage Risk Guidance
                    </p>
                  </div>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold tracking-wide uppercase shrink-0 ${riskConfig.badge}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${riskConfig.dot}`} />
                  <RiskIcon size={13} />
                  <span>{riskLevel} RISK</span>
                </div>
              </header>

              <div className="p-4 sm:p-5 space-y-3.5 flex-1 min-h-0 overflow-y-auto">
                {/* Advisory Disclaimer Notice */}
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 text-xs text-amber-800">
                  <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11.5px]">
                    <span className="font-bold">Climate Advisory Guidance:</span> This insight evaluates regional Copernicus CDS weather conditions and current branch inventory. It is not an indoor electronic moisture sensor measurement.
                  </p>
                </div>

                {/* Explanation text */}
                <div className="space-y-2 text-xs sm:text-[12.5px] leading-relaxed text-slate-600">
                  {weeklySnapshot?.explanation ? (
                    weeklySnapshot.explanation
                      .split("\n\n")
                      .filter(Boolean)
                      .map((para, pIdx) => (
                        <p key={pIdx} className="text-slate-700">
                          {para}
                        </p>
                      ))
                  ) : (
                    <p className="text-slate-500 italic">
                      Storage health assessment is being generated based on seasonal conditions.
                    </p>
                  )}
                </div>

                {/* Practical Recommended Actions */}
                {Array.isArray(weeklySnapshot?.recommended_actions) &&
                  weeklySnapshot.recommended_actions.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
                        Recommended Storage Actions:
                      </span>
                      <ul className="space-y-1.5">
                        {weeklySnapshot.recommended_actions.map((action, aIdx) => (
                          <li
                            key={aIdx}
                            className="flex items-start gap-2 text-[11.5px] text-slate-700 leading-snug"
                          >
                            <CheckCircle2
                              size={13}
                              className="text-emerald-600 shrink-0 mt-0.5"
                            />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>

              <footer className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 sm:px-5 flex items-center justify-between text-[11px] text-slate-400 shrink-0 mt-auto">
                <span>GrainRise AI Preservation Engine</span>
                <span className="font-medium text-slate-500">Stored in 7-day snapshot</span>
              </footer>
            </article>
          </div>

          {/* ── Preview Tables with Compact Card Headers ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <SectionedTableCard
              title={<SmallCardHeader title="Receiving Orders Preview" />}
              columns={receivingOrdersColumns}
              sections={[{ rows: receivingOrdersRows }]}
              footerLabel={
                <button
                  type="button"
                  onClick={() => navigate("/miller-procurement/receiving-orders")}
                  className="text-[11px] font-semibold text-[#1a7a3a] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>View All</span>
                </button>
              }
            />
            <SectionedTableCard
              title={<SmallCardHeader title="Pending Payables Preview" />}
              columns={pendingPayablesColumns}
              sections={[{ rows: pendingPayablesRows }]}
              footerLabel={
                <button
                  type="button"
                  onClick={() => navigate("/miller-procurement/payment-history")}
                  className="text-[11px] font-semibold text-[#1a7a3a] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>View All</span>
                </button>
              }
            />
          </div>

          {/* ── Supplier Performance + Returns Summary ── */}
          <div className="flex flex-col lg:flex-row gap-5 mt-5">
            <SummaryCard
              title="Supplier Performance"
              columns={supplierPerfColumns}
              viewLabel="View Suppliers"
              onView={() => navigate("/miller-procurement/suppliers")}
            />
            <SummaryCard
              title="Returns Summary"
              columns={returnsSummaryColumns}
              viewLabel="View Returns"
              onView={() => navigate("/miller-procurement/returns")}
            />
          </div>

          {/* ── Recent Procurement Activity ── */}
          <div className="mt-5 w-full rounded-[14px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
            <div className="border-b border-slate-200 px-4 py-2.5">
              <h3 className="text-sm md:text-base font-bold text-slate-900">Recent Procurement Activity</h3>
            </div>
            <div className="px-4 py-3">
              {activityGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                  <p className="text-xs">No recent procurement activity recorded yet.</p>
                </div>
              ) : (
                activityGroups.map((group, i) => (
                  <ActivityGroup key={i} date={group.date} items={group.items} />
                ))
              )}
            </div>
          </div>
        </>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default MillerProcurementDashboard;
