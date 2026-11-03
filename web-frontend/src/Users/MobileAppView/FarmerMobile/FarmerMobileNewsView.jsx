import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Clock,
  Heart,
  MessageCircle,
  RotateCw,
  ChevronLeft,
  Bookmark,
  Share2,
  Send,
  ArrowRight,
  Info,
  ExternalLink,
} from "lucide-react";

// ─── Farmer-specific news articles ───────────────────────────────────────────

const INITIAL_ARTICLES = [
  {
    id: "art-0",
    category: "PRICE ADVISORY",
    categoryBg: "bg-[#DCFCE7] text-[#166534]",
    date: "July 19, 2026",
    time: "10:30 AM",
    title: "Bulacan Palay Farmgate Price Climbs to ₱28.50/kg Ahead of August Peak",
    excerpt:
      "Department of Agriculture confirms increased miller buying capacity with high demand across Central Luzon hubs. Farmers are advised to prepare clean and dry batches to maximize farmgate returns this season.",
    imageUrl:
      "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80",
    photoCaption: "Photo: Agricultural field monitoring and grain trade analysis in Central Luzon.",
    likes: 47,
    comments: 12,
    source: "Dept. of Agriculture",
    takeaway:
      "Dry palay to exactly 14% moisture and register delivery batches with accredited buying stations early to lock in the ₱28.50/kg peak rate before mid-August harvest saturation.",
    paragraphs: [
      "The Department of Agriculture (DA) has confirmed that palay farmgate prices in Bulacan have climbed to ₱28.50 per kilogram, driven by strong miller demand across Central Luzon buying hubs.",
      "This represents an 18.7% increase compared to the same period last season. Miller procurement officers attribute the surge to higher export demand for Philippine premium-grade milled rice and consistent dry grain quality from registered Bulacan farm parcels.",
      "The DA Bulacan Provincial Office projects that buying prices will remain elevated through the first two weeks of August before softening as Wet Season harvests from Region III arrive in volume.",
    ],
  },
  {
    id: "art-1",
    category: "CLIMATE ADVISORY",
    categoryBg: "bg-[#DBEAFE] text-[#1D4ED8]",
    date: "July 17, 2026",
    time: "08:00 AM",
    title: "PAGASA: Southwest Monsoon to Bring Moderate to Heavy Rainfall in Bulacan Basin",
    excerpt:
      "Farmers are advised to inspect paddy dikes and drainage paths to prevent water stagnation in early tillering crops. Wind gusts up to 45 km/h expected over Nueva Ecija and Bulacan by weekend.",
    imageUrl:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    photoCaption: "Photo: Monsoon cloud progression over rice paddy irrigation dikes.",
    likes: 34,
    comments: 8,
    source: "PAGASA",
    takeaway:
      "Reinforce field bunds, clear drainage canals, and delay final nitrogen top-dressing by at least 48 hours to avert nutrient runoff and crop lodging during peak Habagat squalls.",
    paragraphs: [
      "PAGASA (Philippine Atmospheric, Geophysical and Astronomical Services Administration) has issued a seasonal advisory warning of moderate to heavy rainfall across the Bulacan Basin and adjacent Central Luzon provinces.",
      "Paddy fields currently in the tillering phase are at heightened risk of waterlogging if tertiary irrigation gates remain obstructed with silt and aquatic weed buildup.",
      "The southwest monsoon (Habagat) season is expected to intensify through late August before transitioning to the October cropping window. PAGASA encourages farmers to monitor 24-hour bulletins for localized rainfall alerts.",
    ],
  },
  {
    id: "art-2",
    category: "TECHNOLOGY",
    categoryBg: "bg-[#F3E8FF] text-[#6B21A8]",
    date: "July 15, 2026",
    time: "09:30 AM",
    title: "Copernicus Satellite Soil Moisture Index Now Available in GrainRise App",
    excerpt:
      "Farmers can now preview 6-month projected rainfall and temperature forecasts directly on their mobile dashboard. The new Forecasting module uses EU Copernicus ERA5 data updated weekly for registered farm parcels.",
    imageUrl:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
    photoCaption: "Photo: Earth observation radar telemetry mapped to local farm cadastral parcels.",
    likes: 89,
    comments: 21,
    source: "GrainRise Platform",
    takeaway:
      "Use the Forecasting module in your GrainRise app to inspect weekly satellite soil moisture indices and optimize supplemental pump irrigation schedules up to 3 weeks ahead.",
    paragraphs: [
      "GrainRise has rolled out a major update to its mobile platform, integrating the Copernicus ERA5 Soil Moisture Index directly into the Farmer Mobile Dashboard under the Forecasting module.",
      "Registered farmers can now preview 6-month projected rainfall and temperature forecasts calibrated specifically for their verified farm parcels in Central Luzon, Cagayan Valley, and the Ilocos Region.",
      "The system combines remote sensing data with historical localized weather stations to generate automated agro-climatic advisories, helping prevent under-irrigation or premature planting.",
    ],
  },
  {
    id: "art-3",
    category: "FARMER PROGRAMS",
    categoryBg: "bg-[#FEF3C7] text-[#B45309]",
    date: "July 12, 2026",
    time: "02:00 PM",
    title: "DA Opens Q3 Fertilizer Subsidy Window for PhilSys-Registered Farmers",
    excerpt:
      "Eligible registered farmers may now apply for subsidized urea and complete fertilizer through the DA Fertilizer Voucher System. Applications close August 5, 2026. Farmers must present valid PhilSys ID and farm parcel certificate.",
    imageUrl:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    photoCaption: "Photo: Certified organic and inorganic agricultural inputs at regional distribution depot.",
    likes: 112,
    comments: 45,
    source: "National Agri Board",
    takeaway:
      "Submit your RSBSA certification and PhilSys National ID before August 5 to claim ₱800/bag urea vouchers and reduce seasonal input costs by up to 35%.",
    paragraphs: [
      "The Department of Agriculture has officially opened the Q3 2026 Fertilizer Voucher Subsidy window for all PhilSys-registered and RSBSA-listed rice farmers.",
      "The program covers Urea (46-0-0) subsidized at ₱800 per 50kg bag (market price ₱1,400) and Complete Fertilizer (14-14-14) at ₱950 per bag, with foliar supplements available for organic transitioning growers.",
      "Applications must be filed through the municipal agriculture office. Farmers using GrainRise verified farmer IDs receive expedited queue processing at participating partner depots.",
    ],
  },
  {
    id: "art-4",
    category: "HARVEST ADVISORY",
    categoryBg: "bg-[#DCFCE7] text-[#166534]",
    date: "July 10, 2026",
    time: "07:45 AM",
    title: "Dry Season Palay Harvest Window Opens: Tips for Maximizing Milling Recovery",
    excerpt:
      "Agronomists from Central Luzon State University recommend harvesting at 20–22% grain moisture and field-drying to 14% before delivering to millers. Proper harvest timing can increase milling recovery by up to 8%.",
    imageUrl:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    photoCaption: "Photo: Combine harvesting in dry irrigated paddy fields in Nueva Ecija.",
    likes: 63,
    comments: 17,
    source: "CLSU Agronomy Dept.",
    takeaway:
      "Harvest grain at 20–22% field moisture and calibrate thresher drum speed to 750 RPM to increase head rice recovery by 8% (yielding an extra ₱1,200–₱1,800/ton).",
    paragraphs: [
      "Agronomists from Central Luzon State University (CLSU) have released field-tested guidelines for maximizing palay milling recovery during the upcoming harvest window.",
      "Premature harvesting when grain moisture exceeds 24% causes chalkiness, mold susceptibility, and high breakage. Conversely, harvesting overripe paddy below 18% moisture increases shattering loss during mechanical reaping.",
      "Proper post-harvest handling on concrete drying pavements combined with gradual aeration guarantees premium Grade A classification upon miller intake inspection.",
    ],
  },
  {
    id: "art-5",
    category: "MARKET TRENDS",
    categoryBg: "bg-[#DCFCE7] text-[#166534]",
    date: "July 8, 2026",
    time: "11:15 AM",
    title: "Jasmine Rice Demand Surges 15% — High-Value Variety Contracts Now Open",
    excerpt:
      "Premium rice millers across Bulacan and Pampanga are offering above-market forward contracts for Jasmine Rice varieties. Farmers with verified Jasmine parcels can now register for priority contract allocation in GrainRise.",
    imageUrl:
      "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80",
    photoCaption: "Photo: Premium long-grain aromatic rice ready for post-milling bagging.",
    likes: 78,
    comments: 23,
    source: "GrainRise Market Desk",
    takeaway:
      "Lock forward procurement contracts in the GrainRise Contracts tab to secure the ₱34.00–₱36.00/kg guaranteed pricing for aromatic Jasmine varieties before harvest volumes peak.",
    paragraphs: [
      "Market intelligence from GrainRise's procurement analytics team confirms a 15% quarter-on-quarter surge in Jasmine Rice demand across premium retail and institutional channels.",
      "Three prominent milling complexes in Bulacan and Pampanga have opened procurement tenders for registered growers, guaranteeing minimum forward purchasing agreements for clean lots.",
      "Farmers with verified parcels of Jasmine (Inpari 32) can review contractual requirements, payment terms, and pickup options directly through the Contracts tab.",
    ],
  },
];

