"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-footer-bg text-white pt-20 pb-24 sm:pb-28 lg:pb-9 relative overflow-hidden border-t border-white/10" id="footer">
      {/* ─── Top Call-To-Action Block (Tailwind utility classes) ─ */}
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10 flex flex-col items-center">
        <span className="text-xs font-bold tracking-widest uppercase text-primary mb-3">
          START YOUR UNFORGETTABLE ESCAPE
        </span>

        <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-bold text-white tracking-tight leading-tight mb-4 max-w-3xl font-poppins">
          Be among the first to experience handpicked luxury with Mahastays
        </h2>

        <p className="text-sm sm:text-base leading-relaxed text-slate-300 max-w-2xl mb-7 font-roboto">
          Handpicked private pool villas, boutique hillside resorts, and curated holiday packages across Mahabaleshwar &amp; Panchgani — 100% verified on-ground with 24/7 concierge support and best rate guarantee.
        </p>

        <div className="mb-9">
          <Link
            href="/explore"
            className="bg-gradient-to-r from-[#f70200] to-[#d40806] text-white border-none rounded-full px-8 py-3.5 text-sm sm:text-base font-bold inline-flex items-center gap-2 shadow-[0_6px_22px_rgba(234,17,13,0.35)] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(234,17,13,0.5)] active:translate-y-0 transition-all cursor-pointer font-poppins"
            id="footer-book-now-btn"
          >
            <span>Explore Handpicked Stays</span>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Trusted Platform Commitments */}
        <div className="flex items-center justify-center gap-6 sm:gap-9 flex-wrap pt-2.5">
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors select-none">
            <svg className="w-5 h-5 text-[#ea110d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>100% Verified Stays</span>
          </div>

          <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors select-none">
            <svg className="w-5 h-5 text-[#ea110d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Best Rate Guarantee</span>
          </div>

          <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors select-none">
            <svg className="w-5 h-5 text-[#ea110d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Instant Confirmation</span>
          </div>

          <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors select-none">
            <svg className="w-5 h-5 text-[#ea110d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>24/7 Local Concierge</span>
          </div>
        </div>
      </div>

      {/* ─── Giant Watermark Background Typography (Tailwind) ─── */}
      <div className="relative w-full text-center pointer-events-none select-none overflow-hidden my-4 sm:my-6" aria-hidden="true">
        <span className="text-6xl sm:text-8xl md:text-9xl lg:text-[160px] font-black tracking-widest uppercase whitespace-nowrap leading-none block watermark-gradient">
          MAHASTAYS
        </span>
      </div>

      {/* ─── Multi-Column Navigation Links (Tailwind) ──────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10 relative z-10">
        {/* Brand Column */}
        <div className="sm:col-span-2 lg:col-span-1 flex flex-col">
          <div className="mb-3.5 flex items-center gap-2.5">
            <Image
              src="/brand/mahastays-logo-main.png"
              alt="Mahastays Icon"
              width={40}
              height={40}
              style={{ width: "auto", height: "34px" }}
              className="object-contain"
            />
            <Image
              src="/brand/mahastays-logo-text.png"
              alt="Mahastays"
              width={150}
              height={34}
              style={{ width: "auto", height: "28px" }}
              className="object-contain"
            />
          </div>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mb-3">
            Mahastays curates the world&apos;s most breathtaking resorts, jungle villas, and cliffside sanctuaries. Tailored luxury, unforgettable moments.
          </p>

          {/* Direct Concierge Contact Numbers */}
          <div className="space-y-1.5 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Call Concierge:</span>
              <a href="tel:+917741002157" className="font-bold text-white hover:text-[#ea110d] transition-colors">
                +91 7741002157
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">WhatsApp Desk:</span>
              <a href="https://wa.me/919405419021" target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-400 hover:underline">
                +91 94054 19021
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="https://www.instagram.com/maha_stays?xtok=MXB2bHB6Mmg0eXJ6Yw%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-0.5 transition-all"
              aria-label="Instagram"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com/share/1DYot11Nwx/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-0.5 transition-all"
              aria-label="Facebook"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a
              href="https://youtube.com/@mahastays?si=5jNIfCT8fWlq-dRq"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-0.5 transition-all"
              aria-label="YouTube"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-0.5 transition-all" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
          </div>
        </div>

        {/* Link Columns */}
        <div className="flex flex-col">
          <h4 className="text-sm font-bold text-white tracking-tight mb-4 capitalize">Destinations</h4>
          <ul className="list-none flex flex-col gap-2.5 text-xs sm:text-sm text-slate-400">
            <li><a href="/explore?location=venna-lake" className="hover:text-white hover:translate-x-1 inline-block transition-all">Venna Lake, Mahabaleshwar</a></li>
            <li><a href="/explore?location=panchgani" className="hover:text-white hover:translate-x-1 inline-block transition-all">Table Land, Panchgani</a></li>
            <li><a href="/explore?location=old-mahabaleshwar" className="hover:text-white hover:translate-x-1 inline-block transition-all">Old Mahabaleshwar</a></li>
            <li><a href="/experiences/act1001" className="hover:text-white hover:translate-x-1 inline-block transition-all">Arthur&apos;s Seat Valley</a></li>
            <li><a href="/explore" className="hover:text-white hover:translate-x-1 inline-block transition-all">Kate&apos;s Point Valley</a></li>
            <li><a href="/experiences/act1005" className="hover:text-white hover:translate-x-1 inline-block transition-all">Tapola &amp; Venna Waters</a></li>
          </ul>
        </div>

        <div className="flex flex-col">
          <h4 className="text-sm font-bold text-white tracking-tight mb-4 capitalize">Stay Collections</h4>
          <ul className="list-none flex flex-col gap-2.5 text-xs sm:text-sm text-slate-400">
            <li><a href="/explore/p5001" className="hover:text-white hover:translate-x-1 inline-block transition-all">Luxury Lakeside Resorts</a></li>
            <li><a href="/explore/p5002" className="hover:text-white hover:translate-x-1 inline-block transition-all">Clifftop Infinity Pool Villas</a></li>
            <li><a href="/packages/pkg1001" className="hover:text-white hover:translate-x-1 inline-block transition-all">Romantic Anniversary Packages</a></li>
            <li><a href="/packages/pkg1002" className="hover:text-white hover:translate-x-1 inline-block transition-all">Bachelor Party Villa Takeovers</a></li>
            <li><a href="/packages/pkg1003" className="hover:text-white hover:translate-x-1 inline-block transition-all">Corporate Offsite Retreats</a></li>
            <li><a href="/experiences" className="hover:text-white hover:translate-x-1 inline-block transition-all">Trekking &amp; Paragliding Tours</a></li>
          </ul>
        </div>

        <div className="flex flex-col">
          <h4 className="text-sm font-bold text-white tracking-tight mb-4 capitalize">Pages</h4>
          <ul className="list-none flex flex-col gap-2.5 text-xs sm:text-sm text-slate-400">
            <li><Link href="/" className="hover:text-white hover:translate-x-1 inline-block transition-all">Home</Link></li>
            <li><Link href="/explore" className="hover:text-white hover:translate-x-1 inline-block transition-all">Explore Stays</Link></li>
            <li><Link href="/packages" className="hover:text-white hover:translate-x-1 inline-block transition-all">Packages</Link></li>
            <li><Link href="/experiences" className="hover:text-white hover:translate-x-1 inline-block transition-all">Experiences</Link></li>
            <li><Link href="/about" className="hover:text-white hover:translate-x-1 inline-block transition-all">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white hover:translate-x-1 inline-block transition-all">Contact Concierge</Link></li>
          </ul>
        </div>

        <div className="flex flex-col">
          <h4 className="text-sm font-bold text-white tracking-tight mb-4 capitalize">Quick Links</h4>
          <ul className="list-none flex flex-col gap-2.5 text-xs sm:text-sm text-slate-400">
            <li><Link href="/why-mahastays" className="hover:text-white hover:translate-x-1 inline-block transition-all">Why Mahastays?</Link></li>
            <li><Link href="/best-rate-guarantee" className="hover:text-white hover:translate-x-1 inline-block transition-all">Best Rate Guarantee</Link></li>
            <li><Link href="/concierge-services" className="hover:text-white hover:translate-x-1 inline-block transition-all">Concierge Services</Link></li>
            <li><Link href="/guest-reviews" className="hover:text-white hover:translate-x-1 inline-block transition-all">Guest Reviews</Link></li>
            <li><Link href="/booking-info" className="hover:text-white hover:translate-x-1 inline-block transition-all">Delivery &amp; Booking Info</Link></li>
            <li><Link href="/faqs" className="hover:text-white hover:translate-x-1 inline-block transition-all">Help &amp; FAQs</Link></li>
          </ul>
        </div>
      </div>

      {/* ─── Bottom Copyright & Legal (Tailwind) ───────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 relative z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/returns-and-refunds" className="hover:text-slate-300 transition-colors">Returns and refunds</Link>
          <span>·</span>
          <Link href="/terms-and-conditions" className="hover:text-slate-300 transition-colors">Terms and conditions</Link>
          <span>·</span>
          <Link href="/cookie-settings" className="hover:text-slate-300 transition-colors">Cookie settings</Link>
        </div>

        <div>
          <span>&copy; {new Date().getFullYear()} Mahastays Inc. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
