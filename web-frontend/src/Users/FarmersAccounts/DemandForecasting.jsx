import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Search,
  Lightbulb,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  LoaderCircle,
  ChevronDown,
  RefreshCw,
  FileSpreadsheet,
  FileDown,
  Users,
  MapPin,
  Calendar,
  ShieldCheck,
  Info,
} from "lucide-react";
import { jsPDF } from "jspdf";

import Dropdown from "../../Components/Minor-Components/Dropdown";

import useFarmerForecasting
  from "../../Components/hooks/Farmer/useFarmerForecasting";
import Toast from "../../Components/Modals/Toast";
import useToast from "../../Components/hooks/useToast";


// ============================================================
// OPTIONS
// ============================================================


const FORECAST_VIEW_OPTIONS = [
  {
    label: "Weekly",
    value: "Weekly",
  },
  {
    label: "Monthly",
    value: "Monthly",
  },
];


// ============================================================
// HELPERS
// ============================================================


const numberValue = (value) => {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};


const formatKg = (value) => {
  return numberValue(value).toLocaleString(
    "en-PH",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
};


const formatProductType = (value) => {
  const normalized = String(
    value || ""
  )
    .trim()
    .toLowerCase();


  switch (normalized) {

    case "milled_rice":
    case "milled rice":
      return "Milled Rice";


    case "unmilled_palay":
    case "unmilled palay":
      return "Unmilled Palay";

    case "palay":
      return "Unmilled Palay";


    default:
      return String(
        value || "—"
      )
        .replaceAll(
          "_",
          " "
        )
        .replace(
          /\b\w/g,
          (letter) =>
            letter.toUpperCase()
        );

  }
};


const getProductName = (product) => {

  const variety = String(
    product?.rice_variety || ""
  ).trim();


  if (variety) {
    return variety;
  }


  return formatProductType(
    product?.product_type
  );

};


const getProductKey = (product) => {

  return [
    product?.product_id ?? "",
    product?.product_type || "",
    product?.rice_variety || "",
  ].join("::");

};


const getPeriodStart = (item) => {

  return (
    item?.period_start
    ||
    item?.start_date
    ||
    item?.date
    ||
    null
  );

};


const getHistoricalValue = (item) => {
  return numberValue(
    item?.realized_demand_kg
    ??
    item?.actual_demand_kg
    ??
    item?.quantity_sold_kg
    ??
    item?.quantity_sold
    ??
    item?.demand_kg
    ??
    item?.quantity_kg
    ??
    item?.value
  );
};

const getForecastValue = (item) => {
  return numberValue(
    item?.forecast_quantity_kg
    ??
    item?.projected_demand_kg
    ??
    item?.predicted_demand_kg
    ??
    item?.forecasted_demand_kg
    ??
    item?.model_forecast_quantity_kg
    ??
    item?.quantity_kg
    ??
    item?.value
  );
};

const formatMonth = (value) => {

  if (!value) {
    return "";
  }


  const date = new Date(
    `${value}T00:00:00`
  );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }


  return date.toLocaleDateString(
    "en-PH",
    {
      month: "short",
    }
  );

};


const formatWeek = (value) => {

  if (!value) {
    return "";
  }


  const date = new Date(
    `${value}T00:00:00`
  );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }


  return date.toLocaleDateString(
    "en-PH",
    {
      month: "short",
      day: "numeric",
    }
  );

};


const formatMonthYear = (value) => {

  if (!value) {
    return "—";
  }


  const date = new Date(
    `${value}T00:00:00`
  );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }


  return date.toLocaleDateString(
    "en-PH",
    {
      month: "long",
      year: "numeric",
    }
  );

};


const formatWeekRange = (
  start,
  end
) => {

  if (
    !start
    ||
    !end
  ) {
    return "—";
  }


  const startDate = new Date(
    `${start}T00:00:00`
  );

  const endDate = new Date(
    `${end}T00:00:00`
  );


  if (
    Number.isNaN(
      startDate.getTime()
    )
    ||
    Number.isNaN(
      endDate.getTime()
    )
  ) {
    return "—";
  }


  const first =
    startDate.toLocaleDateString(
      "en-PH",
      {
        month: "short",
        day: "numeric",
      }
    );


  const last =
    endDate.toLocaleDateString(
      "en-PH",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );


  return `${first} - ${last}`;

};


const formatForecastPeriod = (
  start,
  end,
  forecastView
) => {

  if (
    !start
    ||
    !end
  ) {
    return "—";
  }


  if (
    forecastView
    ===
    "Weekly"
  ) {
    return formatWeekRange(
      start,
      end
    );
  }


  const startDate = new Date(
    `${start}T00:00:00`
  );

  const endDate = new Date(
    `${end}T00:00:00`
  );


  if (
    Number.isNaN(
      startDate.getTime()
    )
    ||
    Number.isNaN(
      endDate.getTime()
    )
  ) {
    return "—";
  }


  const first =
    startDate.toLocaleDateString(
      "en-PH",
      {
        month: "short",
        year: "numeric",
      }
    );


  const last =
    endDate.toLocaleDateString(
      "en-PH",
      {
        month: "short",
        year: "numeric",
      }
    );


  return `${first} - ${last}`;

};


// ============================================================
// READ-ONLY PRODUCT TYPE FIELD
// ============================================================


const ReadOnlyDropdownField = ({
  label,
  value,
}) => {

  return (

    <div>

      <label
        className="
          text-xs
          font-semibold
          text-gray-500
          mb-1.5
          block
        "
      >
        {label}
      </label>


      <div
        aria-disabled="true"
        className="
          relative
          flex
          h-[38px]
          w-full
          cursor-not-allowed
          items-center
          rounded-lg
          border
          border-gray-200
          bg-gray-50
          px-3
          pr-9
          text-sm
          text-gray-600
          select-none
        "
      >

        <span
          className="
            truncate
          "
        >
          {value || "—"}
        </span>


        <ChevronDown
          size={15}
          className="
            absolute
            right-3
            text-gray-300
          "
        />

      </div>

    </div>

  );

};


// ============================================================
// DEMAND CHART
// ============================================================


