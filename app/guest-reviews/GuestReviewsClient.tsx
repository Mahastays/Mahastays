"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function GuestReviewsPage() {
  const [filter, setFilter] = useState("all");

  const reviews = [
    {
      id: 1,
      author: "Pooja & Rohan Sharma",
      city: "Mumbai",
      stay: "Sunset Ridge Clifftop Villa, Mahabaleshwar",
      type: "villas",
      rating: 5,
      date: "October 2026",
      comment:
        "The infinity pool view over the valley took our breath away. Having the in-house chef prepare fresh hot pakodas and barbecue while we sat by the bonfire was unforgettable. 10/10 experience!",
    },
    {
      id: 2,
      author: "Vikram Malhotra",
      city: "Pune",
      stay: "Evershine Grand Resort & Spa",
      type: "couples",
      rating: 5,
      date: "September 2026",
      comment:
        "Seamless check-in. The room was pristine and the direct WhatsApp concierge was so helpful when we needed our Venna Lake boating passes reserved without waiting in the weekend rush.",
    },
    {
      id: 3,
      author: "Ananya Deshmukh",
      city: "Thane",
      stay: "Strawberry Valley Heritage Estate",
      type: "family",
      rating: 5,
      date: "August 2026",
      comment:
        "We traveled with 8 family members including grandparents. The property layout gave everyone privacy while the huge central lawn was perfect for our evening games. The strawberry farm tour was a huge hit!",
    },
    {
      id: 4,
      author: "Arjun Singhal & Team",
      city: "Bengaluru",
      stay: "The Cliff Luxury Retreat, Panchgani",
      type: "corporate",
      rating: 5,
      date: "July 2026",
      comment:
        "Hosted our leadership offsite here. High-speed Wi-Fi worked flawlessly across the whole property, projectors were set up in advance, and the catering was exceptional. Highly recommended.",
    },
    {
      id: 5,
      author: "Sneha Patil",
      city: "Kolhapur",
      stay: "Lakeside Solitude Cottage",
      type: "couples",
      rating: 5,
      date: "June 2026",
      comment:
        "Quiet, romantic, and surrounded by pine trees. Waking up to mist rolling over the lake from our bedroom glass wall felt like a Swiss getaway right here in Maharashtra.",
    },
    {
      id: 6,
      author: "Karan Johar & Friends",
      city: "Mumbai",
      stay: "Villa Bellissimo Infinity Pool Takeover",
      type: "villas",
      rating: 5,
      date: "May 2026",
      comment:
        "Booked for my 30th birthday. No noisy neighbors, music by the pool, and the concierge arranged a gorgeous setup with balloons and a two-tier cake on arrival. Best birthday ever!",
    },
  ];

  const filtered = filter === "all" ? reviews : reviews.filter((r) => r.type === filter);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-roboto antialiased">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-34 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
          <span className="text-xs font-bold tracking-widest uppercase text-[#ea110d] bg-red-50 px-3.5 py-1.5 rounded-full inline-block mb-3 font-poppins">
            Verified Testimonials
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto font-poppins">
            Stories &amp; Experiences From Our Guests
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Real feedback from travelers who stayed at our curated villas, private estates, and luxury hill-station resorts.
          </p>

          {/* Rating Summary Card */}
          <div className="mt-8 inline-flex items-center gap-6 bg-white px-6 py-3.5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900 font-poppins">4.9</span>
              <div className="flex text-amber-400 text-sm">★★★★★</div>
            </div>
            <div className="w-[1px] h-8 bg-slate-200" />
            <div className="text-left text-xs text-slate-600">
              <span className="font-bold text-slate-900 block">Verified Real Guests</span>
              <span>100% Genuine Stays</span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none font-poppins text-xs">
            {[
              { id: "all", label: "All Reviews" },
              { id: "villas", label: "Private Pool Villas" },
              { id: "couples", label: "Couples & Honeymoon" },
              { id: "family", label: "Family Getaways" },
              { id: "corporate", label: "Corporate Retreats" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
                  filter === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-amber-400 text-sm">
                      {"★".repeat(rev.rating)}
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">{rev.date}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-poppins">
                        {rev.author}
                      </h4>
                      <span className="text-[10px] text-slate-400">Resident of {rev.city}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verified Guest
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#ea110d] block mt-1.5 truncate">
                    {rev.stay}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review Callout */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-slate-900 font-poppins">
              Stayed with us recently?
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Share your trip story and photos with our team to receive an instant ₹1,000 credit toward your next booking.
            </p>
            <div className="pt-2">
              <Link
                href="/profile?tab=bookings"
                className="px-6 py-2.5 rounded-full bg-[#ea110d] text-white font-bold text-xs font-poppins shadow-xs hover:bg-[#d00f0c] transition inline-block"
              >
                Write a Guest Review →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
