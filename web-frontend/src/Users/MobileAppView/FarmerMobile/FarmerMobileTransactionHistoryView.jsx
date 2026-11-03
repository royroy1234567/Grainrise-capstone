import React, { useState } from "react";
import { ReceiptText, ArrowLeft, Download, CheckCircle2, Search, Filter } from "lucide-react";

export default function FarmerMobileTransactionHistoryView({
  transactions = [],
  onBack,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = transactions.filter(
    (tx) =>
      tx.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Transaction History
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Audit trail of miller payouts, harvests, & POS receipts
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search by buyer, transaction ID, or grain..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d5921]"
        />
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filtered.map((tx) => (
          <div
            key={tx.id}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:border-slate-200 transition-all space-y-2.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {tx.date} &bull; {tx.id}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  {tx.buyer}
                </h4>
              </div>
              <span className="text-sm font-black text-[#0d5921]">
                {tx.amount}
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              {tx.item}
            </p>

            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-50">
              <span className="text-slate-400">
                Method: <strong className="text-slate-700">{tx.paymentMethod}</strong>
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 size={13} /> {tx.status}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs">
            No transactions found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}

