import React from "react";
import {
  LayoutGrid,
  Tractor,
  FileText,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";

/**
 * FarmerMobileBottomNav
 *
 * Fitted & optimized for all Android devices:
 * - Includes bottom safe area inset padding (`pb-[max(0.5rem,env(safe-area-inset-bottom))]`)
 *   to avoid obstruction by Android system navigation bars / gesture pill indicators.
 * - Flex-1 evenly spaced buttons for all screen widths (320px - 540px+).
 */
export default function FarmerMobileBottomNav({
  activeTab,
  onTabChange,
  unreadMessagesCount = 1,
}) {
  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutGrid size={20} strokeWidth={2.2} />,
    },
    {
      id: "farm",
      label: "Farm",
      icon: <Tractor size={20} strokeWidth={2} />,
    },
    {
      id: "contracts",
      label: "Contracts",
      icon: <FileText size={20} strokeWidth={2} />,
    },
    {
      id: "messages",
      label: "Messages",
      icon: <MessageSquare size={20} strokeWidth={2} />,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
    },
    {
      id: "more",
      label: "More",
      icon: <MoreHorizontal size={20} strokeWidth={2.2} />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-lg w-full">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95 cursor-pointer touch-manipulation select-none ${
                isActive
                  ? "text-[#0d5921] font-bold"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              {/* Active Pill Indicator on top */}
              {isActive && (
                <span className="absolute -top-1.5 w-7 h-1 rounded-full bg-[#0d5921]" />
              )}

              <div className="relative">
                {tab.icon}
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-0.5 rounded-full bg-[#f43f5e] text-white text-[8.5px] font-black flex items-center justify-center ring-2 ring-white">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[9.5px] sm:text-[10px] tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
