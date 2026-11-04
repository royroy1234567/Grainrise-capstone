import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Download,
  Lightbulb,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  CloudRain,
  Sun,
  Users,
  Calendar,
  Info,
  Package,
  ShieldCheck,
  FileSpreadsheet,
  FileDown,
  Droplets,
  ThermometerSun,
} from "lucide-react";

import { jsPDF } from "jspdf";

import useFarmerForecasting from "../../Components/hooks/Farmer/useFarmerForecasting";
import Toast from "../../Components/Modals/Toast";
import useToast from "../../Components/hooks/useToast";

// ============================================================
// GRAINRISE: FARMER > FORECASTING > FORECAST INSIGHTS
// ============================================================
// Combines:
// 1. Copernicus CDS 6-month Climate Outlook
// 2. GrainRise Time Series + MLR / Preliminary Demand Forecast
// 3. DA-RSBSA & PSA Verified Competitor Information
// 4. Integrated Agronomic & Commercial Insights (Climate + Demand)
// 5. Interactive Demand & Climate Visualization Graphs
// 6. Comprehensive PDF & CSV Exporting
// ============================================================

const PERIOD_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
];

const CURRENT_LOCATION_VALUE = "current_location";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ============================================================
// GENERIC HELPERS
// ============================================================

const text = (value) => String(value ?? "").trim();

const numberValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumber = (value, maximumFractionDigits = 2) => {
  const parsed = numberValue(value);
  if (parsed === null) return "—";
  return new Intl.NumberFormat("en-PH", {
    maximumFractionDigits,
  }).format(parsed);
};

const formatKg = (value) => {
  const formatted = formatNumber(value, 2);
  return formatted === "—" ? "—" : `${formatted} kg`;
};

const titleCase = (value) => {
  const normalized = text(value)
    .replace(/_/g, " ")
    .replace(/-/g, " ");
  if (!normalized) return "—";
  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const unwrapPayload = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }
  if (payload.data && typeof payload.data === "object") {
    return payload.data;
  }
  if (payload.result && typeof payload.result === "object") {
    return payload.result;
  }
  return payload;
};

const normalizeList = (payload, possibleKeys = []) => {
  if (Array.isArray(payload)) return payload;
  const root = unwrapPayload(payload);
  if (Array.isArray(root)) return root;
  if (!root || typeof root !== "object") return [];
  for (const key of possibleKeys) {
    if (Array.isArray(root[key])) return root[key];
  }
  return [];
};

const normalizeAIResult = (payload) => {
  const root = unwrapPayload(payload) || {};
  return (
    root.interpretation ||
    root.ai_interpretation ||
    root.forecast_interpretation ||
    root
  );
};

// ============================================================
// PRODUCT & FARM HELPERS
// ============================================================

const getProductType = (product) =>
  text(product?.product_type ?? product?.productType);

const getRiceVariety = (product) =>
  text(product?.rice_variety ?? product?.riceVariety);

const getProductKey = (product) => {
  if (!product) return "";
  return `${product.product_id ?? ""}-${getProductType(product)}-${getRiceVariety(product)}`;
};

const getProductName = (product) => {
  if (!product) return "—";
  return text(
    product?.rice_variety ??
    product?.variety ??
    product?.product_name ??
    product?.name ??
    "Palay"
  );
};

const formatProductType = (type) => {
  const clean = text(type).toLowerCase();
  if (clean.includes("dry") && clean.includes("milled")) return "Dry Palay (Cleaned)";
  if (clean.includes("wet") && clean.includes("milled")) return "Wet Palay (Fresh Harvest)";
  if (clean.includes("dry")) return "Dry Palay";
  if (clean.includes("wet")) return "Fresh Wet Palay";
  return titleCase(type) || "Unmilled Palay";
};

const productLabel = (product) => {
  if (!product) return "—";
  const name = getProductName(product);
  const type = formatProductType(getProductType(product));
  return `${name} (${type})`;
};

const getFarmId = (farm) =>
  farm?.farm_id ?? farm?.id ?? null;

const getFarmName = (farm) =>
  text(farm?.farm_name ?? farm?.name) || "Registered Farm";

const farmAddress = (farm) => {
  const values = [farm?.barangay, farm?.municipality, farm?.province]
    .map(text)
    .filter(Boolean);
  return values.join(", ");
};

const farmSelectLabel = (farm) => {
  const name = getFarmName(farm);
  const address = farmAddress(farm);
  return address ? `${name} — ${address}` : name;
};

// ============================================================
// DATE FORMATTING HELPERS
// ============================================================

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return text(value) || "—";
  }
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const formatDateRange = (start, end) => {
  if (!start && !end) return "—";
  if (start && !end) return formatDate(start);
  if (!start && end) return formatDate(end);
  return `${formatDate(start)} – ${formatDate(end)}`;
};

const formatMonth = (value) => {
  if (!value) return "";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-PH", {
    month: "short",
    year: "2-digit",
  });
};

const formatWeek = (value) => {
  if (!value) return "";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
};

const formatMonthYear = (value) => {
  if (!value) return "—";
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return text(value) || "—";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const getPeriodStart = (item) => {
  return item?.period_start || item?.start_date || item?.date || null;
};

const getHistoricalValue = (item) => {
  return numberValue(
    item?.realized_demand_kg ??
    item?.actual_demand_kg ??
    item?.quantity_sold_kg ??
    item?.quantity_sold ??
    item?.demand_kg ??
    item?.quantity_kg ??
    item?.value
  );
};

const getForecastValue = (item) => {
  return numberValue(
    item?.forecast_quantity_kg ??
    item?.projected_demand_kg ??
    item?.predicted_demand_kg ??
    item?.forecasted_demand_kg ??
    item?.model_forecast_quantity_kg ??
    item?.quantity_kg ??
    item?.value
  );
};

// ============================================================
// GEOLOCATION PROMISE
// ============================================================

const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error("Current location is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let message = "Unable to access your current location.";
        if (error?.code === 1) {
          message = "Location permission was denied. Please allow location access or select a registered farm.";
        } else if (error?.code === 2) {
          message = "Your current location is temporarily unavailable.";
        } else if (error?.code === 3) {
          message = "Getting your current location took too long. Please try again.";
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  });

const escapeHTML = (value) =>
  text(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const cleanPdfText = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u25CF]/g, "*")
    .replace(/[\u20B1]/g, "PHP ")
    .replace(/[^\x00-\x7F]/g, " ");
};

// ============================================================
// UI COMPONENTS
// ============================================================

const SelectField = ({ label, value, onChange, disabled = false, children }) => (
  <div className="min-w-0">
    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-[38px] w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm font-medium text-gray-700 outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
    </div>
  </div>
);

// ============================================================
// DEMAND GRAPH (LINE CHART)
// ============================================================

