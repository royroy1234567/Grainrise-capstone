import React from "react";

/**
 * FarmerMobileYieldHistoryChart
 *
 * Matches the Figma design:
 * - Title: "Harvest & Yield History"
 * - Subtitle: "Yield (kg) per Production Cycle"
 * - Y-axis markers: 25k, 20k, 15k, 5k, 0kg
 * - 4 columns: Cycle 1, Cycle 2, Cycle 3, Cycle 4
 * - Background tracks (light lavender/gray) with dark green yield bars inside
 * - Value labels floating above each bar: "22k", "4k", "16.5k", "6.1k"
 */
export default function FarmerMobileYieldHistoryChart({ yieldData }) {
  const defaultCycles = [
    { cycle: "Cycle 1", label: "22k", heightPercent: 88 },
    { cycle: "Cycle 2", label: "4k", heightPercent: 16 },
    { cycle: "Cycle 3", label: "16.5k", heightPercent: 66 },
    { cycle: "Cycle 4", label: "6.1k", heightPercent: 24.4 },
  ];

  const cycles = yieldData?.cycles || defaultCycles;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
      {/* Title & Subtitle */}
      <div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          {yieldData?.title || "Harvest & Yield History"}
        </h3>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {yieldData?.subtitle || "Yield (kg) per Production Cycle"}
        </p>
      </div>

      {/* Chart container */}
      <div className="relative mt-4 flex items-end">
        {/* Y-axis Labels on Left */}
        <div className="flex flex-col justify-between h-40 pr-2 pb-5 text-[9px] font-medium text-slate-400 text-right select-none shrink-0 w-8">
          <span>25k</span>
          <span>20k</span>
          <span>15k</span>
          <span>5k</span>
          <span>0kg</span>
        </div>

        {/* Bars Container */}
        <div className="flex-1 flex justify-around items-end h-40 border-b border-slate-100 pb-5 pt-3">
          {cycles.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center h-full justify-end group cursor-pointer"
            >
              {/* Value Label above the bar */}
              <span className="text-[9.5px] font-bold text-slate-600 mb-1 leading-none">
                {item.display || item.label}
              </span>

              {/* Bar track container */}
              <div className="w-9 sm:w-11 h-28 bg-[#f3f4f8] rounded-t-sm relative flex items-end overflow-hidden">
                {/* Dark Green Yield Bar */}
                <div
                  className="w-full bg-[#0d5921] rounded-t-xs transition-all duration-500 ease-out group-hover:brightness-110"
                  style={{ height: `${item.heightPercent}%` }}
                />
              </div>

              {/* X-axis Cycle Label */}
              <span className="text-[10px] text-slate-400 font-medium mt-2 leading-none">
                {item.cycle}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

