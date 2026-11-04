import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Package,
  BadgeDollarSign,
  AlertTriangle,
  XCircle,
  ArrowRight,
  History,
  CloudRain,
  Thermometer,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Info,
  Sparkles,
} from "lucide-react";
import Breadcrumbs from "../../../Components/Minor-Components/Breadcrumbs";
import DashboardExportControls from "../../../Components/Minor-Components/DashboardExportControls";
import Toast from "../../../Components/Modals/Toast";
import useToast from "../../../Components/hooks/useToast";
import {
  downloadCsv,
  generateDashboardPdf,
  formatReportDate,
  formatReportTime,
} from "../../../lib/dashboardExportUtils";
import KPICard from "../../../Components/Graphs/KPICard";
import DistributionCard from "../../../Components/Graphs/PieChartCard";
import CategoryBarCard from "../../../Components/Graphs/BarGraphsCard";
import RecentActivityCard from "../../../Components/Graphs/RecentActivityCard";
import PendingReviewsCard from "../../../Components/Graphs/PendingReviewsCard";
import useEncoderDashboard from "../../../Components/hooks/MillerEncoder/useEncoderDashboard";

// ─── Risk Badge Style Helper ──────────────────────────────────────────────────
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


const MILLER_ENCODER_CSV_DATASETS = [
  { id: "kpi", label: "Inventory KPIs", icon: Package },
  { id: "inventory_status", label: "Inventory Status Breakdown", icon: AlertTriangle },
  { id: "climate", label: "Copernicus Climate Outlook", icon: CloudRain },
  { id: "shelf_health", label: "AI Moisture & Shelf Health", icon: Sparkles },
  { id: "recent_activity", label: "Recent Inventory Activity", icon: History },
  { id: "pending_reviews", label: "Pending Reviews", icon: CheckCircle2 },
];