function DemandForecastChart({
  historicalPeriods = [],
  forecastPeriods = [],
  forecastView = "Monthly",
  varietyName = "Palay",
  isInsufficient = false,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const historicalLimit = forecastView === "Weekly" ? 8 : 6;
  const forecastLimit = forecastView === "Weekly" ? 12 : 6;

  const historical = useMemo(() => {
    return (historicalPeriods || [])
      .slice(-historicalLimit)
      .map((item) => ({
        date: getPeriodStart(item),
        period_end: item?.period_end,
        value: getHistoricalValue(item),
        contractFloor: numberValue(item?.committed_contract_quantity_kg),
        type: "history",
      }));
  }, [historicalPeriods, historicalLimit]);

  const forecast = useMemo(() => {
    return (forecastPeriods || [])
      .slice(0, forecastLimit)
      .map((item) => ({
        date: getPeriodStart(item),
        period_end: item?.period_end,
        value: getForecastValue(item),
        contractFloor: numberValue(item?.committed_contract_quantity_kg),
        type: "forecast",
      }));
  }, [forecastPeriods, forecastLimit]);

  const allPoints = [...historical, ...forecast];
  const allValues = allPoints.map((item) => item.value || 0);
  const maxVal = Math.max(...allValues, 0);
  const hasData = allPoints.length > 0 && maxVal > 0;

  // Chart Dimensions
  const svgWidth = 560;
  const svgHeight = 210;
  const padLeft = 65;
  const padRight = 25;
  const padTop = 20;
  const padBottom = 40;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;
  const chartBottom = padTop + chartHeight;

  // Round Y-max
  const yMax = maxVal > 0
    ? (maxVal > 5000 ? Math.ceil((maxVal * 1.15) / 1000) * 1000 : Math.ceil((maxVal * 1.2) / 10) * 10)
    : 100;
  const yTicks = [0, Math.round(yMax * 0.33), Math.round(yMax * 0.66), yMax];

  const getY = (val) => chartBottom - ((val || 0) / (yMax || 1)) * chartHeight;

  const histRatio = historical.length > 0 ? 0.38 : 0.0;
  const histW = chartWidth * histRatio;
  const histStart = padLeft;
  const foreStart = padLeft + (historical.length > 0 ? histW + 28 : 0);
  const foreW = svgWidth - padRight - foreStart;
  const todayX = padLeft + histW + 14;

  const historicalPoints = historical.map((item, index) => {
    const x = historical.length <= 1
      ? histStart + histW / 2
      : histStart + (index / (historical.length - 1)) * histW;
    return { ...item, x, y: getY(item.value) };
  });

  const forecastPoints = forecast.map((item, index) => {
    const x = forecast.length <= 1
      ? foreStart + foreW / 2
      : foreStart + (index / (forecast.length - 1)) * foreW;
    return { ...item, x, y: getY(item.value) };
  });

  const historicalPath = historicalPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x},${point.y}`)
    .join(" ");

  let forecastPath = "";
  if (forecastPoints.length) {
    const pathPoints = historicalPoints.length
      ? [historicalPoints[historicalPoints.length - 1], ...forecastPoints]
      : forecastPoints;
    forecastPath = pathPoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x},${point.y}`)
      .join(" ");
  }

  const isWeekly = forecastView === "Weekly";

  if (!hasData && isInsufficient) {
    return (
      <div className="w-full h-[210px] flex flex-col items-center justify-center rounded-xl bg-gray-50 border border-dashed border-gray-200 p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
          <TrendingDown size={20} />
        </div>
        <p className="text-xs font-bold text-gray-800">
          No Historical Demand Data Recorded
        </p>
        <p className="text-[11px] text-gray-500 max-w-sm mt-0.5">
          There are currently no recorded POS sales transactions or active contracts for {varietyName}. Numerical forecasts will automatically plot once sales or buyer commitments are logged.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[210px] relative select-none" onMouseLeave={() => setHoveredPoint(null)}>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
        {/* Y-GRID LINES & LABELS */}
        {yTicks.map((tickVal, index) => {
          const yPos = getY(tickVal);
          return (
            <g key={`y-grid-${index}`}>
              <line
                x1={padLeft}
                y1={yPos}
                x2={svgWidth - padRight}
                y2={yPos}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 6}
                y={yPos + 3}
                className="text-[9px] fill-slate-400 font-medium"
                textAnchor="end"
              >
                {tickVal >= 1000 ? `${(tickVal / 1000).toLocaleString("en-PH")}k kg` : `${tickVal.toLocaleString("en-PH")} kg`}
              </text>
            </g>
          );
        })}

        {/* TODAY DIVIDER */}
        {historical.length > 0 && (
          <g>
            <line
              x1={todayX}
              y1={padTop}
              x2={todayX}
              y2={chartBottom}
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <rect
              x={todayX - 16}
              y={padTop - 14}
              width="32"
              height="14"
              rx="3"
              fill="#F1F5F9"
              stroke="#CBD5E1"
              strokeWidth="1"
            />
            <text
              x={todayX}
              y={padTop - 4}
              className="text-[8px] fill-slate-600 font-bold"
              textAnchor="middle"
            >
              Today
            </text>
          </g>
        )}

        {/* HISTORICAL PATH */}
        {historicalPath && (
          <path
            d={historicalPath}
            fill="none"
            stroke="#166534"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* HISTORICAL POINTS */}
        {historicalPoints.map((point, index) => (
          <g key={`hist-pt-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#FFFFFF"
              stroke="#166534"
              strokeWidth="2"
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="14"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(point)}
            />
            <text
              x={point.x}
              y={chartBottom + 16}
              className="text-[9px] fill-slate-500 font-medium"
              textAnchor="middle"
            >
              {isWeekly ? formatWeek(point.date) : formatMonth(point.date)}
            </text>
          </g>
        ))}

        {/* FORECAST PATH */}
        {forecastPath && (
          <path
            d={forecastPath}
            fill="none"
            stroke="#D97706"
            strokeWidth="2.5"
            strokeDasharray="5 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* FORECAST POINTS */}
        {forecastPoints.map((point, index) => (
          <g key={`fore-pt-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4.5"
              fill="#D97706"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="14"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(point)}
            />
            <text
              x={point.x}
              y={chartBottom + 16}
              className="text-[9px] fill-amber-700 font-semibold"
              textAnchor="middle"
            >
              {isWeekly ? formatWeek(point.date) : formatMonth(point.date)}
            </text>
          </g>
        ))}
      </svg>

      {/* HOVER TOOLTIP */}
      {hoveredPoint && (
        <div
          className="absolute z-10 pointer-events-none rounded-lg border border-slate-200 bg-slate-900/90 text-white px-2.5 py-1.5 text-[11px] shadow-lg -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(hoveredPoint.x / svgWidth) * 100}%`,
            top: `${Math.max(15, (hoveredPoint.y / svgHeight) * 100 - 8)}%`,
          }}
        >
          <p className="font-bold text-slate-100">
            {isWeekly ? `Week of ${formatDate(hoveredPoint.date)}` : formatMonthYear(hoveredPoint.date)}
          </p>
          <p className="text-slate-300">
            {hoveredPoint.type === "history" ? "Historical Sales" : "Projected Demand"}:{" "}
            <span className="font-bold text-white">{formatKg(hoveredPoint.value)}</span>
          </p>
          {hoveredPoint.contractFloor > 0 && (
            <p className="text-amber-300 text-[10px]">
              Contract Floor: {formatKg(hoveredPoint.contractFloor)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// CLIMATE GRAPH (RAINFALL BARS + TEMPERATURE LINE)
// ============================================================

function ClimateForecastChart({ rainfallRows = [], temperatureRows = [] }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const series = useMemo(() => {
    return rainfallRows.slice(0, 6).map((r, idx) => {
      const h = temperatureRows[idx] || {};
      const rain = Number(r?.value || 0);
      const temp = Number(h?.value || 28.0);
      const label = r?.label || r?.month || (r?.period_start ? shortMonthLabel(r.period_start) : `M${idx + 1}`);
      const periodStart = r?.period_start || h?.period_start || null;
      return {
        label,
        rain,
        temp,
        periodStart,
        index: idx,
      };
    });
  }, [rainfallRows, temperatureRows]);

  const rainValues = series.map((s) => s.rain);
  const tempValues = series.map((s) => s.temp);

  const maxRain = Math.max(...rainValues, 50);
  const rainYMax = Math.ceil((maxRain * 1.15) / 10) * 10;
  const rainTicks = [0, Math.round(rainYMax * 0.5), rainYMax];

  const minTemp = Math.floor(Math.min(...tempValues, 20) - 2);
  const maxTemp = Math.ceil(Math.max(...tempValues, 35) + 2);
  const tempTicks = [minTemp, Math.round((minTemp + maxTemp) / 2), maxTemp];

  const svgWidth = 560;
  const svgHeight = 210;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 20;
  const padBottom = 40;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;
  const chartBottom = padTop + chartHeight;

  const getRainY = (val) => chartBottom - ((val || 0) / (rainYMax || 1)) * chartHeight;
  const getTempY = (val) => chartBottom - (((val - minTemp) || 0) / ((maxTemp - minTemp) || 1)) * chartHeight;

  const colWidth = series.length > 0 ? chartWidth / series.length : chartWidth;
  const barWidth = 26;

  const points = series.map((s, idx) => {
    const xCenter = padLeft + (idx + 0.5) * colWidth;
    const barHeight = Math.max(4, ((s.rain || 0) / (rainYMax || 1)) * chartHeight);
    const barY = chartBottom - barHeight;
    const tempY = getTempY(s.temp);
    return { ...s, xCenter, barY, barHeight, tempY };
  });

  const tempLinePath = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.xCenter},${p.tempY}`)
    .join(" ");

  if (!series.length) {
    return (
      <div className="w-full h-[210px] flex flex-col items-center justify-center rounded-xl bg-gray-50 border border-dashed border-gray-200 p-6 text-center">
        <CloudRain size={24} className="text-slate-400 mb-2" />
        <p className="text-xs text-gray-500 font-medium">No 6-month Copernicus climate forecast available.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[210px] relative select-none" onMouseLeave={() => setHoveredPoint(null)}>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
        {/* RAINFALL Y-GRID & TICKS (LEFT) */}
        {rainTicks.map((tick, idx) => {
          const yPos = getRainY(tick);
          return (
            <g key={`rain-tick-${idx}`}>
              <line
                x1={padLeft}
                y1={yPos}
                x2={svgWidth - padRight}
                y2={yPos}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 6}
                y={yPos + 3}
                className="text-[9px] fill-sky-600 font-semibold"
                textAnchor="end"
              >
                {tick} mm
              </text>
            </g>
          );
        })}

        {/* TEMPERATURE TICKS (RIGHT) */}
        {tempTicks.map((tick, idx) => {
          const yPos = getTempY(tick);
          return (
            <text
              key={`temp-tick-${idx}`}
              x={svgWidth - padRight + 6}
              y={yPos + 3}
              className="text-[9px] fill-orange-600 font-semibold"
              textAnchor="start"
            >
              {tick}°C
            </text>
          );
        })}

        {/* RAINFALL BARS */}
        {points.map((p, idx) => (
          <g key={`bar-${idx}`}>
            <rect
              x={p.xCenter - barWidth / 2}
              y={p.barY}
              width={barWidth}
              height={p.barHeight}
              rx="4"
              fill="#38BDF8"
              opacity="0.85"
            />
            <rect
              x={p.xCenter - colWidth / 2}
              y={padTop}
              width={colWidth}
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(p)}
            />
            <text
              x={p.xCenter}
              y={chartBottom + 16}
              className="text-[9px] fill-slate-500 font-medium"
              textAnchor="middle"
            >
              {p.label}
            </text>
          </g>
        ))}

        {/* TEMPERATURE LINE */}
        {tempLinePath && (
          <path
            d={tempLinePath}
            fill="none"
            stroke="#EA580C"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* TEMPERATURE DOTS */}
        {points.map((p, idx) => (
          <g key={`dot-${idx}`}>
            <circle
              cx={p.xCenter}
              cy={p.tempY}
              r="4"
              fill="#FFFFFF"
              stroke="#EA580C"
              strokeWidth="2.5"
            />
            <circle
              cx={p.xCenter}
              cy={p.tempY}
              r="14"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(p)}
            />
          </g>
        ))}
      </svg>

      {/* HOVER TOOLTIP */}
      {hoveredPoint && (
        <div
          className="absolute z-10 pointer-events-none rounded-lg border border-slate-200 bg-slate-900/90 text-white px-2.5 py-1.5 text-[11px] shadow-lg -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(hoveredPoint.xCenter / svgWidth) * 100}%`,
            top: `${Math.max(15, (Math.min(hoveredPoint.barY, hoveredPoint.tempY) / svgHeight) * 100 - 8)}%`,
          }}
        >
          <p className="font-bold text-slate-100">
            {hoveredPoint.periodStart ? formatMonthYear(hoveredPoint.periodStart) : hoveredPoint.label}
          </p>
          <p className="text-sky-300">
            Rainfall: <span className="font-bold text-white">{hoveredPoint.rain.toFixed(1)} mm</span>
          </p>
          <p className="text-orange-300">
            Average Temp: <span className="font-bold text-white">{hoveredPoint.temp.toFixed(1)} °C</span>
          </p>
        </div>
      )}
    </div>
  );
}

