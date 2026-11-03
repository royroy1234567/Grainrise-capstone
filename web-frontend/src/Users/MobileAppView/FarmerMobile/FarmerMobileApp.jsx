import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Bell,
  X,
  CheckCircle2,
} from "lucide-react";

import { INITIAL_FARMER_DATA } from "./FarmerMobileMockData";
import FarmerMobileHeader from "./FarmerMobileHeader";
import FarmerMobileKPICards from "./FarmerMobileKPICards";
import FarmerMobilePriceTrendChart from "./FarmerMobilePriceTrendChart";
import FarmerMobileYieldHistoryChart from "./FarmerMobileYieldHistoryChart";
import FarmerMobileClimateChart from "./FarmerMobileClimateChart";
import FarmerMobileBottomNav from "./FarmerMobileBottomNav";
import FarmerMobileMoreModal from "./FarmerMobileMoreModal";
import FarmerMobileFarmView from "./FarmerMobileFarmView";
import FarmerMobileContractsView from "./FarmerMobileContractsView";
import FarmerMobileMessagesView from "./FarmerMobileMessagesView";
import FarmerMobileForecastingView from "./FarmerMobileForecastingView";
import FarmerMobilePOSView from "./FarmerMobilePOSView";
import FarmerMobileTransactionHistoryView from "./FarmerMobileTransactionHistoryView";
import FarmerMobileNewsView from "./FarmerMobileNewsView";

/**
 * FarmerMobileApp
 *
 * Full mobile application implementation for Farmer Mobile View,
 * fully responsive and optimized to fit and maximize across all Android device screen sizes:
 * - Small phones: 320px - 360px (Samsung Galaxy A/J, Galaxy Fold outer cover screen)
 * - Standard phones: 375px - 412px (Google Pixel 6/7/8/9, Galaxy S21-S24, Xiaomi, Vivo, Oppo)
 * - Large phones & foldables: 430px - 540px+ (Pro Max, Note, Fold unfolded)
 */
