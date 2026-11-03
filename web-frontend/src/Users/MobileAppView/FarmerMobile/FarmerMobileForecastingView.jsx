import React, { useState } from "react";
import {
  MapPin,
  Search,
  Navigation,
  Layers,
  Plus,
  Minus,
  Crosshair,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  CloudRain,
  Sun,
  AlertTriangle,
  Calendar,
  Download,
  TrendingUp,
  Lightbulb,
  Sprout,
  BarChart2,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const REGISTERED_FARMS = [
  { id: "farm-smc",        name: "San Miguel Rice Farm",  province: "Nueva Ecija",  region: "Central Luzon",  country: "PH", areaHa: 12.5, status: "ACTIVE" },
  { id: "farm-isabela",    name: "Isabela North Block",   province: "Isabela",      region: "Cagayan Valley", country: "PH", areaHa: 18.2, status: null },
  { id: "farm-pangasinan", name: "Pangasinan Test Plot",  province: "Pangasinan",   region: "Ilocos Region",  country: "PH", areaHa: 8.0,  status: null },
];

const FARM_LOCATIONS = [
  { id: "farm-smc",        top: "52%", left: "55%", isPrimary: true },
  { id: "farm-isabela",    top: "28%", left: "22%", isPrimary: false },
  { id: "farm-pangasinan", top: "68%", left: "72%", isPrimary: false },
];

const RAINFALL_DATA = [
  { month: "Sep", mm: 45 },
  { month: "Oct", mm: 85 },
  { month: "Nov", mm: 35 },
  { month: "Dec", mm: 15 },
  { month: "Jan", mm: 10 },
  { month: "Feb", mm: 25 },
];

const TEMP_DATA = [
  { month: "Sep", c: 27.0 },
  { month: "Oct", c: 27.8 },
  { month: "Nov", c: 28.5 },
  { month: "Dec", c: 30.0 },
  { month: "Jan", c: 34.2 },
  { month: "Feb", c: 34.2 },
];

const HIST_RAINFALL = [
  { month: "Sep", mm: 62 },
  { month: "Oct", mm: 95 },
  { month: "Nov", mm: 58 },
  { month: "Dec", mm: 32 },
  { month: "Jan", mm: 20 },
  { month: "Feb", mm: 38 },
];

const HIST_TEMP = [
  { month: "Sep", c: 27.5 },
  { month: "Oct", c: 27.2 },
  { month: "Nov", c: 26.8 },
  { month: "Dec", c: 26.0 },
  { month: "Jan", c: 27.5 },
  { month: "Feb", c: 29.0 },
];

// Demand chart: historical Jan–Jun (solid green) + forecast Jul–Nov (dotted/filled)
const DEMAND_CHART_DATA = [
  { label: "Jan", kg: 8200,  isForecast: false },
  { label: "Mar", kg: 9400,  isForecast: false },
  { label: "May", kg: 10100, isForecast: false },
  { label: "Jul\n(Fcst)", kg: 10800, isForecast: true,  isToday: true },
  { label: "Sep", kg: 12500, isForecast: true },
  { label: "Oct", kg: 14500, isForecast: true,  isPeak: true },
  { label: "Nov", kg: 13200, isForecast: true },
];

const RECOMMENDED_ACTIONS = [
  { title: "Monitor soil moisture",         desc: "Deploy additional capacitive moisture probes in Sector B." },
  { title: "Prepare irrigation",            desc: "Service primary auxiliary diesel pumps prior to mid-November." },
  { title: "Adjust fertilizer schedule",    desc: "Delay final nitrogen top-dressing application by 10 days to avert leaf burn." },
  { title: "Procure drought-resistant seeds", desc: "Reserve certified NSIC Rc222 or Sahod Ulan seeds for the dry planting cycle." },
];

// ─── Reusable Sub-components ──────────────────────────────────────────────────

function FarmIcon({ size = 16, color = "#0d5921" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="18.5" cy="17.5" r="2.5" />
      <path d="M15 6h2l3 5.5" />
      <path d="M8 6h4l4 6H6l-.5-3" />
      <path d="M6 17.5h7" />
    </svg>
  );
}

function RainfallBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.mm));
  const chartH = 90;
  return (
    <div className="flex items-end justify-between gap-1.5 pt-2" style={{ height: chartH + 28 }}>
      {data.map((d) => {
        const barH = Math.round((d.mm / max) * chartH);
        return (
          <div key={d.month} className="flex flex-col items-center flex-1 gap-0.5">
            <span className="text-[9px] font-bold text-slate-700">{d.mm}</span>
            <div className="w-full rounded-t-md bg-[#1a7a35]" style={{ height: barH, minHeight: 4 }} />
            <span className="text-[9px] text-slate-500 font-medium mt-0.5">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function HistRainfallBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.mm));
  const chartH = 70;
  return (
    <div className="flex items-end justify-between gap-1.5 pt-1" style={{ height: chartH + 24 }}>
      {data.map((d) => {
        const barH = Math.round((d.mm / max) * chartH);
        return (
          <div key={d.month} className="flex flex-col items-center flex-1 gap-0.5">
            <div className="w-full rounded-t-sm bg-slate-300" style={{ height: barH, minHeight: 4 }} />
            <span className="text-[9px] text-slate-400 font-medium mt-0.5">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function TempLineChart({ data }) {
  const W = 280, H = 100;
  const pad = { top: 20, bottom: 20, left: 8, right: 8 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const minC = Math.min(...data.map((d) => d.c)) - 1;
  const maxC = Math.max(...data.map((d) => d.c)) + 1;
  const n = data.length;
  const xOf = (i) => pad.left + (i / (n - 1)) * innerW;
  const yOf = (c) => pad.top + (1 - (c - minC) / (maxC - minC)) * innerH;
  const pts = data.map((d, i) => [xOf(i), yOf(d.c)]);
  const polyline = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const areaPath = `M${pts[0][0]},${pts[0][1]} ` +
    pts.slice(1).map(([x, y]) => `L${x},${y}`).join(" ") +
    ` L${pts[n - 1][0]},${H - pad.bottom} L${pts[0][0]},${H - pad.bottom} Z`;
  const maxIdx = data.reduce((best, d, i) => (d.c > data[best].c ? i : best), 0);
  const [px, py] = pts[maxIdx];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
      <defs>
        <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#tempGrad)" />
      <polyline points={polyline} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#ef4444" stroke="white" strokeWidth="1.5" />
      ))}
      <rect x={px - 22} y={py - 18} width={44} height={14} rx="3" fill="#ef4444" />
      <text x={px} y={py - 8} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
        {data[maxIdx].c}°C
      </text>
      {data.map((d, i) => (
        <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="500">{d.month}</text>
      ))}
    </svg>
  );
}

function HistTempLineChart({ data }) {
  const W = 280, H = 80;
  const pad = { top: 12, bottom: 18, left: 8, right: 8 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const minC = Math.min(...data.map((d) => d.c)) - 0.5;
  const maxC = Math.max(...data.map((d) => d.c)) + 0.5;
  const n = data.length;
  const xOf = (i) => pad.left + (i / (n - 1)) * innerW;
  const yOf = (c) => pad.top + (1 - (c - minC) / (maxC - minC)) * innerH;
  const pts = data.map((d, i) => [xOf(i), yOf(d.c)]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
      <polyline points={pts.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="#94a3b8" stroke="white" strokeWidth="1" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={xOf(i)} y={H - 3} textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="500">{d.month}</text>
      ))}
    </svg>
  );
}

/** Demand line chart: solid green historical + dotted/muted forecast, TODAY marker, peak badge */
function DemandLineChart({ data }) {
  const W = 300, H = 130;
  const pad = { top: 28, bottom: 28, left: 32, right: 16 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const n = data.length;
  const maxKg = Math.max(...data.map((d) => d.kg));
  const minKg = 6000;

  const xOf = (i) => pad.left + (i / (n - 1)) * innerW;
  const yOf = (kg) => pad.top + (1 - (kg - minKg) / (maxKg + 1000 - minKg)) * innerH;

  const pts = data.map((d, i) => [xOf(i), yOf(d.kg)]);
  const todayIdx = data.findIndex((d) => d.isToday);
  const peakIdx  = data.findIndex((d) => d.isPeak);

  // Historical segment (Jan–Jul)
  const histPts  = pts.slice(0, todayIdx + 1).map(([x, y]) => `${x},${y}`).join(" ");
  // Forecast segment (Jul–Nov)
  const fcstPts  = pts.slice(todayIdx).map(([x, y]) => `${x},${y}`).join(" ");

  // Area fills
  const histArea = `M${pts[0][0]},${pts[0][1]} ` +
    pts.slice(1, todayIdx + 1).map(([x, y]) => `L${x},${y}`).join(" ") +
    ` L${pts[todayIdx][0]},${H - pad.bottom} L${pts[0][0]},${H - pad.bottom} Z`;
  const fcstArea = `M${pts[todayIdx][0]},${pts[todayIdx][1]} ` +
    pts.slice(todayIdx + 1).map(([x, y]) => `L${x},${y}`).join(" ") +
    ` L${pts[n - 1][0]},${H - pad.bottom} L${pts[todayIdx][0]},${H - pad.bottom} Z`;

  // Y-axis grid values
  const yGrids = [8000, 12000, 16000];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 130 }}>
      <defs>
        <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d5921" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0d5921" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="fcstGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Y-axis grid lines & labels */}
      {yGrids.map((kg) => {
        const y = yOf(kg);
        return (
          <g key={kg}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 2" />
            <text x={pad.left - 4} y={y + 3} textAnchor="end" fontSize="7.5" fill="#94a3b8" fontWeight="500">
              {kg / 1000 % 1 === 0 ? `${kg / 1000}k` : kg}
            </text>
          </g>
        );
      })}

      {/* Area fills */}
      <path d={histArea} fill="url(#histGrad)" />
      <path d={fcstArea} fill="url(#fcstGrad)" />

      {/* Historical line (solid green) */}
      <polyline points={histPts} fill="none" stroke="#0d5921" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Forecast line (dotted amber/dark) */}
      <polyline points={fcstPts} fill="none" stroke="#1a3a1a" strokeWidth="2" strokeDasharray="5 3" strokeLinejoin="round" strokeLinecap="round" />

      {/* All dots */}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={data[i].isPeak ? 4 : 3}
          fill={data[i].isForecast ? "#f59e0b" : "#0d5921"}
          stroke="white" strokeWidth="1.5" />
      ))}

      {/* TODAY vertical dashed line */}
      {todayIdx >= 0 && (
        <line
          x1={pts[todayIdx][0]} y1={pad.top - 8}
          x2={pts[todayIdx][0]} y2={H - pad.bottom}
          stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2"
        />
      )}

      {/* TODAY badge */}
      {todayIdx >= 0 && (() => {
        const tx = pts[todayIdx][0];
        return (
          <g>
            <rect x={tx - 16} y={pad.top - 18} width={32} height={13} rx="3" fill="#f59e0b" />
            <text x={tx} y={pad.top - 9} textAnchor="middle" fontSize="7.5" fill="white" fontWeight="bold">TODAY</text>
          </g>
        );
      })()}

      {/* Peak badge */}
      {peakIdx >= 0 && (() => {
        const [px, py] = pts[peakIdx];
        return (
          <g>
            <rect x={px - 14} y={py - 18} width={28} height={13} rx="3" fill="#1a3a1a" />
            <text x={px} y={py - 9} textAnchor="middle" fontSize="7.5" fill="white" fontWeight="bold">14.5k</text>
          </g>
        );
      })()}

      {/* X-axis labels */}
      {data.map((d, i) => {
        const lines = d.label.split("\n");
        return lines.map((line, li) => (
          <text key={`${i}-${li}`} x={xOf(i)} y={H - pad.bottom + 10 + li * 9}
            textAnchor="middle" fontSize="7.5" fill={d.isToday ? "#f59e0b" : "#94a3b8"} fontWeight={d.isToday ? "700" : "500"}>
            {line}
          </text>
        ));
      })}
    </svg>
  );
}

