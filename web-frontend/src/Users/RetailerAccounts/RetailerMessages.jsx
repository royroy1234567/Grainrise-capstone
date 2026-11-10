import { useEffect, useRef, useState } from "react";
import { CheckCheck, Loader2, MessageCircle, Search, Send, ShieldCheck } from "lucide-react";
import { useLocation } from "react-router-dom";
import Breadcrumbs from "../../Components/Minor-Components/Breadcrumbs";
import { ArticleMessageContent } from "../../Components/Minor-Components/ArticleAttachmentCard";
import ProfanityWarningModal from "../../Components/Modals/ProfanityWarningModal";
import useRetailerMessages from "../../Components/hooks/Retailer/useRetailerMessages";

const getInitials = (name) =>
  String(name || "User")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

const formatTimestamp = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(date);
};

export default function RetailerMessages() {
  const {
    threads,
    activeThread,
    messages,
    isThreadsLoading,
    isMessagesLoading,
    isSending,
    threadsError,
    messagesError,
    sendError,
    loadThreads,
    selectThread,
    sendMessage,
    clearSendError,
    isPartnerTyping,
    emitTyping,
    stopTyping,
  } = useRetailerMessages();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [profanity, setProfanity] = useState({ isOpen: false, message: "", detectedWords: [] });
  const endRef = useRef(null);
  const openedTargetRef = useRef("");

  useEffect(() => {
    const timer = window.setTimeout(() => loadThreads(search).catch(() => {}), search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [loadThreads, search]);

  useEffect(() => {
    if (!activeThread && threads[0] && !location.state) {
      selectThread(threads[0], true).catch(() => {});
    }
  }, [activeThread, location.state, selectThread, threads]);

  useEffect(() => {
    const target = location.state;
    if (!target) return;
    const participantType = target.participant_type || target.participantType;
    const participantId = target.participant_id || target.recipientId;
    if (!participantType || !participantId) return;
    const targetKey = target.thread_id || `${participantType}_${participantId}`;
    if (openedTargetRef.current === targetKey) return;
    openedTargetRef.current = targetKey;
    selectThread({
      thread_id: targetKey,
      participant_type: participantType,
      participant_id: participantId,
      name: target.name || target.recipientName || "Contact",
      role: target.role || "Contact",
      subtitle: target.subtitle || target.role || "Contact",
    }).catch(() => {});
  }, [location.state, selectThread]);

  useEffect(() => {
    if (!activeThread || isMessagesLoading) return;
    const timer = window.setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    return () => window.clearTimeout(timer);
  }, [activeThread, isMessagesLoading, messages]);

  const handleSelect = (thread) => {
    stopTyping();
    clearSendError();
    setInputText("");
    setReplyingTo(null);
    selectThread(thread).catch(() => {});
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;
    const reply = replyingTo;
    setInputText("");
    setReplyingTo(null);
    try {
      await sendMessage(text, reply);
    } catch (error) {
      const data = error?.data || {};
      if (data.code === "PROFANITY_DETECTED" || data.blocked || error?.code === "PROFANITY_DETECTED") {
        setInputText(text);
        setReplyingTo(reply);
        setProfanity({
          isOpen: true,
          message: data.message || error.message,
          detectedWords: data.detected_words || data.matches || [],
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: "Support" }, { label: "Messages" }]} />
      <div>
        <h2 className="text-[clamp(2rem,3vw,2.5rem)] font-extrabold tracking-[-0.03em] text-slate-900">
          Messages &amp; Inquiries
        </h2>
        <p className="text-sm text-slate-500">Communicate directly with registered GrainRise partners.</p>
      </div>

      <div className="grid min-h-[680px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[360px_1fr]">
        <aside className="flex max-h-[330px] flex-col border-b border-slate-200 lg:max-h-none lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 p-4">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..." className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#0B5D1E] focus:ring-1 focus:ring-[#0B5D1E]" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isThreadsLoading && !threads.length ? (
              <div className="flex min-h-52 items-center justify-center"><Loader2 className="animate-spin text-[#0B5D1E]" size={22} /></div>
            ) : threadsError ? (
              <p className="p-5 text-center text-xs text-red-600">{threadsError}</p>
            ) : !threads.length ? (
              <div className="flex min-h-52 flex-col items-center justify-center p-6 text-center text-slate-400"><MessageCircle size={28} /><p className="mt-2 text-xs">No conversations yet.</p></div>
            ) : threads.map((thread) => {
              const selected = activeThread?.thread_id === thread.thread_id;
              return (
                <button key={thread.thread_id} type="button" onClick={() => handleSelect(thread)} className={`flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left ${selected ? "bg-emerald-50/70" : "hover:bg-slate-50"}`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected ? "bg-[#0B5D1E] text-white" : "bg-slate-100 text-slate-600"}`}>{getInitials(thread.name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2"><p className="truncate text-sm font-semibold text-slate-900">{thread.name}</p><span className="shrink-0 text-[10px] text-slate-400">{formatTimestamp(thread.latest_message_at)}</span></div>
                    <p className="truncate text-xs text-slate-500">{thread.subtitle || thread.role}</p>
                    <p className={`mt-2 truncate text-xs ${thread.unread_count ? "font-semibold text-slate-800" : "text-slate-500"}`}>{thread.is_sender_me ? "You: " : ""}{thread.latest_message}</p>
                  </div>
                  {!!thread.unread_count && !selected && <span className="rounded-full bg-[#0B5D1E] px-1.5 py-0.5 text-[9px] font-bold text-white">{thread.unread_count}</span>}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-[500px] flex-col bg-slate-50/50">
          {activeThread ? (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200 bg-white p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">{getInitials(activeThread.name)}</div>
                <div><h3 className="text-sm font-bold text-gray-900">{activeThread.name}</h3><p className="flex items-center gap-1 text-xs font-medium text-emerald-700"><ShieldCheck size={13} />{activeThread.role || "Contact"}</p></div>
              </header>
              <div className="flex-1 overflow-y-auto p-5">
                {isMessagesLoading ? <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-[#0B5D1E]" size={22} /></div> : messagesError ? <p className="text-center text-xs text-red-600">{messagesError}</p> : messages.map((message) => (
                  <div key={message.message_id} className={`mb-3 flex flex-col ${message.is_mine ? "items-end" : "items-start"}`}>
                    {message.replied_message && <button type="button" onClick={() => setReplyingTo(message.replied_message)} className="mb-1 max-w-[80%] truncate rounded-lg bg-slate-100 px-3 py-1 text-left text-[10px] text-slate-500">Replying to: {message.replied_message.message_content}</button>}
                    <button type="button" onClick={() => setReplyingTo(message)} className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-left text-sm ${message.is_mine ? "rounded-br-none bg-emerald-700 text-white" : "rounded-bl-none border border-slate-200 bg-white text-gray-800 shadow-xs"}`}>
                      <ArticleMessageContent content={message.message_content || message.message_text} isMine={message.is_mine} className="leading-relaxed" />
                    </button>
                    <span className="mt-1 flex items-center gap-1 px-1 text-[10px] text-gray-400">{formatTimestamp(message.created_at)} {message.is_mine && <CheckCheck size={12} />}</span>
                  </div>
                ))}
                {isPartnerTyping && <p className="text-xs italic text-slate-400">Typing...</p>}
                <div ref={endRef} />
              </div>
              <form onSubmit={handleSend} className="border-t border-slate-200 bg-white p-4">
                {replyingTo && <div className="mb-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800"><span className="truncate">Replying to: {replyingTo.message_content}</span><button type="button" onClick={() => setReplyingTo(null)}>Cancel</button></div>}
                {sendError && <p className="mb-2 text-xs text-red-600">{sendError}</p>}
                <div className="flex gap-2">
                  <input value={inputText} onChange={(e) => { setInputText(e.target.value); emitTyping(e.target.value); }} onBlur={stopTyping} placeholder={`Message ${activeThread.name}...`} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-emerald-600" />
                  <button disabled={isSending || !inputText.trim()} className="rounded-xl bg-emerald-700 px-4 text-white disabled:opacity-50"><Send size={16} /></button>
                </div>
              </form>
            </>
          ) : <div className="flex flex-1 flex-col items-center justify-center text-slate-400"><MessageCircle size={34} /><p className="mt-2 text-sm">Select a conversation to start messaging.</p></div>}
        </section>
      </div>
      <ProfanityWarningModal isOpen={profanity.isOpen} onClose={() => setProfanity((prev) => ({ ...prev, isOpen: false }))} message={profanity.message} detectedWords={profanity.detectedWords} />
    </div>
  );
}
