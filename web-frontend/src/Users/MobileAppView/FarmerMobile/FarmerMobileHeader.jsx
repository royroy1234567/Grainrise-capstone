import React from "react";
import { Search, Bell } from "lucide-react";
import logoImg from "../../../assets/Logo.png";

/**
 * FarmerMobileHeader
 *
 * Matches the top header in the Figma screenshot:
 * - GrainRise logo with brand mark on the left
 * - Search magnifying glass icon
 * - Notification bell with red badge dot
 * - Dark green circle profile avatar with initials "KA"
 */
export default function FarmerMobileHeader({
  onSearchClick,
  onNotificationClick,
  onProfileClick,
  unreadNotifications = 1,
  userInitials = "KA",
}) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-2.5 flex items-center justify-between shadow-2xs">
      {/* Brand Logo */}
      <div className="flex items-center">
        <img
          src={logoImg}
          alt="GrainRise"
          className="h-8 w-auto object-contain"
        />
      </div>

      {/* Action Icons & Avatar */}
      <div className="flex items-center gap-2">
        {/* Search button */}
        <button
          onClick={onSearchClick}
          aria-label="Search"
          type="button"
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
        >
          <Search size={20} strokeWidth={1.9} />
        </button>

        {/* Notifications with Unread Pink/Red Dot */}
        <button
          onClick={onNotificationClick}
          aria-label="Notifications"
          type="button"
          className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
        >
          <Bell size={20} strokeWidth={1.9} />
          {unreadNotifications > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f43f5e] ring-2 ring-white" />
          )}
        </button>

        {/* Farmer Profile Avatar (Dark Green Circle with white initials "KA") */}
        <button
          onClick={onProfileClick}
          aria-label="Farmer Profile"
          type="button"
          className="w-8 h-8 rounded-full bg-[#0d5921] text-white flex items-center justify-center text-xs font-bold tracking-tight shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer ml-0.5"
        >
          {userInitials}
        </button>
      </div>
    </header>
  );
}

