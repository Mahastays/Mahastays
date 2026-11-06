import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "24/7 On-Ground Concierge Services",
  description:
    "Elevate your stay with dedicated on-ground concierge in Mahabaleshwar: private barbecue setups, personal cooks, sunset lake boatings, guided treks, and luxury transfers.",
  alternates: {
    canonical: "/concierge-services",
  },
};

export default function ConciergeServicesPage() {
  const services = [
    {
      title: "Private Chef & Live BBQ Setup",
      desc: "Enjoy authentic Maharashtrian, North Indian, Jain, or Continental cuisines prepared fresh by dedicated villa cooks right on your terrace or lawn.",
      badge: "Popular with Villas",
    },
    {
      title: "Sunrise Treks & Guided Walks",
      desc: "Local hill-station guides lead exclusive early morning treks to Arthur's Seat, Wilson Point, and secret pine forest trails.",
      badge: "Outdoor Experience",
    },
    {
      title: "Lake Boating & Sunset Kayaking",
      desc: "Skip long ticket lines at Venna Lake and Tapola Backwaters with pre-reserved speedboats and private sunset pontoons.",
      badge: "Pre-Reserved",
    },
    {
      title: "Private Chauffeur Airport & City Transfers",
      desc: "Luxury AC SUV and sedan pickups directly from Mumbai Airport (BOM) or Pune Airport (PNQ) straight to your villa porch.",
      badge: "Door-to-Door",
    },
    {
      title: "Anniversary & Birthday Celebrations",
      desc: "Custom poolside fairy lights, balloon arches, fresh strawberry cream cakes, and personalized bonfire dining arrangements.",
      badge: "Custom Arrangements",
    },
    {
      title: "Bonfire Nights & Stargazing",
      desc: "Curated woodfire bonfires with acoustic music setups and warm hot cocoa under the clear Sahyadri night skies.",
      badge: "Complimentary on Select Villas",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-roboto antialiased">
      <main className="flex-1 pt-28 sm:pt-34 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-14">
          <span className="text-xs font-bold tracking-widest uppercase text-[#ea110d] bg-red-50 px-3.5 py-1.5 rounded-full inline-block mb-3 font-poppins">
            Dedicated Guest Care
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto font-poppins">
            Mahastays 24/7 Concierge Services
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From the moment you reserve your stay until your journey back home, our on-ground team handles every itinerary detail so you can savor every second.
          </p>
        </div>

        {/* Services Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-[#ea110d] font-poppins inline-block mb-3">
                    {s.badge}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
                <div className="pt-5 border-t border-slate-100 mt-5">
                  <a
                    href="https://wa.me/919405419021"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#ea110d] hover:underline inline-flex items-center gap-1 font-poppins"
                  >
                    <span>Request Service via WhatsApp (+91 94054 19021)</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Banner */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-poppins">
            Have a custom travel itinerary in mind?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Our concierge managers specialize in tailor-made escapes for families, couples, and corporate offsites.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <a
              href="https://wa.me/919405419021"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs font-poppins transition shadow-md"
            >
              WhatsApp Concierge: +91 94054 19021
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
