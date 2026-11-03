import React from "react";
import { MapPin } from "lucide-react";

/**
 * FarmerMobileClimateChart
 *
 * Matches the Figma design:
 * - Title: "6-Month Climate Outlook"
 * - Subtitle: "Projected rainfall and temperature for registered farm."
 * - Location pill: "Meycauayan City, Bulacan"
 * - Legend: Dark green square "Rainfall (mm)" + Gold dash "Temp (°C)"
 * - Left Y-axis: 300mm, 200mm, 100mm, 0
 * - Right Y-axis: 32°C, 28°C, 24°C, 20°C
 * - X-axis: Jul, Aug, Sep, Oct, Nov, Dec
 * - Dual visualization: Dark green rainfall bars + Gold temperature spline
 * - Responsive viewBox for all Android screen densities
 */
export default function FarmerMobileClimateChart({ climateData }) {
  const months = climateData?.months || [
    { month: "Jul", rainfallMm: 175, tempC: 30.5 },
    { month: "Aug", rainfallMm: 215, tempC: 30.8 },
    { month: "Sep", rainfallMm: 235, tempC: 29.5 },
    { month: "Oct", rainfallMm: 190, tempC: 27.2 },
    { month: "Nov", rainfallMm: 155, tempC: 26.0 },
    { month: "Dec", rainfallMm: 135, tempC: 24.5 },
  ];

  const location = climateData?.location || "Meycauayan City, Bulacan";

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-2xs overflow-hidden">
      {/* Title & Subtitle */}
      <div>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          {climateData?.title || "6-Month Climate Outlook"}
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
          {climateData?.subtitle ||
            "Projected rainfall and temperature for registered farm."}
        </p>
      </div>

      {/* Location Badge Pill & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ebf6ed] text-[#0d5921] text-[11px] sm:text-xs font-semibold">
          <MapPin size={12} className="text-[#0d5921] shrink-0" />
          <span className="truncate">{location}</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-medium text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#0d5921]" />
            <span>Rainfall (mm)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-0.5 bg-[#ca8a04] rounded-full inline-block" />
            <span>Temp (°C)</span>
          </div>
        </div>
      </div>

      {/* Combo SVG Chart */}
      <div className="relative mt-2 w-full h-40 sm:h-44 flex items-center justify-between">
        {/* Left Y-axis (Rainfall mm) */}
        <div className="flex flex-col justify-between h-28 sm:h-32 text-[8px] sm:text-[8.5px] font-medium text-slate-400 text-right pr-1 pb-3 select-none shrink-0 w-7 sm:w-8">
          <span>300mm</span>
          <span>200mm</span>
          <span>100mm</span>
          <span>0</span>
        </div>

        {/* Center SVG Chart (Bars + Spline) */}
        <div className="flex-1 h-full flex flex-col justify-end overflow-hidden">
          <svg
            viewBox="0 0 240 140"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Horizontal Guide Lines */}
            <line
              x1="0"
              y1="15"
              x2="240"
              y2="15"
              stroke="#f1f5f9"
              strokeDasharray="2 2"
              strokeWidth="0.8"
            />
            <line
              x1="0"
              y1="50"
              x2="240"
              y2="50"
              stroke="#f1f5f9"
              strokeDasharray="2 2"
              strokeWidth="0.8"
            />
            <line
              x1="0"
              y1="85"
              x2="240"
              y2="85"
              stroke="#f1f5f9"
              strokeDasharray="2 2"
              strokeWidth="0.8"
            />
            <line
              x1="0"
              y1="120"
              x2="240"
              y2="120"
              stroke="#e2e8f0"
              strokeWidth="1"
            />

            {/* Dark Green Rainfall Bars */}
            {/* Jul */}
            <rect x="12" y="62" width="15" height="58" rx="1.5" fill="#0d5921" />
            {/* Aug */}
            <rect x="52" y="48" width="15" height="72" rx="1.5" fill="#0d5921" />
            {/* Sep */}
            <rect x="92" y="42" width="15" height="78" rx="1.5" fill="#0d5921" />
            {/* Oct */}
            <rect x="132" y="56" width="15" height="64" rx="1.5" fill="#0d5921" />
            {/* Nov */}
            <rect x="172" y="68" width="15" height="52" rx="1.5" fill="#0d5921" />
            {/* Dec */}
            <rect x="212" y="76" width="15" height="44" rx="1.5" fill="#0d5921" />

            {/* Gold Temperature Spline Path */}
            <path
              d="M 20 42 C 40 41, 45 39, 60 40 C 80 41, 85 43, 100 45 C 120 48, 125 58, 140 60 C 160 62, 165 70, 180 72 C 200 75, 205 82, 220 85"
              fill="none"
              stroke="#ca8a04"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Circular points on Temperature Spline */}
            <circle cx="20" cy="42" r="3" fill="#ffffff" stroke="#ca8a04" strokeWidth="2" />
            <circle cx="60" cy="40" r="3" fill="#ffffff" stroke="#ca8a04" strokeWidth="2" />
            <circle cx="100" cy="45" r="3" fill="#ffffff" stroke="#ca8a04" strokeWidth="2" />
            <circle cx="140" cy="60" r="3" fill="#ffffff" stroke="#ca8a04" strokeWidth="2" />
            <circle cx="180" cy="72" r="3" fill="#ffffff" stroke="#ca8a04" strokeWidth="2" />
            <circle cx="220" cy="85" r="3" fill="#ffffff" stroke="#ca8a04" strokeWidth="2" />

            {/* Month Labels along X-axis */}
            <text x="20" y="134" fontSize="8.5" fill="#64748b" textAnchor="middle" fontWeight="500">
              Jul
            </text>
            <text x="60" y="134" fontSize="8.5" fill="#64748b" textAnchor="middle" fontWeight="500">
              Aug
            </text>
            <text x="100" y="134" fontSize="8.5" fill="#64748b" textAnchor="middle" fontWeight="500">
              Sep
            </text>
            <text x="140" y="134" fontSize="8.5" fill="#64748b" textAnchor="middle" fontWeight="500">
              Oct
            </text>
            <text x="180" y="134" fontSize="8.5" fill="#64748b" textAnchor="middle" fontWeight="500">
              Nov
            </text>
            <text x="220" y="134" fontSize="8.5" fill="#64748b" textAnchor="middle" fontWeight="500">
              Dec
            </text>
          </svg>
        </div>

        {/* Right Y-axis (Temperature °C) */}
        <div className="flex flex-col justify-between h-28 sm:h-32 text-[8px] sm:text-[8.5px] font-medium text-slate-400 text-left pl-1 pb-3 select-none shrink-0 w-7 sm:w-8">
          <span>32°C</span>
          <span>28°C</span>
          <span>24°C</span>
          <span>20°C</span>
        </div>
      </div>
    </div>
  );
}