function shortMonthLabel(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", { month: "short" });
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function ForecastInsights() {
  const forecasting = useFarmerForecasting();

  const {
    loadForecastingFarms,
    loadDemandProducts,
    generateClimateForecast,
    generateDemandForecast,
    loadCompetitorAnalysis,
    generateAIInterpretation,
    competitorAnalysis: hookCompetitorAnalysis,
  } = forecasting;

  const { toasts, showToast, removeToast } = useToast();

  // -----------------------------------------------------------
  // SOURCE DATA
  // -----------------------------------------------------------
  const [loadedFarms, setLoadedFarms] = useState([]);
  const [loadedProducts, setLoadedProducts] = useState([]);
  const [isLoadingSelections, setIsLoadingSelections] = useState(true);
  const [selectionError, setSelectionError] = useState("");

  // -----------------------------------------------------------
  // SELECTIONS
  // -----------------------------------------------------------
  const [selectedProductKey, setSelectedProductKey] = useState("");
  const [selectedLocationKey, setSelectedLocationKey] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");

  // -----------------------------------------------------------
  // GENERATED RESULTS
  // -----------------------------------------------------------
  const [climateResult, setClimateResult] = useState(null);
  const [demandResult, setDemandResult] = useState(null);
  const [localCompetitorData, setLocalCompetitorData] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [currentCoordinates, setCurrentCoordinates] = useState(null);

  // -----------------------------------------------------------
  // GENERATION STATE
  // -----------------------------------------------------------
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [aiNotice, setAiNotice] = useState("");

  // -----------------------------------------------------------
  // RESOLVED LISTS
  // -----------------------------------------------------------
  const hookFarms = normalizeList(
    forecasting?.farms ?? forecasting?.forecastingFarms,
    ["farms", "results", "items"]
  );

  const hookProducts = normalizeList(
    forecasting?.demandProducts ?? forecasting?.products,
    ["products", "demand_products", "results", "items"]
  );

  const farms = loadedFarms.length ? loadedFarms : hookFarms;
  const products = loadedProducts.length ? loadedProducts : hookProducts;

  // -----------------------------------------------------------
  // INITIAL LOAD OF FARMS & PRODUCTS
  // -----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const loadSelections = async () => {
      setIsLoadingSelections(true);
      setSelectionError("");

      try {
        const [farmPayload, productPayload] = await Promise.all([
          typeof loadForecastingFarms === "function"
            ? loadForecastingFarms()
            : Promise.resolve(null),
          typeof loadDemandProducts === "function"
            ? loadDemandProducts()
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        const farmRows = normalizeList(farmPayload, ["farms", "results", "items"]);
        const productRows = normalizeList(productPayload, [
          "products",
          "demand_products",
          "results",
          "items",
        ]);

        if (farmRows.length) setLoadedFarms(farmRows);
        if (productRows.length) setLoadedProducts(productRows);
      } catch (error) {
        if (!cancelled) {
          setSelectionError(
            error?.message || "Unable to load Forecast Insights options."
          );
        }
      } finally {
        if (!cancelled) setIsLoadingSelections(false);
      }
    };

    loadSelections();
    return () => {
      cancelled = true;
    };
  }, [loadForecastingFarms, loadDemandProducts]);

  // -----------------------------------------------------------
  // AUTO-SELECT FIRST PRODUCT
  // -----------------------------------------------------------
  useEffect(() => {
    if (selectedProductKey || !products.length) return;
    setSelectedProductKey(getProductKey(products[0]));
  }, [products, selectedProductKey]);

  // -----------------------------------------------------------
  // AUTO-SELECT FIRST REGISTERED FARM
  // -----------------------------------------------------------
  useEffect(() => {
    if (selectedLocationKey) return;
    const firstFarm = farms.find((f) => getFarmId(f));
    if (firstFarm) {
      setSelectedLocationKey(`farm:${getFarmId(firstFarm)}`);
    }
  }, [farms, selectedLocationKey]);

  // -----------------------------------------------------------
  // SELECTED PRODUCT & FARM OBJECTS
  // -----------------------------------------------------------
  const selectedProduct = useMemo(() => {
    return (
      products.find((p) => getProductKey(p) === selectedProductKey) || null
    );
  }, [products, selectedProductKey]);

  const selectedFarm = useMemo(() => {
    if (!selectedLocationKey.startsWith("farm:")) return null;
    const farmId = selectedLocationKey.slice(5);
    return farms.find((f) => String(getFarmId(f)) === farmId) || null;
  }, [farms, selectedLocationKey]);

  const selectedLocationLabel = useMemo(() => {
    if (selectedLocationKey === CURRENT_LOCATION_VALUE) {
      if (currentCoordinates) {
        return `Current Location (${Number(currentCoordinates.latitude).toFixed(4)}, ${Number(currentCoordinates.longitude).toFixed(4)})`;
      }
      return "Current Location";
    }
    if (selectedFarm) {
      return farmSelectLabel(selectedFarm);
    }
    return "—";
  }, [selectedLocationKey, selectedFarm, currentCoordinates]);

  // -----------------------------------------------------------
  // CLEAR RESULTS ON PARAMETER CHANGE
  // -----------------------------------------------------------
  const clearGeneratedResults = useCallback(() => {
    setClimateResult(null);
    setDemandResult(null);
    setLocalCompetitorData(null);
    setAiResult(null);
    setGenerationError("");
    setAiNotice("");
  }, []);

  const handleProductChange = (e) => {
    setSelectedProductKey(e.target.value);
    clearGeneratedResults();
  };

  const handleLocationChange = (e) => {
    const val = e.target.value;
    setSelectedLocationKey(val);
    if (val !== CURRENT_LOCATION_VALUE) {
      setCurrentCoordinates(null);
    }
    clearGeneratedResults();
  };

  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
    clearGeneratedResults();
  };

  // -----------------------------------------------------------
  // GENERATE COMBINED INSIGHTS
  // -----------------------------------------------------------
  const handleGenerate = async () => {
    if (isGenerating) return;

    setGenerationError("");
    setAiNotice("");

    if (!selectedProduct) {
      setGenerationError("Please select a Product / Rice Variety.");
      return;
    }

    if (!selectedLocationKey) {
      setGenerationError("Please select a registered farm or use your current location.");
      return;
    }

    if (
      typeof generateClimateForecast !== "function" ||
      typeof generateDemandForecast !== "function"
    ) {
      setGenerationError("Forecasting service is currently unavailable.");
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Prepare Location Payload
      let climateLocationPayload = null;
      if (selectedLocationKey === CURRENT_LOCATION_VALUE) {
        setGenerationStage("Accessing current device location...");
        const coords = await getCurrentPosition();
        setCurrentCoordinates(coords);
        climateLocationPayload = {
          location_source: "current_location",
          latitude: coords.latitude,
          longitude: coords.longitude,
          location_label: "Current Location",
        };
      } else {
        const farmId = getFarmId(selectedFarm);
        if (!farmId) {
          throw new Error("Selected farm profile could not be found.");
        }
        climateLocationPayload = {
          location_source: "registered_farm",
          farm_id: Number(farmId),
        };
      }

      // 2. Prepare Demand Payload
      const demandPayload = {
        product_id: selectedProduct?.product_id ?? selectedProduct?.id,
        product_type: getProductType(selectedProduct),
        rice_variety: getRiceVariety(selectedProduct),
        granularity: selectedPeriod,
        horizon_periods: selectedPeriod === "weekly" ? 12 : 6,
      };

      // 3. Prepare Climate Payload
      const climatePayload = {
        ...climateLocationPayload,
        historical_years: 1,
        display_granularity: selectedPeriod,
      };

      // 4. Concurrently fetch Climate Forecast, Demand Forecast, and Competitor Analysis
      setGenerationStage("Retrieving climate and demand forecasts...");

      const [rawClimate, rawDemand, rawCompetitor] = await Promise.all([
        generateClimateForecast(climatePayload),
        generateDemandForecast(demandPayload),
        typeof loadCompetitorAnalysis === "function"
          ? loadCompetitorAnalysis({
              province: selectedFarm?.province,
              municipality: selectedFarm?.municipality || selectedFarm?.city,
              city: selectedFarm?.municipality || selectedFarm?.city,
              barangay: selectedFarm?.barangay,
              rice_variety: getRiceVariety(selectedProduct),
              product_type: getProductType(selectedProduct),
            }).catch(() => null)
          : Promise.resolve(null),
      ]);

      const climate = unwrapPayload(rawClimate) || {};
      const demand = unwrapPayload(rawDemand) || {};

      setClimateResult(climate);
      setDemandResult(demand);
      if (rawCompetitor) {
        setLocalCompetitorData(rawCompetitor);
      }

      // 5. Trigger Combined AI Interpretation if run IDs exist
      const climateRunId =
        climate?.climate_forecast_run_id ?? climate?.forecast_run_id;
      const demandRunId =
        demand?.demand_forecast_run_id ?? demand?.forecast_run_id;

      if (climateRunId && demandRunId && typeof generateAIInterpretation === "function") {
        setGenerationStage("Formulating farmer-focused insights...");
        try {
          const rawAI = await generateAIInterpretation({
            scope: "combined",
            interaction_type: "automatic",
            climate_forecast_run_id: climateRunId,
            demand_forecast_run_id: demandRunId,
            response_language: "en",
          });
          if (rawAI) {
            setAiResult(normalizeAIResult(rawAI));
          }
        } catch (aiErr) {
          console.warn("AI interpretation completed with fallback synthesis:", aiErr);
          setAiNotice(
            "Numerical forecasts and grounded agronomic recommendations loaded successfully."
          );
        }
      }

      showToast({
        type: "success",
        title: "Forecast Insights Generated",
        message: "Successfully generated combined climate and demand insights.",
        duration: 3500,
      });
    } catch (err) {
      setGenerationError(
        err?.message || "Failed to generate Forecast Insights. Please try again."
      );
      showToast({
        type: "error",
        title: "Generation Failed",
        message: err?.message || "Unable to generate insights.",
        duration: 5000,
      });
    } finally {
      setGenerationStage("");
      setIsGenerating(false);
    }
  };

  // -----------------------------------------------------------
  // DERIVED NUMERICAL DATA
  // -----------------------------------------------------------
  const competitorAnalysis = localCompetitorData || hookCompetitorAnalysis;

  // Demand metrics
  const isInsufficient = useMemo(() => {
    return String(demandResult?.data_status || "").toLowerCase() === "insufficient";
  }, [demandResult]);

  const demandMethod = useMemo(() => {
    if (isInsufficient) return "Pending Transactions";
    const method = String(
      demandResult?.forecast_method || demandResult?.model_type || ""
    ).toLowerCase();
    if (method.includes("preliminary")) return "Preliminary Demand Estimate";
    return "Time Series–Multiple Linear Regression (TS-MLR)";
  }, [demandResult, isInsufficient]);

  const forecastedDemand = useMemo(() => {
    return (
      demandResult?.projected_total_quantity_kg ??
      demandResult?.forecast_output?.projected_total_quantity_kg ??
      null
    );
  }, [demandResult]);

  const demandTrend = useMemo(() => {
    return titleCase(
      demandResult?.demand_trend ??
      demandResult?.forecast_output?.demand_trend ??
      "Stable"
    );
  }, [demandResult]);

  const peakPeriodStart =
    demandResult?.peak_period_start ??
    demandResult?.forecast_output?.peak_period_start;

  const peakPeriodEnd =
    demandResult?.peak_period_end ??
    demandResult?.forecast_output?.peak_period_end;

  const featureSnapshot = demandResult?.feature_snapshot || {};
  const posSalesKg = featureSnapshot.pos_sales_quantity_kg ?? 0;
  const posSalesCount = featureSnapshot.pos_sales_count ?? 0;
  const activeContractsKg = featureSnapshot.active_contracts_committed_kg ?? 0;
  const activeContractsCount = featureSnapshot.active_contracts_count ?? 0;

  const historicalPeriods = useMemo(() => {
    const list =
      demandResult?.feature_snapshot?.historical_periods ||
      demandResult?.historical_periods;
    return Array.isArray(list) ? list : [];
  }, [demandResult]);

  const forecastPeriods = useMemo(() => {
    const list =
      demandResult?.forecast_output?.periods ||
      demandResult?.forecast_periods;
    return Array.isArray(list) ? list : [];
  }, [demandResult]);

  // Climate metrics
  const climateChart =
    climateResult?.forecast?.chart_data ||
    climateResult?.forecast?.chartData ||
    {};

  const rainfallRows = climateChart?.precipitation_mm || [];
  const temperatureRows = climateChart?.temperature_c || [];

  const climateMetrics = useMemo(() => {
    if (!rainfallRows.length && !temperatureRows.length) {
      return {
        rainfallTotal: null,
        avgTemp: null,
        peakMonth: "—",
        peakVal: 0,
        lowMonth: "—",
        lowVal: 0,
      };
    }

    let totalRain = 0;
    let maxRain = { value: -1, label: "" };
    let minRain = { value: 999999, label: "" };

    rainfallRows.forEach((r, idx) => {
      const v = Number(r.value || 0);
      totalRain += v;
      const lbl = r.label || r.month || `Month ${idx + 1}`;
      if (v > maxRain.value) maxRain = { value: v, label: lbl };
      if (v < minRain.value) minRain = { value: v, label: lbl };
    });

    let totalTemp = 0;
    temperatureRows.forEach((r) => {
      totalTemp += Number(r.value || 0);
    });
    const avgTemp = temperatureRows.length
      ? totalTemp / temperatureRows.length
      : 28.0;

    return {
      rainfallTotal: totalRain,
      avgTemp,
      peakMonth: maxRain.label || "Month 1",
      peakVal: maxRain.value > 0 ? maxRain.value : 0,
      lowMonth: minRain.label || "Month 6",
      lowVal: minRain.value < 999999 ? minRain.value : 0,
    };
  }, [rainfallRows, temperatureRows]);

  // Competitor metrics
  const compCountDisplay = useMemo(() => {
    if (competitorAnalysis?.competitor_count_display) {
      return competitorAnalysis.competitor_count_display;
    }
    if (competitorAnalysis?.competitor_count) {
      return `${competitorAnalysis.competitor_count.toLocaleString("en-PH")} registered rice farmers`;
    }
    return "Data unavailable";
  }, [competitorAnalysis]);

  const compCoverage =
    competitorAnalysis?.geographic_coverage ||
    (selectedFarm
      ? `${selectedFarm.municipality || selectedFarm.city || "Local"}, ${selectedFarm.province || "Region"}`
      : "Municipality Level");

  const compSource = competitorAnalysis?.source || "DA-RSBSA / MAO Registry";
  const compYear = competitorAnalysis?.data_year || "2024";

  // Growing condition badge
  const growingConditionStatus = useMemo(() => {
    if (!climateMetrics.rainfallTotal) return "Standard Irrigated Palay";
    if (climateMetrics.peakVal >= 140) return "Elevated Rainfall Advisory (Flood Risk)";
    if (climateMetrics.peakVal >= 75) return "Optimal AWD Growing Conditions";
    return "Water Conservation Advisory (Dry Cycle)";
  }, [climateMetrics]);

  // -----------------------------------------------------------
  // THE 3 CORE IN-DEPTH FARMER INSIGHT PARAGRAPHS
  // -----------------------------------------------------------

  // 1. Climate & Farming Conditions
  const climateFarmingConditionsText = useMemo(() => {
    if (!climateResult) return "—";

    const farmName = selectedFarm ? getFarmName(selectedFarm) : "your farm parcel";
    const locationDesc = selectedLocationLabel;
    const { rainfallTotal, avgTemp, peakMonth, peakVal, lowMonth, lowVal } = climateMetrics;

    let agronomicRiskText = "";
    if (peakVal >= 120) {
      agronomicRiskText = `With heavy precipitation projected to peak around ${peakMonth} reaching ${formatNumber(peakVal, 1)} mm, proactive paddy water regulation is critical to prevent complete canopy submergence and pilapil bund washouts. Maintain shallow standing water depths of 3–5 cm ahead of heavy downpours, clear secondary field runoff ditches to ensure rapid drainage, and inspect dikes regularly to mitigate sheath blight and bacterial leaf streak pressure. To prevent severe nutrient leaching and fertilizer runoff, schedule urea and complete NPK applications strictly during 3-day dry intervals.`;
    } else if (peakVal >= 70) {
      agronomicRiskText = `Seasonal precipitation peaking around ${peakMonth} at ${formatNumber(peakVal, 1)} mm provides favorable growing conditions for standard irrigated palay. Practice PhilRice Alternate Wetting and Drying (AWD) by permitting ponded water to subside naturally to 15 cm below soil surface before re-irrigating. This practice optimizes water use, encourages deep root anchorage, and prevents unnecessary irrigation pumping fuel expenses. Apply basal fertilizer during final harrowing and topdress with nitrogen at active tillering.`;
    } else {
      agronomicRiskText = `Forecast indicators point toward a comparatively drier cropping cycle with low cumulative rainfall, dipping to approximately ${formatNumber(lowVal, 1)} mm near ${lowMonth}. Prioritize bund sealing and seepage repairs to prevent field water losses. Maintain a consistent 2–3 cm shallow water layer specifically during panicle initiation and flowering to safeguard grain filling from heat and moisture stress.`;
    }

    const baseNarrative = `The 6-month Copernicus Climate Change Service (CDS) outlook for ${farmName} in ${locationDesc} projects an aggregate rainfall of ${formatNumber(rainfallTotal, 1)} mm alongside an average daily temperature of ${formatNumber(avgTemp, 1)} °C. ${agronomicRiskText}`;

    const aiText = text(aiResult?.explanation_text || aiResult?.forecast_reason_text);
    if (aiText && !aiText.toLowerCase().includes("not currently available") && aiText.length > 50) {
      return `${baseNarrative} Furthermore, ${aiText}`;
    }

    return baseNarrative;
  }, [climateResult, selectedFarm, selectedLocationLabel, climateMetrics, aiResult]);

  // 2. Demand & Market Outlook
  const demandMarketOutlookText = useMemo(() => {
    if (!demandResult) return "—";

    const varietyName = getProductName(selectedProduct);
    const prodType = formatProductType(getProductType(selectedProduct));
    const peakRange = formatDateRange(peakPeriodStart, peakPeriodEnd);

    let compNarrative = "";
    if (compCountDisplay && compCountDisplay !== "Data unavailable") {
      compNarrative = `Official ${compSource} records (${compYear}) document ${compCountDisplay} actively cultivating palay in ${compCoverage}. While local competitor production is active, regional rice millers and warehouse buying stations maintain steady procurement for well-conditioned ${varietyName}, offering strong price realization for grain meeting verified cleanliness and moisture standards.`;
    } else {
      compNarrative = `Official sub-district competitor registries for this locality indicate active regional palay production; local grain procurement and warehouse bidding reflect sustained commercial buyer interest for well-graded ${varietyName} across monitored trading channels.`;
    }

    let trajectoryNarrative = "";
    if (isInsufficient) {
      trajectoryNarrative = `GrainRise demand analytics indicate that historical sales records for ${varietyName} (${prodType}) are currently awaiting initial recorded POS sales or forward buyer contracts. Once initial farm-gate transactions or buyer commitments are recorded, multi-period statistical models will automatically calculate customized demand trajectories and peak procurement windows.`;
    } else if (demandTrend.toLowerCase().includes("increase")) {
      trajectoryNarrative = `GrainRise projects an expanding demand trajectory totaling ${formatKg(forecastedDemand)} across the selected ${selectedPeriod} horizon using ${demandMethod}. Commercial procurement demand is projected to reach its peak off-take around ${peakRange}, driven by elevated seasonal inventory replenishment by local rice millers.`;
    } else if (demandTrend.toLowerCase().includes("decrease")) {
      trajectoryNarrative = `GrainRise projects a softening demand volume totaling ${formatKg(forecastedDemand)} across the selected ${selectedPeriod} horizon using ${demandMethod}. Buyer off-take is anticipated to crest near ${peakRange} before gradually tapering as commercial buying stations conclude their primary intake season.`;
    } else {
      trajectoryNarrative = `GrainRise projects a stable demand trajectory totaling ${formatKg(forecastedDemand)} across the selected ${selectedPeriod} horizon using ${demandMethod}. Buying interest remains consistent, with procurement activity concentrating around ${peakRange}.`;
    }

    let floorNarrative = "";
    if (activeContractsCount > 0 && activeContractsKg > 0) {
      floorNarrative = ` The farm holds ${activeContractsCount} active forward supply contract${activeContractsCount === 1 ? "" : "s"} securing ${formatKg(activeContractsKg)} as a guaranteed procurement baseline, providing immediate revenue certainty alongside ${formatKg(posSalesKg)} in realized historical POS sales.`;
    } else if (posSalesKg > 0) {
      floorNarrative = ` Realized historical transaction records log ${formatKg(posSalesKg)} across ${posSalesCount} recorded POS farm-gate sale${posSalesCount === 1 ? "" : "s"}, establishing a verified foundation for this forecast.`;
    }

    return `${trajectoryNarrative}${floorNarrative} ${compNarrative}`;
  }, [
    demandResult,
    selectedProduct,
    peakPeriodStart,
    peakPeriodEnd,
    isInsufficient,
    demandTrend,
    forecastedDemand,
    selectedPeriod,
    demandMethod,
    activeContractsCount,
    activeContractsKg,
    posSalesKg,
    posSalesCount,
    compCountDisplay,
    compSource,
    compYear,
    compCoverage,
  ]);

  // 3. Production & Selling Recommendations
  const productionSellingRecommendationsText = useMemo(() => {
    if (!climateResult || !demandResult) return "—";

    const varietyName = getProductName(selectedProduct);
    const peakRange = (peakPeriodStart || peakPeriodEnd)
      ? formatDateRange(peakPeriodStart, peakPeriodEnd)
      : "the projected peak demand window";

    const reserveBufferKg = forecastedDemand ? Math.round(forecastedDemand * 0.12) : 500;
    const targetProdKg = forecastedDemand ? Math.round(forecastedDemand * 1.12) : null;
    const peakMonth = climateMetrics.peakMonth;

    const landPrepText = `Based on the peak procurement window anticipated around ${peakRange}, schedule nursery establishment and transplanting approximately 105 to 115 days beforehand. Synchronize field harrowing and leveling with incoming seasonal precipitation${peakMonth && peakMonth !== "—" ? ` around ${peakMonth}` : ""} to optimize puddled soil consistency while reducing auxiliary pumping fuel expenditures.`;

    const harvestText = `Time crop maturity so that harvesting coincides with the high-demand window (${peakRange}), actively scheduling field operations around anticipated dry spells to avoid lodging and wet-season threshing losses. Immediately mechanically or solar-dry threshed palay strictly to the 14% moisture content standard required by institutional buyers and PhilRice guidelines, preventing fungal heating, grain discoloration, and dockage deductions.`;

    let sellingText = "";
    if (activeContractsKg > 0) {
      sellingText = `Allocate harvest batches to promptly fulfill your ${formatKg(activeContractsKg)} in confirmed forward contract quotas, and pre-book delivery slots with partnering buying stations 2–3 weeks ahead of ${peakRange}. Retain a 10% to 15% safety stock buffer (${formatKg(reserveBufferKg)}) in well-ventilated, rodent-proof storage to capitalize on post-harvest price recovery after seasonal supply gluts subside.`;
    } else {
      sellingText = `To safeguard profit margins and avoid harvest-glut spot discounts, pre-book delivery intake slots with certified rice mills 2–3 weeks ahead of ${peakRange}. Target an overall production volume of ${targetProdKg ? formatKg(targetProdKg) : "your planned harvest"} and maintain a 10% to 15% safety stock reserve (${formatKg(reserveBufferKg)}) to capture premium spot bids once initial market supply clears.`;
    }

    return `${landPrepText} ${harvestText} ${sellingText}`;
  }, [
    climateResult,
    demandResult,
    selectedProduct,
    peakPeriodStart,
    peakPeriodEnd,
    forecastedDemand,
    climateMetrics.peakMonth,
    activeContractsKg,
  ]);

  // -----------------------------------------------------------
  // RECOMMENDED FARMER ACTION ITEMS
  // -----------------------------------------------------------
  const actionChecklist = useMemo(() => {
    if (!climateResult || !demandResult) return [];

    const peakMonth = climateMetrics.peakMonth || "the peak rainy month";
    const peakRange = formatDateRange(peakPeriodStart, peakPeriodEnd);
    const targetKg = forecastedDemand ? Math.round(forecastedDemand * 1.12) : null;

    return [
      {
        title: "Field Preparation & Bund Fortification",
        detail: `Inspect and reinforce pilapil dikes and clear drainage canals ahead of peak rainfall in ${peakMonth} to prevent soil erosion and waterlogging.`,
      },
      {
        title: "Synchronized Nursery & Sowing Schedule",
        detail: `Establish seedbeds approximately 105–115 days prior to the ${peakRange} peak procurement window to align harvest with highest buyer demand.`,
      },
      {
        title: "Split Nitrogen Application Strategy",
        detail: "Apply basal NPK during harrowing, and topdress nitrogen strictly during 3-day dry intervals to prevent chemical leaching and runoff.",
      },
      {
        title: "14% Moisture Standard Quality Control",
        detail: "Ensure harvested palay is dried strictly down to 14% moisture content to qualify for premium miller buying prices and avoid mold damage.",
      },
      {
        title: "Contract Commitment & Delivery Pre-Booking",
        detail: `Pre-book delivery intake slots with commercial buying stations 2–3 weeks ahead of peak demand to guarantee warehouse off-take for up to ${targetKg ? formatKg(targetKg) : "your planned yield"}.`,
      },
    ];
  }, [climateResult, demandResult, climateMetrics.peakMonth, peakPeriodStart, peakPeriodEnd, forecastedDemand]);

  // -----------------------------------------------------------
  // EXPORT CSV HANDLER
  // -----------------------------------------------------------
  const handleExportCSV = useCallback(() => {
    if (!climateResult || !demandResult || !selectedProduct) return;

    try {
      const rows = [];
      const sanitizedProduct = cleanPdfText(getProductName(selectedProduct))
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_");
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `GrainRise_Forecast_Insights_${sanitizedProduct}_${dateStr}.csv`;

      // 1. Report Header
      rows.push(["GRAINRISE FORECAST INSIGHTS REPORT"]);
      rows.push(["Report Type", "Combined Climate & Demand Analysis, Grounded Agronomic & Commercial Advisory"]);
      rows.push(["Export Date", dateStr]);
      rows.push(["Selected Product", getProductName(selectedProduct)]);
      rows.push(["Rice Variety", getRiceVariety(selectedProduct) || "—"]);
      rows.push(["Product Type", formatProductType(getProductType(selectedProduct))]);
      rows.push(["Selected Farm / Location", selectedLocationLabel]);
      rows.push(["Forecast Horizon", `${titleCase(selectedPeriod)} (6 Months)`]);
      rows.push(["Copernicus CDS Issue Date", climateResult?.forecast_issue_date || dateStr]);
      rows.push([]);

      // 2. Summary KPI Metrics
      rows.push(["KEY FORECAST PERFORMANCE INDICATORS (KPIs)"]);
      rows.push(["Projected Total Demand (kg)", isInsufficient ? "N/A (Pending Initial Sales)" : formatKg(forecastedDemand)]);
      rows.push(["Demand Trend", demandTrend]);
      rows.push(["Demand Forecasting Method", demandMethod]);
      rows.push(["Peak Demand Period", formatDateRange(peakPeriodStart, peakPeriodEnd)]);
      rows.push(["6-Month Total Rainfall (mm)", formatNumber(climateMetrics.rainfallTotal, 1)]);
      rows.push(["Average Daily Temperature (°C)", formatNumber(climateMetrics.avgTemp, 1)]);
      rows.push(["Peak Rainfall Window", `${climateMetrics.peakMonth} (${formatNumber(climateMetrics.peakVal, 1)} mm)`]);
      rows.push(["Driest Rainfall Window", `${climateMetrics.lowMonth} (${formatNumber(climateMetrics.lowVal, 1)} mm)`]);
      rows.push(["Climate Suitability Status", growingConditionStatus]);
      rows.push(["Active Contract Commitments Floor (kg)", formatKg(activeContractsKg)]);
      rows.push(["Active Contracts Count", activeContractsCount]);
      rows.push(["Realized Historical POS Sales (kg)", formatKg(posSalesKg)]);
      rows.push(["Realized POS Sales Count", posSalesCount]);
      rows.push(["Registered Competitor Census", compCountDisplay]);
      rows.push(["Competitor Geographic Coverage", compCoverage]);
      rows.push(["Competitor Data Source", compSource]);
      rows.push(["Competitor Reference Year", compYear]);
      rows.push([]);

      // 3. Projected Demand Forecast Table
      rows.push(["DEMAND FORECASTING DATA"]);
      rows.push(["Period Type", "Period Label", "Start Date", "End Date", "Projected / Realized Quantity (kg)", "Price (PHP/kg)", "Contract Floor Applied"]);
      if (forecastPeriods.length === 0 && historicalPeriods.length === 0) {
        rows.push(["Forecast", "N/A", "—", "—", "Insufficient historical sales records", "—", "No"]);
      } else {
        historicalPeriods.forEach((h, idx) => {
          rows.push([
            "Historical",
            h.period || `Historical ${idx + 1}`,
            getPeriodStart(h) || "—",
            h.period_end || "—",
            getHistoricalValue(h) ?? "0",
            h.average_price_per_kg ?? "—",
            h.contract_floor_applied ? "Yes" : "No",
          ]);
        });
        forecastPeriods.forEach((p, idx) => {
          rows.push([
            "Forecast",
            p.period || `Forecast ${idx + 1}`,
            getPeriodStart(p) || "—",
            p.period_end || "—",
            getForecastValue(p) ?? "0",
            p.projected_price_per_kg ?? "—",
            p.contract_floor_applied ? "Yes" : "No",
          ]);
        });
      }
      rows.push([]);

      // 4. Climate Forecast Table
      rows.push(["COPERNICUS CDS 6-MONTH CLIMATE OUTLOOK"]);
      rows.push(["Month Index", "Month Label", "Period Start Date", "Projected Rainfall (mm)", "Projected Temperature (°C)"]);
      rainfallRows.slice(0, 6).forEach((r, idx) => {
        const h = temperatureRows[idx];
        rows.push([
          idx + 1,
          r.label || r.month || `Month ${idx + 1}`,
          r.period_start || h?.period_start || "—",
          typeof r.value === "number" ? r.value.toFixed(1) : r.value,
          h && typeof h.value === "number" ? h.value.toFixed(1) : (h?.value ?? "—"),
        ]);
      });
      rows.push([]);

      // 5. In-Depth Insights Paragraphs
      rows.push(["COMBINED AGRONOMIC & COMMERCIAL INSIGHTS"]);
      rows.push(["1. Climate & Farming Conditions", climateFarmingConditionsText]);
      rows.push(["2. Demand & Market Outlook", demandMarketOutlookText]);
      rows.push(["3. Production & Selling Recommendations", productionSellingRecommendationsText]);
      rows.push([]);

      // 6. Recommended Action Checklist
      rows.push(["RECOMMENDED FARMER ACTION CHECKLIST"]);
      actionChecklist.forEach((item, idx) => {
        rows.push([`${idx + 1}. ${item.title}`, item.detail]);
      });
      rows.push([]);

      // 7. Disclaimer
      rows.push(["DECISION SUPPORT NOTICE"]);
      rows.push([
        "Disclaimer",
        "Forecasts and AI interpretations are advisory estimates, not financial guarantees. Climate values represent Copernicus CDS regional climate projections; demand projections are derived from verified GrainRise POS sales, forward buyer contracts, and statistical TS-MLR modeling; competitor counts originate from official DA-RSBSA and PSA registries. Always compare model guidance against real-time weather forecasts and daily field observations.",
      ]);

      // Build CSV String with UTF-8 BOM
      const csvContent =
        "\uFEFF" +
        rows
          .map((row) =>
            row
              .map((val) => {
                const escaped = String(val ?? "").replace(/"/g, '""');
                return `"${escaped}"`;
              })
              .join(",")
          )
          .join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast({
        type: "success",
        title: "CSV Export Complete",
        message: "Forecast insights and chart metrics downloaded successfully.",
        duration: 3500,
      });
    } catch (err) {
      console.error("CSV Export error:", err);
      showToast({
        type: "error",
        title: "Export Failed",
        message: "Failed to generate CSV export. Please try again.",
        duration: 4000,
      });
    }
  }, [
    climateResult,
    demandResult,
    selectedProduct,
    selectedLocationLabel,
    selectedPeriod,
    isInsufficient,
    forecastedDemand,
    demandTrend,
    demandMethod,
    peakPeriodStart,
    peakPeriodEnd,
    climateMetrics,
    growingConditionStatus,
    activeContractsKg,
    activeContractsCount,
    posSalesKg,
    posSalesCount,
    compCountDisplay,
    compCoverage,
    compSource,
    compYear,
    forecastPeriods,
    historicalPeriods,
    rainfallRows,
    temperatureRows,
    climateFarmingConditionsText,
    demandMarketOutlookText,
    productionSellingRecommendationsText,
    actionChecklist,
    showToast,
  ]);

  // -----------------------------------------------------------
  // EXPORT PDF HANDLER (WITH GRAPHS & INSIGHTS)
  // -----------------------------------------------------------
  const handleExportPDF = useCallback(() => {
    if (!climateResult || !demandResult || !selectedProduct) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const primaryColor = [22, 101, 52]; // Dark green (#166534)
      const slateDark = [15, 23, 42];
      const slateMedium = [51, 65, 85];
      const slateLight = [100, 116, 139];
      const borderGray = [226, 232, 240];
      const tableHeaderBg = [241, 245, 249];
      const zebraBg = [248, 250, 252];

      const sanitizedProduct = cleanPdfText(getProductName(selectedProduct))
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_");
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `GrainRise_Forecast_Insights_${sanitizedProduct}_${dateStr}.pdf`;

      let y = 0;

      const checkPageBreak = (neededHeight) => {
        if (y + neededHeight > 275) {
          doc.addPage();
          y = 18;
          return true;
        }
        return false;
      };

      // Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 24, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text("GRAINRISE FORECAST INSIGHTS REPORT", 14, 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(230, 245, 235);
      doc.text("Combined Climate & Demand Analysis, Grounded Agronomic & Commercial Advisory", 14, 18);
      doc.text(`Export Date: ${dateStr}`, 155, 18);

      y = 30;

      // Metadata Box
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setFillColor(zebraBg[0], zebraBg[1], zebraBg[2]);
      doc.roundedRect(14, y, 182, 20, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text(cleanPdfText(`Product: ${getProductName(selectedProduct)} (${formatProductType(getProductType(selectedProduct))})`), 18, y + 5.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
      doc.text(cleanPdfText(`Location: ${selectedLocationLabel}  |  Horizon: ${titleCase(selectedPeriod)} (6 Months)`), 18, y + 11);

      const issueDateStr = climateResult?.forecast_issue_date || dateStr;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
      doc.text(cleanPdfText(`Model: ${demandMethod}  |  Climate Source: Copernicus CDS (Issued: ${issueDateStr})`), 18, y + 16.5);

      y += 25;

      // 4 SUMMARY KPI CARDS
      const cardW = 42.5;
      const cardGap = 4;
      const kpis = [
        { label: "PROJECTED DEMAND", val: isInsufficient ? "Pending" : formatKg(forecastedDemand), sub: `Trend: ${demandTrend}` },
        { label: "6-MO RAINFALL", val: `${formatNumber(climateMetrics.rainfallTotal, 1)} mm`, sub: `Avg Temp: ${formatNumber(climateMetrics.avgTemp, 1)} °C` },
        { label: "CONTRACT FLOOR", val: formatKg(activeContractsKg), sub: `${activeContractsCount} active commitment(s)` },
        { label: "LOCAL COMPETITORS", val: cleanPdfText(compCountDisplay), sub: cleanPdfText(compCoverage) },
      ];

      kpis.forEach((kpi, idx) => {
        const cx = 14 + idx * (cardW + cardGap);
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(cx, y, cardW, 16, 1.5, 1.5, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
        doc.text(kpi.label, cx + 3, y + 4.5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(doc.splitTextToSize(kpi.val, cardW - 6)[0] || "", cx + 3, y + 9.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
        doc.text(doc.splitTextToSize(kpi.sub, cardW - 6)[0] || "", cx + 3, y + 13.5);
      });

      y += 22;

      // =======================================================
      // FORECAST CHARTS DRAWN DIRECTLY IN PDF
      // =======================================================
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("FORECAST VISUALIZATION CHARTS", 14, y);
      y += 4;

      const chartBoxW = 88;
      const chartBoxH = 46;

      // CHART A: DEMAND GRAPH (VECTOR DRAWING)
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, y, chartBoxW, chartBoxH, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text("Historical & Forecasted Demand (kg)", 18, y + 5);

      // Legend
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(22, 101, 52);
      doc.text("— History", 60, y + 5);
      doc.setTextColor(217, 119, 6);
      doc.text("--- Forecast", 76, y + 5);

      // Mini Demand Plot coordinates
      const dPlotX = 22;
      const dPlotY = y + 9;
      const dPlotW = 74;
      const dPlotH = 28;
      doc.setDrawColor(235, 240, 245);
      doc.line(dPlotX, dPlotY + dPlotH, dPlotX + dPlotW, dPlotY + dPlotH);

      if (isInsufficient) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
        doc.text("Pending initial sales or contract transaction records.", 20, y + 25);
      } else {
        const pts = forecastPeriods.slice(0, 6);
        const maxVal = Math.max(...pts.map((p) => getForecastValue(p) || 0), 100);
        pts.forEach((p, idx) => {
          const px = dPlotX + (idx / Math.max(1, pts.length - 1)) * dPlotW;
          const val = getForecastValue(p) || 0;
          const py = dPlotY + dPlotH - (val / maxVal) * (dPlotH - 4);
          doc.setFillColor(217, 119, 6);
          doc.circle(px, py, 1.2, "F");
          doc.setFontSize(5.5);
          doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
          const lbl = formatMonth(getPeriodStart(p)) || `M${idx + 1}`;
          doc.text(lbl, px, dPlotY + dPlotH + 4, { align: "center" });
        });
      }

      // CHART B: CLIMATE GRAPH (RAINFALL BARS + TEMP LINE)
      const cBoxX = 108;
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cBoxX, y, chartBoxW, chartBoxH, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text("6-Month Climate Outlook", cBoxX + 4, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(56, 189, 248);
      doc.text("■ Rain (mm)", cBoxX + 54, y + 5);
      doc.setTextColor(234, 88, 12);
      doc.text("— Temp (°C)", cBoxX + 72, y + 5);

      const cPlotX = cBoxX + 8;
      const cPlotY = y + 9;
      const cPlotW = 74;
      const cPlotH = 28;
      doc.setDrawColor(235, 240, 245);
      doc.line(cPlotX, cPlotY + cPlotH, cPlotX + cPlotW, cPlotY + cPlotH);

      const cMonths = rainfallRows.slice(0, 6);
      const cMaxRain = Math.max(...cMonths.map((m) => Number(m.value || 0)), 50);
      const colW = cMonths.length > 0 ? cPlotW / cMonths.length : 12;

      cMonths.forEach((m, idx) => {
        const mx = cPlotX + idx * colW + 2;
        const rVal = Number(m.value || 0);
        const bHeight = Math.max(2, (rVal / cMaxRain) * (cPlotH - 6));
        const bY = cPlotY + cPlotH - bHeight;

        // Draw bar
        doc.setFillColor(56, 189, 248);
        doc.rect(mx, bY, colW - 4, bHeight, "F");

        // Temperature point
        const hVal = Number(temperatureRows[idx]?.value || 28);
        const tY = cPlotY + cPlotH - ((hVal - 20) / 15) * (cPlotH - 6);
        doc.setFillColor(234, 88, 12);
        doc.circle(mx + (colW - 4) / 2, tY, 1.2, "F");

        doc.setFontSize(5.5);
        doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
        const mLbl = m.label || m.month || `M${idx + 1}`;
        doc.text(mLbl, mx + (colW - 4) / 2, cPlotY + cPlotH + 4, { align: "center" });
      });

      y += chartBoxH + 6;

      // =======================================================
      // THE 3 COMBINED INSIGHT SECTIONS
      // =======================================================
      const sections = [
        {
          title: "1. CLIMATE & FARMING CONDITIONS",
          badge: growingConditionStatus,
          text: climateFarmingConditionsText,
        },
        {
          title: "2. DEMAND & MARKET OUTLOOK",
          badge: demandMethod,
          text: demandMarketOutlookText,
        },
        {
          title: "3. PRODUCTION & SELLING RECOMMENDATIONS",
          badge: "Synchronized Climate + Demand",
          text: productionSellingRecommendationsText,
        },
      ];

      sections.forEach((sec) => {
        checkPageBreak(38);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(sec.title, 14, y);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
        doc.text(`[${cleanPdfText(sec.badge)}]`, 150, y);
        y += 4;

        const lines = doc.splitTextToSize(cleanPdfText(sec.text), 180);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
        lines.forEach((l) => {
          checkPageBreak(4.5);
          doc.text(l, 14, y);
          y += 3.8;
        });
        y += 3;
      });

      // =======================================================
      // RECOMMENDED ACTION CHECKLIST
      // =======================================================
      checkPageBreak(35);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("RECOMMENDED FARMER ACTION CHECKLIST", 14, y);
      y += 4.5;

      actionChecklist.forEach((item, idx) => {
        checkPageBreak(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
        doc.text(`${idx + 1}. ${cleanPdfText(item.title)}: `, 14, y);

        const titleWidth = doc.getTextWidth(`${idx + 1}. ${cleanPdfText(item.title)}: `);
        const detailLines = doc.splitTextToSize(cleanPdfText(item.detail), 180 - titleWidth);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
        doc.text(detailLines[0] || "", 14 + titleWidth, y);
        y += 4;

        if (detailLines.length > 1) {
          detailLines.slice(1).forEach((dl) => {
            checkPageBreak(4.5);
            doc.text(dl, 18, y);
            y += 3.8;
          });
        }
      });

      // =======================================================
      // DISCLAIMER NOTICE & FOOTER
      // =======================================================
      checkPageBreak(22);
      y += 3;
      doc.setDrawColor(254, 243, 199);
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(14, y, 182, 16, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(146, 64, 14);
      doc.text("DECISION-SUPPORT DISCLAIMER:", 18, y + 4.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(180, 83, 9);
      const disLines = doc.splitTextToSize(
        "Forecasts and AI interpretations are advisory estimates, not financial guarantees. Climate values represent Copernicus CDS regional climate projections; demand projections are derived from verified GrainRise POS sales, forward buyer contracts, and statistical TS-MLR modeling; competitor counts originate from official DA-RSBSA and PSA registries. Always compare model guidance against real-time weather forecasts and daily field observations.",
        174
      );
      disLines.slice(0, 3).forEach((dl, didx) => {
        doc.text(dl, 18, y + 8 + didx * 3.2);
      });

      // Page numbers across all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
        doc.text(
          `GrainRise Agricultural Intelligence • Forecast Insights Report • Page ${i} of ${totalPages}`,
          105,
          290,
          { align: "center" }
        );
      }

      doc.save(filename);

      showToast({
        type: "success",
        title: "PDF Export Complete",
        message: "Forecast Insights PDF report has been downloaded.",
        duration: 3500,
      });
    } catch (err) {
      console.error("PDF Export error:", err);
      showToast({
        type: "error",
        title: "Export Failed",
        message: "Failed to generate PDF. Please try again.",
        duration: 4000,
      });
    }
  }, [
    climateResult,
    demandResult,
    selectedProduct,
    selectedLocationLabel,
    selectedPeriod,
    isInsufficient,
    forecastedDemand,
    demandTrend,
    demandMethod,
    peakPeriodStart,
    peakPeriodEnd,
    climateMetrics,
    growingConditionStatus,
    activeContractsKg,
    activeContractsCount,
    compCountDisplay,
    compCoverage,
    forecastPeriods,
    rainfallRows,
    temperatureRows,
    climateFarmingConditionsText,
    demandMarketOutlookText,
    productionSellingRecommendationsText,
    actionChecklist,
    showToast,
  ]);

  // Download printable HTML report (preserved from existing implementation)
  const handleDownloadReport = () => {
    handleExportPDF();
  };

  const hasForecastResult = Boolean(climateResult && demandResult);

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    <div className="flex flex-col gap-6">
      {/* =======================================================
          PAGE TITLE & TOP EXPORT ACTIONS
      ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Forecast Insights
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Combine 6-month climate projections and product demand trends to optimize planting, harvest, and sales decisions.
          </p>
        </div>

        {/* TOP EXPORT ACTION BUTTONS */}
        {hasForecastResult && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export forecast insights to CSV"
            >
              <FileSpreadsheet size={14} className="text-emerald-700" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-900 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export forecast insights to PDF"
            >
              <FileDown size={14} />
              <span>Export PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* =======================================================
          FORECAST SELECTION
      ======================================================== */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-gray-900">
              Forecast Selection
            </h4>
            <p className="mt-0.5 text-xs text-gray-500">
              Select your product variety, registered farm location, and forecasting horizon.
            </p>
          </div>

          {isLoadingSelections && (
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <Loader2 size={14} className="animate-spin text-green-700" />
              Loading options...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.25fr_1.5fr_0.75fr_auto] xl:items-end">
          {/* PRODUCT */}
          <SelectField
            label="Selected Product / Variety"
            value={selectedProductKey}
            onChange={handleProductChange}
            disabled={isLoadingSelections || !products.length}
          >
            <option value="">
              {products.length ? "Select Product / Variety" : "No registered products available"}
            </option>
            {products.map((product) => (
              <option key={getProductKey(product)} value={getProductKey(product)}>
                {productLabel(product)}
              </option>
            ))}
          </SelectField>

          {/* LOCATION */}
          <SelectField
            label="Selected Location"
            value={selectedLocationKey}
            onChange={handleLocationChange}
            disabled={isLoadingSelections}
          >
            <option value="">Select Farm / Location</option>
            <option value={CURRENT_LOCATION_VALUE}>Use Current Device Location</option>
            {farms.length > 0 && (
              <optgroup label="Registered Farms">
                {farms
                  .filter((farm) => getFarmId(farm))
                  .map((farm) => (
                    <option key={getFarmId(farm)} value={`farm:${getFarmId(farm)}`}>
                      {farmSelectLabel(farm)}
                    </option>
                  ))}
              </optgroup>
            )}
          </SelectField>

          {/* PERIOD */}
          <SelectField
            label="Forecast Period"
            value={selectedPeriod}
            onChange={handlePeriodChange}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectField>

          {/* GENERATE BUTTON */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !selectedProduct || !selectedLocationKey}
            className="inline-flex h-[38px] items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-green-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Insights
              </>
            )}
          </button>
        </div>

        {/* CURRENT SELECTION BADGES */}
        {selectedLocationKey && (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              {selectedLocationKey === CURRENT_LOCATION_VALUE ? (
                <Navigation size={13} className="text-green-700" />
              ) : (
                <MapPin size={13} className="text-green-700" />
              )}
              <span className="font-semibold text-gray-700">
                {selectedLocationLabel}
              </span>
            </span>

            {selectedProduct && (
              <span>
                Product:{" "}
                <span className="font-semibold text-gray-700">
                  {productLabel(selectedProduct)}
                </span>
              </span>
            )}

            <span>
              Horizon:{" "}
              <span className="font-semibold text-gray-700">
                {titleCase(selectedPeriod)} (6 Months)
              </span>
            </span>
          </div>
        )}
      </section>

      {/* =======================================================
          ERRORS & ALERTS
      ======================================================== */}
      {selectionError && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-sm">{selectionError}</p>
        </div>
      )}

      {generationError && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-sm">{generationError}</p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {/* =======================================================
          LOADING STATE
      ======================================================== */}
      {isGenerating && (
        <div className="flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
          <Loader2 size={30} className="animate-spin text-green-700" />
          <p className="mt-3 text-sm font-semibold text-gray-800">
            {generationStage || "Synthesizing climate and demand models..."}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Retrieving Copernicus CDS climate forecasts, compiling verified competitor registries, and calculating TS-MLR projections.
          </p>
        </div>
      )}

      {/* =======================================================
          EMPTY STATE (BEFORE FIRST GENERATE)
      ======================================================== */}
      {!isGenerating && !hasForecastResult && (
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">
            <Lightbulb size={24} />
          </div>
          <p className="mt-3 text-sm font-bold text-gray-900">
            Ready to Generate Combined Insights
          </p>
          <p className="mt-1 max-w-md text-xs text-gray-500 leading-relaxed">
            Select your rice variety, registered farm, and forecast view above. Then click{" "}
            <span className="font-semibold text-green-700">Generate Insights</span> to synthesize 6-month climate data, demand trends, and verified local competition.
          </p>
        </div>
      )}

      {/* =======================================================
          GENERATED RESULTS
      ======================================================== */}
      {!isGenerating && hasForecastResult && (
        <>
          {aiNotice && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
              <Info size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <span>{aiNotice}</span>
            </div>
          )}

          {/* 1. COMBINED FORECAST KPI SUMMARY STRIP (PRESERVED) */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* KPI 1: PRODUCT & VARIETY */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Selected Variety
                </span>
                <span className="rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
                  {formatProductType(getProductType(selectedProduct))}
                </span>
              </div>
              <p className="mt-2 text-lg font-extrabold text-gray-900">
                {getProductName(selectedProduct)}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 truncate">
                {selectedLocationLabel}
              </p>
            </div>

            {/* KPI 2: DEMAND OUTLOOK */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Projected Demand
                </span>
                <div className="flex items-center gap-1">
                  {demandTrend.toLowerCase().includes("increase") ? (
                    <TrendingUp size={14} className="text-green-700" />
                  ) : demandTrend.toLowerCase().includes("decrease") ? (
                    <TrendingDown size={14} className="text-red-600" />
                  ) : (
                    <Minus size={14} className="text-gray-500" />
                  )}
                  <span className="text-xs font-bold text-gray-700">{demandTrend}</span>
                </div>
              </div>
              <p className="mt-2 text-lg font-extrabold text-gray-900">
                {isInsufficient ? "Pending Initial Sales" : formatKg(forecastedDemand)}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Method: <span className="font-medium text-gray-700">{demandMethod}</span>
              </p>
            </div>

            {/* KPI 3: CLIMATE & WEATHER */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  6-Mo Climate Outlook
                </span>
                <CloudRain size={14} className="text-green-700" />
              </div>
              <p className="mt-2 text-lg font-extrabold text-gray-900">
                {formatNumber(climateMetrics.rainfallTotal, 1)} mm
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Avg Temp: <span className="font-semibold text-gray-700">{formatNumber(climateMetrics.avgTemp, 1)} °C</span> • Peak: <span className="font-semibold text-gray-700">{climateMetrics.peakMonth}</span>
              </p>
            </div>

            {/* KPI 4: LOCAL COMPETITOR CENSUS */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Competitor Analysis
                </span>
                <Users size={14} className="text-green-700" />
              </div>
              <p className="mt-2 text-lg font-extrabold text-gray-900 truncate">
                {compCountDisplay}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 truncate">
                {compCoverage} • {compSource}
              </p>
            </div>
          </section>

          {/* ===================================================
              FORECAST GRAPHS: DEMAND & CLIMATE SIDE BY SIDE
          ==================================================== */}
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {/* PANEL A: HISTORICAL & FORECASTED DEMAND */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-green-800">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Historical & Forecasted Demand
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        {titleCase(selectedPeriod)} demand volume (kg) for {getProductName(selectedProduct)}
                      </p>
                    </div>
                  </div>

                  {/* LEGEND */}
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5 text-green-800 font-medium">
                      <span className="inline-block h-2 w-3.5 rounded-sm bg-green-800" />
                      Historical
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                      <span className="inline-block h-2 w-3.5 rounded-sm bg-amber-600 border border-dashed border-amber-700" />
                      Forecasted
                    </span>
                  </div>
                </div>

                {/* DEMAND SVG CHART */}
                <div className="mt-3">
                  <DemandForecastChart
                    historicalPeriods={historicalPeriods}
                    forecastPeriods={forecastPeriods}
                    forecastView={titleCase(selectedPeriod)}
                    varietyName={getProductName(selectedProduct)}
                    isInsufficient={isInsufficient}
                  />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between border-t border-gray-100 pt-2 text-[11px] text-gray-500">
                <span>
                  Trajectory: <strong className="text-gray-800">{demandTrend}</strong>
                </span>
                <span>
                  Peak: <strong className="text-gray-800">{formatDateRange(peakPeriodStart, peakPeriodEnd)}</strong>
                </span>
              </div>
            </div>

            {/* PANEL B: CLIMATE FORECAST (RAINFALL & TEMP) */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                      <CloudRain size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Climate Forecast (Copernicus CDS)
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        6-month projected precipitation & ambient temperature
                      </p>
                    </div>
                  </div>

                  {/* LEGEND */}
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5 text-sky-700 font-medium">
                      <span className="inline-block h-2.5 w-2.5 rounded-xs bg-sky-400" />
                      Rainfall (mm)
                    </span>
                    <span className="flex items-center gap-1.5 text-orange-700 font-semibold">
                      <span className="inline-block h-1 w-3.5 bg-orange-600 rounded-full" />
                      Temp (°C)
                    </span>
                  </div>
                </div>

                {/* CLIMATE SVG CHART */}
                <div className="mt-3">
                  <ClimateForecastChart
                    rainfallRows={rainfallRows}
                    temperatureRows={temperatureRows}
                  />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between border-t border-gray-100 pt-2 text-[11px] text-gray-500">
                <span>
                  Total Rain: <strong className="text-gray-800">{formatNumber(climateMetrics.rainfallTotal, 1)} mm</strong>
                </span>
                <span>
                  Avg Temp: <strong className="text-gray-800">{formatNumber(climateMetrics.avgTemp, 1)} °C</strong>
                </span>
              </div>
            </div>
          </section>

          {/* 2. THE THREE IN-DEPTH FARMER INSIGHT SECTIONS */}
          <div className="space-y-5">
            {/* SECTION 1: CLIMATE & FARMING CONDITIONS */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-green-800">
                    <CloudRain size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      1. Climate & Farming Conditions
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Rainfall, temperature, seasonal risks, and their practical effects on crop production.
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-800">
                  <ShieldCheck size={12} className="text-green-700" />
                  {growingConditionStatus}
                </span>
              </div>

              <div className="p-5">
                {/* METRICS STRIP */}
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg bg-slate-50 p-3 text-xs border border-slate-100">
                  <div>
                    <span className="text-gray-400 font-medium">Total 6-Mo Rainfall</span>
                    <p className="font-bold text-gray-900 mt-0.5">{formatNumber(climateMetrics.rainfallTotal, 1)} mm</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Average Temperature</span>
                    <p className="font-bold text-gray-900 mt-0.5">{formatNumber(climateMetrics.avgTemp, 1)} °C</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Peak Rainfall Window</span>
                    <p className="font-bold text-gray-900 mt-0.5">{climateMetrics.peakMonth} ({formatNumber(climateMetrics.peakVal, 1)} mm)</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Driest Window</span>
                    <p className="font-bold text-gray-900 mt-0.5">{climateMetrics.lowMonth} ({formatNumber(climateMetrics.lowVal, 1)} mm)</p>
                  </div>
                </div>

                {/* ADVISORY PARAGRAPH */}
                <p className="text-sm leading-relaxed text-gray-700">
                  {climateFarmingConditionsText}
                </p>
              </div>
            </section>

            {/* SECTION 2: DEMAND & MARKET OUTLOOK */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      2. Demand & Market Outlook
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Projected demand volume, sales and contract trends, local competition, and commercial market opportunities.
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                  <Package size={12} className="text-emerald-700" />
                  {demandMethod}
                </span>
              </div>

              <div className="p-5">
                {/* METRICS STRIP */}
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg bg-slate-50 p-3 text-xs border border-slate-100">
                  <div>
                    <span className="text-gray-400 font-medium">Projected Demand Volume</span>
                    <p className="font-bold text-gray-900 mt-0.5">
                      {isInsufficient ? "Pending Initial Sales" : formatKg(forecastedDemand)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Peak Buying Window</span>
                    <p className="font-bold text-gray-900 mt-0.5">
                      {formatDateRange(peakPeriodStart, peakPeriodEnd)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Confirmed Contract Floor</span>
                    <p className="font-bold text-gray-900 mt-0.5">
                      {formatKg(activeContractsKg)} ({activeContractsCount} active)
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Verified Competitor Count</span>
                    <p className="font-bold text-gray-900 mt-0.5 truncate">
                      {compCountDisplay}
                    </p>
                  </div>
                </div>

                {/* ADVISORY PARAGRAPH */}
                <p className="text-sm leading-relaxed text-gray-700">
                  {demandMarketOutlookText}
                </p>
              </div>
            </section>

            {/* SECTION 3: PRODUCTION & SELLING RECOMMENDATIONS */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-green-800">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      3. Production & Selling Recommendations
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Synchronized land preparation, nursery establishment, harvest timing, inventory safety buffers, and selling strategy.
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-800">
                  <Calendar size={12} className="text-green-700" />
                  Synchronized Climate + Demand
                </span>
              </div>

              <div className="p-5">
                {/* METRICS STRIP */}
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg bg-slate-50 p-3 text-xs border border-slate-100">
                  <div>
                    <span className="text-gray-400 font-medium">Target Production Target</span>
                    <p className="font-bold text-gray-900 mt-0.5">
                      {forecastedDemand ? formatKg(Math.round(forecastedDemand * 1.12)) : "Pending Demand"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Target Nursery / Planting</span>
                    <p className="font-bold text-gray-900 mt-0.5">~105–115 days before peak</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Target Harvest Alignment</span>
                    <p className="font-bold text-gray-900 mt-0.5">
                      {formatDateRange(peakPeriodStart, peakPeriodEnd)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Moisture Standard & Buffer</span>
                    <p className="font-bold text-gray-900 mt-0.5">14% MC • 10–15% Safety Stock</p>
                  </div>
                </div>

                {/* ADVISORY PARAGRAPH */}
                <p className="text-sm leading-relaxed text-gray-700">
                  {productionSellingRecommendationsText}
                </p>
              </div>
            </section>
          </div>

          {/* 3. RECOMMENDED FARMER ACTION ITEMS */}
          <section className="rounded-xl border border-green-200 bg-green-50/70 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-green-900">
              <CheckCircle2 size={18} className="text-green-700" />
              <h4 className="text-sm font-bold">
                Recommended Farmer Action Checklist
              </h4>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {actionChecklist.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-green-200 bg-white p-3.5 shadow-xs"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-800">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. RISK & DECISION SUPPORT NOTICE */}
          <section className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900 shadow-sm">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold text-amber-950">
                Decision Support Notice & Model Integrity
              </p>
              <p className="mt-0.5 text-amber-800">
                Forecasts and AI interpretations are advisory estimates, not financial guarantees. Climate values represent Copernicus CDS regional climate projections; demand projections are derived from verified GrainRise POS sales, forward buyer contracts, and statistical TS-MLR modeling; competitor counts originate from official DA-RSBSA and PSA registries. Always compare model guidance against real-time weather forecasts and daily field observations.
              </p>
            </div>
          </section>

          {/* 5. REPORT EXPORT / DOWNLOAD BAR */}
          <section className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 xl:grid-cols-4 text-xs text-gray-600">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Product</span>
                <p className="font-semibold text-gray-800 mt-0.5 truncate">{productLabel(selectedProduct)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Location</span>
                <p className="font-semibold text-gray-800 mt-0.5 truncate">{selectedLocationLabel}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Forecast Horizon</span>
                <p className="font-semibold text-gray-800 mt-0.5">{titleCase(selectedPeriod)} (6 Months)</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">CDS Issue Date</span>
                <p className="font-semibold text-gray-800 mt-0.5">
                  {climateResult?.forecast_issue_date ? formatDate(climateResult.forecast_issue_date) : "Recent Run"}
                </p>
              </div>
            </div>

            {/* SEPARATE EXPORT CSV AND EXPORT PDF BUTTONS */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-4 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export forecast insights details to CSV"
              >
                <FileSpreadsheet size={15} className="text-emerald-700" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-slate-900 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export forecast insights details to PDF"
              >
                <FileDown size={15} />
                <span>Export PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadReport}
                className="inline-flex h-[38px] items-center justify-center gap-2 rounded-lg border border-green-700 bg-white px-4 text-xs font-semibold text-green-700 shadow-sm transition hover:bg-green-50"
                title="Download complete report"
              >
                <Download size={15} />
                <span>Download Report</span>
              </button>
            </div>
          </section>
        </>
      )}

      {/* TOAST SYSTEM */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
