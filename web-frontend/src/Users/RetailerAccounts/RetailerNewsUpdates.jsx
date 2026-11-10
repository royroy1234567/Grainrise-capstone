import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Heart, MessageSquare, RefreshCw, Search } from "lucide-react";
import Breadcrumbs from "../../Components/Minor-Components/Breadcrumbs";
import { stripHtmlToExcerpt, resolveMediaUrl } from "../../Components/Minor-Components/RichArticleContent";
import Toast from "../../Components/Modals/Toast";
import useToast from "../../Components/hooks/useToast";
import useNewsUpdates from "../../Components/hooks/NewsUpdates/useNewsUpdates";
import useFetchLatestNews from "../../Components/hooks/NewsUpdates/useFetchLatestNews";

const MONTHS = [
  ["", "All Months"], ["1", "January"], ["2", "February"], ["3", "March"],
  ["4", "April"], ["5", "May"], ["6", "June"], ["7", "July"],
  ["8", "August"], ["9", "September"], ["10", "October"], ["11", "November"], ["12", "December"],
];
const CATEGORIES = [
  ["", "All Categories"], ["market_updates", "Market Updates"],
  ["advisory_best_practices", "Advisory & Best Practices"], ["grant_programs_support", "Grant Programs & Support"],
  ["weather_climate", "Weather & Climate"], ["policy_regulation", "Policy & Regulation"],
  ["supply_chain", "Supply Chain"], ["general_agriculture", "General Agriculture"],
];

const formatDate = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-PH", {
    month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const imageFor = (item) => resolveMediaUrl(item.image_url || item.image || "");

export default function RetailerNewsUpdates() {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();
  const {
    newsItems, feedPagination, isFeedLoading, feedError, loadNewsFeed, toggleNewsLike,
  } = useNewsUpdates();
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const refresh = useCallback(() => loadNewsFeed({
    search: query, year, month, category, sort, combined: true, limit: pageSize, offset: (page - 1) * pageSize,
  }), [category, loadNewsFeed, month, page, query, sort, year]);

  useEffect(() => {
    refresh().catch((error) => showToast({
      type: "error", title: "News Error", message: error?.message || "Unable to load news.", duration: 5000,
    }));
  }, [refresh, showToast]);

  const { fetchLatestNews, isFetching } = useFetchLatestNews({
    showToast,
    onNewsFetched: () => refresh().catch(() => {}),
  });

  const years = useMemo(() => {
    const values = new Set(newsItems.map((item) => {
      const date = new Date(item.published_at || item.first_fetched_at);
      return Number.isNaN(date.getTime()) ? "" : String(date.getFullYear());
    }).filter(Boolean));
    return Array.from(values).sort().reverse();
  }, [newsItems]);

  const handleLike = async (event, item) => {
    event.stopPropagation();
    try {
      await toggleNewsLike(item.news_id || item.id);
      await refresh();
    } catch (error) {
      showToast({ type: "error", title: "Reaction Error", message: error?.message || "Unable to update reaction.", duration: 5000 });
    }
  };

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <Breadcrumbs items={[{ label: "Resources" }, { label: "News & Updates" }]} />
          <h2 className="text-[clamp(2rem,3vw,2.5rem)] font-extrabold tracking-[-0.03em] text-slate-900">News &amp; Updates</h2>
          <p className="text-sm text-slate-500">Stay informed with the latest agricultural news, market updates, advisories, and programs.</p>
        </div>
        <button type="button" onClick={fetchLatestNews} disabled={isFetching} className="inline-flex items-center gap-2 self-start rounded-lg bg-[#00580C] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#00470A] disabled:opacity-60 sm:self-center">
          <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} /> {isFetching ? "Fetching..." : "Fetch Latest News"}
        </button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search news and updates..." className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600" />
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={year} onChange={(event) => { setYear(event.target.value); setPage(1); }} className="min-w-[100px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">All Years</option>{years.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select value={month} onChange={(event) => { setMonth(event.target.value); setPage(1); }} className="min-w-[120px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">{MONTHS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="min-w-[160px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="min-w-[130px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="latest">Latest First</option><option value="oldest">Oldest First</option></select>
        </div>
      </div>

      {feedError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{feedError}</div>}
      {isFeedLoading ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading news and updates...</div> : null}
      {!isFeedLoading && !newsItems.length ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">No articles found matching your criteria.</div> : null}

      <div className="flex flex-col gap-4">
        {newsItems.map((item) => {
          const id = item.news_id || item.id;
          const categoryLabel = String(item.category_code || item.category || "General Agriculture").replaceAll("_", " ").toUpperCase();
          return (
            <article key={`${item.item_type || "news"}-${id}`} onClick={() => navigate(`/retailer/news-updates/${item.item_type === "announcement" ? `announcement-${id}?type=announcement` : id}`)} className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-emerald-400 hover:shadow-md md:flex-row">
              <div className="flex h-48 w-full shrink-0 items-center justify-center border-r border-slate-100 bg-emerald-700/10 md:h-auto md:w-64">
                {imageFor(item) ? <img src={imageFor(item)} alt="" className="h-full w-full object-cover" /> : <span className="text-sm font-bold uppercase tracking-widest text-emerald-900/40">Image</span>}
              </div>
              <div className="flex w-full flex-col justify-between p-5">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-3"><span className="rounded-sm bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">{categoryLabel}</span><span className="text-[11px] font-medium text-gray-500">{formatDate(item.published_at || item.first_fetched_at)}</span></div>
                  <h4 className="mb-2 text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700">{item.title}</h4>
                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600">{stripHtmlToExcerpt(item.description || item.article_body || "")}</p>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                    <button type="button" onClick={(event) => handleLike(event, item)} className={`flex items-center gap-1 hover:text-emerald-700 ${item.is_liked ? "font-semibold text-emerald-700" : ""}`}><Heart size={14} fill={item.is_liked ? "currentColor" : "none"} /> {item.reaction_count || 0}</button>
                    <span><MessageSquare size={14} className="mr-1 inline" /> {item.comment_count || 0} Comments</span>
                    <span className="hidden sm:inline-block">Source: {item.source_name || "GrainRise News"}</span>
                  </div>
                  <button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/retailer/news-updates/${item.item_type === "announcement" ? `announcement-${id}?type=announcement` : id}`); }} className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800">Read More <ArrowRight size={14} /></button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {feedPagination.total > pageSize && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500">Showing {feedPagination.offset + 1}-{feedPagination.offset + newsItems.length} of {feedPagination.total} articles</p>
          <div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-md border px-3 py-1 text-sm disabled:opacity-40">Previous</button><span className="rounded-md bg-emerald-700 px-3 py-1 text-sm font-medium text-white">{page}</span><button type="button" disabled={!feedPagination.has_more} onClick={() => setPage((value) => value + 1)} className="rounded-md border px-3 py-1 text-sm disabled:opacity-40">Next</button></div>
        </div>
      )}
    </div>
  );
}