const DemandChart = ({
  historicalPeriods = [],
  forecastPeriods = [],
  forecastView = "Monthly",
  loading = false,
  varietyName = "selected variety",
}) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const historicalLimit = forecastView === "Weekly" ? 8 : 6;
  const forecastLimit = forecastView === "Weekly" ? 12 : 6;

  const historical = (historicalPeriods || [])
    .slice(-historicalLimit)
    .map((item) => ({
      date: getPeriodStart(item),
      period_end: item?.period_end,
      value: getHistoricalValue(item),
      contractFloor: numberValue(item?.committed_contract_quantity_kg),
      contractFloorApplied: Boolean(item?.contract_floor_applied),
      type: "history",
      raw: item,
    }));

  const forecast = (forecastPeriods || [])
    .slice(0, forecastLimit)
    .map((item) => ({
      date: getPeriodStart(item),
      period_end: item?.period_end,
      value: getForecastValue(item),
      contractFloor: numberValue(item?.committed_contract_quantity_kg),
      contractFloorApplied: Boolean(item?.contract_floor_applied),
      type: "forecast",
      raw: item,
    }));

  const allPoints = [...historical, ...forecast];
  const allValues = allPoints.map((item) => item.value);
  const maxVal = Math.max(...allValues, 0);
  const hasData = allPoints.length > 0 && maxVal > 0;

  // SVG dimensions
  const svgWidth = 680;
  const svgHeight = 230;
  const padLeft = 75;
  const padRight = 35;
  const padTop = 25;
  const padBottom = 45;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;
  const chartBottom = padTop + chartHeight;

  // Nice round Y-max
  const yMax = maxVal > 0
    ? (maxVal > 5000 ? Math.ceil((maxVal * 1.15) / 1000) * 1000 : Math.ceil((maxVal * 1.2) / 10) * 10)
    : 100;
  const yTicks = [0, Math.round(yMax * 0.33), Math.round(yMax * 0.66), yMax];

  const getY = (val) => chartBottom - ((val || 0) / (yMax || 1)) * chartHeight;

  // Responsive X-axis partitioning: historical left (40%), forecast right (55%), Today in between
  const histRatio = historical.length > 0 ? 0.40 : 0.0;
  const histW = chartWidth * histRatio;
  const histStart = padLeft;
  const foreStart = padLeft + (historical.length > 0 ? histW + 35 : 0);
  const foreW = svgWidth - padRight - foreStart;
  const todayX = padLeft + histW + 17;

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

  // Responsive tick display step to eliminate label overlap
  // In Weekly view: show fewer evenly spaced labels (e.g. every 2nd or 3rd week)
  const isWeekly = forecastView === "Weekly";
  const foreStep = isWeekly ? (forecast.length > 8 ? 3 : 2) : 1;
  const histStep = isWeekly ? 2 : 1;

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center rounded-xl bg-gray-50/50 border border-gray-100 p-6 text-center">
        <LoaderCircle size={28} className="animate-spin text-green-700 mb-2" />
        <p className="text-xs text-gray-500 font-medium">Updating demand forecast models...</p>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center rounded-xl bg-gray-50 border border-dashed border-gray-200 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
          <TrendingDown size={22} />
        </div>
        <p className="text-sm font-semibold text-gray-800 mb-1">
          No Historical Demand Data Available
        </p>
        <p className="text-xs text-gray-500 max-w-md">
          There are currently no recorded POS sales transactions or active contracts for {varietyName}. Numerical forecasts will automatically activate once real sales or contract orders are logged.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 relative select-none">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full overflow-visible"
      >
        {/* HORIZONTAL GRID LINES & Y-AXIS LABELS */}
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
                x={padLeft - 8}
                y={yPos + 3}
                className="text-[10px] fill-slate-400 font-medium"
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
              x={todayX - 18}
              y={padTop - 18}
              width="36"
              height="16"
              rx="4"
              fill="#F1F5F9"
              stroke="#CBD5E1"
              strokeWidth="1"
            />
            <text
              x={todayX}
              y={padTop - 7}
              className="text-[9px] fill-slate-600 font-semibold"
              textAnchor="middle"
            >
              Today
            </text>
          </g>
        )}

        {/* HISTORICAL PATH & FILL */}
        {historicalPath && (
          <path
            d={historicalPath}
            fill="none"
            stroke="#0B7A2A"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* HISTORICAL POINTS */}
        {historicalPoints.map((point, index) => (
          <g key={`historical-pt-${index}`}>
            {/* Extended invisible hover target */}
            <circle
              cx={point.x}
              cy={point.y}
              r="12"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#0B7A2A"
              stroke="#FFFFFF"
              strokeWidth="2"
              className="transition-transform duration-150 pointer-events-none"
            />
          </g>
        ))}

        {/* FORECAST PATH */}
        {forecastPath && (
          <path
            d={forecastPath}
            fill="none"
            stroke="#D6A62D"
            strokeWidth="3"
            strokeDasharray="8 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* FORECAST POINTS */}
        {forecastPoints.map((point, index) => (
          <g key={`forecast-pt-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="12"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#D6A62D"
              stroke="#FFFFFF"
              strokeWidth="2"
              className="transition-transform duration-150 pointer-events-none"
            />
          </g>
        ))}

        {/* HISTORICAL X-AXIS LABELS (RESPONSIVE TICK SPACING) */}
        {historicalPoints.map((point, index) => {
          const isVisible = index === 0 || index % histStep === 0 || index === historicalPoints.length - 1;
          if (!isVisible) return null;
          return (
            <text
              key={`hist-lbl-${index}`}
              x={point.x}
              y={chartBottom + 20}
              className="text-[10px] fill-slate-500 font-medium"
              textAnchor="middle"
            >
              {isWeekly ? formatWeek(point.date) : formatMonth(point.date)}
            </text>
          );
        })}

        {/* FORECAST X-AXIS LABELS (RESPONSIVE TICK SPACING) */}
        {forecastPoints.map((point, index) => {
          const isVisible = index === 0 || index % foreStep === 0 || index === forecastPoints.length - 1;
          if (!isVisible) return null;
          const labelText = isWeekly ? formatWeek(point.date) : formatMonth(point.date);
          return (
            <text
              key={`fore-lbl-${index}`}
              x={point.x}
              y={chartBottom + 20}
              className="text-[10px] fill-amber-700 font-semibold"
              textAnchor="middle"
            >
              {labelText}
            </text>
          );
        })}

        {/* INSUFFICIENT FORECAST NOTICE IN FORECAST AREA */}
        {forecastPoints.length === 0 && (
          <g>
            <rect
              x={todayX + 15}
              y={padTop + 20}
              width={Math.max(120, svgWidth - padRight - todayX - 25)}
              height={chartHeight - 40}
              rx="8"
              fill="#F8FAFC"
              stroke="#E2E8F0"
              strokeDasharray="4 4"
            />
            <text
              x={todayX + 15 + Math.max(120, svgWidth - padRight - todayX - 25) / 2}
              y={padTop + 20 + (chartHeight - 40) / 2 - 8}
              className="text-[11px] fill-amber-700 font-semibold"
              textAnchor="middle"
            >
              Insufficient Data for Forecast
            </text>
            <text
              x={todayX + 15 + Math.max(120, svgWidth - padRight - todayX - 25) / 2}
              y={padTop + 20 + (chartHeight - 40) / 2 + 10}
              className="text-[9px] fill-slate-500 font-medium"
              textAnchor="middle"
            >
              Minimum 4 active sales periods required
            </text>
          </g>
        )}
      </svg>

      {/* INTERACTIVE FLOATING TOOLTIP */}
      {hoveredPoint && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg text-xs transition-all duration-150"
          style={{
            left: `${Math.max(10, Math.min(svgWidth - 140, (hoveredPoint.x / svgWidth) * 100))}%`,
            top: `${Math.max(5, (hoveredPoint.y / svgHeight) * 100 - 32)}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-semibold text-slate-200">
            {isWeekly
              ? `${formatWeek(hoveredPoint.date)}${hoveredPoint.period_end ? ` – ${formatWeek(hoveredPoint.period_end)}` : ""}`
              : formatMonth(hoveredPoint.date)}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                hoveredPoint.type === "history" ? "bg-green-500" : "bg-amber-400"
              }`}
            />
            <span className="font-bold text-white">
              {Number(hoveredPoint.value || 0).toLocaleString("en-PH")} kg
            </span>
            <span className="text-slate-300">
              ({hoveredPoint.type === "history" ? "Realized Demand" : "Projected Demand"})
            </span>
          </div>
          {hoveredPoint.contractFloorApplied && (
            <p className="text-[10px] text-amber-300 mt-1 font-medium">
              ★ Active contract commitment floor: {Number(hoveredPoint.contractFloor || 0).toLocaleString()} kg
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================


export default function DemandForecasting() {

  const {

    demandProducts,
    loadDemandProducts,

    demandForecast,
    generateDemandForecast,

    competitorAnalysis,
    loadCompetitorAnalysis,

    loading,
    errors,

  } = useFarmerForecasting();

  const { toasts, showToast, removeToast } = useToast();


  const [
    selectedProductKey,
    setSelectedProductKey,
  ] = useState("");


  const [
    forecastView,
    setForecastView,
  ] = useState(
    "Monthly"
  );


  const lastRequestKeyRef =
    useRef("");


  // =========================================================
  // LOAD AVAILABLE PRODUCTS
  // =========================================================

  useEffect(
    () => {

      loadDemandProducts()
        .catch(
          () => {}
        );

    },
    [
      loadDemandProducts,
    ]
  );


  // =========================================================
  // AUTO-SELECT FIRST PRODUCT
  // =========================================================

  useEffect(
    () => {

      if (
        selectedProductKey
        ||
        !demandProducts.length
      ) {
        return;
      }


      const preferredProduct =
        demandProducts.find((p) => p.has_sales_history && p.has_contract_history)
        || demandProducts.find((p) => p.has_sales_history || p.has_contract_history)
        || demandProducts[0];

      setSelectedProductKey(
        getProductKey(
          preferredProduct
        )
      );

    },
    [
      demandProducts,
      selectedProductKey,
    ]
  );


  // =========================================================
  // CURRENT PRODUCT
  // =========================================================

  const selectedProduct =
    useMemo(
      () => {

        return (
          demandProducts.find(
            (product) =>
              getProductKey(
                product
              )
              ===
              selectedProductKey
          )
          ||
          null
        );

      },
      [
        demandProducts,
        selectedProductKey,
      ]
    );

  // =========================================================
  // LOAD COMPETITOR ANALYSIS (NON-BLOCKING)
  // =========================================================

  useEffect(() => {
    if (selectedProduct) {
      loadCompetitorAnalysis({
        rice_variety: selectedProduct.rice_variety,
        product_type: selectedProduct.product_type,
      }).catch(() => {});
    }
  }, [selectedProduct, loadCompetitorAnalysis]);


  // =========================================================
  // GRANULARITY / HORIZON
  // =========================================================

  const forecastConfig =
    useMemo(
      () => {

        if (
          forecastView
          ===
          "Weekly"
        ) {

          return {
            granularity:
              "weekly",

            horizonPeriods:
              12,
          };

        }


        return {
          granularity:
            "monthly",

          horizonPeriods:
            6,
        };

      },
      [
        forecastView,
      ]
    );


  // =========================================================
  // AUTO FORECAST
  //
  // Product + Forecast View are selectable.
  // Product Type is fetched automatically from selected product.
  // =========================================================

  const runForecast =
    useCallback(
      async ({
        force = false,
      } = {}) => {

        if (
          !selectedProduct
        ) {
          return;
        }


        const requestKey = [
          selectedProduct
            ?.product_id
            ??
            "",

          selectedProduct
            ?.product_type
            ||
            "",

          selectedProduct
            ?.rice_variety
            ||
            "",

          forecastConfig
            .granularity,

          forecastConfig
            .horizonPeriods,
        ].join("::");


        if (
          !force
          &&
          lastRequestKeyRef.current
          ===
          requestKey
        ) {
          return;
        }


        lastRequestKeyRef.current =
          requestKey;


        try {

          await generateDemandForecast({

            product_id:
              selectedProduct
                .product_id,

            product_type:
              selectedProduct
                .product_type,

            rice_variety:
              selectedProduct
                .rice_variety,

            granularity:
              forecastConfig
                .granularity,

            horizon_periods:
              forecastConfig
                .horizonPeriods,

          });

        }

        catch (error) {

          /*
           * Allow retry after a failed request.
           */

          lastRequestKeyRef.current =
            "";

          throw error;

        }

      },
      [
        selectedProduct,
        forecastConfig,
        generateDemandForecast,
      ]
    );


  useEffect(
    () => {

      if (
        !selectedProduct
      ) {
        return;
      }


      const timer =
        window.setTimeout(
          () => {

            runForecast()
              .catch(
                () => {}
              );

          },
          250
        );


      return () => {

        window.clearTimeout(
          timer
        );

      };

    },
    [
      selectedProduct,
      forecastView,
      runForecast,
    ]
  );


  // =========================================================
  // FORECAST DATA
  // =========================================================

  const historicalPeriods =
    Array.isArray(
      demandForecast
        ?.feature_snapshot
        ?.historical_periods
    )
      ? demandForecast
          .feature_snapshot
          .historical_periods
      : [];


  const forecastPeriods =
    Array.isArray(
      demandForecast
        ?.forecast_output
        ?.periods
    )
      ? demandForecast
          .forecast_output
          .periods
      : [];


  const forecastedDemand =
    numberValue(
      demandForecast
        ?.projected_total_quantity_kg
    )
    ||
    forecastPeriods.reduce(
      (
        total,
        item
      ) =>
        total
        +
        getForecastValue(
          item
        ),
      0
    );


  const trend = String(
    demandForecast
      ?.demand_trend
      ||
      ""
  ).toLowerCase();


  const peakPeriod =
    forecastPeriods.reduce(
      (
        currentPeak,
        current
      ) => {

        if (
          !currentPeak
        ) {
          return current;
        }


        return (
          getForecastValue(
            current
          )
          >
          getForecastValue(
            currentPeak
          )
            ? current
            : currentPeak
        );

      },
      null
    );


  // =========================================================
  // EXPECTED LEVEL
  // =========================================================

  const historicalAverage =
    historicalPeriods.length
      ? (
          historicalPeriods.reduce(
            (
              total,
              item
            ) =>
              total
              +
              getHistoricalValue(
                item
              ),
            0
          )
          /
          historicalPeriods.length
        )
      : 0;


  const forecastAverage =
    forecastPeriods.length
      ? (
          forecastPeriods.reduce(
            (
              total,
              item
            ) =>
              total
              +
              getForecastValue(
                item
              ),
            0
          )
          /
          forecastPeriods.length
        )
      : 0;


  const isInsufficient =
    demandForecast?.data_status === "insufficient" ||
    !forecastPeriods.length;

  const expectedLevel =
    useMemo(
      () => {

        if (
          demandForecast?.data_status === "insufficient"
        ) {

          return {
            label:
              "Insufficient Data",

            classes:
              "bg-amber-50 text-amber-700 border border-amber-200",
          };

        }

        if (
          !forecastPeriods.length
        ) {

          return {
            label:
              "No Forecast",

            classes:
              "bg-gray-100 text-gray-600",
          };

        }


        if (
          historicalAverage
          >
          0
        ) {

          const ratio =
            forecastAverage
            /
            historicalAverage;


          if (
            ratio >= 1.15
          ) {

            return {
              label:
                "High Demand",

              classes:
                "bg-red-100 text-red-700",
            };

          }


          if (
            ratio <= 0.85
          ) {

            return {
              label:
                "Low Demand",

              classes:
                "bg-blue-100 text-blue-700",
            };

          }

        }


        return {
          label:
            "Moderate Demand",

          classes:
            "bg-yellow-100 text-yellow-700",
        };

      },
      [
        forecastPeriods,
        historicalAverage,
        forecastAverage,
      ]
    );


  // =========================================================
  // TREND PRESENTATION
  // =========================================================

  const trendPresentation =
    useMemo(
      () => {

        switch (trend) {

          case "increasing":

            return {
              label:
                "Increasing",

              Icon:
                TrendingUp,

              classes:
                "text-yellow-600",
            };


          case "decreasing":

            return {
              label:
                "Decreasing",

              Icon:
                TrendingDown,

              classes:
                "text-orange-600",
            };


          default:

            return {
              label:
                forecastPeriods.length
                  ? "Stable"
                  : "—",

              Icon:
                Minus,

              classes:
                "text-gray-600",
            };

        }

      },
      [
        trend,
        forecastPeriods,
      ]
    );


  const TrendIcon =
    trendPresentation.Icon;


  // =========================================================
  // SUMMARY
  // =========================================================

  const productDemandSummary = useMemo(() => {
    if (loading?.demand) {
      return "GrainRise is currently analyzing the selected product's demand data and historical sales signals.";
    }

    if (demandForecast?.insights?.product_demand_summary) {
      return demandForecast.insights.product_demand_summary;
    }

    const name = getProductName(selectedProduct);
    const prodType = formatProductType(selectedProduct?.product_type);

    if (isInsufficient) {
      return `No historical POS sales or contract transactions have been recorded yet for ${name} (${prodType}). To activate demand forecasting and strategic production advisories, record your initial sales or buyer commitments in GrainRise.`;
    }

    const peak =
      forecastView === "Weekly"
        ? formatWeek(getPeriodStart(peakPeriod))
        : formatMonthYear(getPeriodStart(peakPeriod));
    const peakVal = peakPeriod ? formatKg(getForecastValue(peakPeriod)) : "0";
    const totalProj = formatKg(forecastedDemand);
    const horizonCount = forecastPeriods.length;
    const viewUnit = forecastView === "Weekly" ? "week" : "month";
    const modeLabel =
      demandForecast?.feature_snapshot?.methodology?.forecast_method_label ||
      (demandForecast?.feature_snapshot?.methodology?.uses_time_series_mlr
        ? "Time Series + Multiple Linear Regression"
        : "Preliminary Demand Estimate");

    const compCount = competitorAnalysis?.competitor_count
      ? `${competitorAnalysis.competitor_count.toLocaleString("en-PH")} registered rice farmers`
      : null;
    const compCoverage = competitorAnalysis?.geographic_coverage || "the local municipality";

    const compSentence = compCount
      ? ` Within ${compCoverage}, where ${compCount} actively cultivate palay under official ${competitorAnalysis?.source || "DA-RSBSA"} records, regional miller inquiries and warehouse bidding demand for well-graded ${name} remain competitive, rewarding consistent supply compliance.`
      : ` Official sub-district competitor registries are limited in public summary releases for this locality; local grain procurement reflects sustained buyer interest across monitored trading channels.`;

    let trajectoryDesc = "";
    if (trend === "increasing") {
      trajectoryDesc = `indicates an expanding demand trajectory over the ${horizonCount}-${viewUnit} forecast horizon using a ${modeLabel}, with cumulative projected off-take reaching ${totalProj} kg and peak buying volume anticipated around ${peak} at approximately ${peakVal} kg`;
    } else if (trend === "decreasing") {
      trajectoryDesc = `projects a softening demand trajectory across the ${horizonCount}-${viewUnit} forecast horizon using a ${modeLabel}, tapering to an estimated total of ${totalProj} kg with the highest procurement window recorded near ${peak} at ${peakVal} kg`;
    } else {
      trajectoryDesc = `demonstrates a steady, stable demand trajectory across the ${horizonCount}-${viewUnit} forecast horizon using a ${modeLabel}, totaling approximately ${totalProj} kg with buying activity cresting near ${peak} at ${peakVal} kg`;
    }

    return `Projected demand for ${name} (${prodType}) ${trajectoryDesc}.${compSentence}`;
  }, [
    loading,
    isInsufficient,
    demandForecast,
    forecastPeriods,
    selectedProduct,
    peakPeriod,
    trend,
    forecastView,
    forecastedDemand,
    competitorAnalysis,
  ]);

  const productionConsideration = useMemo(() => {
    if (demandForecast?.insights?.production_consideration) {
      return demandForecast.insights.production_consideration;
    }

    const name = getProductName(selectedProduct);

    if (isInsufficient) {
      return `With demand history for ${name} currently pending initial transactions, prioritize logging confirmed buyer agreements and POS farm-gate sales upon harvest. Recording real trade records unlocks automated predictive planning, enabling precise harvest alignment and inventory preparation.`;
    }

    const peak =
      forecastView === "Weekly"
        ? formatWeek(getPeriodStart(peakPeriod))
        : formatMonthYear(getPeriodStart(peakPeriod));
    const horizonCount = forecastPeriods.length;
    const viewUnit = forecastView === "Weekly" ? "week" : "month";
    const totalProj = formatKg(forecastedDemand);

    let schedulingAdvice = "";
    if (trend === "increasing") {
      schedulingAdvice = `Farmers should synchronize seedbed establishment and transplanting approximately 105 to 115 days ahead of the projected peak period around ${peak}, ensuring crop maturation coincides with elevated buyer procurement prices.`;
    } else if (trend === "decreasing") {
      schedulingAdvice = `Given the softening demand outlook through the upcoming ${horizonCount} ${viewUnit}s, calibrate acreage conservatively toward ${totalProj} kg rather than expanding production, focusing available capital on yield efficiency.`;
    } else {
      schedulingAdvice = `With demand holding stable across the ${horizonCount}-${viewUnit} window, maintaining your standard staggered planting schedule will support steady harvesting without overwhelming localized post-harvest handling capacity.`;
    }

    return `Farm operations for ${name} should align harvest volume strictly with the projected ${totalProj} kg requirement while maintaining a 10% to 15% clean reserve buffer. ${schedulingAdvice} Given active competition from registered palay producers across the district, locking in forward contract floors and pre-arranging warehouse delivery slots early will safeguard your farm-gate margins against post-harvest market gluts. Ensure all harvested palay is mechanically dried to the verified 14% moisture standard to prevent aflatoxin and maintain premium grading.`;
  }, [
    demandForecast,
    isInsufficient,
    forecastPeriods,
    trend,
    selectedProduct,
    peakPeriod,
    forecastView,
    forecastedDemand,
  ]);


  // =========================================================
  // FORECAST DATES
  // =========================================================

  const forecastStart =
    demandForecast
      ?.forecast_period
      ?.start_date
    ||
    getPeriodStart(
      forecastPeriods[0]
    );


  const forecastEnd =
    demandForecast
      ?.forecast_period
      ?.end_date
    ||
    getPeriodStart(
      forecastPeriods[
        forecastPeriods.length - 1
      ]
    );


  // =========================================================
  // EXPORT CSV & PDF
  // =========================================================

  const handleExportCSV = useCallback(() => {
    if (!demandForecast || !selectedProduct) return;

    try {
      const rows = [];
      const sanitizedProduct = getProductName(selectedProduct)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_");
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `GrainRise_Demand_Forecast_${sanitizedProduct}_${dateStr}.csv`;

      const escapeField = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const coveredPeriodStr = formatForecastPeriod(
        forecastStart,
        forecastEnd,
        forecastView
      );
      const peakStr =
        forecastView === "Weekly"
          ? formatWeek(getPeriodStart(peakPeriod))
          : formatMonthYear(getPeriodStart(peakPeriod));

      // 1. Report Header & Metadata
      rows.push(["GRAINRISE DEMAND FORECAST REPORT"]);
      rows.push(["Report Type", "Time Series–Multiple Linear Regression Demand Forecast & Market Advisory"]);
      rows.push(["Export Date", dateStr]);
      rows.push(["Forecast Granularity", forecastView]);
      rows.push(["Covered Period", coveredPeriodStr]);
      rows.push(["Selected Product", getProductName(selectedProduct)]);
      rows.push(["Rice Variety", selectedProduct?.rice_variety || "—"]);
      rows.push(["Product Type", formatProductType(selectedProduct?.product_type)]);
      rows.push(["Total Projected Demand (kg)", isInsufficient ? "N/A" : formatKg(forecastedDemand)]);
      rows.push(["Demand Trend", isInsufficient ? "N/A" : trendPresentation.label]);
      rows.push(["Peak Demand Period", isInsufficient ? "N/A" : peakStr]);
      rows.push(["Expected Demand Level", expectedLevel.label]);
      const methodLabel =
        demandForecast?.feature_snapshot?.methodology?.forecast_method_label ||
        (demandForecast?.feature_snapshot?.methodology?.uses_time_series_mlr
          ? "Time Series + Multiple Linear Regression (TS-MLR)"
          : "Preliminary Demand Estimate");

      rows.push(["Forecasting Methodology", methodLabel]);
      rows.push([]);

      // 2. Projected Demand Forecast Table
      rows.push([`PROJECTED DEMAND FORECAST (${methodLabel.toUpperCase()})`]);
      rows.push([
        "Period",
        "Period Start Date",
        "Projected Demand (kg)",
        "Projected Price (PHP/kg)",
        "Lower Bound (kg)",
        "Upper Bound (kg)",
      ]);
      if (forecastPeriods.length === 0) {
        rows.push(["No historical POS sales or contract records available for this product.", "", "", "", "", ""]);
      } else {
        forecastPeriods.forEach((p, idx) => {
          const periodLabel = p.period || `Period ${idx + 1}`;
          const pStart = getPeriodStart(p) || "";
          const projKg = getForecastValue(p);
          const price = p.projected_price_per_kg ?? "—";
          const ci = Array.isArray(p.confidence_interval) ? p.confidence_interval : [];
          const lower = ci[0] ?? "—";
          const upper = ci[1] ?? "—";
          rows.push([periodLabel, pStart, projKg, price, lower, upper]);
        });
      }
      rows.push([]);

      // 3. Historical Demand & Realized Sales Table
      rows.push(["HISTORICAL DEMAND & REALIZED TRANSACTIONS"]);
      rows.push([
        "Period",
        "Period Start Date",
        "Realized Demand / Sales (kg)",
        "Average Price (PHP/kg)",
      ]);
      if (historicalPeriods.length === 0) {
        rows.push(["No historical transactions recorded for this range.", "", "", ""]);
      } else {
        historicalPeriods.forEach((h, idx) => {
          const periodLabel = h.period || `Period ${idx + 1}`;
          const pStart = getPeriodStart(h) || "";
          const actKg = getHistoricalValue(h);
          const price = h.average_price_per_kg ?? "—";
          rows.push([periodLabel, pStart, actKg, price]);
        });
      }
      rows.push([]);

      // 4. Local Market Competition Analysis
      rows.push(["LOCAL MARKET COMPETITION ANALYSIS"]);
      rows.push(["Registered Competitor Count", competitorAnalysis?.competitor_count_display || "Data unavailable"]);
      rows.push(["Geographic Coverage", competitorAnalysis?.geographic_coverage || "—"]);
      rows.push(["Data Source", competitorAnalysis?.source || "DA-RSBSA / PSA Agricultural Registry"]);
      rows.push(["Reference Year", competitorAnalysis?.data_year || "2024"]);
      rows.push(["Variety / Product Focus", competitorAnalysis?.variety_focus || selectedProduct?.rice_variety || "—"]);
      rows.push(["Market Notes", competitorAnalysis?.market_analysis || competitorAnalysis?.variety_context || "—"]);
      if (competitorAnalysis?.barangay_note) {
        rows.push(["Sub-district Footnote", competitorAnalysis.barangay_note]);
      }
      rows.push([]);

      // 5. Agronomic & Commercial Insights
      rows.push(["AGRONOMIC & COMMERCIAL INSIGHTS"]);
      rows.push(["Product Demand Summary", productDemandSummary]);
      rows.push(["Production Consideration", productionConsideration]);
      rows.push([]);

      // Build CSV String with UTF-8 BOM
      const csvContent =
        "\uFEFF" +
        rows
          .map((row) => row.map(escapeField).join(","))
          .join("\r\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showToast({
        type: "success",
        title: "CSV Export Ready",
        message: "Demand forecast details successfully exported to CSV.",
        duration: 4000,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Export Failed",
        message: "Unable to generate CSV export. Please try again.",
        duration: 4000,
      });
    }
  }, [
    demandForecast,
    selectedProduct,
    forecastView,
    forecastStart,
    forecastEnd,
    forecastedDemand,
    trendPresentation,
    peakPeriod,
    expectedLevel,
    forecastPeriods,
    historicalPeriods,
    competitorAnalysis,
    productDemandSummary,
    productionConsideration,
    showToast,
  ]);

  const handleExportPDF = useCallback(() => {
    if (!demandForecast || !selectedProduct) return;

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

      const cleanPdfText = (str) => {
        if (!str) return "";
        return String(str)
          .replace(/[\u2013\u2014]/g, "-") // en-dash, em-dash
          .replace(/[\u2018\u2019]/g, "'") // smart single quotes
          .replace(/[\u201C\u201D]/g, '"') // smart double quotes
          .replace(/[\u2022]/g, "*") // bullet
          .replace(/[\u20B1]/g, "PHP ") // peso sign
          .replace(/[^\x00-\x7F]/g, " "); // fallback for any other non-ASCII chars
      };

      const sanitizedProduct = cleanPdfText(getProductName(selectedProduct))
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_");
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `GrainRise_Demand_Forecast_${sanitizedProduct}_${dateStr}.pdf`;

      let y = 0;

      const checkPageBreak = (neededHeight) => {
        if (y + neededHeight > 275) {
          doc.addPage();
          y = 20;
          return true;
        }
        return false;
      };

      const renderTextLines = (lines, startX, lineHeight = 3.8) => {
        (lines || []).forEach((line) => {
          checkPageBreak(lineHeight + 2);
          doc.text(line, startX, y);
          y += lineHeight;
        });
      };

      // Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 24, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("GRAINRISE DEMAND FORECAST REPORT", 14, 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(230, 245, 235);
      doc.text("Time Series - Multiple Linear Regression Demand Model & Advisory", 14, 18);
      doc.text(`Export Date: ${dateStr}`, 155, 18);

      y = 32;

      // Metadata Box
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setFillColor(zebraBg[0], zebraBg[1], zebraBg[2]);
      doc.roundedRect(14, y, 182, 24, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text(cleanPdfText(`Product: ${getProductName(selectedProduct)}`), 18, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
      const coveredPeriodStr = formatForecastPeriod(forecastStart, forecastEnd, forecastView);
      doc.text(cleanPdfText(`Variety: ${selectedProduct?.rice_variety || "-"}  |  Type: ${formatProductType(selectedProduct?.product_type)}  |  Granularity: ${forecastView}  |  Period: ${coveredPeriodStr}`), 18, y + 12);

      const peakStr = isInsufficient ? "N/A" : (forecastView === "Weekly" ? formatWeek(getPeriodStart(peakPeriod)) : formatMonthYear(getPeriodStart(peakPeriod)));
      const projStr = isInsufficient ? "N/A" : `${formatKg(forecastedDemand)} kg`;
      const trendStr = isInsufficient ? "N/A" : trendPresentation.label;
      const pdfMethodLabel = cleanPdfText(
        demandForecast?.feature_snapshot?.methodology?.forecast_method_label ||
        (demandForecast?.feature_snapshot?.methodology?.uses_time_series_mlr
          ? "TS-MLR Model"
          : "Preliminary Estimate")
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
      doc.text(cleanPdfText(`Projected Demand: ${projStr}  |  Trend: ${trendStr}  |  Peak: ${peakStr}  |  Method: ${isInsufficient ? "No History Available" : pdfMethodLabel}`), 18, y + 18);

      y += 30;

      // SECTION 1: Projected Demand Forecast Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(cleanPdfText(`1. PROJECTED DEMAND FORECAST (${isInsufficient ? "INSUFFICIENT DATA" : pdfMethodLabel.toUpperCase()})`), 14, y);
      y += 4;

      // Table Header
      doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
      doc.rect(14, y, 182, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text("Period", 18, y + 4.8);
      doc.text("Projected Demand (kg)", 65, y + 4.8);
      doc.text("Projected Price (PHP/kg)", 115, y + 4.8);
      doc.text("Confidence Range (kg)", 160, y + 4.8);
      y += 7;

      if (forecastPeriods.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
        doc.text("No historical POS sales or contract records available for this product.", 18, y + 4.5);
        y += 7;
      } else {
        forecastPeriods.forEach((p, idx) => {
          checkPageBreak(8);
          if (idx % 2 === 0) {
            doc.setFillColor(zebraBg[0], zebraBg[1], zebraBg[2]);
            doc.rect(14, y, 182, 6, "F");
          }
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
          doc.text(cleanPdfText(String(p.period || `Period ${idx + 1}`)), 18, y + 4.2);
          doc.text(`${formatKg(getForecastValue(p))} kg`, 65, y + 4.2);
          doc.text(p.projected_price_per_kg ? `PHP ${Number(p.projected_price_per_kg).toFixed(2)}` : "-", 115, y + 4.2);
          const ci = Array.isArray(p.confidence_interval) ? p.confidence_interval : [];
          const ciStr = ci.length === 2 ? `${formatKg(ci[0])} - ${formatKg(ci[1])} kg` : "-";
          doc.text(ciStr, 160, y + 4.2);
          y += 6;
        });
      }

      y += 6;
      checkPageBreak(35);

      // SECTION 2: Historical Demand Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("2. HISTORICAL DEMAND & REALIZED TRANSACTIONS", 14, y);
      y += 4;

      doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
      doc.rect(14, y, 182, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text("Period", 18, y + 4.8);
      doc.text("Realized Sales / Contracts (kg)", 75, y + 4.8);
      doc.text("Average Farm-Gate Price (PHP/kg)", 135, y + 4.8);
      y += 7;

      if (historicalPeriods.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
        doc.text("No historical transactions available.", 18, y + 4.2);
        y += 6;
      } else {
        historicalPeriods.forEach((h, idx) => {
          checkPageBreak(8);
          if (idx % 2 === 0) {
            doc.setFillColor(zebraBg[0], zebraBg[1], zebraBg[2]);
            doc.rect(14, y, 182, 6, "F");
          }
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
          doc.text(cleanPdfText(String(h.period || `Period ${idx + 1}`)), 18, y + 4.2);
          doc.text(`${formatKg(getHistoricalValue(h))} kg`, 75, y + 4.2);
          doc.text(h.average_price_per_kg ? `PHP ${Number(h.average_price_per_kg).toFixed(2)}` : "-", 135, y + 4.2);
          y += 6;
        });
      }

      y += 6;
      checkPageBreak(38);

      // SECTION 3: Competition Analysis Box
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("3. LOCAL MARKET COMPETITION ANALYSIS", 14, y);
      y += 4;

      const compContext = cleanPdfText(
        competitorAnalysis?.variety_context ||
        competitorAnalysis?.market_analysis ||
        "Official agricultural registries maintain municipal palay producer records."
      );
      const compContextLines = doc.splitTextToSize(compContext, 174);
      const compBoxHeight = 22 + Math.min(compContextLines.length, 3) * 3.8 + (competitorAnalysis?.barangay_note ? 5 : 0);

      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setFillColor(zebraBg[0], zebraBg[1], zebraBg[2]);
      doc.roundedRect(14, y, 182, compBoxHeight, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text(cleanPdfText(`Registered Competitor Count: ${competitorAnalysis?.competitor_count_display || "Data unavailable"}`), 18, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(slateMedium[0], slateMedium[1], slateMedium[2]);
      doc.text(cleanPdfText(`Coverage: ${competitorAnalysis?.geographic_coverage || "Municipality Level"}  |  Source: ${competitorAnalysis?.source || "DA-RSBSA / PSA"}  |  Year: ${competitorAnalysis?.data_year || "2024"}`), 18, y + 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      let innerY = y + 16;
      compContextLines.slice(0, 3).forEach((line) => {
        doc.text(line, 18, innerY);
        innerY += 3.8;
      });

      if (competitorAnalysis?.barangay_note) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(6.5);
        doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
        doc.text(cleanPdfText(`* ${competitorAnalysis.barangay_note}`), 18, innerY + 2);
      }

      y += compBoxHeight + 6;
      checkPageBreak(35);

      // SECTION 4: Insights & Considerations
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("4. GRAINRISE AGRONOMIC & COMMERCIAL INSIGHTS", 14, y);
      y += 5;

      // Product Demand Summary
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Product Demand Summary", 14, y);
      y += 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      const cleanSummary = cleanPdfText(productDemandSummary || "No demand summary available.");
      const summaryLines = doc.splitTextToSize(cleanSummary, 182);
      renderTextLines(summaryLines, 14, 3.8);
      y += 3;

      checkPageBreak(25);

      // Production Consideration
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(180, 83, 9); // Amber (#b45309) - individual RGB numbers!
      doc.text("Production Consideration", 14, y);
      y += 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      const cleanConsider = cleanPdfText(productionConsideration || "No production considerations available.");
      const considerLines = doc.splitTextToSize(cleanConsider, 182);
      renderTextLines(considerLines, 14, 3.8);

      // Multi-page Footers
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.line(14, 282, 196, 282);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(slateLight[0], slateLight[1], slateLight[2]);
        doc.text(
          "GrainRise Decision Support Platform  |  Numerical forecasts produced via Time Series + Multiple Linear Regression.",
          14,
          286
        );
        doc.text(`Page ${i} of ${totalPages}`, 182, 286);
      }

      doc.save(filename);

      showToast({
        type: "success",
        title: "PDF Export Ready",
        message: "Demand forecast details successfully exported to PDF.",
        duration: 4000,
      });
    } catch (err) {
      console.error("Demand forecast PDF export error:", err);
      showToast({
        type: "error",
        title: "Export Failed",
        message: "Unable to generate PDF export. Please try again.",
        duration: 4000,
      });
    }
  }, [
    demandForecast,
    selectedProduct,
    forecastView,
    forecastStart,
    forecastEnd,
    forecastedDemand,
    trendPresentation,
    peakPeriod,
    expectedLevel,
    forecastPeriods,
    historicalPeriods,
    competitorAnalysis,
    productDemandSummary,
    productionConsideration,
    showToast,
  ]);


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div
      className="
        flex
        flex-col
        gap-6
      "
    >

      <div>

        <h3
          className="
            font-bold
            text-gray-900
            text-lg
            mb-4
          "
        >
          Demand Forecasting
        </h3>


        {/* =================================================
            FILTERS
        ================================================== */}

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-12
            gap-4
            items-end
          "
        >


          {/* PRODUCT / VARIETY DROPDOWN */}

          <div
            className="
              md:col-span-6
            "
          >

            <label
              className="
                text-xs
                font-semibold
                text-gray-500
                mb-1.5
                block
              "
            >
              Search Product / Variety
            </label>


            <div
              className="
                relative
              "
            >

              <Search
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                  pointer-events-none
                  z-10
                "
                size={16}
              />


              <select
                value={
                  selectedProductKey
                }
                onChange={
                  (
                    event
                  ) => {

                    lastRequestKeyRef.current =
                      "";


                    setSelectedProductKey(
                      event.target.value
                    );

                  }
                }
                disabled={
                  loading?.products
                  ||
                  !demandProducts.length
                }
                className="
                  w-full
                  h-[38px]
                  appearance-none
                  pl-9
                  pr-10
                  border
                  border-gray-200
                  rounded-lg
                  bg-white
                  text-sm
                  text-gray-800
                  outline-none
                  focus:ring-1
                  focus:ring-green-600
                  focus:border-green-600
                  disabled:bg-gray-50
                  disabled:text-gray-400
                "
              >

                {
                  !demandProducts.length
                  &&
                  (
                    <option
                      value=""
                    >
                      No products available
                    </option>
                  )
                }


                {
                  demandProducts.map(
                    (
                      product
                    ) => {

                      const key =
                        getProductKey(
                          product
                        );


                      return (

                        <option
                          key={
                            key
                          }
                          value={
                            key
                          }
                        >

                          {
                            getProductName(
                              product
                            )
                          }

                          {" — "}

                          {
                            formatProductType(
                              product
                                ?.product_type
                            )
                          }

                        </option>

                      );

                    }
                  )
                }

              </select>


              <ChevronDown
                size={15}
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                  pointer-events-none
                "
              />

            </div>

          </div>


          {/* AUTO PRODUCT TYPE */}

          <div
            className="
              md:col-span-3
            "
          >

            <ReadOnlyDropdownField
              label="Product Type"
              value={
                selectedProduct
                  ? formatProductType(
                      selectedProduct
                        ?.product_type
                    )
                  : "—"
              }
            />

          </div>


          {/* WEEKLY / MONTHLY */}

          <div
            className="
              md:col-span-3
            "
          >

            <Dropdown
              label="Forecast View"
              options={
                FORECAST_VIEW_OPTIONS
              }
              value={
                forecastView
              }
              onChange={
                (
                  nextValue
                ) => {

                  lastRequestKeyRef.current =
                    "";


                  setForecastView(
                    nextValue
                  );

                }
              }
            />

          </div>

        </div>

      </div>


      {/* ===================================================
          ERRORS
      ==================================================== */}

      {
        errors?.products
        &&
        (
          <div
            className="
              rounded-lg
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-xs
              text-red-700
            "
          >
            {errors.products}
          </div>
        )
      }


      {
        errors?.demand
        &&
        (
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              rounded-lg
              border
              border-red-200
              bg-red-50
              px-4
              py-3
            "
          >

            <span
              className="
                text-xs
                text-red-700
              "
            >
              {errors.demand}
            </span>


            <button
              type="button"
              onClick={
                () => {

                  runForecast({
                    force:
                      true,
                  }).catch(
                    () => {}
                  );

                }
              }
              disabled={
                loading?.demand
              }
              className="
                shrink-0
                inline-flex
                items-center
                gap-1.5
                text-xs
                font-semibold
                text-red-700
                hover:text-red-800
                disabled:opacity-50
              "
            >

              <RefreshCw
                size={13}
              />

              Retry

            </button>

          </div>
        )
      }


      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-3
          gap-6
        "
      >


        {/* =================================================
            LEFT SIDE
        ================================================== */}

        <div
          className="
            xl:col-span-2
            flex
            flex-col
            gap-6
          "
        >


          {/* CHART */}

          <div
            className="
              border
              border-slate-200
              rounded-xl
              bg-white
              p-6
              shadow-sm
            "
          >

            <div
              className="
                flex
                justify-between
                items-center
                mb-8
              "
            >

              <h4
                className="
                  font-bold
                  text-gray-900
                  text-md
                "
              >
                Historical & Forecasted Demand
              </h4>

              <div className="flex items-center gap-2">
                {!isInsufficient && forecastPeriods.length > 0 && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                      demandForecast?.feature_snapshot?.methodology?.uses_time_series_mlr
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {demandForecast?.feature_snapshot?.methodology?.forecast_method_label || (
                      demandForecast?.feature_snapshot?.methodology?.uses_time_series_mlr
                        ? "TS-MLR Model"
                        : "Preliminary Estimate"
                    )}
                  </span>
                )}
                <span
                  className="
                    text-xs
                    font-medium
                    text-gray-500
                    bg-gray-100
                    px-3
                    py-1
                    rounded-md
                  "
                >
                  Unit: kg
                </span>
              </div>

            </div>


            {
              loading?.demand
                ? (

                  <div
                    className="
                      w-full
                      h-64
                      flex
                      flex-col
                      items-center
                      justify-center
                    "
                  >

                    <LoaderCircle
                      size={28}
                      className="
                        animate-spin
                        text-green-700
                      "
                    />


                    <p
                      className="
                        mt-3
                        text-xs
                        text-gray-500
                      "
                    >
                      Generating {forecastView} Demand Forecast...
                    </p>

                  </div>

                )
                : (

                  <DemandChart
                    historicalPeriods={historicalPeriods}
                    forecastPeriods={forecastPeriods}
                    forecastView={forecastView}
                    loading={loading?.demand}
                    varietyName={getProductName(selectedProduct)}
                  />

                )
            }

          </div>


          {/* KPI CARDS */}

          <div
            className="
              grid
              grid-cols-2
              md:grid-cols-4
              gap-4
            "
          >


            <div
              className="
                border
                border-slate-200
                rounded-xl
                bg-white
                p-4
                shadow-sm
              "
            >

              <p
                className="
                  text-xs
                  text-gray-500
                  font-medium
                  mb-1
                "
              >
                Forecasted Demand
              </p>


              <p
                className="
                  text-lg
                  font-bold
                  text-green-700
                "
              >

                {
                  isInsufficient
                    ? (
                      <span className="text-gray-400 font-semibold">
                        N/A
                      </span>
                    )
                    : (
                      <>
                        {
                          formatKg(
                            forecastedDemand
                          )
                        }

                        {" "}

                        <span
                          className="
                            text-xs
                            font-normal
                            text-gray-900
                          "
                        >
                          kg
                        </span>
                      </>
                    )
                }

              </p>

            </div>


            <div
              className="
                border
                border-slate-200
                rounded-xl
                bg-white
                p-4
                shadow-sm
              "
            >

              <p
                className="
                  text-xs
                  text-gray-500
                  font-medium
                  mb-1
                "
              >
                Demand Trend
              </p>


              {
                isInsufficient
                  ? (
                    <p className="text-md font-bold text-gray-400">
                      N/A
                    </p>
                  )
                  : (
                    <p
                      className={`
                        text-md
                        font-bold
                        flex
                        items-center
                        gap-1
                        ${
                          trendPresentation
                            .classes
                        }
                      `}
                    >

                      <TrendIcon
                        size={16}
                      />

                      {
                        trendPresentation
                          .label
                      }

                    </p>
                  )
              }

            </div>


            <div
              className="
                border
                border-slate-200
                rounded-xl
                bg-white
                p-4
                shadow-sm
              "
            >

              <p
                className="
                  text-xs
                  text-gray-500
                  font-medium
                  mb-1
                "
              >
                Peak Period
              </p>


              <p
                className="
                  text-md
                  font-bold
                  text-gray-900
                "
              >

                {
                  isInsufficient
                    ? (
                      <span className="text-gray-400 font-semibold">
                        N/A
                      </span>
                    )
                    : (
                      peakPeriod
                        ? (
                            forecastView
                            ===
                            "Weekly"
                              ? formatWeek(
                                  getPeriodStart(
                                    peakPeriod
                                  )
                                )
                              : formatMonthYear(
                                  getPeriodStart(
                                    peakPeriod
                                  )
                                )
                          )
                        : "—"
                    )
                }

              </p>

            </div>


            <div
              className="
                border
                border-slate-200
                rounded-xl
                bg-white
                p-4
                shadow-sm
              "
            >

              <p
                className="
                  text-xs
                  text-gray-500
                  font-medium
                  mb-1
                "
              >
                Expected Level
              </p>


              <div
                className={`
                  mt-1
                  inline-flex
                  items-center
                  justify-center
                  px-3
                  py-1
                  rounded-md
                  text-xs
                  font-bold
                  w-full
                  ${
                    expectedLevel
                      .classes
                  }
                `}
              >

                {
                  expectedLevel
                    .label
                }

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            RIGHT SIDE
        ================================================== */}

        <div
          className="
            flex
            flex-col
            gap-4
          "
        >


          {/* LOCAL MARKET COMPETITION ANALYSIS */}
          <div className="border border-slate-200 rounded-xl bg-white p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-gray-900 text-md flex items-center gap-2">
                <Users className="text-emerald-700" size={18} />
                Competition Analysis
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                <ShieldCheck size={12} className="text-emerald-700" />
                Verified Registry
              </span>
            </div>

            {loading?.competitor ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-gray-500">
                <LoaderCircle className="animate-spin text-emerald-700" size={22} />
                <span className="text-xs">Researching local agricultural registry...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                      Registered Competing Farmers
                    </p>
                    <p className="text-xl font-extrabold text-emerald-950 mt-0.5">
                      {competitorAnalysis?.competitor_count_display || "Data unavailable"}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                    <Users size={18} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1.5 text-xs text-gray-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-start justify-between gap-2 py-1 border-b border-slate-200/60">
                    <span className="font-medium text-gray-500 flex items-center gap-1.5">
                      <MapPin size={13} className="text-emerald-700 shrink-0" />
                      Coverage
                    </span>
                    <span className="font-semibold text-gray-900 text-right">
                      {competitorAnalysis?.geographic_coverage || "Municipality Level"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2 py-1 border-b border-slate-200/60">
                    <span className="font-medium text-gray-500 flex items-center gap-1.5">
                      <Calendar size={13} className="text-emerald-700 shrink-0" />
                      Year & Source
                    </span>
                    <span className="font-semibold text-gray-900 text-right">
                      {competitorAnalysis?.data_year || "2024"} ({competitorAnalysis?.source || "DA-RSBSA"})
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2 py-1">
                    <span className="font-medium text-gray-500 flex items-center gap-1.5">
                      <Info size={13} className="text-emerald-700 shrink-0" />
                      Variety Focus
                    </span>
                    <span className="font-semibold text-gray-900 text-right">
                      {competitorAnalysis?.variety_focus || selectedProduct?.rice_variety || "Inbred Palay"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed bg-white border border-gray-100 p-3 rounded-lg">
                  {competitorAnalysis?.variety_context || competitorAnalysis?.market_analysis || "Official public agricultural registries provide municipality-level registered palay farmer totals."}
                </p>

                {competitorAnalysis?.barangay_note && (
                  <p className="text-[11px] text-gray-500 italic">
                    * {competitorAnalysis.barangay_note}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* INSIGHTS */}
          <div className="border border-slate-200 rounded-xl bg-white p-6 shadow-sm flex flex-col gap-5">
            <h4 className="font-bold text-gray-900 text-md flex items-center gap-2">
              <Lightbulb className="text-yellow-500" size={18} />
              Insights & Considerations
            </h4>

            <div>
              <h5 className="text-sm font-semibold text-green-700 mb-1">
                Product Demand Summary
              </h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                {productDemandSummary}
              </p>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h5 className="text-sm font-semibold text-yellow-600 mb-1">
                Production Consideration
              </h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                {productionConsideration}
              </p>
            </div>
          </div>

          {/* EXPORT ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={!demandForecast || loading?.demand}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3.5 py-3 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export demand forecast details to CSV"
            >
              <FileSpreadsheet size={15} className="text-emerald-700" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={!demandForecast || loading?.demand}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-slate-900 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export demand forecast details to PDF"
            >
              <FileDown size={15} />
              <span>Export PDF</span>
            </button>
          </div>


          {/* FORECAST INFO */}

          <div
            className="
              border
              border-slate-200
              rounded-xl
              bg-white
              p-5
              shadow-sm
              mt-2
            "
          >

            <h5
              className="
                text-xs
                font-bold
                text-gray-900
                mb-3
              "
            >
              Forecast Information
            </h5>


            <div
              className="
                flex
                justify-between
                items-center
                gap-4
                py-2
                border-b
                border-gray-100
              "
            >

              <span
                className="
                  text-xs
                  text-gray-500
                "
              >
                Selected Product
              </span>


              <span
                className="
                  text-xs
                  font-medium
                  text-gray-900
                  text-right
                "
              >

                {
                  selectedProduct
                    ? getProductName(
                        selectedProduct
                      )
                    : "—"
                }

              </span>

            </div>


            <div
              className="
                flex
                justify-between
                items-center
                gap-4
                py-2
                border-b
                border-gray-100
              "
            >

              <span
                className="
                  text-xs
                  text-gray-500
                "
              >
                Product Type
              </span>


              <span
                className="
                  text-xs
                  font-medium
                  text-gray-900
                  text-right
                "
              >

                {
                  selectedProduct
                    ? formatProductType(
                        selectedProduct
                          ?.product_type
                      )
                    : "—"
                }

              </span>

            </div>


            <div
              className="
                flex
                justify-between
                items-center
                gap-4
                py-2
                border-b
                border-gray-100
              "
            >

              <span
                className="
                  text-xs
                  text-gray-500
                "
              >
                Forecast View
              </span>


              <span
                className="
                  text-xs
                  font-medium
                  text-gray-900
                  text-right
                "
              >
                {forecastView}
              </span>

            </div>


            <div
              className="
                flex
                justify-between
                items-center
                gap-4
                py-2
              "
            >

              <span
                className="
                  text-xs
                  text-gray-500
                "
              >
                Forecast
                <br />
                Period
              </span>


              <span
                className="
                  text-xs
                  font-medium
                  text-gray-900
                  text-right
                "
              >

                {
                  formatForecastPeriod(
                    forecastStart,
                    forecastEnd,
                    forecastView
                  )
                }

              </span>

            </div>

          </div>

        </div>

      </div>

      <Toast toasts={toasts} removeToast={removeToast} />

    </div>

  );

}
