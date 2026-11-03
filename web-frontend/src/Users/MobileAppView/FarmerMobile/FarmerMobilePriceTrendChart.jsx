import React from "react";

/**
 * FarmerMobilePriceTrendChart
 *
 * Matches the Figma design:
 * - Title: "Palay Market Price Trend"
 * - Subtitle: "Historical Buying Price (₱/kg)"
 * - Y-axis dashed lines at ₱30, ₱25, ₱20, 0
 * - Smooth dark green curve with gradient fill underneath
 * - Data points with white/green ring
 * - Pill badge at Apr: "₱28.50"
 * - Bottom row: "Buying Hub: Bulacan Central" and "+18.7% vs last season"
 * - Fully responsive vector graphics that adapt to any Android screen width
 */
export default function FarmerMobilePriceTrendChart({ trendData }) {
  const defaultData = {
    title: "Palay Market Price Trend",
    subtitle: "Historical Buying Price (₱/kg)",
    hub: "Bulacan Central",
    changeText: "+18.7% vs last season",
    currentPrice: "₱28.50",
  };

  const data = trendData || defaultData;

  // SVG curved path connecting (25,130) -> (100,65) -> (175,70) -> (250,35)
  const linePath =
    "M 25 130 C 60 115, 75 70, 100 65 C 130 60, 150 72, 175 70 C 205 68, 225 45, 250 35";
  const areaPath = `${linePath} L 250 145 L 25 145 Z`;

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-2xs overflow-hidden">
      {/* Title & Subtitle */}
      <div>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          {data.title || "Palay Market Price Trend"}
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
          {data.subtitle || "Historical Buying Price (₱/kg)"}
        </p>
      </div>

      {/* Chart container */}
      <div className="relative mt-2 pt-4 pb-1">
        {/* Floating Apr Badge: ₱28.50 */}
        <div className="absolute right-3 sm:right-5 top-0 z-10">
          <div className="relative bg-[#0d5921] text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center justify-center">
            {data.currentPrice || "₱28.50"}
            {/* Tooltip triangle indicator */}
            <span className="absolute -bottom-1 right-2.5 w-1.5 h-1.5 bg-[#0d5921] rotate-45 transform" />
          </div>
        </div>

        {/* Scalable SVG Chart */}
        <div className="w-full h-32 sm:h-36 flex items-center justify-center">
          <svg
            viewBox="0 0 280 160"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
                <stop offset="70%" stopColor="#86efac" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal dashed grid lines & labels */}
            {/* ₱30 */}
            <line
              x1="20"
              y1="30"
              x2="265"
              y2="30"
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              strokeWidth="0.9"
            />
            <text x="14" y="33" fontSize="8.5" fill="#94a3b8" textAnchor="end">
              ₱30
            </text>

            {/* ₱25 */}
            <line
              x1="20"
              y1="65"
              x2="265"
              y2="65"
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              strokeWidth="0.9"
            />
            <text x="14" y="68" fontSize="8.5" fill="#94a3b8" textAnchor="end">
              ₱25
            </text>

            {/* ₱20 */}
            <line
              x1="20"
              y1="105"
              x2="265"
              y2="105"
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              strokeWidth="0.9"
            />
            <text x="14" y="108" fontSize="8.5" fill="#94a3b8" textAnchor="end">
              ₱20
            </text>

            {/* 0 Baseline */}
            <line
              x1="20"
              y1="145"
              x2="265"
              y2="145"
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              strokeWidth="0.9"
            />
            <text x="14" y="148" fontSize="8.5" fill="#94a3b8" textAnchor="end">
              0
            </text>

            {/* Area gradient under curve */}
            <path d={areaPath} fill="url(#greenFill)" />

            {/* Main Trend Line Curve */}
            <path
              d={linePath}
              fill="none"
              stroke="#0d5921"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Point 1: Jan */}
            <circle cx="25" cy="130" r="3.5" fill="#ffffff" stroke="#0d5921" strokeWidth="2.2" />
            <text x="25" y="157" fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="500">
              Jan
            </text>

            {/* Point 2: Feb */}
            <circle cx="100" cy="65" r="3.5" fill="#ffffff" stroke="#0d5921" strokeWidth="2.2" />
            <text x="100" y="157" fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="500">
              Feb
            </text>

            {/* Point 3: Mar */}
            <circle cx="175" cy="70" r="3.5" fill="#ffffff" stroke="#0d5921" strokeWidth="2.2" />
            <text x="175" y="157" fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="500">
              Mar
            </text>

            {/* Point 4: Apr */}
            <circle cx="250" cy="35" r="3.5" fill="#ffffff" stroke="#0d5921" strokeWidth="2.2" />
            <text x="250" y="157" fontSize="9" fill="#0d5921" textAnchor="middle" fontWeight="700">
              Apr
            </text>
          </svg>
        </div>
      </div>

      {/* Footer Info Row */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-[11px] sm:text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-600 truncate mr-2">
          <span className="w-2 h-2 rounded-full bg-[#0d5921] shrink-0" />
          <span className="truncate">Buying Hub: {data.hub || "Bulacan Central"}</span>
        </div>
        <div className="font-bold text-[#0d5921] whitespace-nowrap shrink-0">
          {data.changeText || "+18.7% vs last season"}
        </div>
      </div>
    </div>
  );
}
