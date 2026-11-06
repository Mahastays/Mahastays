"use client";

import { useState } from "react";
import Link from "next/link";

export default function FaqsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState("all");

  const faqs = [
    {
      category: "booking",
      question: "How do I make a reservation on Mahastays?",
      answer:
        "Simply browse our catalog of verified hotels, villas, or packages, choose your preferred check-in and check-out dates, select the number of guests, and proceed to checkout. Once payment is captured via Razorpay, your booking is confirmed instantly.",
    },
    {
      category: "booking",
      question: "Can I book a whole villa exclusively for my family or bachelor group?",
      answer:
        "Yes! Look for properties tagged as 'Standalone Villa' or 'Private Pool Villa'. When you book these listings, you and your group have exclusive private access to the entire estate, swimming pool, and gardens.",
    },
    {
      category: "cancellation",
      question: "What is the cancellation and refund policy?",
      answer:
        "Most stays on Mahastays offer 100% full refunds if cancelled up to 48 hours prior to check-in. Cancellations between 24 to 48 hours receive a 50% refund or full wallet credit. Please verify the specific cancellation policy listed on the property page.",
    },
    {
      category: "cancellation",
      question: "How long does a refund take to process?",
      answer:
        "Refunds initiated through our system are credited back to your original payment mode (UPI, card, or bank account) within 3 to 5 business days, depending on your bank.",
    },
    {
      category: "stays",
      question: "Are swimming pools private and heated?",
      answer:
        "Private pool villas feature dedicated swimming pools exclusively for your party. Select luxury properties offer temperature-controlled or solar-heated pools (indicated in the amenities badge).",
    },
    {
      category: "stays",
      question: "Is pure vegetarian or Jain food available at villas?",
      answer:
        "Yes! Many of our partner villas have dedicated vegetarian and Jain kitchens where separate cookware is used upon request. You can indicate dietary preferences during booking or to your assigned concierge.",
    },
    {
      category: "membership",
      question: "What are the benefits of the Mahastays Club membership?",
      answer:
        "Enrolled members receive a guaranteed 8% discount on every stay and package, priority early check-in, late check-out, and complimentary activity upgrades such as Venna Lake sunset boating tickets.",
    },
    {
      category: "membership",
      question: "How do I become a Club Gold member?",
      answer:
        "Club Gold membership is automatically activated for verified accounts upon completing your first booking on Mahastays, or via select corporate partner promotions.",
    },
  ];

  const filtered = activeCategory === "all" ? faqs : faqs.filter((f) => f.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-roboto antialiased">
      <main className="flex-1 pt-28 sm:pt-34 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <span className="text-xs font-bold tracking-widest uppercase text-[#ea110d] bg-red-50 px-3.5 py-1.5 rounded-full inline-block mb-3 font-poppins">
            Help Center
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto font-poppins">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Quick answers regarding booking reservations, cancellation guidelines, villa amenities, and Club membership perks.
          </p>
        </div>

        {/* Category Pills */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-10">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 font-poppins text-xs">
            {[
              { id: "all", label: "All Questions" },
              { id: "booking", label: "Bookings & Check-in" },
              { id: "cancellation", label: "Refunds & Cancellations" },
              { id: "stays", label: "Villas & Amenities" },
              { id: "membership", label: "Club Privileges" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setOpenIndex(null);
                }}
                className={`px-4 py-2 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion List */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-3 mb-16">
          {filtered.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900 font-poppins">
                    {item.question}
                  </span>
                  <span className={`w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 text-sm transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-150">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions? */}
        <div className="max-w-2xl mx-auto px-4 text-center bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-lg font-bold text-slate-900 font-poppins">
            Still have questions?
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Our guest support team is online 24/7. Drop us a message and we&apos;ll help you immediately.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://wa.me/919405419021"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs font-poppins shadow-xs transition"
            >
              WhatsApp Us (+91 94054 19021)
            </a>
            <a
              href="tel:+917741002157"
              className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs font-poppins transition"
            >
              Call: +91 7741002157
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
