"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast } from "../../components/ui/Toast";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "booking",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.warning("Please fill out all required fields.", "Incomplete Form");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Thank you! Your message has been routed to our 24/7 guest concierge desk.", "Message Dispatched");
      setFormData({
        name: "",
        email: "",
        phone: "",
        inquiryType: "booking",
        message: "",
      });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-roboto antialiased">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-34 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <span className="text-xs font-bold tracking-widest uppercase text-[#ea110d] bg-red-50 px-3.5 py-1.5 rounded-full inline-block mb-3 font-poppins">
            24x7 Guest Desk
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto font-poppins">
            We&apos;re Here to Help Plan Your Dream Stay
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Have questions about an upcoming reservation, private villa takeovers, or custom celebrations? Our on-ground concierge is available around the clock.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Contact Info Channels */}
            <div className="lg:col-span-5 space-y-4">
              {/* WhatsApp Direct Card */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 uppercase tracking-wider">
                    Instant Response
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold font-poppins">Priority WhatsApp Concierge</h3>
                  <p className="text-xs text-white/90 mt-1 leading-relaxed">
                    Message our Western Maharashtra ground desk directly for immediate villa availability, live photos, and booking changes.
                  </p>
                </div>
                <a
                  href="https://wa.me/919405419021"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-emerald-800 font-bold text-xs sm:text-sm hover:bg-emerald-50 transition shadow-md font-poppins"
                >
                  <span>Chat on WhatsApp (+91 94054 19021)</span>
                  <span>→</span>
                </a>
              </div>

              {/* Regular Channels */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#ea110d] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-poppins">Email Inquiries</span>
                    <a href="mailto:support@mahastays.com" className="text-sm font-bold text-slate-900 hover:text-[#ea110d] transition font-poppins">
                      support@mahastays.com
                    </a>
                    <p className="text-xs text-slate-500 mt-0.5">Average reply time under 15 minutes.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#ea110d] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-poppins">Calling / Direct Hotline</span>
                    <a href="tel:+917741002157" className="text-sm font-bold text-slate-900 hover:text-[#ea110d] transition font-poppins">
                      +91 7741002157
                    </a>
                    <p className="text-xs text-slate-500 mt-0.5">Available 24 hours a day, 7 days a week.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#ea110d] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-poppins">Guest Experience Hub</span>
                    <p className="text-sm font-bold text-slate-900 font-poppins">
                      Panchgani-Mahabaleshwar Road, Near Venna Lake
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Satara District, Maharashtra 412806, India</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Interactive Message Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-poppins mb-1">
                Send Us a Message
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6">
                Tell us about your trip plans or inquiry. We usually reply in less than 15 minutes.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Abhishek Kumar"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#ea110d] bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. abhishek@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#ea110d] bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#ea110d] bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                      Topic / Inquiry Type
                    </label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#ea110d] bg-slate-50/50 cursor-pointer"
                    >
                      <option value="booking">Upcoming Reservation or Stay Details</option>
                      <option value="group">Large Group / Villa Buyout</option>
                      <option value="event">Anniversary, Proposal or Birthday Setup</option>
                      <option value="host">List My Property on Mahastays</option>
                      <option value="billing">Payment &amp; Invoice Assistance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                    How can our concierge help you? *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide your travel dates, preferred location (Mahabaleshwar, Panchgani, Lonavala), guest count, or any custom requirements..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#ea110d] bg-slate-50/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-xs sm:text-sm font-poppins shadow-md shadow-red-500/20 disabled:opacity-60 transition cursor-pointer"
                >
                  {isSubmitting ? "Routing to Desk..." : "Send Message to Concierge →"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
