import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ChevronRight,
  ArrowLeft,
  Printer,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

// ─── Mock product catalogue ───────────────────────────────────────────────────

const PRODUCTS = [
  {
    id: "WR-001",
    name: "Dinorado Rice",
    grade: "50kg Premium Grade",
    pricePerSack: 1500,
    sacksAvailable: 300,
    inStock: true,
    imgColor: "from-amber-100 to-amber-200",
  },
  {
    id: "WR-002",
    name: "Sinandomeng Special",
    grade: "50kg Regular White",
    pricePerSack: 1350,
    sacksAvailable: 185,
    inStock: true,
    imgColor: "from-slate-100 to-slate-200",
  },
  {
    id: "WR-003",
    name: "Jasmine Fragrant Rice",
    grade: "50kg Aromatic Long Grain",
    pricePerSack: 1650,
    sacksAvailable: 120,
    inStock: true,
    imgColor: "from-emerald-100 to-emerald-200",
  },
  {
    id: "WR-004",
    name: "Dinorado Brown Rice",
    grade: "50kg Whole Grain",
    pricePerSack: 1500,
    sacksAvailable: 90,
    inStock: true,
    imgColor: "from-amber-200 to-orange-200",
  },
  {
    id: "WR-005",
    name: "NSIC Rc222 (Tubigan)",
    grade: "50kg Field Dried",
    pricePerSack: 1250,
    sacksAvailable: 0,
    inStock: false,
    imgColor: "from-yellow-100 to-yellow-200",
  },
];

const PAYMENT_METHODS = [
  "Cash on Delivery (Walk-in COD)",
  "GCash / GrabPay",
  "Bank Transfer",
];

// ─── Rice sack thumbnail placeholder ────────────────────────────────────────

