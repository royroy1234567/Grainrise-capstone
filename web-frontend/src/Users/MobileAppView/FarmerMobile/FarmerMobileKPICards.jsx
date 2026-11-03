import React from "react";
import { Warehouse, ClipboardCheck, Sprout, Map } from "lucide-react";

/**
 * FarmerMobileKPICards
 *
 * 2x2 grid cards optimized to fit all Android screen sizes:
 * - Smallest Android screens (320px - 360px): Compact text & padding without overflow.
 * - Standard Android screens (375px - 412px): Standard Figma layout.
 * - Larger Android screens / foldables: High density presentation.
 */
export default function FarmerMobileKPICards({ metrics, onCardClick }) {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
      {/* 1. AVAILABLE MILLERS */}
      <div
        onClick={() => onCardClick && onCardClick("contracts")}
        className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-100 shadow-2xs hover:border-slate-200 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between">
          <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase truncate max-w-[85px] sm:max-w-none">
            {metrics.availableMillers?.title || "AVAILABLE MILLERS"}
          </span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#ebf6ed] text-[#0d5921] flex items-center justify-center shrink-0">
            <Warehouse size={14} strokeWidth={2.2} />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
            {metrics.availableMillers?.value ?? 24}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-1.5 leading-tight line-clamp-1">
            {metrics.availableMillers?.subtext || "Millers available in system"}
          </p>
        </div>
      </div>

      {/* 2. CONTRACTED */}
      <div
        onClick={() => onCardClick && onCardClick("contracts")}
        className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-100 shadow-2xs hover:border-slate-200 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between">
          <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase truncate max-w-[85px] sm:max-w-none">
            {metrics.contracted?.title || "CONTRACTED"}
          </span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#ebf6ed] text-[#0d5921] flex items-center justify-center shrink-0">
            <ClipboardCheck size={14} strokeWidth={2.2} />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-black text-[#0d5921] tracking-tight leading-none">
            {metrics.contracted?.value ?? 8}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-1.5 leading-tight line-clamp-1">
            {metrics.contracted?.subtext || "Active harvest contracts"}
          </p>
        </div>
      </div>

      {/* 3. REGISTERED AREA */}
      <div
        onClick={() => onCardClick && onCardClick("farm")}
        className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-100 shadow-2xs hover:border-slate-200 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between">
          <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase truncate max-w-[85px] sm:max-w-none">
            {metrics.registeredArea?.title || "REGISTERED AREA"}
          </span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#ebf6ed] text-[#0d5921] flex items-center justify-center shrink-0">
            <Sprout size={14} strokeWidth={2.2} />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1 leading-none">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {metrics.registeredArea?.value ?? "12.5"}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
              {metrics.registeredArea?.unit || "ha"}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-1.5 leading-tight line-clamp-1">
            {metrics.registeredArea?.subtext || "Registered farm parcels"}
          </p>
        </div>
      </div>

      {/* 4. POTENTIAL AREA */}
      <div
        onClick={() => onCardClick && onCardClick("farm")}
        className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-100 shadow-2xs hover:border-slate-200 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-start justify-between">
          <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase truncate max-w-[85px] sm:max-w-none">
            {metrics.potentialArea?.title || "POTENTIAL AREA"}
          </span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#fef7e6] text-[#b45309] flex items-center justify-center shrink-0">
            <Map size={14} strokeWidth={2.2} />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1 leading-none">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {metrics.potentialArea?.value ?? "18.2"}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
              {metrics.potentialArea?.unit || "ha"}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-1.5 leading-tight line-clamp-1">
            {metrics.potentialArea?.subtext || "Expandable arable land"}
          </p>
        </div>
      </div>
    </div>
  );
}
