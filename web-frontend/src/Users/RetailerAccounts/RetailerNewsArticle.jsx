import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Flag, Heart, Send, ThumbsUp } from "lucide-react";
import Breadcrumbs from "../../Components/Minor-Components/Breadcrumbs";
import RichArticleContent, { resolveMediaUrl } from "../../Components/Minor-Components/RichArticleContent";
import ReportCommentModal from "../../Components/Modals/NewsUpdates/ReportCommentModal";
import ProfanityWarningModal from "../../Components/Modals/NewsUpdates/ProfanityWarningModal";
import Toast from "../../Components/Modals/Toast";
import useToast from "../../Components/hooks/useToast";
import useApi from "../../Components/hooks/useApi";
import useNewsUpdates from "../../Components/hooks/NewsUpdates/useNewsUpdates";

const commentText = (comment) => comment?.text || comment?.comment_text || comment?.comment_content || "";
const authorName = (comment) => comment?.author || comment?.author_name || comment?.user_name || "GrainRise User";
const commentDate = (comment) => comment?.date || comment?.created_at || comment?.createdAt || "";

export default function RetailerNewsArticle() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { request } = useApi();
  const { toasts, showToast, removeToast } = useToast();
  const isAnnouncement = searchParams.get("type") === "announcement" || String(id).startsWith("announcement");
  const cleanId = String(id || "").replace(/^(announcement|news)-/, "");
  const {
    loadNewsArticle, selectedArticle, isArticleLoading, articleError,
    comments, isCommentsLoading, loadNewsComments, toggleNewsLike,
    addNewsComment, deleteNewsComment, reportNewsComment, isSaving,
  } = useNewsUpdates();
  const [article, setArticle] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [reportingComment, setReportingComment] = useState(null);
  const [profanity, setProfanity] = useState({ isOpen: false, message: "", matches: [], detectedWords: [] });

  const reloadComments = useCallback(() => {
    if (!isAnnouncement) return loadNewsComments(cleanId, { limit: 50 });
    return Promise.resolve();
  }, [cleanId, isAnnouncement, loadNewsComments]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (isAnnouncement) {
          const response = await request(`/announcements/${encodeURIComponent(cleanId)}/user-detail/`, { method: "GET", throwOnError: true });
          const data = response?.data?.article || response?.data || {};
          if (active) {
            setArticle({ ...data, id: data.announcement_id || cleanId, title: data.title, content: data.content || "", category: data.category || "Announcement from the Admin", source: data.source_name || "GrainRise Admin", date: data.date_published || data.created_at, image_url: data.image_url });
            setLiked(Boolean(data.is_liked));
            setLikeCount(Number(data.reaction_count || 0));
          }
        } else {
          const data = await loadNewsArticle(cleanId);
          if (active) {
            setArticle(data);
            setLiked(Boolean(data.is_liked || data.has_liked));
            setLikeCount(Number(data.reaction_count || 0));
          }
          await reloadComments();
        }
      } catch (error) {
        if (active) showToast({ type: "error", title: "News Error", message: error?.message || "Unable to load this article.", duration: 5000 });
      }
    };
    load();
    return () => { active = false; };
  }, [cleanId, isAnnouncement, loadNewsArticle, reloadComments, request, showToast]);

  useEffect(() => {
    if (selectedArticle && !isAnnouncement) {
      setArticle(selectedArticle);
      setLiked(Boolean(selectedArticle.is_liked || selectedArticle.has_liked));
      setLikeCount(Number(selectedArticle.reaction_count || 0));
    }
  }, [isAnnouncement, selectedArticle]);

  const handleLike = async () => {
    try {
      const result = await toggleNewsLike(cleanId, isAnnouncement ? "announcement" : "news");
      setLiked(Boolean(result?.is_liked));
      setLikeCount(Number(result?.reaction_count || 0));
    } catch (error) {
      showToast({ type: "error", title: "Reaction Error", message: error?.message || "Unable to update reaction.", duration: 5000 });
    }
  };

  const handleCommentSubmit = async (parentId = null) => {
    const text = parentId ? replyText : newComment;
    if (!String(text).trim() || isAnnouncement) return;
    try {
      await addNewsComment(cleanId, text, parentId);
      if (parentId) { setReplyText(""); setReplyingTo(null); } else setNewComment("");
      await reloadComments();
      showToast({ type: "success", title: "Success", message: parentId ? "Reply posted successfully." : "Comment posted successfully.", duration: 4000 });
    } catch (error) {
      if (error?.code === "PROFANITY_DETECTED" || error?.response?.data?.code === "PROFANITY_DETECTED") {
        const data = error.response?.data || error;
        setProfanity({ isOpen: true, message: data.message, matches: data.matches || [], detectedWords: data.detected_words || [] });
      } else {
        showToast({ type: "error", title: "Comment Error", message: error?.message || "Unable to post comment.", duration: 5000 });
      }
    }
  };

  const handleReport = async (reason) => {
    await reportNewsComment({ commentId: reportingComment.id, reason, title: article?.title });
    setReportingComment(null);
    showToast({ type: "success", title: "Success", message: "Report submitted successfully.", duration: 4000 });
  };

  if (isArticleLoading || !article) return <div className="p-8 text-center text-slate-500">Loading article...</div>;

  const title = article.title || "News Article";
  const content = article.article_body || article.content || article.description || "";
  const category = String(article.category_code || article.category || "General Agriculture").replaceAll("_", " ").toUpperCase();
  const image = resolveMediaUrl(article.image_url || article.image || "");
  const articleComments = isAnnouncement ? (article.comments || []) : comments;

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} removeToast={removeToast} />
      <Breadcrumbs items={[{ label: "Resources" }, { label: "News & Updates", path: "/retailer/news-updates" }, { label: title.slice(0, 45) }]} />
      <button type="button" onClick={() => navigate("/retailer/news-updates")} className="flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-emerald-700"><ArrowLeft size={16} /> Back to News &amp; Updates</button>

      <article className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-7 pb-4 pt-7">
          <div className="mb-3 flex flex-wrap items-center gap-3"><span className="rounded-md bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{category}</span><span className="text-xs text-gray-500">{article.source_name || article.source || "GrainRise News"} · {article.published_at || article.date_published || article.date || ""}</span></div>
          <h1 className="text-2xl font-extrabold leading-snug text-gray-900 md:text-3xl">{title}</h1>
        </div>
        {image ? <div className="h-56 w-full overflow-hidden md:h-80"><img src={image} alt={title} className="h-full w-full object-cover" /></div> : null}
        <div className="px-7 py-6"><RichArticleContent content={content} /></div>
        <div className="flex items-center justify-between border-t border-slate-100 px-7 py-4">
          <button type="button" onClick={handleLike} disabled={isSaving || isAnnouncement} className={`flex items-center gap-2 text-sm font-medium ${liked ? "text-emerald-700" : "text-gray-500 hover:text-emerald-700"}`}><Heart size={18} fill={liked ? "currentColor" : "none"} /> {likeCount} Likes</button>
        </div>
      </article>

      <section className="mx-auto max-w-5xl space-y-6 rounded-2xl border border-slate-200 bg-white px-7 py-6 shadow-sm">
        <h3 className="font-bold text-gray-900">Comments ({articleComments.length})</h3>
        {!isAnnouncement && <div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">R</div><div className="flex flex-1 gap-2"><input value={newComment} onChange={(event) => setNewComment(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleCommentSubmit()} placeholder="Write a comment..." className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600" /><button type="button" onClick={() => handleCommentSubmit()} disabled={isSaving} className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white"><Send size={14} /> Post Comment</button></div></div>}
        <div className="space-y-5 divide-y divide-slate-100">
          {isCommentsLoading ? <p className="text-sm text-slate-400">Loading comments...</p> : articleComments.map((comment) => {
            const nested = comment.replies || comment.children || [];
            return <div key={comment.id || comment.comment_id} className="pt-4 first:pt-0"><div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">{authorName(comment)[0]}</div><div className="flex-1"><div className="flex justify-between gap-3"><span className="text-sm font-semibold text-gray-800">{authorName(comment)}</span><span className="text-[11px] text-gray-400">{commentDate(comment)}</span></div><p className="text-sm leading-relaxed text-gray-700">{commentText(comment)}</p><div className="mt-2 flex items-center gap-4"><button type="button" onClick={() => setReplyingTo(comment.id || comment.comment_id)} className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-emerald-700"><ThumbsUp size={12} /> Reply</button><button type="button" onClick={() => setReportingComment(comment)} className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-600"><Flag size={12} /> Report</button></div>{replyingTo === (comment.id || comment.comment_id) && <div className="mt-3 flex gap-2"><input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Write a reply..." className="flex-1 rounded-lg border px-3 py-2 text-xs" /><button type="button" onClick={() => handleCommentSubmit(comment.id || comment.comment_id)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Reply</button></div>}{nested.map((reply) => <div key={reply.id || reply.comment_id} className="mt-4 ml-6 border-l-2 border-emerald-100 pl-4"><div className="flex justify-between gap-3"><span className="text-sm font-semibold text-gray-800">{authorName(reply)}</span><span className="text-[11px] text-gray-400">{commentDate(reply)}</span></div><p className="text-sm text-gray-700">{commentText(reply)}</p><button type="button" onClick={() => setReportingComment(reply)} className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600"><Flag size={12} /> Report</button></div>)}</div></div></div>;
          })}
          {!isCommentsLoading && !articleComments.length && <p className="py-6 text-center text-sm text-gray-400">No comments yet. Be the first to share your thoughts!</p>}
        </div>
      </section>

      <ReportCommentModal isOpen={Boolean(reportingComment)} onClose={() => setReportingComment(null)} comment={reportingComment} articleTitle={title} onSubmitReport={handleReport} />
      <ProfanityWarningModal isOpen={profanity.isOpen} onClose={() => setProfanity((value) => ({ ...value, isOpen: false }))} message={profanity.message} matches={profanity.matches} detectedWords={profanity.detectedWords} type="comment" />
    </div>
  );
}
