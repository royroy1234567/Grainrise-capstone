import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calendar, CheckCircle2, DollarSign, FileText, RotateCcw, Truck } from "lucide-react";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";
import DashboardExportControls from "../../Components/Minor-Components/DashboardExportControls";
import DistributionCard from "../../Components/Graphs/PieChartCard";
import KPICard from "../../Components/Graphs/KPICard";
import PendingReviewsCard from "../../Components/Graphs/PendingReviewsCard";
import RecentActivityCard from "../../Components/Graphs/RecentActivityCard";
import SalesTrendCard from "../../Components/Graphs/LineGraphsCard";
import useApi from "../../Components/hooks/useApi";

const periods = ["Last 7 Days", "Last 30 Days", "This Month"];
const peso = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateLabel = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : "—";
const csvValue = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function downloadCsv(filename, rows) {
  const content = rows.map((row) => row.map(csvValue).join(",")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function RetailerDashboard() {
  const navigate = useNavigate();
  const { request } = useApi();
  const [period, setPeriod] = useState("Last 7 Days");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await request(`/retailer/dashboard/?period=${encodeURIComponent(period)}`);
      if (!response?.success) throw new Error(response?.message || "Failed to load dashboard.");
      setDashboard(response.data);
    } catch (loadError) {
      setError(loadError?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [period, request]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const data = dashboard || {
    kpis: { sales_today: 0, low_stock_products: 0, active_orders: 0, open_returns: 0 },
    sales_trend: [], inventory_status: { total: 0, in_stock: 0, low_stock: 0, no_stock: 0 },
    active_orders: [], stock_attention: [], pending_actions: [], recent_activity: [],
    start_date: "", end_date: "", capabilities: {},
  };

  const pendingActions = useMemo(() => data.pending_actions.map((item) => ({
    ...item,
    onDetails: () => navigate(item.id === "inventory" ? "/retailer/inventory" : item.id === "orders" ? "/retailer/order-tracking" : item.id === "returns" ? "/retailer/product-returns" : "/retailer/messages"),
  })), [data.pending_actions, navigate]);

  const exportRows = useCallback(() => [
    ["Retailer Dashboard", dateLabel(data.end_date)],
    [],
    ["KPI", "Value"],
    ["Sales Today", peso(data.kpis.sales_today)],
    ["Low Stock Products", data.kpis.low_stock_products],
    ["Active Orders", data.kpis.active_orders],
    ["Open Returns & Issues", data.kpis.open_returns],
    [],
    ["Sales Trend", "Date", "Revenue"],
    ...data.sales_trend.map((item) => ["Sales", item.date, peso(item.value)]),
    [],
    ["Inventory Status", "Count"],
    ["In Stock", data.inventory_status.in_stock],
    ["Low Stock", data.inventory_status.low_stock],
    ["No Stock", data.inventory_status.no_stock],
    [],
    ["Stock Attention", "Product Code", "Quantity (kg)", "Status"],
    ...data.stock_attention.map((item) => [item.name, item.product_code, item.quantity_kg, item.status]),
    [],
    ["Recent Activity", "Description", "Amount", "Timestamp"],
    ...data.recent_activity.map((item) => [item.title, item.description, peso(item.amount), item.time]),
  ], [data]);

  const handleExportCsv = (dataset) => {
    if (dataset === "sales") {
      downloadCsv("retailer-dashboard-sales.csv", [
        ["Sales Trend", "Date", "Revenue"],
        ...data.sales_trend.map((item) => ["Sales", item.date, peso(item.value)]),
      ]);
      return;
    }
    if (dataset === "inventory") {
      downloadCsv("retailer-dashboard-inventory.csv", [
        ["Inventory Status", "Count"],
        ["In Stock", data.inventory_status.in_stock],
        ["Low Stock", data.inventory_status.low_stock],
        ["No Stock", data.inventory_status.no_stock],
      ]);
      return;
    }
    if (dataset === "stock") {
      downloadCsv("retailer-dashboard-stock.csv", [
        ["Stock Attention", "Product Code", "Quantity (kg)", "Status"],
        ...data.stock_attention.map((item) => [item.name, item.product_code, item.quantity_kg, item.status]),
      ]);
      return;
    }
    downloadCsv("retailer-dashboard.csv", exportRows());
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    let y = 18;
    doc.setFontSize(18);
    doc.text("Retailer Dashboard", 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Period: ${dateLabel(data.start_date)} - ${dateLabel(data.end_date)}`, 14, y);
    y += 10;
    [["Sales Today", peso(data.kpis.sales_today)], ["Low Stock Products", data.kpis.low_stock_products], ["Active Orders", data.kpis.active_orders], ["Open Returns & Issues", data.kpis.open_returns]].forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 14, y);
      y += 6;
    });
    y += 4;
    doc.text("Sales Trend", 14, y);
    y += 6;
    data.sales_trend.forEach((item) => { doc.text(`${item.date}: ${peso(item.value)}`, 18, y); y += 5; if (y > 275) { doc.addPage(); y = 18; } });
    y += 4;
    doc.text("Stock Attention", 14, y);
    y += 6;
    data.stock_attention.forEach((item) => { doc.text(`${item.name} - ${item.quantity_kg} kg - ${item.status}`, 18, y); y += 5; if (y > 275) { doc.addPage(); y = 18; } });
    doc.save("retailer-dashboard.pdf");
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-500"><span>Main</span><span>&gt;</span><span className="font-semibold text-[#107E44]">Dashboard</span></div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">Dashboard</h1>
          <p className="mt-0.5 text-xs text-gray-400">{loading ? "Loading dashboard..." : `Updated through ${dateLabel(data.end_date)}`}</p>
        </div>
        <DashboardExportControls
          formattedDate={dateLabel(data.end_date)}
          onRefresh={loadDashboard}
          isRefreshing={loading}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          csvDatasets={[{ id: "sales", label: "Sales Trend", icon: FileText }, { id: "inventory", label: "Inventory Status", icon: FileText }, { id: "stock", label: "Stock Attention", icon: FileText }]}
        >
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm">
            <Calendar size={14} />
            <select value={period} onChange={(event) => setPeriod(event.target.value)} className="bg-transparent outline-none">
              {periods.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </DashboardExportControls>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="SALES TODAY" value={peso(data.kpis.sales_today)} trend="Completed in-store sales today" tone="success" icon={<DollarSign size={18} strokeWidth={2.5} />} onClick={() => navigate("/retailer/sales-history")} />
        <KPICard title="LOW STOCK PRODUCTS" value={data.kpis.low_stock_products} trend="Products that may need restock" tone="warning" icon={<AlertTriangle size={18} strokeWidth={2.2} />} onClick={() => navigate("/retailer/inventory")} />
        <KPICard title="ACTIVE ORDERS" value={data.kpis.active_orders} trend="Registered supplier orders in progress" tone="neutral" icon={<Truck size={18} strokeWidth={2.2} />} onClick={() => navigate("/retailer/order-tracking")} />
        <KPICard title="OPEN RETURNS & ISSUES" value={data.kpis.open_returns} trend="Requests awaiting resolution" tone="danger" icon={<RotateCcw size={18} strokeWidth={2.2} />} onClick={() => navigate("/retailer/product-returns")} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <SalesTrendCard title="Sales Trend" data={data.sales_trend} selectedRange={period} rangeOptions={periods.map((value) => ({ value, label: value }))} onRangeChange={setPeriod} valueFormatter={peso} className="lg:col-span-8" emptyStateTitle="No sales in this period" />
        <DistributionCard title="Inventory Status" totalLabel={`${data.inventory_status.total} Total Products`} items={[{ label: "In Stock", value: data.inventory_status.in_stock, color: "#107E44" }, { label: "Low Stock", value: data.inventory_status.low_stock, color: "#F59E0B" }, { label: "No Stock", value: data.inventory_status.no_stock, color: "#F43F5E" }]} className="lg:col-span-4" />
      </div>
      <div className="flex justify-end"><button type="button" onClick={() => navigate("/retailer/sales-history")} className="text-xs font-semibold text-[#107E44] hover:underline">View Sales History →</button></div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs lg:col-span-8">
          <div className="mb-4 flex items-start justify-between"><div><h3 className="text-sm font-bold text-gray-900 md:text-base">Active Orders</h3><p className="mt-0.5 text-xs text-gray-400">Ongoing purchases from registered suppliers.</p></div><span className="text-xs text-gray-400">{data.active_orders.length} active</span></div>
          {data.capabilities.orders ? <div className="overflow-x-auto">{/* Reserved for the existing order contract when available. */}</div> : <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400">Order tracking data is not available through the current Retailer API.</p>}
          <div className="mt-3 flex justify-end border-t border-gray-50 pt-3"><button type="button" onClick={() => navigate("/retailer/order-tracking")} className="text-xs font-semibold text-[#107E44] hover:underline">View Order Tracking →</button></div>
        </section>
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs lg:col-span-4">
          <h3 className="text-sm font-bold text-gray-900 md:text-base">Stock Attention</h3><p className="mt-0.5 text-xs text-gray-400">Prioritized using the Miller stock thresholds.</p>
          <div className="mt-4 space-y-3">{data.stock_attention.length ? data.stock_attention.map((item) => <div key={item.id} className="flex items-center justify-between gap-2 border-b border-gray-50 pb-3"><div><p className="text-xs font-bold text-gray-900">{item.name}</p><p className="text-[11px] text-gray-400">{Number(item.quantity_kg || 0).toLocaleString("en-PH")} kg remaining</p></div><div className="flex items-center gap-2"><span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${item.status === "Out of Stock" ? "border-rose-200 bg-rose-50 text-rose-600" : "border-amber-200 bg-amber-50 text-amber-600"}`}>{item.status}</span><button type="button" onClick={() => navigate("/retailer/warehouse-marketplace")} className="text-xs font-semibold text-[#107E44] hover:underline">Find Stock →</button></div></div>) : <p className="py-8 text-center text-xs text-slate-400">No products require attention.</p>}</div>
          <button type="button" onClick={() => navigate("/retailer/warehouse-marketplace")} className="mt-5 w-full rounded-xl border border-emerald-200 bg-emerald-50/80 py-2 text-xs font-bold text-[#107E44]">Browse Warehouse Marketplace →</button>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <PendingReviewsCard title="Pending Actions" items={pendingActions} onViewAll={() => navigate("/retailer/inventory")} viewAllLabel="View All" className="lg:col-span-7" emptyMessage="No pending actions." />
        <RecentActivityCard title="Recent Activity" items={data.recent_activity.map((item) => ({ ...item, icon: CheckCircle2, color: "#107E44", time: item.time ? new Date(item.time).toLocaleDateString("en-PH", { month: "short", day: "numeric" }) : "—" }))} className="lg:col-span-5" emptyMessage="No recent activity." />
      </div>
    </div>
  );
}