// ─── Location Picker Screen ───────────────────────────────────────────────────

function LocationPickerScreen({ onConfirm }) {
  const [selectedFarm, setSelectedFarm] = useState("farm-smc");
  const [searchText, setSearchText]     = useState("San Miguel, Nueva Ecija");
  const [locationMode, setLocationMode] = useState("gps");
  const [confirmed, setConfirmed]       = useState(false);

  const activeFarm = REGISTERED_FARMS.find((f) => f.id === selectedFarm) || REGISTERED_FARMS[0];

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => onConfirm(activeFarm), 700);
  };

  return (
    <div className="space-y-0 -mx-3.5 sm:-mx-4 -mt-3 sm:-mt-4">
      {/* Title */}
      <div className="px-3.5 sm:px-4 pt-3 sm:pt-4 pb-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Forecasting</h1>
      </div>

      {/* Search */}
      <div className="px-3.5 sm:px-4 pb-2">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 text-xs text-slate-700 font-medium outline-none bg-transparent"
            placeholder="Search location..." />
          <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0 cursor-pointer">
            <Crosshair size={14} />
          </button>
        </div>
      </div>

      {/* Mode chips */}
      <div className="px-3.5 sm:px-4 pb-0 flex items-center gap-2">
        <button onClick={() => setLocationMode("gps")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${locationMode === "gps" ? "bg-[#ebf6ed] border-[#0d5921] text-[#0d5921]" : "bg-white border-slate-200 text-slate-600"}`}>
          <Navigation size={12} />Use GPS
        </button>
        <button onClick={() => setLocationMode("registered")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${locationMode === "registered" ? "bg-[#ebf6ed] border-[#0d5921] text-[#0d5921]" : "bg-white border-slate-200 text-slate-600"}`}>
          <FarmIcon size={12} color={locationMode === "registered" ? "#0d5921" : "#64748b"} />
          Registered Farms
          <span className="ml-0.5 min-w-[18px] h-[18px] rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center px-1">
            {REGISTERED_FARMS.length}
          </span>
        </button>
      </div>

      {/* Map */}
      <div className="relative w-full" style={{ height: 220 }}>
        <div className="absolute inset-0 bg-[#e8f0e8] overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice">
            <rect width="320" height="220" fill="#e8f0e8" />
            <ellipse cx="90" cy="80" rx="110" ry="70" fill="#dceadc" opacity="0.7" />
            <ellipse cx="230" cy="150" rx="100" ry="60" fill="#dceadc" opacity="0.6" />
            <ellipse cx="160" cy="190" rx="140" ry="45" fill="#d4e6d4" opacity="0.5" />
            <path d="M -10 135 Q 80 125 150 138 Q 220 150 330 128" stroke="#90b8d0" strokeWidth="6" fill="none" opacity="0.7" />
            <path d="M 30 220 Q 100 170 160 138 Q 200 115 260 55" stroke="#90b8d0" strokeWidth="3" fill="none" opacity="0.5" />
            <path d="M 60 10 Q 140 55 200 44 Q 260 35 310 75" stroke="#aac8aa" strokeWidth="1.5" strokeDasharray="4 3" fill="none" opacity="0.8" />
          </svg>
          <span className="absolute text-[9px] font-bold text-slate-500 tracking-wide" style={{ top: "26%", left: "55%" }}>RAMOS CLUSTER</span>
          <span className="absolute text-[9px] font-semibold text-slate-500" style={{ top: "30%", left: "6%" }}>GUIMI</span>
          <span className="absolute text-[9px] font-bold text-slate-400 tracking-widest" style={{ top: "4%", right: "2%" }}>CABANATUAN HU...</span>
          {FARM_LOCATIONS.map((farm) => (
            <button key={farm.id} onClick={() => setSelectedFarm(farm.id)} className="absolute cursor-pointer"
              style={{ top: farm.top, left: farm.left, transform: "translate(-50%,-50%)" }}>
              {farm.isPrimary ? (
                <div className="flex flex-col items-center gap-0.5">
                  <div className="bg-white rounded-xl shadow-lg px-2.5 py-1.5 border border-slate-200 min-w-[130px]">
                    <p className="text-[10px] font-bold text-slate-800 whitespace-nowrap">San Miguel Rice Farm ⊕</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">12.5 ha &bull; ~29°C &bull; 65% Precip</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#0d5921] flex items-center justify-center shadow-lg border-2 border-white">
                    <FarmIcon size={18} color="white" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#0d5921] -mt-1" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-white border-2 border-[#0d5921] flex items-center justify-center shadow-md">
                  <FarmIcon size={12} color="#0d5921" />
                </div>
              )}
            </button>
          ))}
          <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
            {[<Layers size={14}/>, <Plus size={14}/>, <Minus size={14}/>].map((icon, i) => (
              <button key={i} className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center text-slate-600 cursor-pointer border border-slate-100">{icon}</button>
            ))}
            <button className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center text-[#0d5921] cursor-pointer border border-slate-100"><Navigation size={13}/></button>
          </div>
        </div>
      </div>

      {/* Selected Location Card */}
      <div className="px-3.5 sm:px-4 pt-3 pb-1">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-1.5 px-3.5 pt-3 pb-1.5">
            <MapPin size={12} className="text-slate-400 shrink-0" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Location</span>
          </div>
          <div className="flex items-center gap-3 px-3.5 pb-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-gradient-to-br from-emerald-300 via-green-400 to-emerald-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{activeFarm.name} <span className="text-slate-400">⊕</span></p>
              <p className="text-[11px] text-slate-500 mt-0.5">{activeFarm.province}, Philippines &bull; {activeFarm.areaHa} ha</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0d5921]" />
                <span className="text-[11px] text-slate-600 font-medium">In-Season (Wet Season)</span>
              </div>
            </div>
          </div>
          <div className="px-3.5 pb-3.5">
            <button onClick={handleConfirm}
              className="w-full py-3 rounded-xl bg-[#0d5921] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#0a4a1c] active:scale-[0.98] transition-all cursor-pointer shadow-sm">
              {confirmed ? (<><CheckCircle2 size={16}/>Location Confirmed!</>) : (<>Confirm Location<ChevronRight size={16}/></>)}
            </button>
          </div>
        </div>
      </div>

      {/* Handle */}
      <div className="flex justify-center py-1">
        <div className="w-10 h-1 rounded-full bg-slate-200" />
      </div>

      {/* Farm list */}
      <div className="px-3.5 sm:px-4 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <FarmIcon size={18} color="#0d5921" />
          <h2 className="text-base font-black text-slate-900">Registered Farms ({REGISTERED_FARMS.length})</h2>
        </div>
        <div className="space-y-2.5">
          {REGISTERED_FARMS.map((farm) => {
            const isSelected = selectedFarm === farm.id;
            return (
              <button key={farm.id} onClick={() => setSelectedFarm(farm.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${isSelected ? "border-[#0d5921] bg-white shadow-sm" : "border-slate-200 bg-white"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-[#ebf6ed]" : "bg-slate-100"}`}>
                  <FarmIcon size={18} color={isSelected ? "#0d5921" : "#94a3b8"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 truncate">{farm.name}</span>
                    {farm.status === "ACTIVE" && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#ebf6ed] text-[#0d5921] text-[9px] font-bold uppercase shrink-0">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{farm.province}, {farm.country} &bull; {farm.areaHa} ha</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-[#0d5921] bg-[#0d5921]" : "border-slate-300 bg-white"}`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Forecast Detail Screen ────────────────────────────────────────────────────

function ForecastDetailScreen({ farm, onChangeFarm }) {
  const [activeTab, setActiveTab] = useState("climate");

  return (
    <div className="space-y-0 -mx-3.5 sm:-mx-4 -mt-3 sm:-mt-4">
      {/* Title */}
      <div className="px-3.5 sm:px-4 pt-3 sm:pt-4 pb-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Forecasting</h1>
      </div>

      {/* Location Card (compact) */}
      <div className="px-3.5 sm:px-4 pb-3">
        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#ebf6ed] flex items-center justify-center shrink-0">
            <MapPin size={18} className="text-[#0d5921]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              <span>SELECTED LOCATION</span>
              <CheckCircle2 size={10} className="text-[#0d5921]" />
            </div>
            <p className="text-base font-black text-slate-900 leading-tight truncate">{farm.name}</p>
            <p className="text-[11px] text-slate-500">{farm.province}, {farm.region} &bull; {farm.areaHa} ha</p>
          </div>
          <button onClick={onChangeFarm}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 shrink-0 flex items-center gap-1 cursor-pointer">
            Change <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-3.5 sm:px-4 pb-3">
        <div className="flex">
          {["climate", "demand", "insights"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold capitalize rounded-xl transition-all cursor-pointer ${activeTab === tab ? "bg-[#0d5921] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── CLIMATE TAB ──────────────────────────────────────────────── */}
      {activeTab === "climate" && (
        <div className="px-3.5 sm:px-4 space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">6-Month Climate Outlook</h2>
              <p className="text-xs text-slate-500 font-medium">Sept 2026 – Feb 2027</p>
            </div>
            <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer">
              Monthly View <ChevronDown size={12} />
            </button>
          </div>

          {/* Rainfall */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#ebf6ed] flex items-center justify-center">
                  <CloudRain size={14} className="text-[#0d5921]" />
                </div>
                <span className="text-sm font-bold text-slate-800">6-Month Rainfall Outlook</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Metric (mm)</span>
            </div>
            <RainfallBarChart data={RAINFALL_DATA} />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0d5921]" />
                <span className="text-[11px] text-slate-600 font-medium">Precipitation Expected</span>
              </div>
              <span className="text-[11px] font-bold text-red-500">↓-15% vs Hist. Avg</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center">
                  <Sun size={14} className="text-amber-500" />
                </div>
                <span className="text-sm font-bold text-slate-800">6-Month Temperature Outlook</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Celsius (°C)</span>
            </div>
            <TempLineChart data={TEMP_DATA} />
            <div className="flex items-center justify-between pt-1 flex-wrap gap-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-[11px] text-slate-600 font-medium">Warm Trend Detected</span>
              </div>
              <span className="text-[11px] font-bold text-red-500">Peak in Jan (+2.4°C baseline)</span>
            </div>
          </div>

          {/* Insights */}
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-3">Climate Insights for Your Farm</h2>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-[#0d5921]" />
                <span className="text-sm font-bold text-[#0d5921]">Climate Summary</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Expect an unusually dry late Q4 transitioning into an unseasonably warm Q1. Early planting is strongly recommended to leverage remaining residual soil moisture before peak dry conditions set in by early December.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-1.5">
                <div className="flex items-center gap-1.5"><CloudRain size={13} className="text-slate-500" /><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Rainfall Advisory</span></div>
                <p className="text-xs text-slate-700 leading-snug">Precipitation projected <span className="font-bold text-slate-900">15% below</span> historical averages for Nov–Jan.</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-1.5">
                <div className="flex items-center gap-1.5"><Sun size={13} className="text-amber-400" /><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Temp Advisory</span></div>
                <p className="text-xs text-slate-700 leading-snug">Peak daytime temp likely to exceed <span className="font-bold text-red-600">34°C</span> during late January.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Drought Risk</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">Elevated</span>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 text-[9px] font-bold"><AlertTriangle size={9}/> High Risk</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Excessive Rain</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">Calm</span>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#ebf6ed] text-[#0d5921] text-[9px] font-bold"><CheckCircle2 size={9}/> Low Risk</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-0.5">
                <div className="flex items-center gap-1.5 mb-1"><Calendar size={12} className="text-[#0d5921]" /><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Suggested Planting</span></div>
                <p className="text-base font-black text-[#0d5921] leading-tight">Oct 5 – Oct 20</p>
                <p className="text-[10px] text-slate-500">Prime moisture window</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-0.5">
                <div className="flex items-center gap-1.5 mb-1"><ChevronRight size={12} className="text-[#0d5921]" /><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Harvest Strategy</span></div>
                <p className="text-base font-black text-slate-900 leading-tight">Shift +7 Days</p>
                <p className="text-[10px] text-slate-500">Accelerate by 1 week</p>
              </div>
            </div>
            <div className="bg-[#ebf6ed] rounded-2xl border border-[#c8e6cc] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#0d5921]" />
                <h3 className="text-base font-black text-slate-900">Recommended Actions</h3>
              </div>
              {RECOMMENDED_ACTIONS.map((action, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 size={15} className="text-[#0d5921] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{action.title}</p>
                    <p className="text-[11px] text-slate-600 leading-snug mt-0.5">{action.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Climate History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Climate History</h2>
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer">Monthly View <ChevronDown size={12}/></button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Historical Rainfall (1yr Avg)</span>
                <span className="text-[10px] font-semibold text-slate-400">mm</span>
              </div>
              <HistRainfallBarChart data={HIST_RAINFALL} />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Historical Temp (1yr Avg)</span>
                <span className="text-[10px] font-semibold text-slate-400">°C</span>
              </div>
              <HistTempLineChart data={HIST_TEMP} />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-1.5">
              {[
                { label: "Forecast Area:",         value: farm.name },
                { label: "Data Period:",           value: "Sept 2026 – Feb 2027" },
                { label: "Last Updated:",          value: "Aug 30, 2026 · 08:30 AM PHT" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">{label}</span>
                  <span className="text-[11px] text-slate-800 font-bold text-right">{value}</span>
                </div>
              ))}
            </div>
            <button className="w-full py-3.5 rounded-2xl bg-[#0d5921] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#0a4a1c] active:scale-[0.98] transition-all cursor-pointer shadow-sm">
              <Download size={16} />Download Forecast Report
            </button>
          </div>
        </div>
      )}

      {/* ── DEMAND TAB ───────────────────────────────────────────────── */}
      {activeTab === "demand" && (
        <div className="px-3.5 sm:px-4 space-y-4 pb-6">

          {/* Section heading */}
          <h2 className="text-lg font-black text-slate-900">Demand Forecasting</h2>

          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <Search size={15} className="text-slate-400 shrink-0" />
            <span className="flex-1 text-xs text-slate-700 font-medium">Jasmine Rice</span>
          </div>

          {/* Filters row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] font-bold text-slate-500 mb-1">Product Type</p>
              <button className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer">
                Milled Rice <ChevronDown size={13} className="text-slate-400" />
              </button>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 mb-1">Forecast View</p>
              <button className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer">
                Monthly <ChevronDown size={13} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Historical & Forecasted Demand chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-tight">Historical &amp; Forecasted Demand</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Central Luzon Wholesale Depots</p>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 shrink-0">Unit: kg</span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#0d5921" strokeWidth="2.5" strokeLinecap="round"/><circle cx="11" cy="4" r="2.5" fill="#0d5921"/></svg>
                <span className="text-[10px] font-semibold text-slate-600">Historical (Jan–Jun)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#1a3a1a" strokeWidth="2" strokeDasharray="4 2"/><circle cx="11" cy="4" r="2.5" fill="#f59e0b"/></svg>
                <span className="text-[10px] font-semibold text-slate-600">Forecast (Jul–Nov)</span>
              </div>
            </div>

            {/* Chart */}
            <DemandLineChart data={DEMAND_CHART_DATA} />

            {/* Confidence row */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#0d5921]" />
                <span className="text-[11px] text-slate-600 font-medium">Projected baseline confidence: <span className="font-bold text-slate-900">91.4%</span></span>
              </div>
              <span className="text-[11px] font-bold text-[#0d5921]">+32% peak vs H1</span>
            </div>
          </div>

          {/* Demand metrics 2×2 */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Demand Trend */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} className="text-[#0d5921]" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Demand Trend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={16} className="text-amber-500" />
                <span className="text-base font-black text-amber-500">Increasing</span>
              </div>
            </div>

            {/* Peak Period */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-[#0d5921]" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Peak Period</span>
              </div>
              <span className="text-base font-black text-slate-900">October 2026</span>
            </div>

            {/* Expected Level */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <BarChart2 size={13} className="text-red-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Expected Level</span>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 text-xs font-bold">High Demand</span>
            </div>

            {/* Forecasted Demand */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-[#0d5921]" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Forecasted Demand</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-[#0d5921]">12,500</span>
                <span className="text-xs font-bold text-slate-500">kg</span>
              </div>
            </div>
          </div>

          {/* Insights & Considerations */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <h3 className="text-sm font-black text-slate-900">Insights &amp; Considerations</h3>
            </div>

            {/* Product Demand Summary — green left border */}
            <div className="pl-3 border-l-4 border-[#0d5921] space-y-0.5">
              <p className="text-xs font-bold text-[#0d5921]">Product Demand Summary</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Demand for Jasmine Rice is projected to increase steadily during the forecast period, with the highest expected demand occurring in <span className="font-bold text-slate-900">October</span>.
              </p>
            </div>

            {/* Production Consideration — amber left border */}
            <div className="pl-3 border-l-4 border-amber-400 space-y-0.5">
              <p className="text-xs font-bold text-amber-600">Production Consideration</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consider preparing sufficient supply ahead of the projected peak-demand period to maximize wholesale contract value and lock favorable forward pricing.
              </p>
            </div>
          </div>

          {/* Metadata footer */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-1.5">
            {[
              { label: "Selected Product",   value: "Jasmine Rice (Premium Grade)" },
              { label: "Forecast Period",    value: "Sep 2026 – Feb 2027" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">{label}</span>
                <span className="text-[11px] text-slate-800 font-bold">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Data Source &amp; Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0d5921]" />
                <span className="text-[11px] font-bold text-[#0d5921]">Oct 26, 2026 · Live Ag-Market Data</span>
              </div>
            </div>
          </div>

          {/* Download */}
          <button className="w-full py-3.5 rounded-2xl bg-[#0d5921] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#0a4a1c] active:scale-[0.98] transition-all cursor-pointer shadow-sm">
            <Download size={16} />Download Demand Report
          </button>
        </div>
      )}

      {/* ── INSIGHTS TAB ─────────────────────────────────────────────── */}
      {activeTab === "insights" && (
        <div className="px-3.5 sm:px-4 space-y-4 pb-6">

          {/* ── Target Commodity Card ──────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            {/* Label + Change Product link */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Commodity</span>
              <button className="flex items-center gap-1 text-[11px] font-bold text-[#0d5921] cursor-pointer hover:underline">
                <ChevronRight size={11} />Change Product
              </button>
            </div>

            {/* Product name + grain icon */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-black text-slate-900 leading-tight">Jasmine Rice (Premium)</p>
                <p className="text-xs text-slate-500 mt-0.5">Type: Milled Long-Grain</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 text-2xl">
                🌾
              </div>
            </div>

            {/* Scope Field + Horizon — 2 col */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <MapPin size={11} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Scope Field</span>
                </div>
                <p className="text-xs font-bold text-slate-900">San Miguel Sector 4</p>
                <p className="text-[11px] text-slate-500">Nueva Ecija Depot</p>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Calendar size={11} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Horizon</span>
                </div>
                <p className="text-xs font-bold text-slate-900">Sep '26 – Feb '27</p>
                <p className="text-[11px] text-slate-500">6-Month Outlook</p>
              </div>
            </div>
          </div>

          {/* ── Combined Forecast Summary ──────────────────────────── */}
          <div className="space-y-2">
            <h2 className="text-base font-black text-slate-900">Combined Forecast Summary</h2>
            <div className="grid grid-cols-2 gap-2.5">

              {/* Demand Outlook */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Demand Outlook</span>
                  <TrendingUp size={11} className="text-[#0d5921]" />
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#0d5921] text-white text-xs font-bold">Increasing</span>
              </div>

              {/* Est. Demand */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Est. Demand</span>
                  <Calendar size={11} className="text-slate-400" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-slate-900">12,500</span>
                  <span className="text-xs font-bold text-slate-500">kg</span>
                </div>
              </div>

              {/* Peak Period */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Peak Period</span>
                  <span className="text-amber-500 text-[11px]">🕐</span>
                </div>
                <p className="text-xl font-black text-amber-500 leading-tight">Oct 2026</p>
              </div>

              {/* Rainfall */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Rainfall</span>
                  <CloudRain size={11} className="text-blue-400" />
                </div>
                <p className="text-xl font-black text-blue-500 leading-tight">Moderate</p>
              </div>

              {/* Temp Range */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Temp Range</span>
                  <span className="text-orange-400 text-[11px]">🌡</span>
                </div>
                <p className="text-xl font-black text-slate-900 leading-tight">26–31°C</p>
              </div>

              {/* Suitability */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Suitability</span>
                  <CheckCircle2 size={11} className="text-[#0d5921]" />
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#ebf6ed] text-[#0d5921] text-xs font-bold">Favorable</span>
              </div>
            </div>
          </div>

          {/* ── Farmer-Focused Insights ───────────────────────────── */}
          <div>
            <h2 className="text-base font-black text-slate-900">Farmer-Focused Insights</h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
              Actionable agro-climatic advisories synthesized from climate models and commodity buyer demand.
            </p>
          </div>

          {/* Overall Forecast Summary — green card */}
          <div className="bg-[#ebf6ed] rounded-2xl border border-[#c8e6cc] p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0d5921] flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} color="white" />
              </div>
              <span className="text-sm font-black text-slate-900">Overall Forecast Summary</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Conditions are highly favorable for Jasmine Rice cultivation this season. Strong projected demand aligns perfectly with optimal climate windows, presenting a significant margin opportunity for forward-contracted yields.
            </p>
          </div>

          {/* Climate / Growing Consideration */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <CloudRain size={16} className="text-blue-500" />
              </div>
              <span className="text-sm font-bold text-slate-900">Climate / Growing Consideration</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Expected moderate rainfall provides adequate baseline hydration, reducing reliance on supplemental irrigation by an estimated 20%. Maintain field drainage canals ahead of late October wet spells.
            </p>
          </div>

          {/* Suggested Planting Window */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Sprout size={16} className="text-emerald-600" />
              </div>
              <span className="text-sm font-bold text-slate-900">Suggested Planting Window</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Target planting window between September 10 – September 25 to align the critical vegetative stage with the most stable temperature profiles and sufficient solar radiance.
            </p>
          </div>

          {/* Demand & Pricing Opportunity */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-amber-500" />
              </div>
              <span className="text-sm font-bold text-slate-900">Demand &amp; Pricing Opportunity</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Market indicators suggest a 15% spike in premium rice demand leading into Q4 2026. Forward-contracting is advised to lock in favorable mill purchasing rates before regional harvest saturation.
            </p>
          </div>

          {/* Suggested Harvest Timing */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <FarmIcon size={16} color="#059669" />
              </div>
              <span className="text-sm font-bold text-slate-900">Suggested Harvest Timing</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Optimal harvest predicted for late January to early February 2027 to capture peak market demand and prevent late-season monsoon moisture spoilage in unsealed storage.
            </p>
          </div>

          {/* Pathogen Risk / Early Warning — RED alert card */}
          <div className="bg-red-50 rounded-2xl border border-red-200 p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} color="white" />
              </div>
              <span className="text-sm font-bold text-red-700">Pathogen Risk / Early Warning</span>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">
              Monitor humidity levels closely during late November; slight elevation may increase risk of fungal presence (Blast / Sheath Blight). Ensure preventive organic fungicide application prior to boot stage.
            </p>
          </div>

          {/* Suggested Production / Yield */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#ebf6ed] flex items-center justify-center shrink-0 text-base font-black text-[#0d5921]">G</div>
              <span className="text-sm font-bold text-slate-900">Suggested Production / Yield</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Maintain soil nitrogen levels during the mid-growth phase to maximize grain weight and quality for premium milling specifications and reduced broken kernel percentage.
            </p>
          </div>

          {/* ── Forecast Model Metadata ────────────────────────────── */}
          <div className="bg-[#ebf6ed] rounded-2xl border border-[#c8e6cc] p-4 space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Forecast Model Metadata</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {[
                { label: "Target Product",    value: "Jasmine Rice (Prem.)" },
                { label: "Forecast Location", value: "San Miguel Farm, NE" },
                { label: "Temporal Window",   value: "Sep 2026 – Feb 2027" },
                { label: "Verification Date", value: "Aug 30, 2026 · AgData" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Download */}
          <button className="w-full py-3.5 rounded-2xl bg-[#0d5921] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#0a4a1c] active:scale-[0.98] transition-all cursor-pointer shadow-sm">
            <Download size={16} />Download Demand Report
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function FarmerMobileForecastingView({ onBack }) {
  const [screen, setScreen]           = useState("picker");
  const [confirmedFarm, setConfirmedFarm] = useState(null);

  if (screen === "forecast" && confirmedFarm) {
    return (
      <ForecastDetailScreen
        farm={confirmedFarm}
        onChangeFarm={() => setScreen("picker")}
      />
    );
  }

  return (
    <LocationPickerScreen
      onConfirm={(farm) => {
        setConfirmedFarm(farm);
        setScreen("forecast");
      }}
    />
  );
}
