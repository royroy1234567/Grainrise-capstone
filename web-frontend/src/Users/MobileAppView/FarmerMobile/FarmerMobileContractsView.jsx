import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  PlusCircle,
  Calendar,
  Clock,
  Coins,
  Hourglass,
  Eye,
  RefreshCw,
  X,
  CheckCircle2,
  Building2,
  MapPin,
  Sparkles,
  Check,
  Ban,
} from "lucide-react";

import riceSackImg from "../../../assets/rice-sack-pos.jpg";
import riceFieldImg from "../../../assets/ricee.jpg";
import grainTableImg from "../../../assets/graintablee.jpg";

/**
 * FarmerMobileContractsView
 *
 * Full and exact replica of all 4 subtabs from the Figma designs:
 * 1. Application: Search, All/Pending/Under Review/Declined, Application cards with status badges & View Details
 * 2. Offers: "+ Create Open Bidding", Search, Bidding cards (Dinorado, Jasmine, Basmati, Sinandomeng), View Offers
 * 3. Opportunities: Search, Photo cards with UNMILLED/MILLED badges, days left, price/kg, mill info, location, View Details
 * 4. Contracts: Search miller ID, All/Active/Due Soon/Completed, Photo cards with CON-ID, status badge, ABC Rice Mill, 4-grid specs, total value, fulfillment date, View Details
 */
