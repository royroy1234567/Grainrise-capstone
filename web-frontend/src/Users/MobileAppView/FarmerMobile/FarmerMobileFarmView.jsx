import React, { useState } from "react";
import { Sprout, MapPin, Droplets, Layers, ChevronRight, Plus, Sparkles } from "lucide-react";

export default function FarmerMobileFarmView({ farms = [], onSelectFarm }) {
  const [selectedFarm, setSelectedFarm] = useState(farms[0] || null);

  const totalArea = farms.reduce((acc, f) => acc + (f.areaHa || 0), 0).toFixed(1);

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Farm Management
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {farms.length} Registered Parcels &bull; {totalArea} ha Total
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d5921] text-white text-xs font-bold shadow-xs hover:bg-[#0b4b1c] active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>New Parcel</span>
        </button>
      </div>

      {/* Farm Health Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d5921] to-[#166534] text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/20 text-white">
              <Sparkles size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Active Agronomic Insight
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-100">
            LOW RISK
          </span>
        </div>
        <p className="text-sm font-semibold mt-2.5 leading-snug">
          Optimal vegetative growth observed across Meycauayan parcels. Soil moisture index is adequate for the next 7 days.
        </p>
      </div>

      {/* Registered Farm Parcels List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
          Registered Parcels
        </h3>

        {farms.map((farm) => (
          <div
            key={farm.id}
            onClick={() => {
              setSelectedFarm(farm);
              if (onSelectFarm) onSelectFarm(farm);
            }}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:border-slate-200 active:scale-[0.99] transition-all cursor-pointer space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ebf6ed] text-[#0d5921] flex items-center justify-center shrink-0 mt-0.5">
                  <Sprout size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {farm.name}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mt-1">
                    <MapPin size={11} className="text-slate-400" />
                    <span>{farm.location}</span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-[#0d5921] bg-[#ebf6ed] px-2 py-0.5 rounded-lg">
                {farm.areaHa} ha
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Layers size={13} className="text-slate-400" />
                <span className="truncate">{farm.crop}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Droplets size={13} className="text-slate-400" />
                <span className="truncate">{farm.irrigation}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400 font-medium">Stage: {farm.stage}</span>
              <span className="text-[#0d5921] font-semibold flex items-center gap-0.5">
                Details <ChevronRight size={13} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

