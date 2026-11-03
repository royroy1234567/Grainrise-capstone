import React from "react";
import FarmerMobileApp from "../MobileAppView/FarmerMobile/FarmerMobileApp";

/**
 * FarmerMobilePreviewPage
 *
 * Fullscreen mobile preview wrapper for Farmer Mobile View.
 * Automatically adapts and maximizes to 100% of the screen width and height
 * across all Android devices (Samsung Galaxy, Google Pixel, Xiaomi, Oppo, Vivo, Motorola, etc.)
 * while maintaining responsive centering on wider desktop viewports.
 *
 * Accessible via:
 * - /farmer/mobile-preview
 * - /mobile-preview/farmer
 * - /farmer-mobile
 */
export default function FarmerMobilePreviewPage() {
  return (
    <div className="w-full min-h-screen bg-[#f8fafc] flex justify-center">
      {/* 
        On mobile/Android viewports (<= 640px), takes 100% full width and height with no borders/letterboxing.
        On desktop monitors (> 640px), centers gracefully up to max-w-md with subtle framing.
      */}
      <div className="w-full sm:max-w-md min-h-screen bg-[#f8fafc] sm:shadow-lg sm:border-x sm:border-slate-200/80 flex flex-col">
        <FarmerMobileApp />
      </div>
    </div>
  );
}
