"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../../lib/api";

interface ReviewItem {
  id: string;
  author: string;
  location?: string;
  avatar?: string;
  date: string;
  rating: number;
  comment: string;
  roomStayed?: string;
  tierTravelled?: string;
  slotBooked?: string;
  targetType?: string;
  isVerifiedStay?: boolean;
}

export default function GuestReviewsPage() {
  const [filter, setFilter] = useState("all");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState({ average: 0, count: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form fields
  const [authorName, setAuthorName] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [targetType, setTargetType] = useState<"property" | "package" | "experience">("property");

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/reviews?limit=50");
      const data = res.data?.data || res.data?.items || res.data || [];
      const items: ReviewItem[] = Array.isArray(data) ? data : [];
      setReviews(items);

      const metaSum = res.data?.meta?.summary;
      if (metaSum && metaSum.count > 0) {
        setSummary({ average: metaSum.average || 5.0, count: metaSum.count });
      } else if (items.length > 0) {
        const sum = items.reduce((acc, r) => acc + (r.rating || 5), 0);
        setSummary({ average: Math.round((sum / items.length) * 10) / 10, count: items.length });
      } else {
        setSummary({ average: 0, count: 0 });
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) {
      setSubmitError("Please fill in your name and review details.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await api.post("/reviews", {
        author: authorName.trim(),
        location: location.trim() || undefined,
        rating,
        comment: comment.trim(),
        targetType,
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setAuthorName("");
        setLocation("");
        setRating(5);
        setComment("");
        fetchReviews();
      }, 1200);
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      setSubmitError(err.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === "all") return true;
    if (filter === "5star") return r.rating === 5;
    if (filter === "property") return r.targetType === "property" || !r.targetType;
    if (filter === "package") return r.targetType === "package";
    if (filter === "experience") return r.targetType === "experience";
    return true;
  });

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
            Genuine verified feedback from travelers who booked stays, packages, and curated experiences across Maharashtra.
          </p>

          {/* Rating Summary Card */}
          {summary.count > 0 ? (
            <div className="mt-8 inline-flex items-center gap-6 bg-white px-6 py-3.5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900 font-poppins">
                  {summary.average.toFixed(1)}
                </span>
                <div className="flex text-amber-400 text-sm">
                  {"★".repeat(Math.round(summary.average))}
                </div>
              </div>
              <div className="w-[1px] h-8 bg-slate-200" />
              <div className="text-left text-xs text-slate-600">
                <span className="font-bold text-slate-900 block">{summary.count} Verified Reviews</span>
                <span>Direct Database Records</span>
              </div>
            </div>
          ) : (
            <div className="mt-8 inline-flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm text-xs text-slate-500">
              <span>No platform reviews recorded yet</span>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none font-poppins text-xs">
            {[
              { id: "all", label: `All Reviews (${reviews.length})` },
              { id: "5star", label: "5-Star Ratings" },
              { id: "property", label: "Villas & Stays" },
              { id: "package", label: "Holiday Packages" },
              { id: "experience", label: "Local Experiences" },
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
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading verified reviews...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center max-w-lg mx-auto border border-slate-100 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-[#ea110d] flex items-center justify-center mx-auto text-2xl font-bold">
                ★
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-poppins">
                No Reviews Found
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                There are no reviews matching this filter in our database yet. Have you stayed with us? Share your story!
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 rounded-full bg-[#ea110d] text-white font-bold text-xs font-poppins shadow-xs hover:bg-[#d00f0c] transition cursor-pointer"
              >
                Write the First Review →
              </button>
            </div>
          ) : (
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
                        {"☆".repeat(Math.max(0, 5 - rev.rating))}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">{rev.date}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-poppins">
                          {rev.author ? rev.author[0].toUpperCase() : "G"}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-poppins">
                            {rev.author}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {rev.location ? `Resident of ${rev.location}` : "Guest Traveler"}
                          </span>
                        </div>
                      </div>
                      {rev.isVerifiedStay !== false && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified
                        </span>
                      )}
                    </div>
                    {(rev.roomStayed || rev.tierTravelled || rev.slotBooked) && (
                      <span className="text-[11px] font-semibold text-[#ea110d] block mt-1.5 truncate">
                        {rev.roomStayed || rev.tierTravelled || rev.slotBooked}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Callout */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-slate-900 font-poppins">
              Stayed or traveled with us recently?
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Share your genuine experience with other travelers. Your feedback helps our partner hosts maintain quality standards.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 rounded-full bg-[#ea110d] text-white font-bold text-xs font-poppins shadow-xs hover:bg-[#d00f0c] transition inline-block cursor-pointer"
              >
                Write a Guest Review →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Write Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-poppins">Write a Guest Review</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold transition"
              >
                ✕
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="text-sm font-bold text-slate-900">Thank you for your review!</h4>
                <p className="text-xs text-slate-500">Your feedback has been saved to the database.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {submitError && (
                  <div className="p-3 rounded-xl bg-red-50 text-[#ea110d] text-xs font-medium">
                    {submitError}
                  </div>
                )}

                {/* Star rating selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 font-poppins">
                    Overall Experience Rating
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition cursor-pointer ${
                          star <= rating ? "text-amber-400 scale-110" : "text-slate-200"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-600 ml-2 font-poppins">
                      {rating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Experience Type */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 font-poppins">
                    Category
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50 focus:outline-[#ea110d]"
                  >
                    <option value="property">Villa / Hotel Stay</option>
                    <option value="package">Curated Tour Package</option>
                    <option value="experience">Adventure Experience / Trek</option>
                  </select>
                </div>

                {/* Author Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 font-poppins">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Rahul Patil"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-[#ea110d]"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 font-poppins">
                    Your City / Hometown
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Mumbai, Pune"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-[#ea110d]"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 font-poppins">
                    Your Review &amp; Experience
                  </label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe what made your stay memorable (view, hospitality, rooms, cleanliness)..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-[#ea110d] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-xs font-poppins shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Submitting Review..." : "Publish Real Review"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
