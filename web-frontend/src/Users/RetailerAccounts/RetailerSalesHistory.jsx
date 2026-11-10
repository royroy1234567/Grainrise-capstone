import { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "../../Components/Minor-Components/Breadcrumbs";
import SearchFilter from "../../Components/Minor-Components/SearchFilter";
import DateRangePicker from "../../Components/Minor-Components/DateRangePicker";
import SortByDropdown from "../../Components/Minor-Components/SortByDropdown";
import SectionedTableCard from "../../Components/Minor-Components/SectionedTableCard";
import POSSalesReceiptModal from "../../Components/Modals/MillerSales/POSSalesReceiptModal";

const API = `${(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "")}/api`;
const token = () => localStorage.getItem("grainrise_token") || localStorage.getItem("access_token") || "";
const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "amount-desc", label: "Amount (High to Low)" },
  { value: "amount-asc", label: "Amount (Low to High)" },
];
const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

export default function RetailerSalesHistory() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [dates, setDates] = useState({ startDate: "", endDate: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, sort });
      if (dates.startDate) params.set("start_date", dates.startDate);
      if (dates.endDate) params.set("end_date", dates.endDate);
      const response = await fetch(`${API}/retailer/sales-history/?${params}`, { headers: { Accept: "application/json", Authorization: `Bearer ${token()}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.detail || "Unable to load sales history.");
      setTransactions(data.data || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [search, sort, dates.startDate, dates.endDate]);
  const pageRows = transactions.slice((page - 1) * 10, page * 10);
  const sections = useMemo(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const grouped = new Map();
    pageRows.forEach((row) => {
      const date = row.transaction_date ? new Date(row.transaction_date).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }) : "";
      const label = date === today ? "Today" : date === yesterday ? "Yesterday" : date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Date unavailable";
      if (!grouped.has(label)) grouped.set(label, []);
      grouped.get(label).push(row);
    });
    return [...grouped.entries()].map(([label, rows]) => ({ label, rows }));
  }, [pageRows]);
  const columns = [
    { key: "time", label: "Transaction Time", width: "22%" },
    { key: "variant", label: "Variant", width: "22%" },
    { key: "quantity", label: "Quantity", width: "20%" },
    { key: "total_amount", label: "Total Payment", width: "20%", render: (row) => money(row.total_amount) },
    { key: "action", label: "Action", width: "16%" },
  ];
  const openReceipt = async (row) => {
    try {
      const response = await fetch(`${API}/retailer/sales-history/${encodeURIComponent(row.reference_no)}/`, { headers: { Accept: "application/json", Authorization: `Bearer ${token()}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load receipt.");
      setReceipt(data.receipt);
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  return <><Breadcrumbs items={[{ label: "Sales", path: "/retailer/point-of-sale" }, { label: "Sales History" }]} /><div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Sales History</h1><p className="mt-1 text-sm text-gray-500">View completed in-store transactions.</p></div><div className="mb-4 flex flex-wrap items-center gap-3"><div className="w-full max-w-sm"><SearchFilter onSearch={(value) => { setSearch(value); setPage(1); }} placeholder="Search receipt no., variant, customer, or amount" /></div><DateRangePicker onDateChange={(value) => { setDates(value); setPage(1); }} /><SortByDropdown value={sort} onChange={(value) => { setSort(value); setPage(1); }} options={SORT_OPTIONS} /></div>{error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<SectionedTableCard columns={columns} sections={sections} loading={loading} loadingMessage="Loading sales history..." currentPage={page} totalPages={Math.max(1, Math.ceil(transactions.length / 10))} onPageChange={setPage} onViewDetails={openReceipt} viewDetailsLabel="View Details" footerLabel={`Showing ${transactions.length ? (page - 1) * 10 + 1 : 0}-${Math.min(page * 10, transactions.length)} of ${transactions.length} transactions`} emptyStateTitle="No sales found" /><POSSalesReceiptModal isOpen={Boolean(receipt)} onClose={() => setReceipt(null)} receiptData={receipt} receiptContextLabel="GrainRise Retailer POS" /></>;
}