const CATEGORIES = [
  "All",
  "Price Advisory",
  "Climate Advisory",
  "Technology",
  "Farmer Programs",
  "Harvest Advisory",
  "Market Trends",
];

// ─── Article Detail View ──────────────────────────────────────────────────────

function ArticleDetailView({ article, onBack, userInitials = "KA" }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(article.likes);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([
    {
      id: "c-1",
      author: "Mang Ernesto Cruz",
      initials: "EC",
      avatarBg: "bg-emerald-100 text-emerald-800",
      date: article.date + " - 3:45 PM",
      text: "Mahalaga talaga ang tamang moisture level bago mag-deliver sa miller. Nag-invest ako sa handheld moisture meter at sulit na sulit para hindi mabawasan ang buying price.",
      likes: 6,
      isLiked: false,
      replies: [
        {
          id: "r-1",
          author: "DA Extension Officer Ramon",
          initials: "RO",
          avatarBg: "bg-blue-100 text-blue-800",
          time: "4:30 PM",
          text: "Tama yan Mang Ernesto! Yung 14% moisture ang standard para ma-classify na Clean & Dry at makuha ang pinakamataas na presyo.",
        },
      ],
    },
    {
      id: "c-2",
      author: "Fe Reyes (Bulacan Coop)",
      initials: "FR",
      avatarBg: "bg-amber-100 text-amber-800",
      date: article.date + " - 5:10 PM",
      text: "Kumpleto ang mga advisory dito. Naibahagi ko na sa aming cluster meeting sa San Miguel para makapaghanda ang lahat ng kasama.",
      likes: 4,
      isLiked: false,
      replies: [],
    },
  ]);

  const handleToggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: `c-${Date.now()}`,
      author: "Ka Andres (You)",
      initials: userInitials,
      avatarBg: "bg-[#0d5921] text-white",
      date: "Just now",
      text: commentText.trim(),
      likes: 0,
      isLiked: false,
      replies: [],
    };

    setComments((prev) => [newComment, ...prev]);
    setCommentText("");
  };

  return (
    <div className="bg-white min-h-full -mx-3.5 sm:-mx-4 -mt-3 sm:-mt-4 px-3.5 sm:px-4 py-3 space-y-4 font-sans antialiased text-slate-900 pb-16">
      {/* ── Subheader Navigation Bar matching Retailer & Figma ──────── */}
      <div className="flex items-center justify-between py-2 border-b border-slate-100 -mx-3.5 sm:-mx-4 px-3.5 sm:px-4 sticky top-0 bg-white/95 backdrop-blur-xs z-20">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-[#0d5921] transition-colors cursor-pointer py-1"
        >
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
            <ChevronLeft size={16} />
          </div>
          <span className="text-sm">News &amp; Updates</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isSaved
                ? "bg-[#ebf6ed] text-[#0d5921]"
                : "text-slate-500 hover:bg-slate-100"
            }`}
            title="Bookmark"
          >
            <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: article.title,
                  url: window.location.href,
                });
              }
            }}
            className="w-8 h-8 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Share"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* ── Article Header ──────────────────────────────────────────── */}
      <div className="space-y-2 pt-1">
        <span
          className={`inline-block text-[9.5px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${article.categoryBg}`}
        >
          {article.category}
        </span>

        <h1 className="text-lg font-black text-slate-900 leading-snug tracking-tight">
          {article.title}
        </h1>

        <p className="text-[11px] text-slate-400 font-medium">
          Source:{" "}
          <strong className="text-slate-600 font-semibold">{article.source}</strong> ·{" "}
          {article.date} - {article.time}
        </p>
      </div>

      {/* ── Hero Image & Caption ─────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-2xs aspect-16/10 bg-slate-100">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
        <p className="text-[10px] text-slate-400 italic">
          {article.photoCaption || "Photo: Field monitoring and agro-climatic advisories in Region III."}
        </p>
      </div>

      {/* ── Article Body Paragraphs ──────────────────────────────────── */}
      <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-normal">
        {article.paragraphs && article.paragraphs[0] && (
          <p>{article.paragraphs[0]}</p>
        )}
        {article.paragraphs && article.paragraphs[1] && (
          <p>{article.paragraphs[1]}</p>
        )}

        {/* ── Key Takeaway Callout Box matching Figma & Retailer ───────── */}
        <div className="bg-[#ebf6ed] border-l-4 border-[#0d5921] rounded-r-2xl p-3.5 space-y-1.5 shadow-2xs my-2">
          <div className="flex items-center gap-1.5 text-[#0d5921]">
            <Info size={14} className="shrink-0" />
            <h3 className="text-[11px] font-extrabold uppercase tracking-wide">
              KEY TAKEAWAY FOR FARMERS:
            </h3>
          </div>
          <p className="text-xs text-slate-800 leading-relaxed font-medium pl-5">
            {article.takeaway}
          </p>
        </div>

        {article.paragraphs && article.paragraphs[2] && (
          <p>{article.paragraphs[2]}</p>
        )}
      </div>

      {/* ── View Original Article Button ──────────────────────────────── */}
      <div className="pt-2">
        <button
          onClick={() => {}}
          className="w-full py-2.5 bg-white border border-slate-200 hover:border-[#0d5921] hover:text-[#0d5921] text-slate-700 text-xs font-bold rounded-2xl shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>View Original Article</span>
          <ExternalLink size={13} />
        </button>
      </div>

      {/* ── Likes & Engagement Row ───────────────────────────────────── */}
      <div className="pt-2 pb-2 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={handleToggleLike}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isLiked
              ? "bg-[#ebf6ed] text-[#0d5921]"
              : "bg-slate-50 text-slate-700 hover:bg-[#ebf6ed] hover:text-[#0d5921]"
          }`}
        >
          <Heart
            size={14}
            className={isLiked ? "text-[#0d5921]" : "text-slate-500"}
            fill={isLiked ? "currentColor" : "none"}
          />
          <span>{likesCount} Likes</span>
        </button>

        <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-1">
            <MessageCircle size={14} className="text-slate-400" />
            <span>{comments.length} Comments</span>
          </div>
        </div>
      </div>

      {/* ── Comments Section ─────────────────────────────────────────── */}
      <div className="space-y-4 pt-1">
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
          Comments ({comments.length})
        </h3>

        {/* Comment Input Box */}
        <form onSubmit={handlePostComment} className="flex gap-2 items-center">
          <div className="w-8 h-8 rounded-full bg-[#0d5921] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Add to the discussion..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d5921] focus:bg-white transition-all shadow-2xs"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#0d5921] hover:text-[#0a4a1c] disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </form>

        {/* Comment Thread List */}
        <div className="space-y-3.5">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${comment.avatarBg}`}
                >
                  {comment.initials}
                </div>
                <div className="flex-1 bg-slate-50 rounded-2xl rounded-tl-none p-3 space-y-1 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {comment.author}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {comment.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {comment.text}
                  </p>
                </div>
              </div>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-9 space-y-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${reply.avatarBg}`}
                      >
                        {reply.initials}
                      </div>
                      <div className="flex-1 bg-slate-50/80 rounded-xl rounded-tl-none p-2.5 space-y-0.5 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-900">
                            {reply.author}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {reply.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {reply.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main News View ───────────────────────────────────────────────────────────

export default function FarmerMobileNewsView({ news = [], onBack }) {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [likedArticles, setLikedArticles] = useState({});
  const [visibleCount, setVisibleCount] = useState(4);

  // Show article detail
  if (selectedArticle) {
    return (
      <ArticleDetailView
        article={selectedArticle}
        onBack={() => setSelectedArticle(null)}
      />
    );
  }

  const toggleLike = (id, e) => {
    e?.stopPropagation();
    setLikedArticles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredArticles = INITIAL_ARTICLES.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === "All" ||
      art.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCat;
  });

  const visibleArticles = filteredArticles.slice(0, visibleCount);

  return (
    <div className="space-y-4 pb-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            News &amp; Updates
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Farm advisories, market prices &amp; agri programs
          </p>
        </div>
      </div>

      {/* ── Search + Filter ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search news and updates......"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0d5921] shadow-sm"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal size={13} className="text-slate-500" />
            <span className="max-w-[70px] truncate">{selectedCategory}</span>
            <span className="text-[10px] text-slate-400">▾</span>
          </button>
          {showFilterMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#ebf6ed] text-[#0d5921] font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Articles List ────────────────────────────────────────────── */}
      <div className="space-y-4">
        {visibleArticles.map((art) => {
          const isLiked = likedArticles[art.id];
          const likeCount = art.likes + (isLiked ? 1 : 0);

          return (
            <div
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              {/* Cover image */}
              <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                <img
                  src={art.imageUrl}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>

              {/* Content */}
              <div className="p-4 space-y-2.5">
                {/* Category + Date */}
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <span
                    className={`text-[9.5px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${art.categoryBg}`}
                  >
                    {art.category}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock size={12} />
                    <span>
                      {art.date} · {art.time}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-sm font-extrabold text-slate-900 leading-snug group-hover:text-[#0d5921] transition-colors">
                  {art.title}
                </h2>

                {/* Excerpt */}
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {art.excerpt}
                </p>

                {/* Footer */}
                <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <button
                      onClick={(e) => toggleLike(art.id, e)}
                      className={`flex items-center gap-1 cursor-pointer transition-colors ${
                        isLiked
                          ? "text-rose-500 font-bold"
                          : "hover:text-slate-600"
                      }`}
                    >
                      <Heart
                        size={13}
                        fill={isLiked ? "currentColor" : "none"}
                      />
                      <span>{likeCount}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <MessageCircle size={13} />
                      <span>{art.comments} Comments</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {art.source}
                  </span>
                </div>

                <div className="flex justify-end pt-0.5">
                  <button
                    onClick={() => setSelectedArticle(art)}
                    className="text-xs font-bold text-[#0d5921] hover:text-[#0a4a1c] flex items-center gap-1 cursor-pointer"
                  >
                    Read More <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────── */}
      <div className="text-center pt-2 space-y-2">
        <p className="text-xs text-slate-400 font-medium">
          Showing {visibleArticles.length} of {filteredArticles.length} articles
        </p>
        {visibleCount < filteredArticles.length && (
          <button
            onClick={() => setVisibleCount((n) => n + 3)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 active:scale-98 transition-all cursor-pointer"
          >
            <RotateCw size={13} className="text-slate-500" />
            Load More Articles
          </button>
        )}
      </div>
    </div>
  );
}
