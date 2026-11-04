import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  TrendingUp,
  Coins,
  ClipboardList,
  CheckCircle,
  ShoppingCart,
} from "lucide-react";
import KPICard from "../../../Components/Graphs/KPICard";
import DistributionCard from "../../../Components/Graphs/PieChartCard";
import SalesTrendCard from "../../../Components/Graphs/LineGraphsCard";
import RecentActivityCard from "../../../Components/Graphs/RecentActivityCard";
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
import useApi from "../../../Components/hooks/useApi";

const RANGE_OPTIONS = [
  { label: "Week", value: "Week" },
  { label: "Month", value: "Month" },
];

const TOP_SELLING_COLUMNS = [
  {
    key: "rank",
    label: "Rank",
    width: "60px",
    render: (row) => {
      if (row.rank <= 3) {
        return (
          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-800 text-white text-[11px] font-bold">
            {row.rank}
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center h-5 w-5 text-gray-500 text-[11px] font-bold">
          {row.rank}
        </div>
      );
    },
  },
  { key: "product", label: "Product" },
  { key: "quantity", label: "Quantity Sold" },
];

const WarehouseSalesDashboard = () => {
  const navigate = useNavigate();
  const { request } = useApi();

  const [selectedTrendRange, setSelectedTrendRange] = useState("Week");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const { toasts, showToast, removeToast } = useToast();

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      setLoading(true);
      setError("");
      const res = await request("/warehouse/sales/dashboard/");
      setDashboardData(res);
    } catch (err) {
      console.error("Failed to load warehouse sales dashboard data:", err);
      setError(err?.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, [request, showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const lastUpdatedTime =
    dashboardData?.last_updated ||
    new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const kpis = dashboardData?.kpis;

  // ─── Clickable KPI Cards with Live Data ──────────────────────────────────────
  const salesMetrics = [
    {
      title: "TODAY'S SALES",
      value: kpis?.today_sales?.value || "₱0.00",
      trend: kpis?.today_sales?.trend || "Sales recorded today",
      icon: <BadgeDollarSign size={18} strokeWidth={2.2} />,
      tone: "success",
      onClick: () => navigate("/warehouse-sales/sales-history"),
      ariaLabel: "Navigate to Sales History for Today's Sales",
    },
    {
      title: "SALES THIS MONTH",
      value: kpis?.month_sales?.value || "₱0.00",
      trend: kpis?.month_sales?.trend || "Accumulated monthly revenue",
      icon: <TrendingUp size={18} strokeWidth={2.2} />,
      tone: "success",
      onClick: () => navigate("/warehouse-sales/sales-history"),
      ariaLabel: "Navigate to Sales History for Sales This Month",
    },
    {
      title: "POTENTIAL SALES",
      value: kpis?.potential_sales?.value || "₱0.00",
      trend:
        kpis?.potential_sales?.trend ||
        "Estimated revenue from active inventory and pending sales",
      icon: <Coins size={18} strokeWidth={2.2} />,
      tone: "success",
      onClick: () => navigate("/warehouse-sales/point-of-sale"),
      ariaLabel: "Navigate to Point of Sale (POS) for Potential Sales",
    },
    {
      title: "PENDING ONLINE ORDERS",
      value: kpis?.pending_online_orders?.value || "0 Orders",
      trend: kpis?.pending_online_orders?.trend || "Requires seller attention",
      icon: <ClipboardList size={18} strokeWidth={2.2} />,
      tone: "warning",
      onClick: () => navigate("/warehouse-sales/online-orders"),
      ariaLabel: "Navigate to Online Orders for Pending Online Orders",
    },
  ];

  // ─── Dynamic Sales Trend Series by Range ─────────────────────────────────────
  const currentTrendData = useMemo(() => {
    if (selectedTrendRange === "Month") {
      return dashboardData?.sales_trend?.month || [];
    }
    return dashboardData?.sales_trend?.week || [];
  }, [selectedTrendRange, dashboardData]);

  const currentTrendMax = useMemo(() => {
    if (selectedTrendRange === "Month") {
      return dashboardData?.sales_trend?.max_month || 50000;
    }
    return dashboardData?.sales_trend?.max_week || 10000;
  }, [selectedTrendRange, dashboardData]);

  // ─── Recent Order Activities Mapping ─────────────────────────────────────────
  const recentOrderActivities = useMemo(() => {
    const list = dashboardData?.recent_activities || [];
    return list.map((item) => ({
      ...item,
      icon: item.type === "online" ? ShoppingCart : CheckCircle,
    }));
  }, [dashboardData]);

  // ─── Top Selling Products ───────────────────────────────────────────────────
  const topSellingProducts = dashboardData?.top_selling_products || [];

  const csvDatasets = useMemo(
    () => [
      { id: "kpi", label: "Sales KPIs", icon: BadgeDollarSign },
      { id: "trend", label: `Sales Trend (${selectedTrendRange})`, icon: TrendingUp },
      { id: "distribution", label: "Channel Distribution", icon: Coins },
      { id: "top_selling", label: "Top Selling Products", icon: ShoppingCart },
      { id: "recent_activity", label: "Recent Sales Activity", icon: ClipboardList },
    ],
    [selectedTrendRange]
  );

  const handleExportCsv = (section = "all") => {
    try {
      const rows = [];
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `grainrise-warehouse-sales-dashboard-${section}-${dateStr}.csv`;

      rows.push(["GRAINRISE WAREHOUSE SALES COMMERCIAL SALES REPORT"]);
      rows.push(["Generated At", `${formatReportDate()} ${formatReportTime()}`]);
      rows.push(["Sales Trend Range", selectedTrendRange]);
      rows.push([]);

      if (section === "kpi" || section === "all") {
        rows.push(["KEY SALES PERFORMANCE INDICATORS (KPIS)"]);
        rows.push(["Metric", "Value", "Description"]);
        rows.push(["Today's Sales", kpis?.today_sales?.value || "₱0.00", kpis?.today_sales?.trend || "Sales recorded today"]);
        rows.push(["Sales This Month", kpis?.month_sales?.value || "₱0.00", kpis?.month_sales?.trend || "Monthly accumulated revenue"]);
        rows.push(["Pending Orders", kpis?.pending_orders?.value || "0", kpis?.pending_orders?.trend || "Orders awaiting fulfillment"]);
        rows.push(["Completed Orders", kpis?.completed_orders?.value || "0", kpis?.completed_orders?.trend || "Successfully fulfilled orders"]);
        rows.push([]);
      }

      if (section === "trend" || section === "all") {
        rows.push([`SALES TREND (${selectedTrendRange.toUpperCase()})`]);
        rows.push(["Period", "Sales (PHP)"]);
        (currentTrendData || []).forEach((pt) => {
          rows.push([pt.label, pt.value ?? 0]);
        });
        rows.push([]);
      }

      if (section === "distribution" || section === "all") {
        rows.push(["SALES CHANNEL DISTRIBUTION"]);
        rows.push(["Channel", "Percentage / Revenue"]);
        (dashboardData?.sales_distribution || []).forEach((item) => {
          rows.push([item.label, `${item.value}%`]);
        });
        rows.push([]);
      }

      if (section === "top_selling" || section === "all") {
        rows.push(["TOP SELLING PRODUCTS"]);
        rows.push(["Rank", "Product Variant", "Quantity Sold"]);
        topSellingProducts.forEach((prod) => {
          rows.push([prod.rank, prod.product, prod.quantity]);
        });
        rows.push([]);
      }

      if (section === "recent_activity" || section === "all") {
        rows.push(["RECENT SALES ORDER ACTIVITY"]);
        rows.push(["Title", "Description", "Time"]);
        recentOrderActivities.forEach((act) => {
          rows.push([act.title, act.description, act.time]);
        });
        rows.push([]);
      }

      downloadCsv(filename, rows);
      showToast({
        type: "success",
        title: "Report Exported",
        message: "Sales CSV report downloaded successfully.",
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
        subtitle: "Executive Warehouse Sales Commercial Sales & Revenue Report",
        metadata: [
          { label: "Account Role", value: "Warehouse Sales" },
          { label: "Sales Trend View", value: selectedTrendRange },
        ],
        kpis: [
          { title: "TODAY'S SALES", value: kpis?.today_sales?.value || "₱0.00" },
          { title: "MONTH SALES", value: kpis?.month_sales?.value || "₱0.00" },
          { title: "PENDING ORDERS", value: kpis?.pending_orders?.value || "0" },
          { title: "COMPLETED", value: kpis?.completed_orders?.value || "0" },
        ],
        sections: [
          {
            title: `Sales Trend Data (${selectedTrendRange})`,
            type: "table",
            headers: ["Period Label", "Sales Amount"],
            colWidths: [90, 92],
            rows: (currentTrendData || []).map((pt) => [
              pt.label,
              `₱${Number(pt.value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            ]),
          },
          {
            title: "Top Selling Product Variants",
            type: "table",
            headers: ["Rank", "Product Variant", "Quantity Sold"],
            colWidths: [30, 95, 57],
            rows: topSellingProducts.map((p) => [String(p.rank), p.product, p.quantity]),
          },
          {
            title: "Sales Channel Distribution",
            type: "table",
            headers: ["Channel Category", "Contribution (%)"],
            colWidths: [90, 92],
            rows: (dashboardData?.sales_distribution || []).map((d) => [d.label, `${d.value}%`]),
          },
        ],
        filename: `grainrise-warehouse-sales-report-${new Date().toISOString().split("T")[0]}.pdf`,
      });
      showToast({
        type: "success",
        title: "Report Exported",
        message: "Sales summary PDF report downloaded successfully.",
      });
    } catch (err) {
      console.error("PDF Export error:", err);
      showToast({
        type: "error",
        title: "Export Failed",
        message: "Failed to generate PDF summary.",
      });
    }
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Main", path: "/warehouse-sales/dashboard" },
          { label: "Dashboard" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Last Updated: Today , {lastUpdatedTime}
          </p>
        </div>
        <DashboardExportControls
          formattedDate={formatReportDate()}
          onRefresh={() => {
            fetchDashboardData(true);
            showToast({
              type: "success",
              title: "Dashboard Refreshed",
              message: "Warehouse Sales sales dashboard updated.",
            });
          }}
          isRefreshing={isRefreshing || loading}
          refreshTitle="Refresh Sales Dashboard Data"
          csvDatasets={csvDatasets}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 mt-4">
          {error}
        </div>
      ) : null}

      {/* ── KPI Cards (Clickable) ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {salesMetrics.map((metric) => (
          <KPICard key={metric.title} {...metric} />
        ))}
      </div>

      {/* ── Charts: Sales Trend & Sales Distribution (Aligned Panels) ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          <SalesTrendCard
            title="Sales Trend"
            data={currentTrendData}
            selectedRange={selectedTrendRange}
            rangeOptions={RANGE_OPTIONS}
            onRangeChange={setSelectedTrendRange}
            maxValue={currentTrendMax}
            height={260}
            className="h-full flex flex-col justify-between"
            axisFormatter={(val) => {
              if (val >= 1000000) return `₱${(val / 1000000).toFixed(1)}M`;
              if (val >= 1000) return `₱${Math.round(val / 1000)}k`;
              return `₱${val}`;
            }}
            valueFormatter={(val) =>
              `₱${Number(val).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            }
            emptyStateTitle="No sales trend data"
            emptyStateDescription="Sales trend points will be plotted as transactions occur."
          />
        </div>
        <div className="flex flex-col">
          <DistributionCard
            title="Sales Distribution"
            totalLabel="100% Revenue"
            items={dashboardData?.sales_distribution || []}
            className="h-full flex flex-col justify-between"
            emptyStateTitle="No distribution data"
            emptyStateDescription="Distribution will show once completed sales are recorded."
          />
        </div>
      </div>

      {/* ── Lower Row: Recent Activity & Top Selling Products ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 items-stretch">
        <div className="flex flex-col">
          <RecentActivityCard
            title="Recent Order Activity"
            items={recentOrderActivities}
            className="h-full flex flex-col"
          />
        </div>
        <div className="flex flex-col">
          <SectionedTableCard
            title="Top Selling Products"
            columns={TOP_SELLING_COLUMNS}
            sections={[{ rows: topSellingProducts }]}
            className="h-full flex flex-col"
            emptyStateTitle="No sales recorded yet"
            emptyStateDescription="Top selling products ranked by quantity sold (kg) will appear here."
          />
        </div>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default WarehouseSalesDashboard;