function SackThumb({ product }) {
  return (
    <div
      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${product.imgColor} flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden`}
    >
      {/* Simple rice bag SVG */}
      <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
        <rect x="10" y="8" width="28" height="34" rx="4" fill="white" fillOpacity="0.5" stroke="#94a3b8" strokeWidth="1.5" />
        <path d="M14 14h20M14 19h20M14 24h20M14 29h16" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <path d="M18 8 Q24 4 30 8" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
        <ellipse cx="24" cy="38" rx="6" ry="3" fill="#94a3b8" fillOpacity="0.3" />
      </svg>
    </div>
  );
}

// ─── Product List Screen ─────────────────────────────────────────────────────

function POSProductList({ cart, onAddToCart, onGoToCheckout }) {
  const [search, setSearch]       = useState("");
  const [showCount, setShowCount] = useState(3);

  const filtered = PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );
  const visible = filtered.slice(0, showCount);

  const inStock  = PRODUCTS.filter((p) => p.inStock).length;
  const lowStock = PRODUCTS.filter((p) => !p.inStock).length;

  // Cart totals
  const cartTotal  = cart.reduce((s, i) => s + i.pricePerSack * i.qty, 0);
  const cartItems  = cart.reduce((s, i) => s + i.qty, 0);
  const cartPreview = cart
    .slice(0, 2)
    .map((i) => `${i.name.split(" ")[0]} (${i.qty})`)
    .join(", ");

  return (
    <div className="space-y-0 -mx-3.5 sm:-mx-4 -mt-3 sm:-mt-4">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-3.5 sm:px-4 pt-3 sm:pt-4 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Point of Sale</h1>
        <span className="px-2.5 py-1 rounded-full bg-[#ebf6ed] text-[#0d5921] text-xs font-bold">
          {PRODUCTS.length * 15} total
        </span>
      </div>

      {/* ── Search + Filter ─────────────────────────────────────────── */}
      <div className="px-3.5 sm:px-4 pb-2.5 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product code....."
            className="flex-1 text-xs text-slate-700 font-medium outline-none bg-transparent placeholder:text-slate-400"
          />
        </div>
        <button className="flex items-center gap-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 shadow-sm cursor-pointer shrink-0">
          <SlidersHorizontal size={13} /> All <ChevronDown size={11} />
        </button>
      </div>

      {/* ── Stock chips ─────────────────────────────────────────────── */}
      <div className="px-3.5 sm:px-4 pb-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-[#0d5921]" />
          <span className="text-xs font-semibold text-slate-700">{inStock} In Stock</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={13} className="text-amber-500" />
          <span className="text-xs font-semibold text-slate-700">{lowStock} Low Stock</span>
        </div>
      </div>

      {/* ── Product Cards ─────────────────────────────────────────────  */}
      <div className="px-3.5 sm:px-4 space-y-3">
        {visible.map((product) => {
          const inCart = cart.find((c) => c.id === product.id);
          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3.5">
                <SackThumb product={product} />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-slate-900 leading-tight">{product.name}</p>
                    <span className="px-1.5 py-0.5 rounded-md bg-[#ebf6ed] text-[#0d5921] text-[9px] font-bold shrink-0">
                      {product.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{product.grade}</p>
                  <p className="text-sm font-bold text-slate-900">
                    ₱{product.pricePerSack.toLocaleString()}.00
                    <span className="text-[11px] font-medium text-slate-500"> / Sack</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <ShoppingCart size={11} className="text-slate-400" />
                    <span className="text-[11px] text-slate-500">{product.sacksAvailable} sacks available</span>
                  </div>
                </div>
              </div>

              {/* Add to cart / in-cart controls */}
              <div className="px-3.5 pb-3.5">
                {!inCart ? (
                  <button
                    onClick={() => onAddToCart(product)}
                    className="w-full py-2.5 rounded-xl border-2 border-[#0d5921] text-[#0d5921] text-xs font-bold hover:bg-[#ebf6ed] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus size={13} />+ Add to Cart
                  </button>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAddToCart(product, -1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer hover:bg-slate-200"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="text-sm font-black text-slate-900 min-w-[24px] text-center">{inCart.qty}</span>
                      <button
                        onClick={() => onAddToCart(product, 1)}
                        className="w-8 h-8 rounded-lg bg-[#0d5921] flex items-center justify-center text-white cursor-pointer hover:bg-[#0a4a1c]"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <span className="text-sm font-black text-[#0d5921]">
                      ₱{(inCart.qty * product.pricePerSack).toLocaleString()}.00
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Pagination info */}
        <p className="text-center text-xs text-slate-500 font-medium pt-1">
          Showing {Math.min(showCount, filtered.length)} of {filtered.length * 3} products
        </p>
        {showCount < filtered.length && (
          <button
            onClick={() => setShowCount((n) => n + 3)}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#0d5921] py-2 cursor-pointer"
          >
            <RotateCcw size={13} />Load More
          </button>
        )}
      </div>

      {/* ── Cart Bottom Bar (shows when cart has items) ─────────────── */}
      {cart.length > 0 && (
        <div
          className="fixed bottom-16 sm:bottom-20 left-0 right-0 z-40 px-3.5 sm:px-4 pb-2"
          style={{ maxWidth: 480, margin: "0 auto" }}
        >
          <button
            onClick={onGoToCheckout}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl shadow-xl border border-slate-200 cursor-pointer hover:shadow-2xl active:scale-[0.99] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-[#ebf6ed] flex items-center justify-center shrink-0">
              <ShoppingCart size={18} className="text-[#0d5921]" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Current Sale</p>
              <p className="text-xs font-semibold text-slate-700 truncate">{cartPreview}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
              <p className="text-sm font-black text-[#0d5921]">₱{cartTotal.toLocaleString()}.00</p>
            </div>
            <div className="flex items-center gap-0.5 text-xs font-bold text-[#0d5921] shrink-0">
              Checkout <ChevronRight size={14} />
            </div>
          </button>
        </div>
      )}

      {/* Spacer for cart bar */}
      {cart.length > 0 && <div className="h-20" />}
    </div>
  );
}

// ─── Checkout Screen ──────────────────────────────────────────────────────────

function CheckoutScreen({ cart, onUpdateQty, onRemove, onComplete, onClearCart, onBack }) {
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery (Walk-in COD)");
  const [amountReceived, setAmountReceived] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const totalSacks    = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal      = cart.reduce((s, i) => s + i.qty * i.pricePerSack, 0);
  const totalDue      = subtotal;
  const received      = parseFloat(amountReceived.replace(/[^\d.]/g, "")) || 0;
  const change        = Math.max(0, received - totalDue);
  const isBalanced    = received >= totalDue;

  const quickAmounts  = [
    { label: `Exact (₱${(totalDue / 1000).toFixed(0)}k)`, value: totalDue },
    { label: "₱15,000.00", value: 15000 },
    { label: "₱20,000.00", value: 20000 },
  ];

  const formatPHP = (n) =>
    `₱${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const handleComplete = () => {
    setIsSuccess(true);
    if (onComplete) {
      onComplete({
        cart,
        totalDue,
        paymentMethod,
        amountReceived: received,
        change,
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 size={34} className="text-[#0d5921]" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Transaction Complete!</h3>
          <p className="text-xs text-slate-500">
            Sale of <strong>{totalSacks} sacks</strong> amounting to <strong>{formatPHP(totalDue)}</strong> has been recorded successfully.
          </p>
          {change > 0 && (
            <div className="p-3 rounded-xl bg-[#ebf6ed] text-sm font-bold text-[#0d5921]">
              Change to return: {formatPHP(change)}
            </div>
          )}
          <button
            onClick={() => { onClearCart(); onBack(); }}
            className="w-full py-2.5 rounded-xl bg-[#0d5921] text-white text-xs font-bold cursor-pointer hover:bg-[#0a4a1c]"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0 -mx-3.5 sm:-mx-4 -mt-3 sm:-mt-4">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-3.5 sm:px-4 pt-3 sm:pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Checkout</h1>
      </div>

      <div className="px-3.5 sm:px-4 space-y-4 pb-8">

        {/* ── Order Summary ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Order Summary</span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#ebf6ed] text-[#0d5921] text-[10px] font-bold">
                {cart.length} items
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">{totalSacks} sacks total</span>
          </div>

          <div className="divide-y divide-slate-100">
            {cart.map((item) => (
              <div key={item.id} className="px-4 py-3 space-y-2">
                {/* Product row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-slate-900">{item.name}</p>
                      <span className="px-1.5 py-0.5 rounded-md bg-[#ebf6ed] text-[#0d5921] text-[9px] font-bold">{item.id}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.grade} &bull; ₱{item.pricePerSack.toLocaleString()}.00 / sack
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Qty controls + line total */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer hover:bg-slate-50 text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="text-sm font-black text-slate-900 min-w-[20px] text-center">{item.qty}</span>
                    <button
                      onClick={() => onUpdateQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer hover:bg-slate-50 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-black text-slate-900">
                    {formatPHP(item.qty * item.pricePerSack)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Subtotals */}
          <div className="px-4 py-3 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal ({totalSacks} sacks)</span>
              <span className="font-semibold">{formatPHP(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Warehouse Handling Fee</span>
              <span className="font-bold text-[#0d5921]">Free</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>VAT / Taxes (Inclusive)</span>
              <span className="font-semibold">{formatPHP(0)}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
              <span className="text-sm font-bold text-slate-800">Total Amount Due</span>
              <span className="text-xl font-black text-slate-900">{formatPHP(totalDue)}</span>
            </div>
          </div>
        </div>

        {/* ── Payment Details ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Payment Details</span>
            <button className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer">
              <Printer size={13} />
            </button>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Payment Method</label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0d5921] cursor-pointer pr-8"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Amount Received */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Amount Received</label>
              <span className="text-[10px] text-slate-400 font-medium">PHP currency</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl">
              <span className="text-sm font-bold text-slate-500 shrink-0">₱</span>
              <input
                type="number"
                min={0}
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder={totalDue.toLocaleString() + ".00"}
                className="flex-1 text-sm font-bold text-slate-900 outline-none bg-transparent"
              />
            </div>

            {/* Quick amount chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {quickAmounts.map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => setAmountReceived(String(value))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Change to Return */}
          <div className={`flex items-center justify-between px-3.5 py-3 rounded-xl ${isBalanced ? "bg-[#ebf6ed]" : "bg-slate-50"}`}>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isBalanced ? "bg-[#0d5921]" : "bg-slate-300"}`}>
                <CheckCircle2 size={13} color="white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Change to Return</p>
                <p className="text-[10px] text-slate-400">{isBalanced ? "Tender balanced" : "Awaiting payment"}</p>
              </div>
            </div>
            <span className={`text-lg font-black ${isBalanced ? "text-[#0d5921]" : "text-slate-400"}`}>
              {formatPHP(change)}
            </span>
          </div>
        </div>

        {/* ── Total Payable + CTA ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Payable</span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
              {paymentMethod.split(" ")[0]}
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatPHP(totalDue)}</p>

          <button
            onClick={handleComplete}
            className="w-full py-3.5 rounded-xl bg-[#0d5921] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#0a4a1c] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <CheckCircle2 size={17} />
            Complete Transaction
          </button>
          <button
            onClick={() => { onClearCart(); onBack(); }}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-red-500 py-1 cursor-pointer transition-colors"
          >
            Clear Cart &amp; Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function FarmerMobilePOSView({ onBack, onCompleteSale }) {
  const [screen, setScreen] = useState("products"); // "products" | "checkout"
  const [cart, setCart]     = useState([]);

  const handleAddToCart = (product, delta = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (!existing && delta > 0) {
        return [...prev, { ...product, qty: 1 }];
      }
      return prev
        .map((i) =>
          i.id === product.id ? { ...i, qty: Math.max(0, i.qty + delta) } : i
        )
        .filter((i) => i.qty > 0);
    });
  };

  const handleRemove = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const handleComplete = (saleData) => {
    if (onCompleteSale) {
      const totalQty = saleData.cart.reduce((s, i) => s + i.qty, 0);
      onCompleteSale({
        product: saleData.cart.map((i) => i.name).join(", "),
        quantityKg: totalQty,
        totalAmount: saleData.totalDue,
        buyerName: "Walk-in Customer",
        paymentMode: saleData.paymentMethod,
      });
    }
  };

  const handleClearCart = () => {
    setCart([]);
    setScreen("products");
  };

  if (screen === "checkout") {
    return (
      <CheckoutScreen
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemove}
        onComplete={handleComplete}
        onClearCart={handleClearCart}
        onBack={() => setScreen("products")}
      />
    );
  }

  return (
    <POSProductList
      cart={cart}
      onAddToCart={handleAddToCart}
      onGoToCheckout={() => setScreen("checkout")}
    />
  );
}
