import { useEffect, useMemo, useRef, useState } from "react";
import POSProductCard from "../../Components/Minor-Components/POSProductCard";
import POSCartCard from "../../Components/Minor-Components/POSCartCard";
import PaginationControls from "../../Components/Minor-Components/PaginationControls";
import SearchFilter from "../../Components/Minor-Components/SearchFilter";
import SortByDropdown from "../../Components/Minor-Components/SortByDropdown";
import CustomGreenButton from "../../Components/Minor-Components/CustomGreenButton";
import Breadcrumbs from "../../Components/Minor-Components/Breadcrumbs";
import useToast from "../../Components/hooks/useToast";
import Toast from "../../Components/Modals/Toast";
import POSPaymentProofModal from "../../Components/Modals/MillerSales/POSPaymentProofModal";
import POSSalesReceiptModal from "../../Components/Modals/MillerSales/POSSalesReceiptModal";

const API = `${(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "")}/api`;
const auth = () => localStorage.getItem("grainrise_token") || localStorage.getItem("access_token") || "";
const request = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, { ...options, headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${auth()}`, ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || data.message || "POS request failed.");
  return data;
};
const idempotency = () => `retailer-pos-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;
const stockFilters = [{ value: "all", label: "All" }, { value: "in-stock", label: "In Stock" }, { value: "low-stock", label: "Low Stock" }];

export default function RetailerPointOfSale() {
  const { toasts, showToast, removeToast } = useToast();
  const [products, setProducts] = useState([]);
  const [seller, setSeller] = useState({});
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [proofModal, setProofModal] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const idempotencyRef = useRef(idempotency());

  const load = async () => {
    setLoading(true);
    try {
      const data = await request("/retailer/pos/products/");
      setProducts(data.products || []);
      setSeller(data.seller || {});
    } catch (e) {
      showToast({ type: "error", title: "Error", message: e?.message || "Unable to load retailer inventory.", duration: 5000 });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => (!q || `${p.name} ${p.variant} ${p.product_code}`.toLowerCase().includes(q)) && (filter === "all" || (filter === "in-stock" ? p.stock_quantity_kg > 0 : p.stock_quantity_kg > 0 && p.stock_quantity_kg < 200)));
  }, [products, query, filter]);
  const paginated = filtered.slice((page - 1) * 9, page * 9);
  const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const change = Math.max(0, Number(amountPaid || 0) - total);

  const add = (product) => {
    setCart((items) => {
      const current = items.find((item) => item.productId === product.id);
      if (current) return items.map((item) => item.productId === product.id ? { ...item, quantity: Math.min(product.stock_quantity_kg, item.quantity + 1) } : item);
      return [...items, { productId: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock_quantity_kg }];
    });
  };
  const updateQuantity = (productId, value) => {
    const quantity = Number(value);
    setCart((items) => items.map((item) => item.productId === productId ? { ...item, quantity } : item).filter((item) => item.quantity > 0));
  };
  const complete = async (payment = {}) => {
    if (!cart.length) {
      showToast({ type: "warning", title: "Warning", message: "Add at least one product to the cart.", duration: 4000 });
      return;
    }
    if (paymentMethod === "Cash" && Number(amountPaid) < total) {
      showToast({ type: "warning", title: "Warning", message: "Amount paid is insufficient.", duration: 4000 });
      return;
    }
    try {
      const result = await request("/retailer/pos/checkout/", { method: "POST", headers: { "X-Idempotency-Key": idempotencyRef.current }, body: JSON.stringify({
        items: cart.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
        payment_method: paymentMethod, amount_paid: paymentMethod === "Cash" ? Number(amountPaid) : 0,
        reference_no: payment.referenceNo, payment_proof_image: payment.capturedImage, idempotency_key: idempotencyRef.current,
      }) });
      setReceipt({ ...result.receipt, total_amount: result.receipt.total, amount_paid: result.receipt.amount_paid, change_amount: result.receipt.change, payment_method_label: result.receipt.payment_method, seller_name: result.receipt.seller, transaction_date_formatted: new Date().toLocaleString("en-PH"), business_name: "GrainRise Retailer", items: result.receipt.items.map((item) => ({ product_name: item.product_name, quantity_label: `${item.quantity_kg} kg`, unit_price: item.unit_price, subtotal: item.subtotal })) });
      setCart([]); setAmountPaid(""); setProofModal(false); idempotencyRef.current = idempotency(); await load();
      showToast({ type: "success", title: "Success", message: "Transaction completed successfully.", duration: 4000 });
    } catch (e) {
      showToast({ type: "error", title: "Error", message: e?.response?.data?.message || e?.message || "Unable to complete transaction.", duration: 5000 });
    }
  };

  return <div className="w-full"><Breadcrumbs items={[{ label: "Retailer", path: "/retailer/dashboard" }, { label: "Point of Sale" }]} /><div className="mb-4"><h1 className="text-2xl font-bold">Point of Sale</h1><p className="mt-1 text-sm text-slate-500">Process walk-in kilogram-based transactions.</p></div><div className="flex flex-col gap-6 lg:flex-row"><div className="min-w-0 flex-1"><div className="mb-4 flex gap-3"><div className="flex-1"><SearchFilter onSearch={(v) => { setQuery(v); setPage(1); }} placeholder="Search product code, variant, or product name" /></div><SortByDropdown value={filter} onChange={(v) => { setFilter(v); setPage(1); }} options={stockFilters} /></div><div className="mb-5 flex gap-3"><span className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">{products.filter((p) => p.stock_quantity_kg >= 200).length} Products In Stock</span><span className="rounded-full bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700">{products.filter((p) => p.stock_quantity_kg > 0 && p.stock_quantity_kg < 200).length} Low Stock Products</span></div>{loading ? <p className="py-12 text-center text-slate-400">Loading inventory...</p> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{paginated.map((p) => <POSProductCard key={p.id} name={p.name} sku={p.product_code} price={p.price} unitLabel="Per kg" stockAvailable={p.stock_quantity_kg} onAddToCart={() => add(p)} />)}</div>}{!loading && !paginated.length && <p className="py-12 text-center text-slate-400">No eligible products match your search.</p>}<div className="mt-6"><PaginationControls currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / 9))} onPageChange={setPage} pageLabel={`Showing ${filtered.length ? (page - 1) * 9 + 1 : 0}-${Math.min(page * 9, filtered.length)} of ${filtered.length} products`} /></div></div><aside className="w-full lg:w-[400px]"><div className="rounded-xl border bg-white shadow-sm"><div className="flex justify-between border-b px-4 py-4"><h3 className="text-lg font-bold">Current Sale</h3><span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">Items: {cart.length}</span></div><div className="space-y-3 px-4 py-3">{cart.length ? cart.map((item) => <POSCartCard key={item.productId} name={item.name} price={item.price} quantity={item.quantity} onQuantityChange={(v) => updateQuantity(item.productId, v)} onRemove={() => updateQuantity(item.productId, 0)} />) : <p className="py-8 text-center text-sm text-slate-400">No items in cart</p>}</div><div className="space-y-3 border-t px-4 py-4"><div className="flex justify-between text-sm"><span>Subtotal</span><span>₱{total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div><div className="flex justify-between font-bold"><span>Total</span><span>₱{total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm"><option>Cash</option><option>GCash</option><option>Bank Transfer</option></select>{paymentMethod === "Cash" && <><label className="text-xs text-slate-500">Amount Paid<input type="number" min="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" /></label><div className="flex justify-between rounded-md bg-emerald-50 px-3 py-3 font-bold">Change <span className="text-emerald-700">₱{change.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div></>}<div className="flex gap-3"><button type="button" onClick={() => { setCart([]); setAmountPaid(""); }} className="flex-1 rounded-md border px-4 py-2 text-sm">Clear Cart</button><CustomGreenButton text={paymentMethod === "Cash" ? "Complete Transaction" : "Verify Payment"} onClick={() => paymentMethod === "Cash" ? complete() : setProofModal(true)} className="flex-1 !rounded-md" /></div></div></div></aside></div><POSPaymentProofModal isOpen={proofModal} onClose={() => setProofModal(false)} paymentMethod={paymentMethod} totalPayable={total} onCheckDuplicateReference={(referenceNo) => request("/retailer/pos/check-reference/", { method: "POST", body: JSON.stringify({ reference_no: referenceNo }) })} onConfirmPaymentProof={complete} /><POSSalesReceiptModal isOpen={Boolean(receipt)} onClose={() => setReceipt(null)} receiptData={receipt} receiptContextLabel="GrainRise Retailer POS" /><Toast toasts={toasts} removeToast={removeToast} /></div>;
}