export default function MillerEncoderDashboard() {
  const navigate = useNavigate();
  const { fetchDashboardData, loading, error } = useEncoderDashboard();

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
          message: "Inventory and climate dashboard data updated.",
        });
      }
    } catch (err) {
      if (isManual) {
        showToast({
          type: "error",
          title: "Refresh Failed",
          message: "Unable to refresh encoder dashboard data.",
        });
      }
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, [fetchDashboardData, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Clean error message preventing raw HTML from rendering in UI
  const displayError = useMemo(() => {
    if (!error) return null;
    if (
      typeof error === "string" &&
      (error.trim().startsWith("<") ||
        error.toLowerCase().includes("<!doctype") ||
        error.toLowerCase().includes("<html") ||
        error.toLowerCase().includes("<body"))
    ) {
      return "Failed to load dashboard data. Please try again.";
    }
    return typeof error === "string" ? error : "Failed to load dashboard data.";
  }, [error]);

  // Current date & time for header
  const now = useMemo(() => new Date(), []);
  const formattedDate = useMemo(
    () =>
      now.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [now]
  );
  const formattedTime = useMemo(
    () =>
      now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    [now]
  );

  // ─── Extract Data ───────────────────────────────────────────────────────────
  const kpis = dashboardData?.kpis || {};
  const invStatusItems = dashboardData?.inventory_status || [];
  const invOverviewItems = dashboardData?.inventory_overview || [];
  const lowStockItems = dashboardData?.low_stock_distributions || [];
  const recentActivityItems = dashboardData?.recent_activity || [];
  const pendingOrders = dashboardData?.pending_orders || { pending_count: 0, items: [] };
  const weeklySnapshot = dashboardData?.weekly_cds_snapshot || null;

  // ─── Top KPI Metrics with Click Handlers ────────────────────────────────────
  const kpiMetrics = useMemo(
    () => [
      {
        title: "Product Variants",
        value: kpis.product_variants?.value ?? "0",
        footer: kpis.product_variants?.footer ?? "Registered warehouse products",
        tone: "neutral",
        icon: <Package size={18} strokeWidth={2.2} />,
        onClick: () => navigate("/supplier-encoder/stock"),
      },
      {
        title: "Inventory Value",
        value: kpis.inventory_value?.value ?? "₱0",
        footer: kpis.inventory_value?.footer ?? "Total warehouse inventory value",
        tone: "success",
        icon: <BadgeDollarSign size={18} strokeWidth={2.2} />,
        onClick: () => navigate("/supplier-encoder/stock"),
      },
      {
        title: "Low Stock Products",
        value: kpis.low_stock_products?.value ?? "0",
        footer: kpis.low_stock_products?.footer ?? "Products requiring restocking",
        tone: "warning",
        icon: <AlertTriangle size={18} strokeWidth={2.2} />,
        onClick: () => navigate("/supplier-encoder/stock?filter=low-stock"),
      },
      {
        title: "Out of Stock",
        value: kpis.out_of_stock?.value ?? "0",
        footer: kpis.out_of_stock?.footer ?? "Products with zero available inventory",
        tone: "danger",
        variant: "solid",
        icon: <XCircle size={18} strokeWidth={2.2} />,
        onClick: () => navigate("/supplier-encoder/stock?filter=no-stock"),
      },
    ],
    [kpis, navigate]
  );

  // ─── Climate Months Preparation ─────────────────────────────────────────────
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
  const climateLocation = weeklySnapshot?.location_name || weeklySnapshot?.city || "Regional Facility";

  const forecastRangeLabel = useMemo(() => {
    if (climateMonths.length >= 2) {
      return `${climateMonths[0].month} → ${climateMonths[climateMonths.length - 1].month}`;
    }
    return "3-Month Seasonal Forecast";
  }, [climateMonths]);

  const csvDatasets = MILLER_ENCODER_CSV_DATASETS;

  const handleExportCsv = (section = "all") => {
    try {
      const rows = [];
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `grainrise-miller-encoder-dashboard-${section}-${dateStr}.csv`;

      rows.push(["GRAINRISE MILLER ENCODER INVENTORY & STORAGE REPORT"]);
      rows.push(["Generated At", `${formatReportDate(now)} ${formatReportTime(now)}`]);
      rows.push([]);

      if (section === "kpi" || section === "all") {
        rows.push(["KEY INVENTORY INDICATORS (KPIS)"]);
        rows.push(["Metric", "Value", "Description"]);
        rows.push(["Product Variants", kpiMetrics[0]?.value ?? "—", "Registered warehouse products"]);
        rows.push(["Inventory Value", kpiMetrics[1]?.value ?? "—", "Total warehouse inventory value"]);
        rows.push(["Low Stock Products", kpiMetrics[2]?.value ?? "—", "Products requiring restocking"]);
        rows.push(["Out of Stock", kpiMetrics[3]?.value ?? "—", "Zero available inventory"]);
        rows.push([]);
      }

      if (section === "inventory_status" || section === "all") {
        rows.push(["INVENTORY STATUS BREAKDOWN"]);
        rows.push(["Status", "Share (%)"]);
        invStatusItems.forEach((item) => {
          rows.push([item.label, `${item.value}%`]);
        });
        rows.push([]);
      }

      if (section === "climate" || section === "all") {
        rows.push(["COPERNICUS CDS 3-MONTH CLIMATE OUTLOOK"]);
        rows.push(["Location", climateLocation]);
        rows.push(["Month", "Projected Rainfall (mm)", "Projected Temperature (°C)"]);
        climateMonths.forEach((m) => {
          rows.push([m.month, m.rainfall_mm, m.temperature_c]);
        });
        rows.push([]);
      }

      if (section === "shelf_health" || section === "all") {
        rows.push(["AI MOISTURE & SHELF HEALTH INSIGHT"]);
        rows.push(["Risk Level", riskLevel]);
        rows.push(["Agronomic / Storage Guidance", weeklySnapshot?.shelf_health_explanation || ""]);
        rows.push([]);
      }

      if (section === "recent_activity" || section === "all") {
        rows.push(["RECENT INVENTORY ACTIVITY"]);
        rows.push(["Title", "Description", "Time"]);
        recentActivityItems.forEach((a) => {
          rows.push([a.title, a.description, a.time]);
        });
        rows.push([]);
      }

      if (section === "pending_reviews" || section === "all") {
        rows.push(["PENDING REVIEWS"]);
        rows.push(["Type", "Product / Variant", "Status", "Date"]);
        (pendingOrders?.items || []).forEach((p) => {
          rows.push([p.type || "Order Request", p.order_number || p.name || "—", p.status || "Pending", p.date || p.time || "—"]);
        });
        rows.push([]);
      }

      downloadCsv(filename, rows);
      showToast({
        type: "success",
        title: "Report Exported",
        message: "Encoder CSV report downloaded successfully.",
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
        subtitle: "Executive Miller Milling Inventory & Shelf Health Report",
        metadata: [
          { label: "Account Role", value: "Miller Encoder" },
          { label: "Climate Source", value: "Copernicus CDS Predictive Climate Data" },
        ],
        kpis: [
          { title: "PRODUCT VARIANTS", value: kpiMetrics[0]?.value ?? "—" },
          { title: "INVENTORY VALUE", value: kpiMetrics[1]?.value ?? "—" },
          { title: "LOW STOCK", value: kpiMetrics[2]?.value ?? "—" },
          { title: "OUT OF STOCK", value: kpiMetrics[3]?.value ?? "—" },
        ],
        sections: [
          {
            title: "Inventory Stock Distribution",
            type: "table",
            headers: ["Status Category", "Proportion (%)"],
            colWidths: [90, 92],
            rows: invStatusItems.map((item) => [item.label, `${item.value}%`]),
          },
          {
            title: `Seasonal Climate Outlook (${climateLocation})`,
            type: "table",
            headers: ["Month", "Projected Rainfall (mm)", "Projected Temperature (°C)"],
            colWidths: [62, 60, 60],
            rows: climateMonths.map((m) => [m.month, `${m.rainfall_mm} mm`, `${m.temperature_c}°C`]),
          },
          {
            title: `AI Shelf Health Assessment [${riskLevel} RISK]`,
            type: "text",
            text: weeklySnapshot?.shelf_health_explanation || "Storage environmental conditions are currently stable.",
          },
          {
            title: "Pending Inventory Quality Reviews",
            type: "table",
            headers: ["Review Type", "Item Name", "Status", "Target Date"],
            colWidths: [45, 60, 42, 35],
            rows: (pendingOrders?.items || []).map((p) => [p.type || "Order Request", p.order_number || p.name || "—", p.status || "Pending", p.date || p.time || "—"]),
          },
        ],
        filename: `grainrise-miller-encoder-report-${new Date().toISOString().split("T")[0]}.pdf`,
      });
      showToast({
        type: "success",
        title: "Report Exported",
        message: "Encoder summary PDF report downloaded successfully.",
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
    <div className="space-y-5">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={[{ label: "Main" }, { label: "Dashboard" }]} />
          <h1 className="text-[clamp(2rem,3vw,2.5rem)] font-extrabold tracking-[-0.03em] text-slate-900">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Last Updated: Today · {formattedTime}
          </p>
        </div>

        <DashboardExportControls
          formattedDate={formattedDate}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing || loading}
          refreshTitle="Refresh Inventory & Climate Data"
          csvDatasets={csvDatasets}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
        />
      </div>

      {/* ── Error Banner if Fetch Fails ──────────────────────────────────────── */}
      {displayError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0 text-rose-500" />
            <span>{displayError}</span>
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

      {/* ── Loading Overlay or Content ───────────────────────────────────────── */}
      {loading && !dashboardData ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
          <Loader2 size={36} className="animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-800">Loading Warehouse Dashboard...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving branch inventory KPIs and weekly climate snapshot.</p>
        </div>
      ) : (
        <>
          {/* ── KPI Row ──────────────────────────────────────────────────────────── */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {kpiMetrics.map((metric) => (
              <KPICard key={metric.title} {...metric} />
            ))}
          </div>

          {/* ── Charts Row ───────────────────────────────────────────────────────── */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Inventory Status donut */}
            <DistributionCard
              title="Inventory Status"
              totalLabel="Current Inventory Status"
              items={invStatusItems}
              donutSize={160}
              holeSize={60}
            />

            {/* Inventory Overview bar chart */}
            <CategoryBarCard
              title="Inventory Overview"
              items={invOverviewItems}
              seriesLabel="2026"
              barColor="#0F9D2A"
              height={160}
              showLegend={true}
            />

            {/* Low Stock Distributions bar chart */}
            <CategoryBarCard
              title="Low Stock Distributions"
              items={lowStockItems}
              seriesLabel="2026"
              barColor="#E0AC1C"
              height={160}
              showLegend={true}
            />
          </div>

          {/* ── NEW: WEEKLY 3-MONTH CDS SNAPSHOT & AI SHELF HEALTH ROW ──────────── */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* ── Left Card: 3-Month Climate Forecast ──────────────────────────── */}
            <article className="dark-readable-graph w-full overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)] flex flex-col justify-between">
              <header className="border-b border-slate-100 px-4 py-3 sm:px-5 flex items-center justify-between gap-3">
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

              <div className="p-4 sm:p-5 space-y-4 flex-1">
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

              <footer className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 sm:px-5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Weekly Snapshot • Valid for 7 days</span>
                <span className="font-medium text-slate-500">Auto-refreshes weekly</span>
              </footer>
            </article>

            {/* ── Right Card: AI Moisture & Shelf Health Insight ────────────────── */}
            <article className="dark-readable-graph w-full overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)] flex flex-col justify-between">
              <header className="border-b border-slate-100 px-4 py-3 sm:px-5 flex items-center justify-between gap-3">
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

              <div className="p-4 sm:p-5 space-y-3.5 flex-1 overflow-y-auto max-h-[360px]">
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

              <footer className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 sm:px-5 flex items-center justify-between text-[11px] text-slate-400">
                <span>GrainRise AI Preservation Engine</span>
                <span className="font-medium text-slate-500">Stored in 7-day snapshot</span>
              </footer>
            </article>
          </div>

          {/* ── Activity + Pending Row ────────────────────────────────────────────── */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Recent Inventory Activity */}
            <div className="flex flex-col gap-3">
              <RecentActivityCard
                title="Recent Inventory Activity"
                items={recentActivityItems}
                showConnector={true}
              />
              {/* View History CTA */}
              <button
                type="button"
                onClick={() => navigate("/supplier-encoder/orders")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 cursor-pointer"
              >
                <History size={14} strokeWidth={2.5} />
                View History
                <ArrowRight size={13} strokeWidth={2.5} />
              </button>
            </div>

            {/* Pending Order Requests */}
            <div className="flex flex-col gap-3">
              <PendingReviewsCard
                title="Pending Order Requests"
                items={pendingOrders.items}
                viewAllLabel="View Requests →"
                onViewAll={() => navigate("/supplier-encoder/orders")}
              />
              {/* Badge showing count */}
              <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 text-sm">
                <span className="font-semibold text-amber-700">
                  {pendingOrders.pending_count} awaiting approval
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/supplier-encoder/orders")}
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-700 transition hover:text-emerald-800 cursor-pointer"
                >
                  View Requests
                  <ArrowRight size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
