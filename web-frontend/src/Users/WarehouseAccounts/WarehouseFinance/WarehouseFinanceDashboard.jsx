import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  CalendarDays,
  CircleCheckBig,
  CircleX,
  TrendingUp,
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
import RevenueExpenseTrendChart from "../../../Components/Graphs/RevenueExpenseTrendChart";
import useApi from "../../../Components/hooks/useApi";

const periodOptions = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "Overall", value: "overall" },
];

const defaultChartData = {
  daily: {
    revenue: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({ label, value: null })),
    expenses: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({ label, value: null })),
  },
  weekly: {
    revenue: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"].map((label) => ({ label, value: null })),
    expenses: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"].map((label) => ({ label, value: null })),
  },
  monthly: {
    revenue: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((label) => ({ label, value: null })),
    expenses: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((label) => ({ label, value: null })),
  },
  yearly: {
    revenue: ["2022", "2023", "2024", "2025", "2026"].map((label) => ({ label, value: null })),
    expenses: ["2022", "2023", "2024", "2025", "2026"].map((label) => ({ label, value: null })),
  },
  overall: {
    revenue: ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"].map((label) => ({ label, value: null })),
    expenses: ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"].map((label) => ({ label, value: null })),
  },
};

const formatCurrency = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function WarehouseFinanceDashboard() {
  const navigate = useNavigate();
  const { request } = useApi();

  const [selectedRange, setSelectedRange] = useState("monthly");
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
      const res = await request("/warehouse/finance/dashboard/", {
        method: "GET",
        throwOnError: true,
      });
      const payload = res?.data ?? res ?? {};
      setDashboardData(payload);
    } catch (err) {
      console.error("Failed to load warehouse finance dashboard data:", err);
      setError(err?.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, [request, showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const rawKpis = dashboardData?.metrics || {};
  const chartDataByPeriod = dashboardData?.chart_data || {};

  const currentChartData =
    chartDataByPeriod[selectedRange] || defaultChartData[selectedRange] || defaultChartData.monthly;

  const chartSeries = useMemo(() => {
    return [
      {
        key: "revenue",
        label: "Revenue",
        data: currentChartData?.revenue || [],
        lineColor: "#16C38A",
        fillColor: "rgba(22, 195, 138, 0.12)",
        strokeWidth: 1.25,
      },
      {
        key: "expenses",
        label: "Expenses",
        data: currentChartData?.expenses || [],
        lineColor: "#D94B44",
        fillColor: "rgba(217, 75, 68, 0.06)",
        strokeWidth: 1.1,
      },
    ];
  }, [currentChartData]);

  // Click actions:
  // - Unpaid Expenses -> report with Pending
  // - Paid Expenses -> report with Paid
  // - Total Expenses -> report with All
  const handleNavigateToReport = (statusFilter) => {
    navigate("/warehouse-finance/payment-history/report", {
      state: { statusFilter },
    });
  };

  const metrics = [
    {
      title: "Unpaid Expenses",
      value: rawKpis?.unpaid_expenses?.value ?? (loading ? "..." : "₱0.00"),
      footer: rawKpis?.unpaid_expenses?.footer ?? "Outstanding payments",
      tone: "danger",
      icon: <CircleX size={18} strokeWidth={2.2} />,
      onClick: () => handleNavigateToReport("pending"),
      ariaLabel: "View Unpaid Expenses in Financial Report",
    },
    {
      title: "Paid Expenses",
      value: rawKpis?.paid_expenses?.value ?? (loading ? "..." : "₱0.00"),
      footer: rawKpis?.paid_expenses?.footer ?? "Cleared payments",
      tone: "success",
      icon: <CircleCheckBig size={18} strokeWidth={2.2} />,
      onClick: () => handleNavigateToReport("paid"),
      ariaLabel: "View Paid Expenses in Financial Report",
    },
    {
      title: "Total Expenses",
      value: rawKpis?.total_expenses?.value ?? (loading ? "..." : "₱0.00"),
      footer: rawKpis?.total_expenses?.footer ?? "Total recorded expenses",
      tone: "warning",
      icon: <BadgeDollarSign size={18} strokeWidth={2.2} />,
      onClick: () => handleNavigateToReport("all"),
      ariaLabel: "View Total Expenses in Financial Report",
    },
    {
      title: "Net Revenue",
      value: rawKpis?.net_revenue?.value ?? (loading ? "..." : "₱0.00"),
      footer: rawKpis?.net_revenue?.footer ?? "Revenue after expenses",
      tone: "success",
      variant: "solid",
      icon: <TrendingUp size={18} strokeWidth={2.2} />,
      // Preserved non-clickable card behavior
    },
  ];

  const lastUpdatedDisplay =
    dashboardData?.last_updated ||
    `Today · ${new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;

  const todayDisplay =
    dashboardData?.today_formatted ||
    new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const csvDatasets = useMemo(
    () => [
      { id: "kpi", label: "Financial KPIs", icon: BadgeDollarSign },
      { id: "trend", label: `Revenue vs Expenses (${selectedRange.toUpperCase()})`, icon: TrendingUp },
    ],
    [selectedRange]
  );

  const handleExportCsv = (section = "all") => {
    try {
      const rows = [];
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `grainrise-warehouse-finance-dashboard-${section}-${dateStr}.csv`;

      rows.push(["GRAINRISE WAREHOUSE FINANCE FINANCIAL OPERATIONS REPORT"]);
      rows.push(["Generated At", `${formatReportDate()} ${formatReportTime()}`]);
      rows.push(["Selected Trend Range", selectedRange.toUpperCase()]);
      rows.push([]);

      if (section === "kpi" || section === "all") {
        rows.push(["KEY FINANCIAL PERFORMANCE INDICATORS"]);
        rows.push(["Metric", "Value", "Description"]);
        rows.push(["Unpaid Expenses", rawKpis?.unpaid_expenses?.value ?? "₱0.00", "Outstanding pending payments"]);
        rows.push(["Paid Expenses", rawKpis?.paid_expenses?.value ?? "₱0.00", "Cleared disbursements"]);
        rows.push(["Total Expenses", rawKpis?.total_expenses?.value ?? "₱0.00", "Total operating expenditures"]);
        rows.push(["Net Revenue", rawKpis?.net_revenue?.value ?? "₱0.00", "Net income after expenses"]);
        rows.push([]);
      }

      if (section === "trend" || section === "all") {
        rows.push([`REVENUE VS EXPENSES TREND (${selectedRange.toUpperCase()})`]);
        rows.push(["Period", "Revenue (PHP)", "Expenses (PHP)"]);
        const revData = currentChartData?.revenue || [];
        const expData = currentChartData?.expenses || [];
        revData.forEach((pt, i) => {
          const expPt = expData[i];
          rows.push([pt.label, pt.value ?? 0, expPt?.value ?? 0]);
        });
        rows.push([]);
      }

      downloadCsv(filename, rows);
      showToast({
        type: "success",
        title: "Report Exported",
        message: "Financial CSV report downloaded successfully.",
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
      const revData = currentChartData?.revenue || [];
      const expData = currentChartData?.expenses || [];
      const tableRows = revData.map((pt, i) => [
        pt.label,
        formatCurrency(pt.value),
        formatCurrency(expData[i]?.value),
      ]);

      generateDashboardPdf({
        title: "GRAINRISE AGRICULTURAL PLATFORM",
        subtitle: "Executive Warehouse Finance Financial Performance & Payout Report",
        metadata: [
          { label: "Account Role", value: "Warehouse Finance" },
          { label: "Selected Reporting Range", value: selectedRange.toUpperCase() },
        ],
        kpis: [
          { title: "UNPAID EXPENSES", value: rawKpis?.unpaid_expenses?.value ?? "₱0.00" },
          { title: "PAID EXPENSES", value: rawKpis?.paid_expenses?.value ?? "₱0.00" },
          { title: "TOTAL EXPENSES", value: rawKpis?.total_expenses?.value ?? "₱0.00" },
          { title: "NET REVENUE", value: rawKpis?.net_revenue?.value ?? "₱0.00" },
        ],
        sections: [
          {
            title: `Revenue vs Expenses Breakdown (${selectedRange.toUpperCase()})`,
            type: "table",
            headers: ["Period Label", "Revenue", "Expenses"],
            colWidths: [62, 60, 60],
            rows: tableRows,
          },
        ],
        filename: `grainrise-warehouse-finance-report-${new Date().toISOString().split("T")[0]}.pdf`,
      });
      showToast({
        type: "success",
        title: "Report Exported",
        message: "Financial summary PDF report downloaded successfully.",
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
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={[{ label: "Main" }, { label: "Dashboard" }]} />
          <h1 className="text-[clamp(2rem,3vw,2.5rem)] font-extrabold tracking-[-0.03em] text-slate-900">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            {loading ? "Updating..." : `Last Updated: ${lastUpdatedDisplay}`}
          </p>
        </div>

        <DashboardExportControls
          formattedDate={todayDisplay}
          onRefresh={() => {
            fetchDashboardData(true);
            showToast({
              type: "success",
              title: "Dashboard Refreshed",
              message: "Warehouse Finance finance dashboard updated.",
            });
          }}
          isRefreshing={isRefreshing || loading}
          refreshTitle="Refresh Finance Dashboard Data"
          csvDatasets={csvDatasets}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <KPICard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Line Graph: Always visible */}
      <RevenueExpenseTrendChart
        title="Expenses vs Revenue"
        subtitle="Performance over selected period"
        selectedRange={selectedRange}
        rangeOptions={periodOptions}
        onRangeChange={setSelectedRange}
        series={chartSeries}
        height={320}
        axisFormatter={(value) => `₱${Math.round(value / 1000)}k`}
        valueFormatter={formatCurrency}
      />

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}