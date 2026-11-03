import React, { useState } from "react";
import {
  Search,
  SquarePen,
  Building2,
  CheckCheck,
  Check,
  Clock,
  Anchor,
  ChevronLeft,
  FileText,
  FileCheck2,
  Paperclip,
  Mic,
  Send,
  Download,
  Wifi,
  Boxes,
} from "lucide-react";

import riceSackImg from "../../../assets/rice-sack-pos.jpg";

/**
 * FarmerMobileMessagesView
 *
 * Exact replica of the Figma design for Messages:
 * 1. Conversations List View (Screenshots 3 & 4):
 *    - Header: "Messages" with Compose message icon
 *    - Search bar: "Search conversations"
 *    - Conversation cards:
 *      - ABC Rice Mill (Depot Central #4 • Bulacan, Delivered • Waiting for QA PDF, 10:42 AM, 2 unread)
 *      - Golden Harvest Milling (Isabela Grain Silo, Valid until Nov 1 • 500 Sacks Reserved, Yesterday, 2 unread)
 *      - Delta Agro Co. (Freight Division, In Transit: Manila Wharf (Wharf 9), Oct 12, double checkmark)
 * 2. Chat Detail / Thread View (Screenshots 1 & 2):
 *    - Header: Back button, "ABC Rice Mill ✓", "APP-2026-0018 • Application Under Review", "[📄 View Ref]" button
 *    - Date chip: "Today, October 15, 2024"
 *    - Top Pinned Context Card: Lot #994-A • Dinorado Special (Triple Milled, Depot 4 Storage Dock, 500 Sacks Reserved (25,000 kg))
 *    - Incoming bubble from ABC Rice Mill (requesting moisture analysis report)
 *    - Outgoing bubble from Farmer (confirming report is ready)
 *    - Attachment bubble: Moisture_Report_Oct24.pdf (1.2 MB • Signed Lab Certificate with Download button)
 *    - Auto-verified Depot Sensor card: "Depot Moisture Reading: 12.9%" (< 14.0% compliant)
 *    - Quick action chips: "Acknowledge Sample Delivery", "Re-confirm Sacks Allocation"
 *    - Modern input bar: Paperclip 📎, "Type a message...", Mic 🎙, "Send ➤" button
 */
