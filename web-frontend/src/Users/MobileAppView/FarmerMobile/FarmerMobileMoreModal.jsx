import React from "react";
import {
  X,
  TrendingUp,
  ShoppingCart,
  ReceiptText,
  Newspaper,
  ChevronRight,
} from "lucide-react";

/**
 * FarmerMobileMoreModal
 *
 * Exact replica of Figma screenshot 1, optimized for all Android devices:
 * - Safe area padding for bottom gesture navigation.
 * - Fits 100% width on mobile screens up to max-w-md on tablets.
 * - FINANCE section: "Forecasting" (dark green icon, mint background, red badge "3", chevron right)
 * - HISTORY section: "Point of Sale", "Transaction History", "News & Updates"
 */
export default function FarmerMobileMoreModal({
  isOpen,
  onClose,
  onSelectAction,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Bottom Sheet Drawer */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl px-5 pt-3 pb-[max(2rem,env(safe-area-inset-bottom))] z-10 animate-in slide-in-from-bottom duration-300">
        {/* Top Drag Handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            More
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── FINANCE Section ────────────────────────────────────────── */}
        <div className="mb-5">
          <span className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
            FINANCE
          </span>

          {/* Forecasting Row (Highlighted Green Card matching Figma) */}
          <button
            onClick={() => {
              onSelectAction("forecasting");
              onClose();
            }}
            type="button"
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#eef7ee] border-l-4 border-[#0d5921] hover:bg-[#e4f3e5] active:scale-[0.99] transition-all cursor-pointer text-left shadow-2xs"
          >
            <div className="flex items-center gap-3">
              {/* Dark Green Icon Square */}
              <div className="w-10 h-10 rounded-xl bg-[#0d5921] text-white flex items-center justify-center shadow-xs shrink-0">
                <TrendingUp size={20} strokeWidth={2.2} />
              </div>
              <span className="font-bold text-[#0d5921] text-sm tracking-tight">
                Forecasting
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Red Badge "3" */}
              <span className="w-5 h-5 rounded-full bg-[#f43f5e] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                3
              </span>
              <ChevronRight size={17} className="text-slate-400" />
            </div>
          </button>
        </div>

        {/* ── HISTORY Section ────────────────────────────────────────── */}
        <div className="space-y-1">
          <span className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
            HISTORY
          </span>

          {/* 1. Point of Sale */}
          <button
            onClick={() => {
              onSelectAction("pos");
              onClose();
            }}
            type="button"
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ebf6ed] text-[#0d5921] flex items-center justify-center shrink-0">
                <ShoppingCart size={19} strokeWidth={2.2} />
              </div>
              <span className="font-semibold text-slate-800 text-sm">
                Point of Sale
              </span>
            </div>
            <ChevronRight size={17} className="text-slate-300" />
          </button>

          {/* 2. Transaction History */}
          <button
            onClick={() => {
              onSelectAction("transactions");
              onClose();
            }}
            type="button"
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ebf6ed] text-[#0d5921] flex items-center justify-center shrink-0">
                <ReceiptText size={19} strokeWidth={2.2} />
              </div>
              <span className="font-semibold text-slate-800 text-sm">
                Transaction History
              </span>
            </div>
            <ChevronRight size={17} className="text-slate-300" />
          </button>

          {/* 3. News & Updates */}
          <button
            onClick={() => {
              onSelectAction("news");
              onClose();
            }}
            type="button"
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ebf6ed] text-[#0d5921] flex items-center justify-center shrink-0">
                <Newspaper size={19} strokeWidth={2.2} />
              </div>
              <span className="font-semibold text-slate-800 text-sm">
                News & Updates
              </span>
            </div>
            <ChevronRight size={17} className="text-slate-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
