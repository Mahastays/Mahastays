"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { DetailPageSkeleton } from "../../components/Skeletons";
import { getExperienceDetail, ExperienceTier, ExperienceSlot, ExperienceDetail } from "../experiencesData";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchExperienceByCode } from "@/store/slices/experienceslice";
import { useWishlistItem } from "@/lib/wishlist";

export default function ExperienceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const experienceId = (params?.id as string) || "act2001";
  const dispatch = useAppDispatch();
  const { selectedExperience, detailLoading } = useAppSelector((state) => state.experiences);

  useEffect(() => {
    if (experienceId) {
      dispatch(fetchExperienceByCode(experienceId));
    }
  }, [dispatch, experienceId]);

  const localExp = useMemo(() => getExperienceDetail(experienceId), [experienceId]);

  // Merge store data seamlessly with local rich fallback
  const exp: ExperienceDetail = useMemo(() => {
    const isMatch = Boolean(
      selectedExperience &&
        (selectedExperience.id === experienceId ||
          (selectedExperience as any).code === experienceId ||
          (selectedExperience as any).slug === experienceId)
    );
    if (isMatch && selectedExperience) {
      return {
        ...localExp,
        title: selectedExperience.title || localExp.title,
        price: selectedExperience.price || localExp.price,
        numericPrice: selectedExperience.numericPrice || localExp.numericPrice,
        originalPrice: selectedExperience.originalPrice || localExp.originalPrice,
        overview: selectedExperience.overview || localExp.overview,
        description: selectedExperience.description || localExp.description,
        city: selectedExperience.city || localExp.city,
        image: selectedExperience.image || localExp.image,
        gallery:
          selectedExperience.gallery && selectedExperience.gallery.length > 0
            ? selectedExperience.gallery
            : localExp.gallery,
        tiers:
          selectedExperience.tiers && selectedExperience.tiers.length > 0
            ? (selectedExperience.tiers as unknown as ExperienceTier[])
            : localExp.tiers,
        slots:
          selectedExperience.slots && selectedExperience.slots.length > 0
            ? (selectedExperience.slots as unknown as ExperienceSlot[])
            : localExp.slots,
        timeline:
          selectedExperience.timeline && selectedExperience.timeline.length > 0
            ? (selectedExperience.timeline as ExperienceDetail["timeline"])
            : localExp.timeline,
        inclusions:
          selectedExperience.inclusions && selectedExperience.inclusions.length > 0
            ? (selectedExperience.inclusions as ExperienceDetail["inclusions"])
            : localExp.inclusions,
        highlights:
          selectedExperience.highlights && selectedExperience.highlights.length > 0
            ? (selectedExperience.highlights as ExperienceDetail["highlights"])
            : localExp.highlights,
        policies: (selectedExperience as any).policies || (localExp as any).policies,
        guide: (selectedExperience.guide as ExperienceDetail["guide"]) || localExp.guide,
        acceptingBookings: (selectedExperience as any)?.acceptingBookings !== undefined ? (selectedExperience as any).acceptingBookings : (localExp as any).acceptingBookings !== false,
      };
    }
    return localExp;
  }, [localExp, selectedExperience, experienceId]);

  // Combined gallery
  const allPhotos = useMemo(() => {
    const list: string[] = [];
    if (exp.image) list.push(exp.image);
    if (exp.gallery) {
      exp.gallery.forEach((url) => {
        if (url && !list.includes(url)) list.push(url);
      });
    }
    if (list.length === 0) list.push("/hero-resort.jpg");
    return list;
  }, [exp]);

  // Interactive UI State - default tab "tiers"
  const [activeDetailTab, setActiveDetailTab] = useState("tiers");
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState(true);

  const checkTabScroll = () => {
    if (tabsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
      setCanScrollTabsLeft(scrollLeft > 6);
      setCanScrollTabsRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  useEffect(() => {
    checkTabScroll();
    window.addEventListener("resize", checkTabScroll);
    return () => window.removeEventListener("resize", checkTabScroll);
  }, []);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsScrollRef.current) {
      const scrollAmount = direction === "left" ? -220 : 220;
      tabsScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedTierId, setSelectedTierId] = useState<string>(() => {
    return exp.tiers[0]?.id || "tier-trek-1";
  });
  const [selectedSlotId, setSelectedSlotId] = useState<string>(() => {
    return exp.slots[0]?.id || "slot-1";
  });
  const [bookingDate, setBookingDate] = useState("2026-10-15");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false);
  const { isSaved: isWishlist, toggle: toggleWishlistAction } = useWishlistItem({
    id: exp.id,
    type: "experience",
    title: exp.title,
    location: `${exp.city || "Mahabaleshwar"}, ${exp.country || "India"}`,
    price: exp.price,
    numericPrice: exp.numericPrice,
    image: exp.image || "/hero-resort.jpg",
    rating: exp.rating,
    category: exp.category || "Experience",
    url: `/experiences/${exp.id}`,
  });
  const [showShareToast, setShowShareToast] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);

  // Selected Tier & Slot
  const selectedTier: ExperienceTier = useMemo(() => {
    return exp.tiers.find((t) => t.id === selectedTierId) || exp.tiers[0];
  }, [exp.tiers, selectedTierId]);

  const selectedSlot: ExperienceSlot = useMemo(() => {
    return exp.slots.find((s) => s.id === selectedSlotId) || exp.slots[0];
  }, [exp.slots, selectedSlotId]);

  useEffect(() => {
    if (exp.tiers && exp.tiers.length > 0) {
      const exists = exp.tiers.some((t) => t.id === selectedTierId);
      if (!exists) {
        setSelectedTierId(exp.tiers[0].id);
      }
    }
  }, [exp.tiers, selectedTierId]);

  useEffect(() => {
    if (exp.slots && exp.slots.length > 0) {
      const exists = exp.slots.some((s) => s.id === selectedSlotId);
      if (!exists) {
        setSelectedSlotId(exp.slots[0].id);
      }
    }
  }, [exp.slots, selectedSlotId]);

  // Price calculations
  const pricePerPerson = selectedTier?.pricePerPerson || exp.numericPrice || 2400;
  const originalPricePerPerson = selectedTier?.originalPrice || exp.originalPrice || 3500;
  const savingsPerPerson = Math.max(0, originalPricePerPerson - pricePerPerson);

  const totalParticipants = adults + children;
  const basePrice = pricePerPerson * totalParticipants;
  const discountAmount = Math.round(basePrice * 0.08);
  const gstRate = 0.18;
  const taxesAndGst = Math.round((basePrice - discountAmount) * gstRate);
  const grandTotal = basePrice - discountAmount + taxesAndGst;

  // Pure tab switching in-place
  const handleTabChange = (tabId: string) => {
    setActiveDetailTab(tabId);
    const tabEl = document.getElementById("detail-tabs-bar");
    if (tabEl) {
      const rect = tabEl.getBoundingClientRect();
      if (rect.top < 70) {
        const y = window.scrollY + rect.top - 74;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }
    }
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev + 1) % allPhotos.length);
  };

  if (detailLoading && (!selectedExperience || (selectedExperience.id !== experienceId && (selectedExperience as any).code !== experienceId))) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] font-roboto">
        <Navbar />
        <DetailPageSkeleton />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] font-roboto text-slate-800">
      <Navbar />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 lg:pt-36 pb-24">
        {/* Breadcrumbs & Action Bar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              <span>Home</span>
            </Link>
            <span>/</span>
            <Link href="/experiences" className="hover:text-slate-900 transition-colors">
              Experiences
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-[320px]">
              {exp.title}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: exp.title, url: window.location.href }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  setShowShareToast(true);
                  setTimeout(() => setShowShareToast(false), 2400);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium font-poppins transition shadow-sm"
              aria-label="Share experience"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>Share</span>
            </button>

            <button
              onClick={async () => {
                await toggleWishlistAction();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium font-poppins transition shadow-sm ${
                isWishlist
                  ? "border-red-200 bg-red-50 text-[#ea110d]"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
              aria-label="Save to wishlist"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={isWishlist ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{isWishlist ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>

        {/* Share Toast Notification */}
        {showShareToast && (
          <div className="fixed top-20 right-6 z-50 bg-[#0B0A06] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium font-poppins animate-fade-in flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Experience link copied to clipboard!</span>
          </div>
        )}

        {/* Experience Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold font-poppins bg-[#ea110d] text-white tracking-wide">
              {exp.category || "Outdoor Adventure"}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold font-poppins bg-slate-100 text-slate-700">
              {exp.duration || "4 Hours"}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold font-poppins bg-emerald-50 text-emerald-700 border border-emerald-200">
              {exp.difficulty || "Moderate"}
            </span>
            <div className="flex items-center gap-1 text-xs text-amber-500 font-bold font-poppins ml-1">
              <span>★</span>
              <span className="text-slate-800">{exp.rating || 4.95}</span>
              <span className="text-slate-400 font-normal">({exp.reviewsCount || 112} reviews)</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight font-poppins">
            {exp.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs sm:text-sm text-slate-600">
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea110d" strokeWidth="2.2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{exp.city || "Panchgani & Mahabaleshwar"}, Maharashtra</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Free cancellation up to 48 hours</span>
            </span>
          </div>
        </div>

        {/* 5-Photo Mosaic Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-8 h-auto sm:h-[460px] lg:h-[500px]">
          <div
            onClick={() => setLightboxOpen(true)}
            className="lg:col-span-7 relative rounded-[28px] overflow-hidden bg-slate-200 group cursor-pointer h-[260px] sm:h-[460px] lg:h-full border border-slate-100 shadow-sm"
          >
            <Image
              src={allPhotos[activePhotoIndex] || allPhotos[0]}
              alt={exp.title}
              fill
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

            <button
              onClick={handlePrevPhoto}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition z-10"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              onClick={handleNextPhoto}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition z-10"
              aria-label="Next photo"
            >
              ›
            </button>

            <div className="absolute bottom-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium font-poppins">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Featured Action View</span>
              </span>
            </div>
            <div className="absolute bottom-4 right-4 z-10">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold font-poppins">
                <span>{activePhotoIndex + 1} / {allPhotos.length}</span>
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3 h-[240px] sm:h-[460px] lg:h-full">
            {allPhotos.slice(1, 5).map((photoUrl, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActivePhotoIndex(idx + 1);
                  setLightboxOpen(true);
                }}
                className="relative rounded-[22px] overflow-hidden bg-slate-200 group cursor-pointer border border-slate-100 shadow-sm"
              >
                <Image
                  src={photoUrl}
                  alt={`${exp.title} preview ${idx + 2}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />

                {idx === 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxOpen(true);
                    }}
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-900 text-xs font-bold font-poppins shadow-lg backdrop-blur-sm transition-transform active:scale-95"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>View all photos</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start mb-12">
          {/* ============================================================== */}
          {/* LEFT COLUMN: Tabs + Content (8 cols)                           */}
          {/* ============================================================== */}
          <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-5">
            {/* Guide Card */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#0B0A06] text-white font-extrabold text-base flex items-center justify-center font-poppins shrink-0 shadow-sm">
                  {exp.guide?.name ? exp.guide.name[0] : "T"}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins flex items-center gap-1.5">
                    <span>Guided by {exp.guide?.name || "Tanaji Bhilare"}</span>
                    <span className="w-4 h-4 rounded-full bg-[#ea110d] text-white flex items-center justify-center text-[10px] font-bold shrink-0" title="Verified Guide">
                      ✓
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-roboto">
                    {exp.guide?.role || "IMF Certified Mountaineer"} • 8+ Years Experience • 450+ Guided Treks
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50/80 border border-red-100 text-xs font-bold text-[#ea110d] font-poppins shrink-0">
                <span className="text-[#ea110d] font-bold">✓</span>
                <span>Instant Booking Confirmed</span>
              </div>
            </div>

            {/* Quick Highlights Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  title: "Certified Instructor",
                  desc: "IMF accredited mountain guide",
                  icon: (
                    <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  ),
                },
                {
                  title: "Safety Gear Included",
                  desc: "Helmets, harnesses & first aid",
                  icon: (
                    <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                },
                {
                  title: "Small Group Size",
                  desc: `Max ${exp.groupSize || "8"} adventurers`,
                  icon: (
                    <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                },
                {
                  title: "Snacks & Refreshment",
                  desc: "Hydration & local breakfast",
                  icon: (
                    <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v7a2 2 0 002 2h0a2 2 0 002-2V3M8 3v18M18 3v18M15 3h6v4a3 3 0 01-3 3h0a3 3 0 01-3-3V3z" />
                    </svg>
                  ),
                },
              ].map((h, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex flex-col group hover:border-slate-300 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-2.5 shrink-0 group-hover:bg-slate-100 transition-colors">
                    {h.icon}
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-poppins">{h.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">{h.desc}</div>
                </div>
              ))}
            </div>

            {/* Sticky Navigation Tabs Bar with Left/Right Slide Buttons & White Gradient */}
            <div
              id="detail-tabs-bar"
              className="relative sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
            >
              {/* Left Gradient & Slide Button */}
              <div
                className={`absolute left-1.5 top-1.5 bottom-1.5 z-10 flex items-center pr-8 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none rounded-l-xl transition-opacity duration-300 ${
                  canScrollTabsLeft ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <button
                  type="button"
                  onClick={() => scrollTabs("left")}
                  className="pointer-events-auto w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 hover:text-[#ea110d] hover:border-[#ea110d]/40 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                  aria-label="Scroll tabs left"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Tabs Track */}
              <div
                ref={tabsScrollRef}
                onScroll={checkTabScroll}
                className="overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth flex items-center gap-1 px-1"
              >
              {[
                {
                  id: "tiers",
                  label: "Tiers & Slots",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  ),
                },
                {
                  id: "about",
                  label: "About",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  ),
                },
                {
                  id: "timeline",
                  label: "Timeline",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  ),
                },
                {
                  id: "facilities",
                  label: "Inclusions",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ),
                },
                {
                  id: "rules",
                  label: "Policies",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                },
                {
                  id: "location",
                  label: "Location",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                },
                {
                  id: "reviews",
                  label: "Reviews",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ),
                },
                {
                  id: "all",
                  label: "All Details",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                  ),
                },
              ].map((tab) => {
                const isActive = activeDetailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold font-poppins rounded-xl transition-all whitespace-nowrap cursor-pointer relative ${
                      isActive
                        ? "text-[#ea110d] bg-red-50/70"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span className={isActive ? "text-[#ea110d]" : "text-slate-400"}>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-[#ea110d] rounded-full" />
                    )}
                                    </button>
                );
              })}
              </div>

              {/* Right Gradient & Slide Button */}
              <div
                className={`absolute right-1.5 top-1.5 bottom-1.5 z-10 flex items-center pl-8 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none rounded-r-xl transition-opacity duration-300 ${
                  canScrollTabsRight ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <button
                  type="button"
                  onClick={() => scrollTabs("right")}
                  className="pointer-events-auto w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 hover:text-[#ea110d] hover:border-[#ea110d]/40 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                  aria-label="Scroll tabs right"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ============================================================== */}
            {/* TAB 1: Tiers & Slots (Default Open)                            */}
            {/* ============================================================== */}
            {(activeDetailTab === "tiers" || activeDetailTab === "all") && (
              <div id="tiers" className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-poppins">
                      Available Experience Tiers &amp; Time Slots
                    </h2>
                    <p className="text-xs text-slate-500 font-roboto mt-0.5">
                      Select your preferred adventure tier and convenient departure time slot
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-poppins">
                    {exp.tiers.length} Tiers Available
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {exp.tiers.map((tier) => {
                    const isSelected = selectedTierId === tier.id;
                    return (
                      <div
                        key={tier.id}
                        className={`rounded-2xl p-4 sm:p-5 transition-all bg-white border ${
                          isSelected
                            ? "border-[#ea110d] ring-2 ring-red-500/20 shadow-md"
                            : "border-slate-100 hover:border-slate-200 shadow-sm"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                                {tier.name}
                              </h3>
                              {tier.badge && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[#ea110d] text-[10px] font-bold font-poppins border border-rose-200">
                                  {tier.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-roboto line-clamp-2 mb-3">
                              {tier.tagline || (tier as any).description}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
                              {(tier.features || [
                                "Certified Mountain Guide",
                                "All Safety Gear & Helmets",
                                "Refreshments & Energy Snacks",
                              ]).map((feat, fi) => (
                                <span key={fi} className="flex items-center gap-1.5">
                                  <span className="text-[#ea110d] font-bold text-xs">✓</span>
                                  <span>{feat}</span>
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5 shrink-0">
                            <div className="md:text-right">
                              <span className="text-xs text-slate-400 line-through block font-medium">
                                ₹{(tier.originalPrice || Math.round(tier.pricePerPerson * 1.3)).toLocaleString("en-IN")}
                              </span>
                              <div className="flex items-baseline md:justify-end gap-1">
                                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-poppins">
                                  ₹{tier.pricePerPerson.toLocaleString("en-IN")}
                                </span>
                                <span className="text-xs text-slate-500">/ person</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedTierId(tier.id)}
                              className={`mt-2 py-2 px-4 rounded-xl text-xs font-bold font-poppins transition-all shadow-sm ${
                                isSelected
                                  ? "bg-[#ea110d] text-white shadow-red-200"
                                  : "bg-white border border-slate-300 text-slate-700 hover:border-slate-800 hover:text-slate-900"
                              }`}
                            >
                              {isSelected ? "Selected Tier" : "Select Tier"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Slots Selector */}
                {exp.slots && exp.slots.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-poppins mb-3">
                      Select Departure Time Slot
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {exp.slots.map((slot) => {
                        const isSlotSelected = selectedSlotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSlotSelected
                                ? "border-[#ea110d] bg-red-50/60 ring-2 ring-red-500/20"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="text-xs font-bold text-slate-900 font-poppins">{slot.time}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{slot.label}</div>
                            <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                              {slot.availableSpots} spots left
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: About this Experience                                   */}
            {/* ============================================================== */}
            {(activeDetailTab === "about" || activeDetailTab === "all") && (
              <div id="about" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-7 flex flex-col justify-between">
                    <h3 className="text-xl font-bold text-slate-900 font-poppins mb-3">
                      About this Experience
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-roboto mb-5">
                      {exp.description || exp.overview}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">{exp.duration}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Difficulty</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">{exp.difficulty}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Group Size</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">Max {exp.groupSize}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Language</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">{exp.language || "English, Hindi"}</div>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setVideoModalOpen(true)}
                    className="md:col-span-5 relative rounded-2xl overflow-hidden h-48 sm:h-52 bg-slate-900 group cursor-pointer border border-slate-200"
                  >
                    <Image
                      src={allPhotos[1] || allPhotos[0]}
                      alt="Action Video Preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 420px"
                      className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-3 right-3">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-bold font-poppins shadow-lg backdrop-blur-sm group-hover:scale-105 transition-transform">
                        <span className="text-[#ea110d] text-xs">▶</span>
                        <span>Watch Action Preview</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: Activity Timeline                                       */}
            {/* ============================================================== */}
            {(activeDetailTab === "timeline" || activeDetailTab === "all") && (
              <div id="timeline" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 font-poppins">
                      Activity Schedule &amp; Timeline
                    </h3>
                    <p className="text-xs text-slate-500 font-roboto mt-0.5">
                      Hour-by-hour briefing of the guided adventure
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {(exp.timeline || [
                    { time: "06:00 AM", title: "Meeting & Gear Briefing", desc: "Meet at Table Land base point, fit harnesses and helmets." },
                    { time: "06:45 AM", title: "Sunrise Ridge Trek", desc: "Climb through the ancient forest trails as dawn breaks." },
                    { time: "08:15 AM", title: "Summit View & Breakfast", desc: "Enjoy panoramic Sahyadri views with fresh strawberry snacks." },
                    { time: "09:30 AM", title: "Rappelling & Descent", desc: "Guided 60ft rappelling session followed by gentle descent." },
                  ]).map((t, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="px-2.5 py-1 rounded-lg bg-[#0B0A06] text-white text-[11px] font-bold font-poppins shrink-0">
                        {t.time}
                      </span>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 font-poppins">{t.title}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{t.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 4: Inclusions & What to Bring                              */}
            {/* ============================================================== */}
            {(activeDetailTab === "facilities" || activeDetailTab === "all") && (
              <div id="facilities" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-poppins">
                    What this Experience Includes
                  </h3>
                  <p className="text-xs text-slate-500 font-roboto mt-0.5">
                    Full safety equipment, professional guides, and amenities
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-poppins mb-3 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                      <span>Included</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-700 font-roboto">
                      {[
                        "IMF Certified Wilderness Instructor & Safety Marshals",
                        "UIAA Approved Helmets, Harnesses & Technical Gear",
                        "Energy Drinks, Mineral Water & Traditional Maharashtrian Breakfast",
                        "High-Resolution Action Photos & Drone Highlights",
                        "Comprehensive First-Aid Kit & Emergency Oxygen on Site",
                      ].map((inc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold text-xs mt-0.5">✓</span>
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins mb-3 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-400 text-white flex items-center justify-center text-[10px]">✕</span>
                      <span>What to Bring (Exclusions)</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 font-roboto">
                      {[
                        "Sturdy trekking shoes or sports shoes with good grip",
                        "Comfortable breathable athletic wear",
                        "Sunscreen, sunglasses & personal medication",
                        "Small backpack to carry water bottle",
                      ].map((exc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-slate-400 font-bold text-xs mt-0.5">•</span>
                          <span>{exc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 5: Safety Policies & Rules                                 */}
            {/* ============================================================== */}
            {(activeDetailTab === "rules" || activeDetailTab === "all") && (
              <div id="rules" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-poppins mb-1">
                    Safety Rules &amp; Guidelines
                  </h3>
                  <p className="text-xs text-slate-500 font-roboto">
                    Strict adherence to safety standards for an enjoyable adventure
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Cancellation Policy</div>
                      <div className="text-xs text-emerald-700 font-semibold mt-1">Free Cancellation</div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Cancel up to 48 hours before the start time for a 100% full refund.
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Health &amp; Age Limit</div>
                      <ul className="text-xs text-slate-600 mt-1 space-y-0.5">
                        <li>• Minimum age: 10 years</li>
                        <li>• Not suitable for pregnant women or individuals with severe heart conditions</li>
                        <li>• Physical fitness level: Moderate</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Weather Contingency</div>
                      <div className="text-xs text-slate-600 mt-1">
                        In case of severe rain or unsafe winds, your slot will be rescheduled at your convenience or fully refunded.
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">ID &amp; Punctuality</div>
                      <ul className="text-xs text-slate-600 mt-1 space-y-0.5">
                        <li>• Please arrive 15 minutes before slot time</li>
                        <li>• Valid government photo ID required</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 6: Location & Meeting Point                                */}
            {/* ============================================================== */}
            {(activeDetailTab === "location" || activeDetailTab === "all") && (
              <div id="location" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 font-poppins">
                      Meeting Point &amp; Location
                    </h3>
                    <p className="text-xs text-slate-500 font-roboto mt-0.5">
                      Table Land Base Point, Panchgani, Maharashtra
                    </p>
                  </div>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Table+Land+Panchgani"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-poppins transition"
                  >
                    <span>Open in Maps</span>
                    <span>↗</span>
                  </a>
                </div>

                <div className="relative rounded-2xl overflow-hidden h-56 sm:h-64 bg-slate-100 border border-slate-200">
                  <Image
                    src="/panchgani.jpg"
                    alt="Meeting Point View"
                    fill
                    className="object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[#ea110d] text-white flex items-center justify-center shadow-xl animate-bounce">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="mt-1 px-3 py-1 rounded-full bg-white/95 text-slate-900 text-xs font-bold font-poppins shadow-md backdrop-blur-sm">
                      {exp.title} Meeting Point
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 7: Reviews & Ratings                                       */}
            {/* ============================================================== */}
            {(activeDetailTab === "reviews" || activeDetailTab === "all") && (
              <div id="reviews" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 font-poppins flex items-center gap-2">
                      <span>Adventurer Reviews &amp; Ratings</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                        ★ {exp.rating || 4.95} / 5.0
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-roboto mt-0.5">
                      Based on {exp.reviewsCount || 112} verified adventure participants
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWriteReviewOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ea110d] text-white text-xs font-bold font-poppins hover:bg-red-700 transition shadow-sm self-start"
                  >
                    <span>Write a Review</span>
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  {[
                    {
                      name: "Karan Joharil",
                      date: "September 2026",
                      rating: 5,
                      comment:
                        "Tanaji was the most knowledgeable guide we could ask for! The sunrise over the Sahyadri mountains was surreal. Equipment was in top condition.",
                    },
                    {
                      name: "Shreya Ghoshal",
                      date: "August 2026",
                      rating: 5,
                      comment:
                        "The rappelling session felt completely safe even for a first-timer. Delicious hot tea and snacks at the summit. Unforgettable morning in Panchgani!",
                    },
                  ].map((rev, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center font-poppins">
                            {rev.name[0]}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 font-poppins">{rev.name}</div>
                            <div className="text-[10px] text-slate-400 font-roboto">{rev.date}</div>
                          </div>
                        </div>
                        <div className="text-amber-500 text-xs font-bold">{"★".repeat(rev.rating)}</div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-roboto">
                        &quot;{rev.comment}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: Sticky Booking Ledger Card (4 cols)               */}
          {/* ============================================================== */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 z-20 self-start">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col gap-4">
              {/* Top Rate */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-poppins">
                    ₹{pricePerPerson.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-500 font-normal"> / person</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 line-through block font-poppins">
                    ₹{originalPricePerPerson.toLocaleString("en-IN")}
                  </span>
                  {savingsPerPerson > 0 && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold font-poppins border border-emerald-200">
                      Save ₹{savingsPerPerson.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              {/* Selected Tier & Slot Box */}
              <div
                onClick={() => handleTabChange("tiers")}
                className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 hover:bg-rose-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#ea110d] tracking-wider font-poppins">
                    SELECTED TIER &amp; SLOT
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 font-poppins truncate max-w-[210px]">
                    {selectedTier?.name} • {selectedSlot?.time}
                  </div>
                </div>
                <span className="text-xs font-bold text-[#ea110d] font-poppins">Change →</span>
              </div>

              {/* Booking Date Selector */}
              <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/50 flex items-start gap-2">
                <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Experience Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-hidden cursor-pointer"
                  />
                </div>
              </div>

              {/* Participants Dropdown Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsGuestPickerOpen(!isGuestPickerOpen)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Participants</div>
                      <div className="text-xs font-bold text-slate-800">
                        {adults} Adults, {children} Child
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs">{isGuestPickerOpen ? "▲" : "▼"}</span>
                </button>

                {isGuestPickerOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 p-3 rounded-xl bg-white border border-slate-200 shadow-xl z-30 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Adults</div>
                        <div className="text-[10px] text-slate-400">Age 13+</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-50"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-slate-800 w-4 text-center">{adults}</span>
                        <button
                          type="button"
                          onClick={() => setAdults(adults + 1)}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Children</div>
                        <div className="text-[10px] text-slate-400">Ages 10-12</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-50"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-slate-800 w-4 text-center">{children}</span>
                        <button
                          type="button"
                          onClick={() => setChildren(children + 1)}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Booking Button */}
              {exp.acceptingBookings === false ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-sm font-poppins cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Bookings Paused</span>
                  </button>
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/90 text-center font-medium leading-relaxed">
                    This experience is temporarily not accepting reservations. Please check back shortly or reach out to concierge.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const queryParams = new URLSearchParams({
                      type: "experience",
                      id: String(exp.id || (exp as any).code || experienceId),
                      title: exp.title,
                      tierId: selectedTier?.id || selectedTierId,
                      tierName: selectedTier?.name || "Standard Guided Trek",
                      slotId: selectedSlot?.id || selectedSlotId,
                      slotTime: selectedSlot?.time || "06:00 AM",
                      checkIn: bookingDate,
                      adults: String(adults),
                      children: String(children),
                      price: String(pricePerPerson),
                      image: allPhotos[0] || "",
                    });
                    router.push(`/checkout?${queryParams.toString()}`);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-sm font-poppins shadow-lg shadow-red-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <span>Reserve Experience</span>
                  <span>→</span>
                </button>
              )}

              <div className="text-center">
                <span className="text-[11px] text-slate-500 font-roboto inline-flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Instant Confirmation • Certified Mountain Guide</span>
                </span>
              </div>

              {/* Price Breakdown Ledger */}
              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>
                    ₹{pricePerPerson.toLocaleString("en-IN")} × {totalParticipants} participants
                  </span>
                  <span className="font-semibold text-slate-900">₹{basePrice.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Mahastays Member Discount (8%)</span>
                  <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>GST &amp; Safety Cess (18%)</span>
                  <span className="font-semibold text-slate-900">₹{taxesAndGst.toLocaleString("en-IN")}</span>
                </div>

                <div className="border-t border-slate-200/80 pt-2 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm font-poppins">Total (INR)</span>
                  <span className="font-extrabold text-slate-900 text-xl font-poppins">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Badges */}
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-[11px] text-slate-500 font-roboto">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>100% Verified Experience with Safe Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Free Cancellation up to 48 hours before start</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Mobile Booking Bar */}
        <div className="lg:hidden fixed bottom-[58px] md:bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xl">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Price</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-900 font-poppins">
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-slate-500">/ {totalParticipants} persons</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const queryParams = new URLSearchParams({
                type: "experience",
                id: String(exp.id || (exp as any).code || experienceId),
                title: exp.title,
                tierId: selectedTier?.id || selectedTierId,
                tierName: selectedTier?.name || "Standard Guided Trek",
                slotId: selectedSlot?.id || selectedSlotId,
                slotTime: selectedSlot?.time || "06:00 AM",
                checkIn: bookingDate,
                adults: String(adults),
                children: String(children),
                price: String(pricePerPerson),
                image: allPhotos[0] || "",
              });
              router.push(`/checkout?${queryParams.toString()}`);
            }}
            className="px-6 py-2.5 rounded-xl bg-[#ea110d] text-white font-bold text-xs font-poppins shadow-md active:scale-95 transition-all"
          >
            Reserve Now
          </button>
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 sm:p-6 backdrop-blur-md animate-fade-in">
          <div className="w-full flex items-center justify-between text-white pb-4">
            <span className="text-xs font-semibold font-poppins">
              {activePhotoIndex + 1} / {allPhotos.length} Photos
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold font-poppins transition"
            >
              ✕ Close
            </button>
          </div>

          <div className="relative w-full max-w-5xl h-[65vh] sm:h-[75vh]">
            <Image
              src={allPhotos[activePhotoIndex]}
              alt={`Full preview ${activePhotoIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handlePrevPhoto}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold font-poppins transition"
            >
              ‹ Previous
            </button>
            <button
              onClick={handleNextPhoto}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold font-poppins transition"
            >
              Next ›
            </button>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-slate-800 text-white">
              <span className="text-sm font-bold font-poppins">Action Highlights: {exp.title}</span>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold hover:bg-white/20"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <Image
                src={allPhotos[0]}
                alt="Action Video Preview"
                fill
                className="object-cover opacity-60"
              />
              <div className="relative z-10 text-center text-white px-4">
                <div className="w-16 h-16 rounded-full bg-[#ea110d] text-white flex items-center justify-center text-2xl mx-auto shadow-2xl mb-2">
                  ▶
                </div>
                <div className="text-sm font-bold font-poppins">4K Action Cam &amp; Trail Preview</div>
                <div className="text-xs text-slate-300 mt-1">Trail footage provided to confirmed adventurers before departure</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {writeReviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 font-poppins">Write an Adventurer Review</h3>
              <button
                onClick={() => setWriteReviewOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Share your adventure review for {exp.title} with fellow travelers.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sameer Kulkarni"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ea110d]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rating</label>
                <div className="text-xl text-amber-500 cursor-pointer">★★★★★</div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Review</label>
                <textarea
                  rows={4}
                  placeholder="Describe your trekking experience, guide assistance, safety and gear..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ea110d]"
                />
              </div>
              <button
                type="button"
                onClick={() => setWriteReviewOpen(false)}
                className="w-full py-3 rounded-xl bg-[#ea110d] text-white font-bold text-xs font-poppins shadow-md hover:bg-red-700 transition"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