export default function FarmerMobileApp({ onExternalNavigate }) {
  const [data, setData] = useState(INITIAL_FARMER_DATA);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) return tabParam;
    }
    return "dashboard";
  });

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  // Scroll to top whenever tab changes (crucial for mobile screens)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleBottomTabChange = (tabId) => {
    if (tabId === "more") {
      setIsMoreOpen(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const handleSelectMoreAction = (actionId) => {
    setActiveTab(actionId);
  };

  const handleCompleteSale = (saleData) => {
    const newTx = {
      id: `TX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: "Just now",
      buyer: saleData.buyerName,
      item: `${saleData.product} (${saleData.quantityKg} kg)`,
      amount: `₱${Number(saleData.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      type: "Point of Sale",
      paymentMethod: saleData.paymentMode,
      status: "Completed",
    };

    setData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));

    showToast(`Sale of ${saleData.quantityKg}kg recorded successfully!`);
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900 relative overflow-x-hidden touch-manipulation">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300 max-w-[90vw]">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Top Header (Figma) ─────────────────────────────────── */}
      <FarmerMobileHeader
        onSearchClick={() => setShowSearchModal(true)}
        onNotificationClick={() => setShowNotificationsModal(true)}
        onProfileClick={() => setShowProfileModal(true)}
        unreadNotifications={data.notifications.filter((n) => !n.read).length}
        userInitials={data.farmerInfo.farmerInitials}
      />

      {/* ── 2. Main Content Views (Maximized for Android screens) ── */}
      <main className="flex-1 px-3.5 sm:px-4 py-3 sm:py-4 space-y-3.5 sm:space-y-4 w-full pb-24 sm:pb-28">
        {activeTab === "dashboard" && (
          <>
            {/* Dashboard Title & Updated Timestamp Badge */}
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Dashboard
              </h1>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] sm:text-xs text-slate-500 font-medium shadow-2xs max-w-full truncate">
                <Calendar size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{data.farmerInfo.currentDate}</span>
                <span className="text-slate-300">&bull;</span>
                <span className="truncate">{data.farmerInfo.lastUpdated}</span>
              </div>
            </div>

            {/* 4 KPI Metric Cards (2x2 Grid) */}
            <FarmerMobileKPICards
              metrics={data.kpis}
              onCardClick={(tab) => setActiveTab(tab)}
            />

            {/* Palay Market Price Trend Chart */}
            <FarmerMobilePriceTrendChart
              trendData={data.palayPriceTrend}
            />

            {/* Harvest & Yield History Bar Chart */}
            <FarmerMobileYieldHistoryChart
              yieldData={data.yieldHistory}
            />

            {/* 6-Month Climate Outlook Combo Chart */}
            <FarmerMobileClimateChart
              climateData={data.climateOutlook}
            />
          </>
        )}

        {/* Tab: Farm Management */}
        {activeTab === "farm" && (
          <FarmerMobileFarmView
            farms={data.farms}
          />
        )}

        {/* Tab: Contracts */}
        {activeTab === "contracts" && (
          <FarmerMobileContractsView
            contracts={data.contracts}
          />
        )}

        {/* Tab: Messages */}
        {activeTab === "messages" && (
          <FarmerMobileMessagesView
            messages={data.messages}
          />
        )}

        {/* Action: Forecasting */}
        {activeTab === "forecasting" && (
          <FarmerMobileForecastingView
            onBack={() => setActiveTab("dashboard")}
          />
        )}

        {/* Action: Point of Sale */}
        {activeTab === "pos" && (
          <FarmerMobilePOSView
            onBack={() => setActiveTab("dashboard")}
            onCompleteSale={handleCompleteSale}
          />
        )}

        {/* Action: Transaction History */}
        {activeTab === "transactions" && (
          <FarmerMobileTransactionHistoryView
            transactions={data.transactions}
            onBack={() => setActiveTab("dashboard")}
          />
        )}

        {/* Action: News & Updates */}
        {activeTab === "news" && (
          <FarmerMobileNewsView
            news={data.news}
            onBack={() => setActiveTab("dashboard")}
          />
        )}
      </main>

      {/* ── 3. Bottom Navigation Bar (Fitted with Safe Area Inset) ── */}
      <FarmerMobileBottomNav
        activeTab={
          ["dashboard", "farm", "contracts", "messages"].includes(activeTab)
            ? activeTab
            : "dashboard"
        }
        onTabChange={handleBottomTabChange}
        unreadMessagesCount={data.messages.filter((m) => m.unreadCount > 0).length}
      />

      {/* ── 4. "More" Bottom Sheet Drawer ─────────────────────────── */}
      <FarmerMobileMoreModal
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        onSelectAction={handleSelectMoreAction}
      />

      {/* ── 5. Search Modal ────────────────────────────────────────── */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-16">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Search GrainRise
              </h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search millers, contracts, or farm advisories..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d5921]"
                autoFocus
              />
            </div>
            <div className="space-y-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Popular Searches
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Golden Grains Mill", "Palay Buying Price", "August Rainfall", "Dry Palay 14%"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setSearchQuery(item)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Notifications Modal ─────────────────────────────────── */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-16">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-[#0d5921]" />
                <h3 className="text-base font-bold text-slate-900">
                  Notifications
                </h3>
              </div>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {data.notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-xs space-y-1 cursor-pointer"
                >
                  <p className="font-semibold text-slate-800">{n.title}</p>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {n.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Profile Modal ───────────────────────────────────────── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full space-y-4 shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-[#0d5921] text-white text-xl font-bold flex items-center justify-center mx-auto shadow-sm">
              {data.farmerInfo.farmerInitials}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {data.farmerInfo.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {data.farmerInfo.farmLocation}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 font-medium">
              Registered Farmer ID: <strong>GR-FRM-2026-004</strong>
            </div>
            <button
              onClick={() => {
                setShowProfileModal(false);
                if (onExternalNavigate) onExternalNavigate("/login");
              }}
              className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 cursor-pointer"
            >
              Sign Out
            </button>
            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs hover:bg-slate-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
