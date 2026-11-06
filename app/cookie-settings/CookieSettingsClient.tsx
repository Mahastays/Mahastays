"use client";

import { useState } from "react";
import { toast } from "../../components/ui/Toast";

export default function CookieSettingsPage() {
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: true,
    functional: true,
    marketing: false,
  });

  const handleSave = () => {
    toast.success("Your cookie preferences have been updated and saved.", "Preferences Saved");
  };

  const handleAcceptAll = () => {
    setPreferences({
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true,
    });
    toast.success("All cookies enabled for optimal browsing experience.", "All Cookies Accepted");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-roboto antialiased">
      <main className="flex-1 pt-28 sm:pt-34 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-[#ea110d] bg-red-50 px-3.5 py-1.5 rounded-full inline-block mb-3 font-poppins">
              Privacy Controls
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-poppins">
              Cookie Preferences &amp; Settings
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Control how cookies and tracking technologies are used during your visits to Mahastays.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
            {/* Necessary Cookies */}
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins">
                    Strictly Necessary Cookies
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    Always Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                  Essential for website security, user authentication sessions, checkout flow navigation, and load balancing. The website cannot function properly without these.
                </p>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled
                className="w-5 h-5 accent-[#ea110d] cursor-not-allowed opacity-70 mt-1"
              />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins">
                  Analytics &amp; Performance Cookies
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                  Allow us to count visits and traffic sources so we can measure and improve the speed and responsiveness of property search filters and booking pages.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                className="w-5 h-5 accent-[#ea110d] cursor-pointer mt-1"
              />
            </div>

            {/* Functional Cookies */}
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins">
                  Functional &amp; Preference Cookies
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                  Enable personalized features such as remembering your preferred currency (INR), language, and recently viewed villas and stay packages.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                className="w-5 h-5 accent-[#ea110d] cursor-pointer mt-1"
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start justify-between gap-4 pb-6">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins">
                  Targeted Marketing &amp; Advertising Cookies
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                  Used by our trusted promotional partners to build a profile of your interests and display relevant vacation offers on external sites.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                className="w-5 h-5 accent-[#ea110d] cursor-pointer mt-1"
              />
            </div>

            {/* Save Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Accept All Cookies
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-xs font-poppins shadow-md shadow-red-500/20 transition cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