export default function FarmerMobileContractsView() {
  const [activeSubTab, setActiveSubTab] = useState("Opportunities");
  const [searchQuery, setSearchQuery] = useState("");
  const [offerFilter, setOfferFilter] = useState("All");
  const [appFilter, setAppFilter] = useState("All");
  const [contractFilter, setContractFilter] = useState("All");

  // Modals
  const [showCreateBiddingModal, setShowCreateBiddingModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // New bidding form state
  const [newVariety, setNewVariety] = useState("Dinorado Special");
  const [newQuantity, setNewQuantity] = useState("2500");
  const [newDeadline, setNewDeadline] = useState("2026-11-15");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ── MOCK DATA FOR OFFERS ──────────────────────────────────────────
  const [biddings, setBiddings] = useState([
    {
      id: "BID-2026-0582",
      variety: "Dinorado",
      requiredQty: "2,500",
      startDate: "Oct 12, 2026",
      deadline: "Oct 26, 2026",
      status: "High Demand",
      offersCount: 12,
      offersReceivedText: "12 Offers Received",
      offersList: [
        { miller: "Golden Grains Mill", price: "₱29.50/kg", volume: "2,500 kg", payout: "₱73,750" },
        { miller: "Bulacan Central Milling", price: "₱29.00/kg", volume: "2,500 kg", payout: "₱72,500" },
        { miller: "Marilao Agro Hub", price: "₱28.80/kg", volume: "2,500 kg", payout: "₱72,000" },
      ],
    },
    {
      id: "BID-2026-0569",
      variety: "Jasmine Rice Premium",
      requiredQty: "1,800",
      startDate: "Oct 15, 2026",
      deadline: "Nov 02, 2026",
      status: "Open",
      offersCount: 4,
      offersReceivedText: "4 Offers Received",
      offersList: [
        { miller: "Bocaue Milling Corp.", price: "₱32.00/kg", volume: "1,800 kg", payout: "₱57,600" },
        { miller: "Central Luzon Grains", price: "₱31.50/kg", volume: "1,800 kg", payout: "₱56,700" },
      ],
    },
    {
      id: "BID-2026-0545",
      variety: "Basmati Grade A",
      requiredQty: "5,000",
      startDate: "Oct 18, 2026",
      deadline: "Nov 10, 2026",
      status: "Open",
      offersCount: 0,
      offersReceivedText: "0 Offers Yet",
      offersList: [],
    },
    {
      id: "BID-2026-0538",
      variety: "Sinandomeng Special",
      requiredQty: "3,200",
      startDate: "Oct 20, 2026",
      deadline: "Nov 05, 2026",
      status: "High Demand",
      offersCount: 8,
      offersReceivedText: "8 Offers Received",
      offersList: [
        { miller: "San Ildefonso Rice Mill", price: "₱28.50/kg", volume: "3,200 kg", payout: "₱91,200" },
        { miller: "Golden Grains Mill", price: "₱28.00/kg", volume: "3,200 kg", payout: "₱89,600" },
      ],
    },
  ]);

  // ── MOCK DATA FOR APPLICATIONS ────────────────────────────────────
  const [applications] = useState([
    {
      id: "APP-001",
      millName: "ABC Rice Mill",
      appliedDate: "August 24, 2026",
      variety: "Jasmine Rice",
      quantity: "500 kg",
      status: "Pending",
      notes: "Awaiting miller inspection schedule.",
    },
    {
      id: "APP-002",
      millName: "ABC Rice Mill",
      appliedDate: "August 24, 2026",
      variety: "Jasmine Rice",
      quantity: "500 kg",
      status: "Under Review",
      notes: "Milling officer reviewing moisture compliance certificates.",
    },
    {
      id: "APP-003",
      millName: "ABC Rice Mill",
      appliedDate: "August 24, 2026",
      variety: "Jasmine Rice",
      quantity: "500 kg",
      status: "Declined",
      notes: "Quota filled for this production cycle.",
    },
    {
      id: "APP-004",
      millName: "ABC Rice Mill",
      appliedDate: "August 24, 2026",
      variety: "Jasmine Rice",
      quantity: "500 kg",
      status: "Pending",
      notes: "Application submitted to Bocaue central station.",
    },
    {
      id: "APP-005",
      millName: "ABC Rice Mill",
      appliedDate: "August 24, 2026",
      variety: "Jasmine Rice",
      quantity: "500 kg",
      status: "Under Review",
      notes: "Moisture content and purity evaluation in progress.",
    },
  ]);

  // ── MOCK DATA FOR OPPORTUNITIES (Figma Screenshots 3 & 4) ─────────
  const [opportunities] = useState([
    {
      id: "OPP-001",
      variety: "Premium Jasmine",
      pricePerKg: "₱19.50",
      categoryBadge: "UNMILLED PALAY",
      timeLeftBadge: "⏱ 3 days left",
      timeLeftColor: "bg-[#fef3c7] text-[#92400e]",
      millerName: "Central Valley Millers",
      spotBadge: "Spot Cash",
      spotBadgeColor: "bg-[#dcfce7] text-[#15803d]",
      quantityRequired: "10,000 kg",
      fulfillmentDate: "Oct 15, 2026",
      location: "Nueva Ecija, Philippines",
      depot: "Depot Hub #4",
      image: grainTableImg,
    },
    {
      id: "OPP-002",
      variety: "Basmati Rice",
      pricePerKg: "₱18.75",
      categoryBadge: "MILLED PALAY",
      timeLeftBadge: "📅 12 days left",
      timeLeftColor: "bg-white/90 text-slate-700",
      millerName: "Global Grains Corp.",
      spotBadge: "High Volume",
      spotBadgeColor: "bg-[#ffe4e6] text-[#be123c]",
      quantityRequired: "25,000 kg",
      fulfillmentDate: "Oct 20, 2026",
      location: "Pangasinan, Philippines",
      depot: "Central Mill Delivery",
      image: riceSackImg,
    },
    {
      id: "OPP-003",
      variety: "Premium Jasmine",
      pricePerKg: "₱19.50",
      categoryBadge: "UNMILLED PALAY",
      timeLeftBadge: "⏱ 3 days left",
      timeLeftColor: "bg-[#fef3c7] text-[#92400e]",
      millerName: "Central Valley Millers",
      spotBadge: "Spot Cash",
      spotBadgeColor: "bg-[#dcfce7] text-[#15803d]",
      quantityRequired: "10,000 kg",
      fulfillmentDate: "Oct 15, 2026",
      location: "Nueva Ecija, Philippines",
      depot: "Depot Hub #4",
      image: riceFieldImg,
    },
  ]);

  // ── MOCK DATA FOR CURRENT CONTRACTS (Figma Screenshots 1 & 2) ─────
  const [contractsList] = useState([
    {
      id: "CON-2026-0023",
      millName: "ABC Rice Mill",
      verified: true,
      buyerId: "Buyer ID: BYR-772 • Central Depot Luzon",
      status: "Due Soon",
      statusColor: "bg-[#fef3c7] text-[#92400e]",
      product: "Milled Palay",
      variety: "Dinorado Premium",
      quantity: "2,500 kg (50 bags)",
      pricing: "₱20.00 /kg",
      totalValueLabel: "TOTAL CONTRACT VALUE",
      totalValue: "₱50,000.00",
      dateLabel: "FULFILLMENT DATE",
      dateValue: "Oct 15, 2026",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "CON-2026-0024",
      millName: "ABC Rice Mill",
      verified: true,
      buyerId: "Buyer ID: BYR-772 • Central Depot Luzon",
      status: "Active",
      statusColor: "bg-[#dcfce7] text-[#15803d]",
      product: "Milled Palay",
      variety: "Dinorado Premium",
      quantity: "2,500 kg (50 bags)",
      pricing: "₱20.00 /kg",
      totalValueLabel: "TOTAL CONTRACT VALUE",
      totalValue: "₱50,000.00",
      dateLabel: "FULFILLMENT DATE",
      dateValue: "Oct 28, 2026",
      image: "https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "CON-2026-0025",
      millName: "ABC Rice Mill",
      verified: true,
      buyerId: "Buyer ID: BYR-772 • North Station",
      status: "Completed",
      statusColor: "bg-[#e0e7ff] text-[#3730a3]",
      product: "Milled Palay",
      variety: "Dinorado Select",
      quantity: "2,500 kg (Delivered)",
      pricing: "₱20.00 /kg",
      totalValueLabel: "TOTAL DISBURSED VALUE",
      totalValue: "₱50,000.00",
      dateLabel: "FULFILLED ON",
      dateValue: "Sep 30, 2026",
      image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "CON-2026-0026",
      millName: "ABC Rice Mill",
      verified: false,
      buyerId: "Buyer ID: BYR-772 • Mutual Termination",
      status: "Cancelled",
      statusColor: "bg-[#f1f5f9] text-[#64748b]",
      product: "Milled Palay",
      variety: "Dinorado",
      quantity: "2,500 kg",
      pricing: "₱20.00 /kg",
      totalValueLabel: "TOTAL VALUE",
      totalValue: "₱50,000.00",
      isStrikethrough: true,
      dateLabel: "CLOSED ON",
      dateValue: "Oct 15, 2026",
      image: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=600&q=80",
    },
  ]);

  // Filtering
  const filteredBiddings = biddings.filter((b) => {
    const matches =
      b.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (offerFilter === "High Demand") return matches && b.status === "High Demand";
    if (offerFilter === "Open") return matches && b.status === "Open";
    return matches;
  });

  const filteredApps = applications.filter((a) => {
    const matches =
      a.millName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.variety.toLowerCase().includes(searchQuery.toLowerCase());
    if (appFilter === "Pending") return matches && a.status === "Pending";
    if (appFilter === "Under Review") return matches && a.status === "Under Review";
    if (appFilter === "Declined") return matches && a.status === "Declined";
    return matches;
  });

  const filteredOpportunities = opportunities.filter((o) => {
    return (
      o.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.millerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredContracts = contractsList.filter((c) => {
    const matches =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.millName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.variety.toLowerCase().includes(searchQuery.toLowerCase());
    if (contractFilter === "Active") return matches && c.status === "Active";
    if (contractFilter === "Due Soon") return matches && c.status === "Due Soon";
    if (contractFilter === "Completed") return matches && c.status === "Completed";
    return matches;
  });

  const handleCreateBidding = (e) => {
    e.preventDefault();
    const newBid = {
      id: `BID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      variety: newVariety,
      requiredQty: Number(newQuantity).toLocaleString(),
      startDate: "Today",
      deadline: newDeadline,
      status: "Open",
      offersCount: 0,
      offersReceivedText: "0 Offers Yet",
      offersList: [],
    };
    setBiddings([newBid, ...biddings]);
    setShowCreateBiddingModal(false);
    showToast(`Bidding for ${newQuantity}kg ${newVariety} published!`);
  };

  return (
    <div className="space-y-3.5">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Title: Contracts */}
      <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
        Contracts
      </h1>

      {/* ── 4 Top Navigation Subtabs Pill Container (Figma) ────── */}
      <div className="bg-[#f1f5f9] p-1 rounded-2xl flex items-center justify-between text-xs font-semibold">
        {["Application", "Offers", "Opportunities", "Contracts"].map((tab) => {
          const isActive = activeSubTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveSubTab(tab);
                setSearchQuery("");
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all cursor-pointer truncate ${
                isActive
                  ? "bg-[#0d5921] text-white font-bold shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 1: APPLICATION
      ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === "Application" && (
        <div className="space-y-3">
          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applications....."
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d5921] shadow-2xs"
              />
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer shrink-0"
            >
              <SlidersHorizontal size={14} className="text-slate-500" />
              <span>All</span>
              <span className="text-[10px] text-slate-400">&#9662;</span>
            </button>
          </div>

          {/* Status Counts Row */}
          <div className="flex items-center gap-3 text-xs font-semibold px-0.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setAppFilter("All")}
              className={`cursor-pointer whitespace-nowrap ${
                appFilter === "All" ? "text-[#0d5921] font-bold" : "text-slate-400"
              }`}
            >
              All (75)
            </button>
            <button
              onClick={() => setAppFilter("Pending")}
              className={`cursor-pointer whitespace-nowrap ${
                appFilter === "Pending" ? "text-[#0d5921] font-bold" : "text-slate-400"
              }`}
            >
              Pending (25)
            </button>
            <button
              onClick={() => setAppFilter("Under Review")}
              className={`cursor-pointer whitespace-nowrap ${
                appFilter === "Under Review" ? "text-[#0d5921] font-bold" : "text-slate-400"
              }`}
            >
              Under Review (27)
            </button>
            <button
              onClick={() => setAppFilter("Declined")}
              className={`cursor-pointer whitespace-nowrap ${
                appFilter === "Declined" ? "text-[#0d5921] font-bold" : "text-slate-400"
              }`}
            >
              Declined (23)
            </button>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {app.millName}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      Applied: {app.appliedDate}
                    </p>
                  </div>

                  {app.status === "Pending" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] text-[10px] font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#b45309]" />
                      Pending
                    </span>
                  )}
                  {app.status === "Under Review" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e0e7ff] text-[#3730a3] text-[10px] font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3730a3]" />
                      Under Review
                    </span>
                  )}
                  {app.status === "Declined" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffe4e6] text-[#be123c] text-[10px] font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#be123c]" />
                      Declined
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Variety</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">{app.variety}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Quantity</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">{app.quantity}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedApp(app)}
                  className="w-full py-2.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-[0.99] text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye size={14} className="text-slate-500" />
                  <span>View Details</span>
                </button>
              </div>
            ))}
          </div>

          <div className="text-center pt-2 pb-2 space-y-1.5">
            <p className="text-xs text-slate-400 font-medium">
              Showing {filteredApps.length} of 75 applications
            </p>
            <button
              onClick={() => showToast("Loaded all latest applications")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Load More</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 2: OFFERS
      ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === "Offers" && (
        <div className="space-y-3">
          <button
            onClick={() => setShowCreateBiddingModal(true)}
            className="w-full py-3 px-4 rounded-2xl bg-[#0d5921] hover:bg-[#0b4b1c] active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle size={18} strokeWidth={2.2} />
            <span>Create Open Bidding</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search open biddings......"
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d5921] shadow-2xs"
              />
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer shrink-0"
            >
              <SlidersHorizontal size={14} className="text-slate-500" />
              <span>All</span>
              <span className="text-[10px] text-slate-400">&#9662;</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold px-0.5">
            <button
              onClick={() => setOfferFilter("All")}
              className={`cursor-pointer ${
                offerFilter === "All" ? "text-[#0d5921] font-bold" : "text-slate-400"
              }`}
            >
              All (75)
            </button>
            <button
              onClick={() => setOfferFilter("High Demand")}
              className={`cursor-pointer ${
                offerFilter === "High Demand" ? "text-[#0d5921] font-bold" : "text-slate-400"
              }`}
            >
              High Demand (50)
            </button>
            <button
              onClick={() => setOfferFilter("Open")}
              className={`cursor-pointer ${
                offerFilter === "Open" ? "text-[#0d5921] font-bold" : "text-slate-400"
              }`}
            >
              Open (25)
            </button>
          </div>

          <div className="space-y-3">
            {filteredBiddings.map((bid) => (
              <div
                key={bid.id}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                    {bid.id}
                  </span>
                  {bid.status === "High Demand" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] text-[10px] font-black">
                      <Sparkles size={11} className="text-[#b45309]" />
                      High Demand
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[10px] font-black">
                      Open
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                      {bid.variety}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                      REQUIRED QUANTITY
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-[#0d5921] tracking-tight">
                      {bid.requiredQty}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 ml-1">kg</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-tight font-medium">Start Date</span>
                      <span className="font-bold text-slate-800 text-[11px]">{bid.startDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-600" />
                    <div>
                      <span className="text-[10px] text-amber-600 block leading-tight font-medium">Deadline</span>
                      <span className="font-bold text-slate-800 text-[11px]">{bid.deadline}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-1.5">
                    {bid.offersCount > 0 ? (
                      <>
                        <Coins size={15} className="text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-800">
                          {bid.offersReceivedText}
                        </span>
                      </>
                    ) : (
                      <>
                        <Hourglass size={15} className="text-slate-400" />
                        <span className="text-xs font-medium text-slate-400">
                          {bid.offersReceivedText}
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedOffer(bid)}
                    className="px-4 py-1.5 rounded-xl border border-[#0d5921] text-[#0d5921] hover:bg-[#ebf6ed] active:scale-95 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    View Offers
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2 pb-2 space-y-1.5">
            <p className="text-xs text-slate-400 font-medium">
              Showing {filteredBiddings.length} of 75 biddings
            </p>
            <button
              onClick={() => showToast("Loaded all latest open biddings")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Load More</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 3: OPPORTUNITIES (Figma Screenshots 3 & 4)
      ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === "Opportunities" && (
        <div className="space-y-3">
          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search opportunities....."
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d5921] shadow-2xs"
              />
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer shrink-0"
            >
              <SlidersHorizontal size={14} className="text-slate-500" />
              <span>All</span>
              <span className="text-[10px] text-slate-400">&#9662;</span>
            </button>
          </div>

          {/* Opportunities Cards with Visual Banner matching Figma */}
          <div className="space-y-3.5">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-2xs space-y-3 pb-4"
              >
                {/* Photo Banner with Badges */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                  <img
                    src={opp.image}
                    alt={opp.variety}
                    className="w-full h-full object-cover"
                  />
                  {/* Left Badge: UNMILLED PALAY / MILLED PALAY */}
                  <span className="absolute bottom-2.5 left-3 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-xs text-[10px] font-black text-slate-800 tracking-wider shadow-sm uppercase">
                    {opp.categoryBadge}
                  </span>

                  {/* Right Badge: ⏱ 3 days left / 📅 12 days left */}
                  <span
                    className={`absolute top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${opp.timeLeftColor}`}
                  >
                    {opp.timeLeftBadge}
                  </span>
                </div>

                {/* Body Content */}
                <div className="px-4 space-y-2.5">
                  {/* Title & Price/kg */}
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                      {opp.variety}
                    </h3>

                    <div className="text-right">
                      <span className="text-2xl font-black text-[#0d5921] tracking-tight">
                        {opp.pricePerKg}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 ml-0.5">
                        /kg
                      </span>
                    </div>
                  </div>

                  {/* Miller Name & Spot Cash / High Volume Badge */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Building2 size={14} className="text-[#0d5921] shrink-0" />
                      <span className="truncate">{opp.millerName}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${opp.spotBadgeColor}`}
                    >
                      {opp.spotBadge}
                    </span>
                  </div>

                  {/* 2-Column Quantity & Fulfillment Date */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-50">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Quantity Required
                      </span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {opp.quantityRequired}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Fulfillment Date
                      </span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {opp.fulfillmentDate}
                      </span>
                    </div>
                  </div>

                  {/* Location & Depot */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <div className="flex items-center gap-1 truncate text-slate-600">
                      <MapPin size={12} className="text-amber-600 shrink-0" />
                      <span className="truncate">{opp.location}</span>
                    </div>
                    <span className="text-slate-400 whitespace-nowrap ml-2">
                      {opp.depot}
                    </span>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedOpportunity(opp)}
                    className="w-full mt-1 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-[0.99] text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye size={14} className="text-slate-500" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2 pb-2 space-y-1.5">
            <p className="text-xs text-slate-400 font-medium">
              Showing {filteredOpportunities.length} of 75 opportunities
            </p>
            <button
              onClick={() => showToast("Loaded all latest procurement opportunities")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Load More</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 4: CONTRACTS (Figma Screenshots 1 & 2)
      ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === "Contracts" && (
        <div className="space-y-3">
          {/* Search miller ID Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search miller ID....."
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d5921] shadow-2xs"
              />
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer shrink-0"
            >
              <SlidersHorizontal size={14} className="text-slate-500" />
              <span>All</span>
              <span className="text-[10px] text-slate-400">&#9662;</span>
            </button>
          </div>

          {/* Status Counts Row */}
          <div className="flex items-center gap-3 text-xs font-semibold px-0.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setContractFilter("All")}
              className={`cursor-pointer whitespace-nowrap ${
                contractFilter === "All" ? "text-[#0d5921] font-bold" : "text-slate-400"
              }`}
            >
              All (75)
            </button>
            <button
              onClick={() => setContractFilter("Active")}
              className={`cursor-pointer whitespace-nowrap ${
                contractFilter === "Active" ? "text-[#0d5921] font-bold" : "text-slate-400"
              }`}
            >
              Active (25)
            </button>
            <button
              onClick={() => setContractFilter("Due Soon")}
              className={`cursor-pointer whitespace-nowrap ${
                contractFilter === "Due Soon" ? "text-[#0d5921] font-bold" : "text-slate-400"
              }`}
            >
              Due Soon (27)
            </button>
            <button
              onClick={() => setContractFilter("Completed")}
              className={`cursor-pointer whitespace-nowrap ${
                contractFilter === "Completed" ? "text-[#0d5921] font-bold" : "text-slate-400"
              }`}
            >
              Completed (23)
            </button>
          </div>

          {/* Contract Cards with Facility Photos matching Figma */}
          <div className="space-y-3.5">
            {filteredContracts.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-2xs space-y-3 pb-4"
              >
                {/* Photo Banner with CON-ID and Status Badge */}
                <div className="relative h-36 w-full overflow-hidden bg-slate-200">
                  <img
                    src={c.image}
                    alt={c.millName}
                    className="w-full h-full object-cover"
                  />
                  {/* CON-ID Pill on Top Left */}
                  <span className="absolute top-2.5 left-3 px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-mono font-bold text-white tracking-wider">
                    {c.id}
                  </span>

                  {/* Status Pill on Top Right */}
                  <span
                    className={`absolute top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-sm flex items-center gap-1 ${c.statusColor}`}
                  >
                    {c.status === "Due Soon" && <Clock size={11} />}
                    {c.status === "Active" && <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />}
                    {c.status === "Completed" && <Check size={11} />}
                    {c.status === "Cancelled" && <Ban size={11} />}
                    {c.status}
                  </span>
                </div>

                {/* Body Content */}
                <div className="px-4 space-y-3">
                  {/* Mill Name & Verified Check */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Building2 size={16} className="text-slate-700" />
                      <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                        {c.millName}
                      </h3>
                      {c.verified && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {c.buyerId}
                    </p>
                  </div>

                  {/* 4-Item Grid Specs matching Figma */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs pt-1 border-t border-slate-50">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        PRODUCT
                      </span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {c.product}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        VARIETY
                      </span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {c.variety}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        QUANTITY
                      </span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {c.quantity}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        AGREED PRICING
                      </span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {c.pricing}
                      </span>
                    </div>
                  </div>

                  {/* Total Contract Value & Fulfillment Date Row */}
                  <div className="flex items-end justify-between pt-2 border-t border-slate-50">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        {c.totalValueLabel}
                      </span>
                      <span
                        className={`text-xl font-black tracking-tight block mt-0.5 ${
                          c.isStrikethrough
                            ? "line-through text-slate-400"
                            : "text-[#0d5921]"
                        }`}
                      >
                        {c.totalValue}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase block">
                        {c.dateLabel}
                      </span>
                      <span className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1 mt-0.5">
                        <Calendar size={12} className="text-slate-400" />
                        {c.dateValue}
                      </span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedContract(c)}
                    className="w-full mt-1 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-[0.99] text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye size={14} className="text-slate-500" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2 pb-2 space-y-1.5">
            <p className="text-xs text-slate-400 font-medium">
              Showing {filteredContracts.length} of 75 current contracts
            </p>
            <button
              onClick={() => showToast("Loaded all contracts history")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Load More</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Create Open Bidding ────────────────────────────── */}
      {showCreateBiddingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                Create Open Bidding
              </h3>
              <button
                onClick={() => setShowCreateBiddingModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateBidding} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Grain Variety
                </label>
                <input
                  type="text"
                  value={newVariety}
                  onChange={(e) => setNewVariety(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0d5921]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Target Quantity (kg)
                </label>
                <input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0d5921]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Bidding Deadline
                </label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0d5921]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0d5921] text-white text-xs font-bold shadow-md hover:bg-[#0b4b1c] active:scale-[0.99] transition-all cursor-pointer"
              >
                Publish Bidding to Millers
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: View Offers for Bidding ────────────────────────── */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Offers for {selectedOffer.variety}
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">{selectedOffer.id} &bull; {selectedOffer.requiredQty} kg</span>
              </div>
              <button
                onClick={() => setSelectedOffer(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedOffer.offersList && selectedOffer.offersList.length > 0 ? (
                selectedOffer.offersList.map((off, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{off.miller}</span>
                      <span className="font-black text-[#0d5921]">{off.price}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Volume: {off.volume}</span>
                      <span>Total: {off.payout}</span>
                    </div>
                    <button
                      onClick={() => {
                        showToast(`Accepted offer from ${off.miller}!`);
                        setSelectedOffer(null);
                      }}
                      className="w-full mt-2 py-1.5 rounded-lg bg-[#0d5921] text-white text-[11px] font-bold hover:bg-[#0b4b1c] cursor-pointer"
                    >
                      Accept Offer & Lock Contract
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No miller bids received yet for this batch.
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedOffer(null)}
              className="w-full py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: View Opportunity Details ───────────────────────── */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Opportunity Details
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">{selectedOpportunity.id}</span>
              </div>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Commodity:</span>
                <span className="font-bold text-slate-800">{selectedOpportunity.variety}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purchasing Miller:</span>
                <span className="font-bold text-slate-800">{selectedOpportunity.millerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Buying Price:</span>
                <span className="font-black text-[#0d5921]">{selectedOpportunity.pricePerKg} /kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Volume Needed:</span>
                <span className="font-bold text-slate-800">{selectedOpportunity.quantityRequired}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fulfillment Date:</span>
                <span className="font-bold text-slate-800">{selectedOpportunity.fulfillmentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Drop-off Location:</span>
                <span className="font-bold text-slate-800">{selectedOpportunity.location}</span>
              </div>
            </div>

            <button
              onClick={() => {
                showToast(`Applied to supply ${selectedOpportunity.variety} for ${selectedOpportunity.millerName}!`);
                setSelectedOpportunity(null);
              }}
              className="w-full py-2.5 rounded-xl bg-[#0d5921] text-white text-xs font-bold hover:bg-[#0b4b1c] cursor-pointer shadow-xs"
            >
              Submit Supply Application
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: View Contract Details ──────────────────────────── */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {selectedContract.id} Details
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">{selectedContract.millName}</span>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Buyer Station:</span>
                <span className="font-bold text-slate-800">{selectedContract.buyerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Product / Variety:</span>
                <span className="font-bold text-slate-800">{selectedContract.product} ({selectedContract.variety})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Volume:</span>
                <span className="font-bold text-slate-800">{selectedContract.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Agreed Farmgate Price:</span>
                <span className="font-bold text-slate-800">{selectedContract.pricing}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500">Contract Total:</span>
                <span className={`font-black text-base ${selectedContract.isStrikethrough ? "line-through text-slate-400" : "text-[#0d5921]"}`}>
                  {selectedContract.totalValue}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedContract(null)}
              className="w-full py-2.5 rounded-xl bg-[#0d5921] text-white text-xs font-bold hover:bg-[#0b4b1c] cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
