import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Breadcrumbs from "../../Components/Minor-Components/Breadcrumbs";
import Tabs from "../../Components/Minor-Components/Tabs";
import SearchFilter from "../../Components/Minor-Components/SearchFilter";
import SortByDropdown from "../../Components/Minor-Components/SortByDropdown";
import SectionedTableCard from "../../Components/Minor-Components/SectionedTableCard";
import CustomGreenButton from "../../Components/Minor-Components/CustomGreenButton";
import CustomAmberButton from "../../Components/Minor-Components/CustomAmberButton";
import CustomRedButton from "../../Components/Minor-Components/CustomRedButton";
import ArchiveProductModal from "../../Components/Modals/ArchiveProductModal";
import RestoreProductModal from "../../Components/Modals/RestoreProductModal";
import DeleteProductModal from "../../Components/Modals/DeleteProductModal";
import AddProductModal from "../../Components/Modals/AddProductModal";

const API = `${(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "")}/api`;
const TABS = [{ id: "active", label: "Active" }, { id: "archive", label: "Archived" }];
const SORT_OPTIONS = [
  { value: "name-asc", label: "Product A-Z" },
  { value: "name-desc", label: "Product Z-A" },
  { value: "stock-desc", label: "Highest Stock" },
  { value: "stock-asc", label: "Lowest Stock" },
];
const token = () => localStorage.getItem("grainrise_token") || localStorage.getItem("access_token") || "";
const request = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token()}`, ...(options.headers || {}) },
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false) throw new Error(payload.message || "Inventory request failed.");
  return payload;
};
const statusClass = { "In Stock": "bg-green-100 text-green-700", "Low Stock": "bg-amber-100 text-amber-700", "Out of Stock": "bg-red-100 text-red-700" };

function ProductModal({ product, mode, onClose, onSave }) {
  const registered = product && ["miller", "warehouse", "registered"].includes(String(product.source_type).toLowerCase());
  const initialForm = {
    product_name: product?.product_name || product?.variant || "",
    variant: product?.variant || "",
    product_description: product?.product_description || "",
    selling_price: product?.selling_price ?? "",
    nongrainrise_supplier_name: product?.nongrainrise_supplier_name || "",
    stock_quantity: product?.stock_quantity ?? "",
    unit_cost: product?.unit_cost ?? "",
    arrival_date: product?.arrival_date || "",
    expiry_date: product?.expiry_date || "",
  };
  const [form, setForm] = useState(initialForm);
  const editing = mode === "edit" || mode === "add";
  const submit = (event) => {
    event.preventDefault();
    onSave(form);
  };
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={submit} className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b pb-3">
          <div><h2 className="text-lg font-bold">{mode === "add" ? "Add Product" : editing ? "Edit Product Details" : "Product Details"}</h2><p className="text-xs text-gray-500">Inventory product information</p></div>
          <button type="button" onClick={onClose} className="text-xl text-gray-500">×</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
          {[
            ["Product Name", "product_name"], ["Variant", "variant"], ["Supplier Name", "nongrainrise_supplier_name"],
            ["Stock Quantity (kg)", "stock_quantity"], ["Unit Cost", "unit_cost"], ["Selling Price", "selling_price"],
            ["Arrival Date", "arrival_date"], ["Expiration Date", "expiry_date"],
          ].map(([label, key]) => (
            <label key={key} className="font-medium text-gray-700">{label}
              <input type={key.includes("date") ? "date" : key.includes("quantity") || key.includes("cost") || key.includes("price") ? "number" : "text"} step="0.01"
                value={form[key]} disabled={!editing || (registered && !["selling_price"].includes(key))}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 disabled:bg-gray-50" />
            </label>
          ))}
          <label className="sm:col-span-2 font-medium text-gray-700">Description
            <textarea value={form.product_description} disabled={!editing} onChange={(event) => setForm({ ...form, product_description: event.target.value })} className="mt-1 min-h-20 w-full rounded-xl border border-gray-200 p-3 disabled:bg-gray-50" />
          </label>
        </div>
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t pt-3">
          {editing ? <><button type="button" onClick={() => setForm(initialForm)} className="rounded-lg border px-4 py-2 text-xs">Clear</button><CustomGreenButton text="Save Changes" onClick={submit} className="!py-2 !text-xs" /></> : null}
          {!editing && <button type="button" onClick={() => onSave("__edit__")} className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white">Edit Product</button>}
        </div>
      </form>
    </div>,
    document.body
  );
}

export default function RetailerInventory() {
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name-asc");
  const [stockFilter, setStockFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const load = async () => { const result = await request(`/retailer/inventory/?status=${tab === "archive" ? "archived" : "active"}`); setProducts(result.data || []); };
  useEffect(() => { load().catch((error) => window.alert(error.message)); }, [tab]);
  const visible = useMemo(() => {
    const query = search.toLowerCase();
    return products.filter((p) => (!query || [p.product_code, p.variant, p.product_description].some((v) => String(v || "").toLowerCase().includes(query))) && (tab === "archive" || stockFilter === "all" || p.stock_status === { in: "In Stock", low: "Low Stock", none: "Out of Stock" }[stockFilter])).sort((a, b) => { const av = String(a.variant || a.product_name || ""); const bv = String(b.variant || b.product_name || ""); if (sort === "stock-desc" || sort === "stock-asc") return (Number(a.stock_quantity) - Number(b.stock_quantity)) * (sort === "stock-desc" ? -1 : 1); return av.localeCompare(bv) * (sort === "name-desc" ? -1 : 1); });
  }, [products, search, sort, stockFilter, tab]);
  const refresh = () => load().catch((error) => window.alert(error.message));
  const action = async (path, options) => { try { await request(path, options); setModal(null); refresh(); } catch (error) { window.alert(error.message); } };
  const columns = tab === "archive" ? [
    { key: "variant", label: "Product Name", render: (p) => <><b>{p.variant || p.product_name}</b><div className="text-[10px] text-gray-500">{p.product_code}</div></> },
    { key: "expiry_date", label: "Expiry Date", render: (p) => p.expiry_date || "—" },
    { key: "stock_quantity", label: "Quantity", render: (p) => `${Number(p.stock_quantity).toLocaleString()} kg` },
    { key: "archive_reason", label: "Reason", render: (p) => p.archive_reason || "—" },
    { key: "action", label: "Actions", render: (p) => <><CustomGreenButton text="Restore" onClick={() => setModal({ type: "restore", product: p })} className="!px-3 !py-1.5 !text-xs" /><CustomRedButton text="Delete" onClick={() => setModal({ type: "delete", product: p })} className="ml-2 !px-3 !py-1.5 !text-xs" /></> },
  ] : [
    { key: "variant", label: "Variant", render: (p) => <><b>{p.variant || p.product_name}</b><div className="text-[10px] text-gray-500">{p.product_description}</div></> },
    { key: "product_code", label: "Product Code", render: (p) => p.product_code },
    { key: "expiry_date", label: "Expiration", render: (p) => p.expiry_date || "—" },
    { key: "stock_quantity", label: "Stock Qty (kg)", render: (p) => `${Number(p.stock_quantity).toLocaleString()} kg` },
    { key: "selling_price", label: "Price", render: (p) => `₱${Number(p.selling_price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` },
    { key: "stock_status", label: "Status", render: (p) => <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${statusClass[p.stock_status]}`}>{p.stock_status}</span> },
    { key: "action", label: "Action", render: (p) => <><button onClick={() => setModal({ type: "view", product: p })} className="rounded-lg border px-3 py-1.5 text-xs">View Details</button><CustomAmberButton text="Archive" onClick={() => setModal({ type: "archive", product: p })} className="ml-2 !px-3 !py-1.5 !text-xs" /></> },
  ];
  return <><Breadcrumbs items={[{ label: "Inventory", path: "/retailer/inventory" }, { label: "Inventory" }]} /><div className="mb-6"><h1 className="text-2xl font-bold">Inventory</h1><p className="mt-1 text-sm text-gray-500">Manage your inventory and monitor stock levels.</p></div><Tabs tabs={TABS} activeTab={tab} onTabChange={(id) => { setTab(id); setPage(1); }} /><div className="mb-4 flex flex-wrap items-center gap-3"><div className="w-full max-w-sm"><SearchFilter onSearch={(value) => { setSearch(value); setPage(1); }} placeholder="Search product code, variant, or description" /></div>{tab === "active" && <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-xs"><option value="all">All Stock</option><option value="in">In Stock</option><option value="low">Low Stock</option><option value="none">No Stock</option></select>}<SortByDropdown value={sort} onChange={setSort} options={SORT_OPTIONS} />{tab === "active" && <button onClick={() => setModal({ type: "add" })} className="ml-auto rounded-lg bg-[#00580C] px-4 py-2 text-xs font-semibold text-white">Add Product</button>}</div><SectionedTableCard columns={columns} sections={[{ rows: visible.slice((page - 1) * 10, page * 10) }]} currentPage={page} totalPages={Math.max(1, Math.ceil(visible.length / 10))} onPageChange={setPage} footerLabel={`Showing ${Math.min(visible.length, (page - 1) * 10 + 1)}-${Math.min(page * 10, visible.length)} of ${visible.length} products`} />
    {modal?.type === "view" && <ProductModal product={modal.product} mode="view" onClose={() => setModal(null)} onSave={(value) => value === "__edit__" ? setModal({ ...modal, type: "edit" }) : null} />}
    {modal?.type === "edit" && <ProductModal product={modal.product} mode="edit" onClose={() => setModal({ ...modal, type: "view" })} onSave={(data) => action(`/retailer/inventory/${modal.product.id}/`, { method: "PATCH", body: JSON.stringify(data) })} />}
    {modal?.type === "add" && <AddProductModal isOpen supplierFreeText onClose={() => setModal(null)} onSave={(data) => action("/retailer/inventory/", { method: "POST", body: JSON.stringify({ product_name: data.variant, variant: data.variant, nongrainrise_supplier_name: data.supplier, product_image: data.imageName, stock_quantity: data.stockQuantity, unit_cost: data.unitCost, selling_price: data.sellingPrice, order_date: data.orderDate, arrival_date: data.arrivalDate, expiry_date: data.expirationDate, product_description: data.descriptionText }) })} />}
    <ArchiveProductModal isOpen={modal?.type === "archive"} onClose={() => setModal(null)} productName={modal?.product?.variant || "Product"} onArchive={(reason) => action(`/retailer/inventory/${modal.product.id}/archive/`, { method: "POST", body: JSON.stringify({ reason }) })} /><RestoreProductModal isOpen={modal?.type === "restore"} onClose={() => setModal(null)} productName={modal?.product?.variant || "Product"} onRestore={() => action(`/retailer/inventory/${modal.product.id}/restore/`, { method: "POST" })} /><DeleteProductModal isOpen={modal?.type === "delete"} onClose={() => setModal(null)} productName={modal?.product?.variant || "Product"} onDelete={() => action(`/retailer/inventory/${modal.product.id}/`, { method: "DELETE" })} /></>;
}