export default function FarmerMobileMessagesView() {
  const [activeChat, setActiveChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputMsg, setInputMsg] = useState("");
  const [showRefModal, setShowRefModal] = useState(false);

  // Conversations list matching screenshots 3 & 4
  const [conversations, setConversations] = useState([
    {
      id: "conv-1",
      millName: "ABC Rice Mill",
      verified: true,
      online: true,
      time: "10:42 AM",
      location: "Depot Central #4 • Bulacan",
      previewText:
        "We've received your application for the long-grain rice contract. Could you please provi...",
      statusText: "Delivered • Waiting for QA PDF",
      statusIcon: "checkCheck",
      unreadCount: 2,
      lotInfo: {
        lotNo: "Lot #994-A",
        variety: "Dinorado Special",
        badge: "Triple Milled",
        dock: "Depot 4 Storage Dock • Batch Q3-2024",
        reserved: "500 Sacks Reserved (25,000 kg)",
      },
    },
    {
      id: "conv-2",
      millName: "Golden Harvest Milling",
      verified: true,
      online: true,
      time: "Yesterday",
      location: "Isabela Grain Silo • Depot Bay 2",
      previewText:
        "The revised offer details have been sent. Please review the delivery schedule for th...",
      statusText: "Valid until Nov 1 • 500 Sacks Reserved",
      statusIcon: "clock",
      unreadCount: 2,
      lotInfo: {
        lotNo: "Lot #812-B",
        variety: "Jasmine Premium",
        badge: "Clean & Dry",
        dock: "Depot Bay 2 Silo • Batch Q4-2024",
        reserved: "300 Sacks Reserved (15,000 kg)",
      },
    },
    {
      id: "conv-3",
      millName: "Delta Agro Co.",
      verified: false,
      online: false,
      time: "Oct 12",
      location: "Freight Division • Port Logistics",
      previewText:
        "Delivery confirmed for shipment #4. Payment will be processed within 5 business days...",
      statusText: "In Transit: Manila Wharf (Wharf 9)",
      statusIcon: "anchor",
      unreadCount: 0,
      lotInfo: {
        lotNo: "Lot #704-C",
        variety: "NSIC Rc222",
        badge: "In Transit",
        dock: "Manila Wharf Pier 9",
        reserved: "800 Sacks Dispatched (40,000 kg)",
      },
    },
  ]);

  // Thread messages for ABC Rice Mill (Screenshots 1 & 2)
  const [messagesThread, setMessagesThread] = useState([
    {
      id: "m-1",
      sender: "miller",
      text: "Hello. We've received your application (APP-2026-0018) for the long-grain rice contract. Could you please provide the updated moisture analysis report from your latest harvest? We need this to proceed with the review.",
      time: "10:42 AM",
    },
    {
      id: "m-2",
      sender: "farmer",
      text: "Hi, thanks for reaching out. Yes, I have the latest moisture analysis report ready. I will attach it here momentarily. The levels are consistent with our historical data.",
      time: "11:15 AM",
      delivered: true,
    },
    {
      id: "m-3",
      sender: "farmer_attachment",
      fileName: "Moisture_Report_Oct24.pdf",
      fileSize: "1.2 MB • Signed Lab Certificate",
      time: "11:16 AM",
      delivered: true,
    },
    {
      id: "m-4",
      sender: "system_sensor",
      reading: "Depot Moisture Reading: 12.9%",
      detail:
        "Auto-verified by Depot #4 automated grain sensor array. Status complies with premium milling benchmark (< 14.0%).",
    },
  ]);

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputMsg).trim();
    if (!text) return;

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: "farmer",
      text: text,
      time: "Just now",
      delivered: true,
    };

    setMessagesThread((prev) => [...prev, newMsg]);
    setInputMsg("");
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.millName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.previewText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ══════════════════════════════════════════════════════════════════
  // DETAIL CHAT VIEW (Screenshots 1 & 2)
  // ══════════════════════════════════════════════════════════════════
  if (activeChat) {
    return (
      <div className="flex flex-col h-[calc(100vh-125px)] bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
        {/* Top Header */}
        <div className="px-3.5 py-3 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Back Button */}
            <button
              onClick={() => setActiveChat(null)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-all cursor-pointer"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-900 leading-tight">
                  {activeChat.millName}
                </h3>
                {activeChat.verified && (
                  <span className="w-3.5 h-3.5 rounded-full bg-[#0d5921] text-white flex items-center justify-center text-[8px] font-bold">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                APP-2026-0018 &bull; Application Under Review
              </p>
            </div>
          </div>

          {/* View Ref Button */}
          <button
            onClick={() => setShowRefModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <FileText size={13} className="text-slate-500" />
            <span>View Ref</span>
          </button>
        </div>

        {/* Messages Scrollable Body */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-[#f8fafc]/60">
          {/* Centered Date Separator Chip */}
          <div className="text-center my-1">
            <span className="inline-block px-3 py-1 rounded-full bg-slate-200/60 text-slate-500 text-[10px] font-semibold">
              Today, October 15, 2024
            </span>
          </div>

          {/* Top Order/Batch Context Card (Screenshot 2) */}
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs flex items-center gap-3">
            <img
              src={riceSackImg}
              alt="Lot"
              className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-xs font-black text-slate-900 truncate">
                  {activeChat.lotInfo.lotNo} &bull; {activeChat.lotInfo.variety}
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-[#fef3c7] text-[#92400e] text-[9.5px] font-bold whitespace-nowrap">
                  {activeChat.lotInfo.badge}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                {activeChat.lotInfo.dock}
              </p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#0d5921] mt-1">
                <Boxes size={12} />
                <span>{activeChat.lotInfo.reserved}</span>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          {messagesThread.map((msg) => {
            // 1. Incoming Miller Bubble
            if (msg.sender === "miller") {
              return (
                <div key={msg.id} className="max-w-[85%] space-y-1">
                  <div className="bg-[#f0f4ff] text-slate-800 rounded-3xl rounded-tl-sm p-3.5 text-xs leading-relaxed shadow-2xs">
                    {msg.text}
                  </div>
                  <div className="text-[9.5px] text-slate-400 pl-2">
                    {msg.time}
                  </div>
                </div>
              );
            }

            // 2. Outgoing Farmer Bubble
            if (msg.sender === "farmer") {
              return (
                <div
                  key={msg.id}
                  className="max-w-[85%] ml-auto flex flex-col items-end space-y-1"
                >
                  <div className="bg-[#0d5921] text-white rounded-3xl rounded-tr-sm p-3.5 text-xs leading-relaxed shadow-xs">
                    {msg.text}
                  </div>
                  <div className="text-[9.5px] text-slate-400 pr-2 flex items-center gap-1">
                    <span>{msg.time}</span>
                    <CheckCheck size={12} className="text-[#0d5921]" />
                  </div>
                </div>
              );
            }

            // 3. Outgoing PDF Attachment Bubble
            if (msg.sender === "farmer_attachment") {
              return (
                <div
                  key={msg.id}
                  className="max-w-[85%] ml-auto flex flex-col items-end space-y-1"
                >
                  <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-3 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                        <FileCheck2 size={19} />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 leading-tight">
                          {msg.fileName}
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          {msg.fileSize}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                  <div className="text-[9.5px] text-slate-400 pr-2 flex items-center gap-1">
                    <span>{msg.time}</span>
                    <CheckCheck size={12} className="text-[#0d5921]" />
                  </div>
                </div>
              );
            }

            // 4. Auto-verified Sensor Card (Screenshot 1)
            if (msg.sender === "system_sensor") {
              return (
                <div
                  key={msg.id}
                  className="bg-[#f0f4ff] border border-blue-100/80 rounded-2xl p-3.5 space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#0d5921] flex items-center justify-center">
                        <Wifi size={13} />
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        {msg.reading}
                      </span>
                    </div>
                    <span className="w-4 h-4 rounded-full bg-[#0d5921] text-white flex items-center justify-center text-[9px] font-bold">
                      ✓
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-8">
                    {msg.detail}
                  </p>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Quick Action Pills (Above Input Bar) */}
        <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() =>
              handleSendMessage(
                "Sample delivery of 50kg grain sample dispatched to Depot #4 for milling analysis."
              )
            }
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer"
          >
            Acknowledge Sample Delivery
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                "Confirmed: Allocation of 500 sacks (25,000 kg) reserved for delivery on Oct 24."
              )
            }
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer"
          >
            Re-confirm Sacks Allocation
          </button>
        </div>

        {/* Bottom Chat Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2"
        >
          {/* Paperclip Attachment Button */}
          <button
            type="button"
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Paperclip size={17} />
          </button>

          {/* Text Input with Microphone */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Type a message..."
              className="w-full pl-3.5 pr-8 py-2 rounded-xl bg-slate-100/90 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d5921]"
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Mic size={15} />
            </button>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-[#0d5921] text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-[#0b4b1c] active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <span>Send</span>
            <Send size={13} />
          </button>
        </form>

        {/* Modal: View Ref Details */}
        {showRefModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">
                  Contract Reference
                </h3>
                <button
                  onClick={() => setShowRefModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Application ID:</span>
                  <span className="font-mono font-bold text-slate-800">APP-2026-0018</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grain Batch:</span>
                  <span className="font-bold text-slate-800">Dinorado Special (Lot #994-A)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reserved Allocation:</span>
                  <span className="font-bold text-slate-800">500 Sacks (25,000 kg)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Buyer Station:</span>
                  <span className="font-bold text-slate-800">ABC Rice Mill &bull; Depot #4</span>
                </div>
              </div>

              <button
                onClick={() => setShowRefModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#0d5921] text-white text-xs font-bold hover:bg-[#0b4b1c] cursor-pointer"
              >
                Close Reference
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // CONVERSATIONS LIST VIEW (Screenshots 3 & 4)
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-3.5">
      {/* Title & Compose Icon Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
          Messages
        </h1>
        <button
          type="button"
          onClick={() => setActiveChat(conversations[0])}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
        >
          <SquarePen size={18} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations"
          className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d5921] shadow-2xs"
        />
      </div>

      {/* Conversation Cards List matching Figma screenshots 3 & 4 */}
      <div className="space-y-3">
        {filteredConversations.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveChat(c)}
            className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-3 hover:border-slate-200 active:scale-[0.99] transition-all cursor-pointer"
          >
            {/* Header: Mill Icon, Name, Active Dot, Timestamp */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#ebf6ed] text-[#0d5921] flex items-center justify-center shrink-0">
                  <Building2 size={20} strokeWidth={2} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      {c.millName}
                    </h3>
                    {c.online && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {c.location}
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-semibold text-slate-400">
                {c.time}
              </span>
            </div>

            {/* Bubble Preview */}
            <div className="bg-[#f0f4ff] rounded-2xl p-3 text-xs text-slate-700 leading-relaxed">
              {c.previewText}
            </div>

            {/* Footer Row: Status on left, unread badge on right */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                {c.statusIcon === "checkCheck" && (
                  <CheckCheck size={14} className="text-[#0d5921]" />
                )}
                {c.statusIcon === "clock" && (
                  <Clock size={13} className="text-amber-600" />
                )}
                {c.statusIcon === "anchor" && (
                  <Anchor size={13} className="text-blue-600" />
                )}
                <span className="truncate">{c.statusText}</span>
              </div>

              {c.unreadCount > 0 ? (
                <span className="w-5 h-5 rounded-full bg-[#0d5921] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  {c.unreadCount}
                </span>
              ) : (
                <CheckCheck size={14} className="text-slate-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
