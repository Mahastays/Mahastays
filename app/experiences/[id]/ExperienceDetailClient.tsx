"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { DetailPageSkeleton } from "../../components/Skeletons";
import { VideoPlayerModal } from "../../components/VideoPlayerModal";
import { ExperienceTier, ExperienceSlot, ExperienceDetail } from "../experiencesData";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchExperienceByCode } from "@/store/slices/experienceslice";
import { useWishlistItem } from "@/lib/wishlist";
import { api } from "@/lib/api";

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

  // Construct experience purely from live backend database
  const exp: ExperienceDetail | null = useMemo(() => {
    if (!selectedExperience) return null;
    const e = selectedExperience as any;
    const isMatch = Boolean(
      e.id === experienceId ||
      e._id === experienceId ||
      e.slug === experienceId ||
      e.code === experienceId
    );
    if (!isMatch) return null;

    const rawTiers: ExperienceTier[] = (e.tiers && e.tiers.length > 0)
      ? e.tiers.map((t: any, idx: number) => ({
          id: t.id || t.tierId || `tier-${idx + 1}`,
          name: t.name || `Tier ${idx + 1}`,
          badge: t.badge,
          tagline: t.tagline || "",
          priceType: t.priceType || e.priceType || 'per_person',
          personLimit: t.personLimit != null ? Number(t.personLimit) : (e.personLimit != null ? Number(e.personLimit) : 15),
          childPricePerPerson: t.childPricePerPerson != null ? Number(t.childPricePerPerson) : null,
          pricePerPerson: Number(t.pricePerPerson) || e.numericPrice || 499,
          originalPrice: Number(t.originalPrice) || Math.round((Number(t.pricePerPerson) || e.numericPrice || 499) * 1.3),
          features: t.features || ["Certified Guide", "Refreshments Included"],
        }))
      : [
          {
            id: "tier-1",
            name: "Standard Experience",
            tagline: "Guided excursion with certified expert",
            priceType: e.priceType || 'per_person',
            personLimit: e.personLimit || 15,
            pricePerPerson: e.numericPrice || 499,
            originalPrice: Math.round((e.numericPrice || 499) * 1.3),
            features: ["Certified Guide", "Safety Equipment", "Refreshments"],
          },
        ];

    const rawSlots: ExperienceSlot[] = (e.slots && e.slots.length > 0)
      ? e.slots.map((s: any, idx: number) => ({
          id: s.id || s.slotId || `slot-${idx + 1}`,
          time: s.time || "09:00 AM - 11:00 AM",
          label: s.label || s.time || "Morning Batch",
          availableSpots: s.availableSpots || s.capacity || 15,
          price: s.price ?? e.numericPrice ?? 499,
        }))
      : [
          {
            id: "slot-1",
            time: "07:00 AM - 09:00 AM",
            label: "Morning Batch",
            availableSpots: 15,
            price: e.numericPrice || 499,
          },
          {
            id: "slot-2",
            time: "04:30 PM - 06:30 PM",
            label: "Sunset Batch",
            availableSpots: 15,
            price: e.numericPrice || 499,
          },
        ];

      const expPriceType = (rawTiers[0]?.priceType) || e.priceType || 'per_person';
      const isExpFullSetup = expPriceType === 'per_activity' || expPriceType === 'full_setup';
      const isExpPerNight = expPriceType === 'per_night';
      const expUnitText = isExpFullSetup ? 'setup' : isExpPerNight ? 'night' : 'person';
      const displayPrice = e.price && (isExpFullSetup ? (e.price.includes('setup') ? e.price : `₹${(e.numericPrice || 499).toLocaleString("en-IN")} / setup`) : isExpPerNight ? (e.price.includes('night') ? e.price : `₹${(e.numericPrice || 499).toLocaleString("en-IN")} / night`) : e.price) || `₹${(e.numericPrice || 499).toLocaleString("en-IN")} / ${expUnitText}`;

      return {
        _id: e._id || e.id,
        id: e.id || e._id,
        vendorId: e.vendorId || "",
        title: e.title || e.name || "Curated Experience",
        name: e.name || e.title || "Curated Experience",
        country: e.country || "India",
        flag: e.flag || "🇮🇳",
        city: e.city || "Mahabaleshwar",
        locationId: e.locationId || "",
        duration: e.duration || "2 Hours",
        category: e.category || "Adventure",
        rating: typeof e.rating === "number" ? e.rating : 0,
        ratingScore: typeof e.rating === "number" ? e.rating : 0,
        reviewsCount: typeof e.reviewsCount === "number" ? e.reviewsCount : 0,
        price: displayPrice,
        numericPrice: e.numericPrice || 499,
        originalPrice: e.originalPrice || Math.round((e.numericPrice || 499) * 1.3),
        difficulty: (e.difficulty as any) || "Moderate",
        ageLimit: e.ageLimit || "10 - 65 yrs",
        groupSize: e.groupSize || "Small group",
        language: e.language || "English, Hindi, Marathi",
        image: e.image || e.gallery?.[0] || "/hero-resort.jpg",
        gallery: e.gallery || (e.image ? [e.image] : ["/hero-resort.jpg"]),
        description: e.description || "",
        overview: e.overview || e.description || "",
        highlights: e.highlights || [],
        timeline: e.timeline || [],
        inclusions: e.inclusions || [],
        exclusions: e.exclusions || [],
        whatToBring: e.whatToBring || [],
        locationType: (e as any).locationType || "fixed_location",
        serviceArea: (e as any).serviceArea || "",
        location: (e as any).location || e.city || e.meetingPoint?.split(',')[0]?.trim() || "Mahabaleshwar",
        meetingPoint: e.meetingPoint || `Directly at activity location, ${e.city || "Mahabaleshwar"}`,
        coordinates: e.coordinates || { lat: 17.9237, lng: 73.6586 },
        schedule: e.schedule,
        videoUrl: e.videoUrl || e.video || (e.videos && e.videos[0]) || "",
        keyHighlights: e.keyHighlights || [],
        slots: rawSlots,
        tiers: rawTiers,
        guide: e.guide || {
          name: e.guideName || e.vendorName || "Verified Host",
          role: e.guideRole || "Verified Activity Host & Coordinator",
          experience: e.guideExperience || "Experienced Host",
          staysCount: e.guideStaysCount || "50+ Experiences Hosted",
          avatar: e.guideAvatar,
          confirmationBadge: "Instant Booking Confirmed",
          verified: true,
        },
        guideName: e.guideName || e.guide?.name || "Verified Host",
        guideRole: e.guideRole || e.guide?.role || "Verified Activity Host & Coordinator",
        guideAvatar: e.guideAvatar || e.guide?.avatar,
        reviews: e.reviews || [],
        cancellationPolicy: e.cancellationPolicy || "Free cancellation up to 24 hours before activity start.",
        status: e.status || "active",
        featured: e.featured,
        acceptingBookings: e.acceptingBookings !== false,
        priceType: expPriceType,
        personLimit: (rawTiers[0]?.personLimit) || e.personLimit || 15,
        pricingRules: e.pricingRules || (selectedExperience as any)?.pricingRules || null,
      };
  }, [selectedExperience, experienceId]);

  // Combined gallery
  const allPhotos = useMemo(() => {
    const list: string[] = [];
    if (exp?.image) list.push(exp.image);
    if (exp?.gallery) {
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
  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [bookingDate, setBookingDate] = useState("2026-10-15");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false);
  const { isSaved: isWishlist, toggle: toggleWishlistAction } = useWishlistItem({
    id: exp?.id || experienceId,
    type: "experience",
    title: exp?.title || "",
    location: `${exp?.city || "Mahabaleshwar"}, ${exp?.country || "India"}`,
    price: exp?.price || "",
    numericPrice: exp?.numericPrice || 0,
    image: allPhotos[0] || "/hero-resort.jpg",
    rating: exp?.rating || "4.8/5 ★",
    category: exp?.category || "Experience",
    url: `/experiences/${exp?.id || experienceId}`,
  });
  const [showShareToast, setShowShareToast] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const [realReviews, setRealReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewLocation, setNewReviewLocation] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");

  const loadExperienceReviews = async () => {
    try {
      setReviewsLoading(true);
      const targetId = exp?.id || experienceId;
      const res = await api.get(`/reviews?targetType=experience&targetId=${targetId}`);
      const data = res.data?.data || res.data?.items || res.data || [];
      if (Array.isArray(data)) {
        setRealReviews(data);
      }
    } catch {
      // offline / not found
    } finally {
      setReviewsLoading(false);
    }
  };

  const actualReviewsCount = realReviews.length > 0
    ? realReviews.length
    : (typeof exp?.reviewsCount === "number" && exp.reviewsCount > 0 ? exp.reviewsCount : 0);

  const actualAvgRating = useMemo(() => {
    if (realReviews.length > 0) {
      const sum = realReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
      return (sum / realReviews.length).toFixed(1);
    }
    if (exp?.ratingScore && exp.ratingScore > 0) {
      return Number(exp.ratingScore).toFixed(1);
    }
    if (typeof exp?.rating === "number" && exp.rating > 0) {
      return Number(exp.rating).toFixed(1);
    }
    return null;
  }, [realReviews, exp?.ratingScore, exp?.rating]);

  useEffect(() => {
    if (exp?.id || experienceId) {
      loadExperienceReviews();
    }
  }, [exp?.id, experienceId]);

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;
    setReviewSubmitting(true);
    setReviewMsg("");
    try {
      await api.post("/reviews", {
        targetType: "experience",
        targetId: exp?.id || experienceId,
        author: newReviewAuthor.trim(),
        location: newReviewLocation.trim() || undefined,
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        slotBooked: selectedSlot?.time || "Experience Slot",
      });
      setReviewMsg("Review posted successfully!");
      setTimeout(() => {
        setWriteReviewOpen(false);
        setNewReviewAuthor("");
        setNewReviewLocation("");
        setNewReviewComment("");
        setNewReviewRating(5);
        setReviewMsg("");
        loadExperienceReviews();
      }, 1000);
    } catch (err: any) {
      setReviewMsg(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Selected Tier & Slot
  const selectedTier: ExperienceTier | undefined = useMemo(() => {
    if (!exp?.tiers || exp.tiers.length === 0) return undefined;
    return exp.tiers.find((t) => t.id === selectedTierId) || exp.tiers[0];
  }, [exp?.tiers, selectedTierId]);

  const selectedSlot: ExperienceSlot | undefined = useMemo(() => {
    if (!exp?.slots || exp.slots.length === 0) return undefined;
    return exp.slots.find((s) => s.id === selectedSlotId) || exp.slots[0];
  }, [exp?.slots, selectedSlotId]);

  useEffect(() => {
    if (exp?.tiers && exp.tiers.length > 0) {
      const exists = exp.tiers.some((t) => t.id === selectedTierId);
      if (!exists) {
        setSelectedTierId(exp.tiers[0].id);
      }
    }
  }, [exp?.tiers, selectedTierId]);

  useEffect(() => {
    if (exp?.slots && exp.slots.length > 0) {
      const exists = exp.slots.some((s) => s.id === selectedSlotId);
      if (!exists) {
        setSelectedSlotId(exp.slots[0].id);
      }
    }
  }, [exp?.slots, selectedSlotId]);

  // Price calculations
  const rawPriceType = (selectedTier as any)?.priceType || (exp as any)?.priceType || 'per_person';
  const isFullSetup = rawPriceType === 'per_activity' || rawPriceType === 'full_setup';
  const isPerNight = rawPriceType === 'per_night';
  const priceType = isFullSetup ? 'full_setup' : isPerNight ? 'per_night' : 'per_person';
  const personLimit = (selectedTier as any)?.personLimit || (exp as any)?.personLimit || selectedSlot?.availableSpots || 15;
  const totalParticipants = adults + children;
  const isPersonLimitExceeded = totalParticipants > personLimit;

  const pricePerPerson = selectedTier?.pricePerPerson || exp?.numericPrice || 2400;
  const originalPricePerPerson = selectedTier?.originalPrice || exp?.originalPrice || 3500;
  const savingsPerPerson = Math.max(0, originalPricePerPerson - pricePerPerson);

  const pricingRules = (exp as any)?.pricingRules;
  const hasChildPrice = Boolean((exp as any)?.hasChildPrice ?? pricingRules?.hasChildPrice);
  const rawChildPrice = (selectedTier as any)?.childPricePerPerson ?? (exp as any)?.childPrice ?? pricingRules?.childPrice;
  const childPrice = (hasChildPrice && typeof rawChildPrice === 'number') ? rawChildPrice : null;
  const childAgeLimit = (exp as any)?.childAgeLimit || pricingRules?.childAgeLimit || 'Ages 3-12';
  const effectiveChildPrice = (hasChildPrice && childPrice !== null) ? childPrice : pricePerPerson;

  const memberDiscountPercent = typeof pricingRules?.memberDiscountPercent === 'number'
    ? pricingRules.memberDiscountPercent
    : 8;
  const includeFee = pricingRules?.includeCleaningFee !== false && !!pricingRules?.cleaningFee;
  const feeAmount = includeFee ? (pricingRules?.cleaningFee || 0) : 0;
  const gstPercent = typeof pricingRules?.gstPercent === 'number'
    ? pricingRules.gstPercent
    : (pricingRules?.includeGst === false ? 0 : 18);
  const gstRate = gstPercent / 100;

  // If full setup / per_activity or per_night, flat price does NOT increase with guest count:
  const basePrice = (isFullSetup || isPerNight)
    ? pricePerPerson
    : (pricePerPerson * adults + effectiveChildPrice * children);
  const discountAmount = Math.round(basePrice * (memberDiscountPercent / 100));
  const taxesAndGst = Math.round((basePrice - discountAmount + feeAmount) * gstRate);
  const grandTotal = Math.max(0, basePrice - discountAmount + feeAmount + taxesAndGst);

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

  if (detailLoading || !exp) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] font-roboto">
        <DetailPageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] font-roboto text-slate-800">
      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-24 pb-16">
        {/* Breadcrumbs & Action Bar */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium font-poppins transition shadow-2xs"
              aria-label="Share experience"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
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
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium font-poppins transition shadow-2xs ${
                isWishlist
                  ? "border-red-200 bg-red-50 text-[#ea110d]"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
              aria-label="Save to wishlist"
            >
              <svg
                width="13"
                height="13"
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
          <div className="fixed top-20 right-6 z-50 bg-[#0B0A06] text-white px-3.5 py-2 rounded-xl shadow-xl text-xs font-medium font-poppins animate-fade-in flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Experience link copied to clipboard!</span>
          </div>
        )}

        {/* Experience Header */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold font-poppins bg-[#ea110d] text-white tracking-wide">
              {exp.category || "Experience"}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold font-poppins bg-slate-100 text-slate-700">
              {exp.duration || "2 Hours"}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold font-poppins bg-emerald-50 text-emerald-700 border border-emerald-200">
              {exp.difficulty || "Easy"}
            </span>
            {actualReviewsCount > 0 && actualAvgRating ? (
              <div className="flex items-center gap-1 text-xs text-amber-500 font-bold font-poppins ml-1">
                <span>★</span>
                <span className="text-slate-800">{actualAvgRating}</span>
                <span className="text-slate-400 font-normal">({actualReviewsCount} {actualReviewsCount === 1 ? "review" : "reviews"})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium font-poppins ml-1">
                <span className="text-amber-400">★</span>
                <span className="text-slate-700 font-bold">New</span>
                <span className="text-slate-400 font-normal">(No reviews yet)</span>
              </div>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">
            {exp.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              {(exp as any).locationType === "customer_location" ? (
                <>
                  <span className="text-sm leading-none">🚗</span>
                  <span className="text-emerald-700 font-bold">At Your Stay / Villa (Delivered to You)</span>
                </>
              ) : (exp as any).locationType === "both" ? (
                <>
                  <span className="text-sm leading-none">🔄</span>
                  <span className="text-blue-700 font-bold">At Host Venue or Delivered At Your Stay</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea110d" strokeWidth="2.2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{(exp as any).location || exp.city || "Mahabaleshwar"}, Maharashtra</span>
                </>
              )}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Free cancellation up to 48 hours</span>
            </span>
          </div>
        </div>

        {/* 5-Photo Mosaic Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-2.5 mb-5 h-auto sm:h-[340px] lg:h-[360px]">
          <div
            onClick={() => setLightboxOpen(true)}
            className="lg:col-span-7 relative rounded-xl overflow-hidden bg-slate-200 group cursor-pointer h-[220px] sm:h-full border border-slate-100 shadow-xs"
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
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition z-10"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              onClick={handleNextPhoto}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition z-10"
              aria-label="Next photo"
            >
              ›
            </button>

            <div className="absolute bottom-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium font-poppins">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Featured Action View</span>
              </span>
            </div>
            <div className="absolute bottom-3 right-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold font-poppins">
                <span>{activePhotoIndex + 1} / {allPhotos.length}</span>
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-2 sm:gap-2.5 h-[180px] sm:h-full">
            {allPhotos.slice(1, 5).map((photoUrl, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActivePhotoIndex(idx + 1);
                  setLightboxOpen(true);
                }}
                className="relative rounded-xl overflow-hidden bg-slate-200 group cursor-pointer border border-slate-100 shadow-xs"
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
                    className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 hover:bg-white text-slate-900 text-[11px] font-bold font-poppins shadow-md backdrop-blur-sm transition-transform active:scale-95"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start mb-8">
          {/* ============================================================== */}
          {/* LEFT COLUMN: Tabs + Content (8 cols)                           */}
          {/* ============================================================== */}
          <div className="lg:col-span-8 flex flex-col gap-3 sm:gap-4">
            {/* Guide Card */}
            <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-100 shadow-2xs flex flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {exp.guide?.avatar || (exp as any).vendor?.avatarUrl ? (
                  <img
                    src={exp.guide?.avatar || (exp as any).vendor?.avatarUrl}
                    alt={exp.guide?.name || "Guide Profile"}
                    loading="lazy"
                    decoding="async"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 ring-2 ring-rose-100 shadow-2xs"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0B0A06] text-white font-extrabold text-sm flex items-center justify-center font-poppins shrink-0 shadow-2xs">
                    {(exp.guide?.name || "T")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-poppins flex items-center gap-1 truncate">
                    <span className="truncate">Hosted by {exp.guide?.name || "Verified Host"}</span>
                    {((exp.guide as any)?.verified !== false) && (
                      <span className="w-3.5 h-3.5 rounded-full bg-[#ea110d] text-white flex items-center justify-center text-[9px] font-bold shrink-0" title="Verified Host">
                        ✓
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-roboto truncate">
                    {exp.guide?.role || "Activity Host"} • {(exp.guide as any)?.experience || "Experienced Host"} • {(exp.guide as any)?.staysCount || "50+ Hosted"}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50/80 border border-red-100 text-[11px] font-bold text-[#ea110d] font-poppins shrink-0">
                <span className="text-[#ea110d] font-bold text-[10px]">✓</span>
                <span className="hidden sm:inline">{(exp.guide as any)?.confirmationBadge || "Instant Booking Confirmed"}</span>
                <span className="sm:hidden">Instant Confirmed</span>
              </div>
            </div>

            {/* Quick Highlights Strip (Clean 1-line strip with Mahastays logo bullet & dividers) */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-slate-100 sm:divide-x sm:divide-slate-200/80">
                {(((exp as any).keyHighlights && (exp as any).keyHighlights.length > 0)
                  ? (exp as any).keyHighlights.map((ka: any) => ({
                      title: ka.name || ka.title,
                      desc: ka.desc || ka.description,
                    }))
                  : (exp.highlights && exp.highlights.length >= 4)
                  ? exp.highlights.slice(0, 4).map((h: string) => ({
                      title: h,
                      desc: "",
                    }))
                  : [
                      { title: "Verified Host", desc: "Trained & friendly coordinator" },
                      { title: "Complete Setup", desc: "All essential equipment provided" },
                      { title: "Safety Assured", desc: "Compliant with safety protocols" },
                      { title: "Refreshments", desc: "Included snacks & drinks" },
                    ]
                ).map((h: any, i: number) => (
                  <div
                    key={i}
                    title={h.desc ? `${h.title} • ${h.desc}` : h.title}
                    className="group flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                      <Image
                        src="/brand/mahastays-logo-main.png"
                        alt="Mahastays"
                        width={18}
                        height={18}
                        className="w-full h-full object-contain filter grayscale contrast-125 opacity-75 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                      />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-[#ea110d] transition-colors font-poppins truncate tracking-tight">
                      {h.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sticky Navigation Tabs Bar with Left/Right Slide Buttons & White Gradient */}
            <div
              id="detail-tabs-bar"
              className="relative sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/80 p-1 shadow-xs"
            >
              {/* Left Gradient & Slide Button */}
              <div
                className={`absolute left-1 top-1 bottom-1 z-10 flex items-center pr-6 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none rounded-l-lg transition-opacity duration-300 ${
                  canScrollTabsLeft ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <button
                  type="button"
                  onClick={() => scrollTabs("left")}
                  className="pointer-events-auto w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white shadow-xs border border-slate-200 text-slate-700 hover:text-[#ea110d] hover:border-[#ea110d]/40 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                  aria-label="Scroll tabs left"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  ),
                },
                {
                  id: "about",
                  label: "About",
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  ),
                },
                {
                  id: "timeline",
                  label: "Timeline",
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  ),
                },
                {
                  id: "facilities",
                  label: "Inclusions",
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ),
                },
                {
                  id: "rules",
                  label: "Policies",
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                },
                {
                  id: "location",
                  label: "Location",
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                },
                {
                  id: "reviews",
                  label: "Reviews",
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ),
                },
                {
                  id: "all",
                  label: "All Details",
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
                    className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold font-poppins rounded-lg transition-all whitespace-nowrap cursor-pointer relative ${
                      isActive
                        ? "text-[#ea110d] bg-red-50/70"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span className={isActive ? "text-[#ea110d]" : "text-slate-400"}>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#ea110d] rounded-full" />
                    )}
                  </button>
                );
              })}
              </div>

              {/* Right Gradient & Slide Button */}
              <div
                className={`absolute right-1 top-1 bottom-1 z-10 flex items-center pl-6 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none rounded-r-lg transition-opacity duration-300 ${
                  canScrollTabsRight ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <button
                  type="button"
                  onClick={() => scrollTabs("right")}
                  className="pointer-events-auto w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white shadow-xs border border-slate-200 text-slate-700 hover:text-[#ea110d] hover:border-[#ea110d]/40 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                  aria-label="Scroll tabs right"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ============================================================== */}
            {/* TAB 1: Tiers & Slots (Default Open)                            */}
            {/* ============================================================== */}
            {(activeDetailTab === "tiers" || activeDetailTab === "all") && (
              <div id="tiers" className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-poppins">
                      Available Experience Tiers &amp; Time Slots
                    </h2>
                    <p className="text-[11px] text-slate-500 font-roboto mt-0.5">
                      Select your preferred experience tier and convenient time slot
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 font-poppins">
                    {exp.tiers.length} Tiers Available
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {exp.tiers.map((tier) => {
                    const isSelected = selectedTierId === tier.id;
                    return (
                      <div
                        key={tier.id}
                        className={`rounded-xl p-3 sm:p-3.5 transition-all bg-white border ${
                          isSelected
                            ? "border-[#ea110d] ring-2 ring-red-500/20 shadow-md"
                            : "border-slate-100 hover:border-slate-200 shadow-2xs"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins truncate">
                                {tier.name}
                              </h3>
                              {tier.badge && (
                                <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-[#ea110d] text-[9px] font-bold font-poppins border border-rose-200 shrink-0">
                                  {tier.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-roboto line-clamp-1 sm:line-clamp-2 mb-2">
                              {tier.tagline || (tier as any).description}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-600">
                              {(tier.features && tier.features.length > 0 ? tier.features : [
                                "Verified Activity Host",
                                "All Essential Activity Equipment",
                                "Refreshments & Snacks",
                              ]).map((feat, fi) => (
                                <span key={fi} className="flex items-center gap-1 truncate">
                                  <span className="text-[#ea110d] font-bold text-[10px]">✓</span>
                                  <span>{feat}</span>
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-2.5 md:pt-0 md:pl-4 shrink-0">
                            <div className="md:text-right">
                              <span className="text-[11px] text-slate-400 line-through block font-medium">
                                ₹{(tier.originalPrice || Math.round(tier.pricePerPerson * 1.3)).toLocaleString("en-IN")}
                              </span>
                              <div className="flex items-baseline md:justify-end gap-1">
                                <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-poppins">
                                  ₹{tier.pricePerPerson.toLocaleString("en-IN")}
                                </span>
                                <span className="text-[11px] text-slate-500 font-normal">
                                  / {((tier as any).priceType || (exp as any)?.priceType) === 'full_setup' || ((tier as any).priceType || (exp as any)?.priceType) === 'per_activity'
                                    ? 'setup'
                                    : ((tier as any).priceType || (exp as any)?.priceType) === 'per_night'
                                    ? 'night'
                                    : 'person'}
                                </span>
                              </div>
                              {(((tier as any).priceType || (exp as any)?.priceType) === 'full_setup' || ((tier as any).priceType || (exp as any)?.priceType) === 'per_activity') && (
                                <span className="text-[9px] text-emerald-600 font-semibold block md:text-right mt-0.5">
                                  Flat setup • up to {(tier as any).personLimit || (exp as any)?.personLimit || 15} participants
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedTierId(tier.id)}
                              className={`mt-1.5 py-1.5 px-3.5 rounded-lg text-xs font-bold font-poppins transition-all shadow-xs cursor-pointer ${
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
                  <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-100 shadow-2xs">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-poppins mb-2">
                      Select Departure Time Slot
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {exp.slots.map((slot) => {
                        const isSlotSelected = selectedSlotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                              isSlotSelected
                                ? "border-[#ea110d] bg-red-50/60 ring-2 ring-red-500/20"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="text-xs font-bold text-slate-900 font-poppins">{slot.time}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5">{slot.label}</div>
                            <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">
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
              <div id="about" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-7 flex flex-col justify-between">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins mb-2">
                      About this Experience
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-roboto mb-4">
                      {exp.description || exp.overview}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-[9px] uppercase font-bold text-slate-400">Duration</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">{exp.duration}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-[9px] uppercase font-bold text-slate-400">Difficulty</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">{exp.difficulty}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-[9px] uppercase font-bold text-slate-400">Group Size</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">Max {exp.groupSize}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-[9px] uppercase font-bold text-slate-400">Language</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">{exp.language || "English, Hindi"}</div>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setVideoModalOpen(true)}
                    className="md:col-span-5 relative rounded-xl overflow-hidden h-40 sm:h-44 bg-slate-900 group cursor-pointer border border-slate-200"
                  >
                    <Image
                      src={allPhotos[1] || allPhotos[0]}
                      alt="Action Video Preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 420px"
                      loading="lazy"
                      className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-2.5 right-2.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-slate-900 text-[11px] font-bold font-poppins shadow-md backdrop-blur-sm group-hover:scale-105 transition-transform">
                        <span className="text-[#ea110d] text-[10px]">▶</span>
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
              <div id="timeline" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                      Activity Schedule &amp; Timeline
                    </h3>
                    <p className="text-[11px] text-slate-500 font-roboto mt-0.5">
                      Hour-by-hour briefing of the experience schedule
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  {(exp.timeline && exp.timeline.length > 0 ? exp.timeline : [
                    { time: "Start", title: "Welcome & Briefing", desc: "Arrival at meeting point and activity overview." },
                    { time: "Session 1", title: "Core Activity Experience", desc: "Interactive session coordinated by our verified host." },
                    { time: "Break", title: "Refreshments & Photos", desc: "Enjoy snacks, drinks, and photo moments." },
                    { time: "Wrap-up", title: "Conclusion & Farewell", desc: "Wrap-up, feedback, and memorable send-off." },
                  ]).map((t, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="px-2 py-0.5 rounded-md bg-[#0B0A06] text-white text-[10px] font-bold font-poppins shrink-0">
                        {t.time}
                      </span>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 font-poppins">{t.title}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{t.desc}</div>
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
              <div id="facilities" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                    What this Experience Includes
                  </h3>
                  <p className="text-[11px] text-slate-500 font-roboto mt-0.5">
                    All essentials, professional host support, and amenities
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider font-poppins mb-2.5 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px]">✓</span>
                      <span>Included</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 font-roboto">
                      {(exp.inclusions && exp.inclusions.length > 0
                        ? exp.inclusions.map((inc: any) =>
                            typeof inc === "string"
                              ? inc
                              : inc.title
                              ? `${inc.title}${inc.desc ? ` - ${inc.desc}` : ""}`
                              : String(inc)
                          )
                        : [
                            "Professional Activity Host & Coordinator",
                            "All Essential Activity Gear & Setup",
                            "Refreshments & Mineral Water",
                            "First-Aid Kit & Host Support",
                            "Activity Photos & Highlights",
                          ]
                      ).map((inc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold text-xs mt-0.5">✓</span>
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-poppins mb-2.5 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-400 text-white flex items-center justify-center text-[9px]">✕</span>
                      <span>What to Bring / Requirements</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-600 font-roboto">
                      {(exp.whatToBring && exp.whatToBring.length > 0
                        ? exp.whatToBring
                        : exp.exclusions && exp.exclusions.length > 0
                        ? exp.exclusions
                        : [
                            "Comfortable clothing suitable for the activity",
                            "Valid government photo ID",
                            "Personal medications (if required)",
                            "Mobile phone for verification & photos",
                          ]
                      ).map((exc, i) => (
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
              <div id="rules" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins mb-0.5">
                    Safety Rules &amp; Guidelines
                  </h3>
                  <p className="text-[11px] text-slate-500 font-roboto">
                    Strict adherence to safety standards for an enjoyable adventure
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Cancellation Policy</div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Free Cancellation</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Cancel up to 48 hours before the start time for a 100% full refund.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Health &amp; Age Limit</div>
                      <ul className="text-[11px] text-slate-600 mt-0.5 space-y-0.5">
                        <li>• Minimum age: 10 years</li>
                        <li>• Not suitable for pregnant women or severe conditions</li>
                        <li>• Physical fitness level: Moderate</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Weather Contingency</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        In case of severe rain or unsafe winds, your slot will be rescheduled or fully refunded.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">ID &amp; Punctuality</div>
                      <ul className="text-[11px] text-slate-600 mt-0.5 space-y-0.5">
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
              <div id="location" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col gap-4">
                {(exp as any).locationType === "customer_location" || (exp as any).locationType === "both" ? (
                  <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border border-emerald-200/90 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow-md shadow-emerald-600/25">
                        🚗
                      </div>
                      <div className="space-y-0.5">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          ✓ Doorstep / Villa Setup Available
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 font-poppins">
                          Hosted Directly At Your Booked Stay / Villa / Resort
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-roboto">
                          No traveling required! The verified host will arrive directly at your accommodation with all required props, instruments, and activity materials.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-emerald-200/70">
                      <div className="p-2.5 rounded-lg bg-white/90 border border-emerald-100">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Service Coverage</span>
                        <span className="text-xs font-bold text-slate-800">
                          {(exp as any).serviceArea || "Mahabaleshwar & Panchgani Stays"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/90 border border-emerald-100">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Host Arrival</span>
                        <span className="text-xs font-bold text-slate-800">
                          20–30 mins prior to slot
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/90 border border-emerald-100">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Your Address</span>
                        <span className="text-xs font-bold text-slate-800">
                          Provide villa name at checkout
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {(exp as any).locationType !== "customer_location" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                          {(exp as any).locationType === "both" ? "Host Basecamp / Venue (Alternative)" : "Meeting Point & Location"}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-roboto mt-0.5">
                          {exp.meetingPoint || `${(exp as any).location || exp.city || "Mahabaleshwar"}, Maharashtra`}
                        </p>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(exp.meetingPoint || `${(exp as any).location || exp.city || "Mahabaleshwar"}, Maharashtra`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold font-poppins transition"
                      >
                        <span>Open in Maps</span>
                        <span>↗</span>
                      </a>
                    </div>

                    <div className="relative rounded-xl overflow-hidden min-h-[220px] sm:min-h-[260px] bg-slate-100 border border-slate-200 shadow-inner">
                      {(() => {
                        const lat = exp.coordinates?.lat || 17.9242;
                        const lng = exp.coordinates?.lng || 73.6643;
                        return (
                          <iframe
                            title="Experience Meeting Point Map"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${(lng - 0.02).toFixed(5)}%2C${(lat - 0.015).toFixed(5)}%2C${(lng + 0.02).toFixed(5)}%2C${(lat + 0.015).toFixed(5)}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`}
                            className="absolute inset-0 w-full h-full border-0"
                            loading="lazy"
                          />
                        );
                      })()}
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-sm text-[11px] font-bold font-poppins text-slate-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{exp.title} Meeting Point</span>
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono">
                        {exp.meetingPoint || `${(exp as any).location || exp.city || "Mahabaleshwar"}, Maharashtra`}
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(exp.meetingPoint || `${(exp as any).location || exp.city || "Mahabaleshwar"}, Maharashtra`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-[#ea110d] text-white text-[11px] font-bold font-poppins shadow-md hover:bg-[#d00f0c] transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open in Maps</span>
                        <span>↗</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 7: Reviews & Ratings                                       */}
            {/* ============================================================== */}
            {(activeDetailTab === "reviews" || activeDetailTab === "all") && (
              <div id="reviews" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins flex items-center gap-2">
                      <span>Guest Reviews &amp; Ratings</span>
                      {actualAvgRating && actualReviewsCount > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                          ★ {actualAvgRating} / 5.0
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-roboto mt-0.5">
                      {actualReviewsCount > 0
                        ? `Based on ${actualReviewsCount} verified participant ${actualReviewsCount === 1 ? "review" : "reviews"}`
                        : "No reviews yet — be the first to share your experience"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWriteReviewOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ea110d] text-white text-xs font-bold font-poppins hover:bg-red-700 transition shadow-2xs self-start cursor-pointer"
                  >
                    <span>Write a Review</span>
                  </button>
                </div>

                <div className="space-y-2.5 pt-1">
                  {reviewsLoading ? (
                    <div className="py-4 text-center text-xs text-slate-400">Loading reviews from database...</div>
                  ) : realReviews.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1.5">
                      <p className="text-xs text-slate-500 font-medium">No reviews written for this experience yet.</p>
                      <button
                        type="button"
                        onClick={() => setWriteReviewOpen(true)}
                        className="text-xs font-bold text-[#ea110d] hover:underline cursor-pointer"
                      >
                        Be the first to share your experience →
                      </button>
                    </div>
                  ) : (
                    realReviews.map((rev, i) => (
                      <div key={rev.id || i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center font-poppins">
                              {rev.author ? rev.author[0].toUpperCase() : "G"}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 font-poppins">{rev.author}</div>
                              <div className="text-[10px] text-slate-400 font-roboto">
                                {rev.date || "Recent"} {rev.slotBooked ? `• ${rev.slotBooked}` : ""}
                              </div>
                            </div>
                          </div>
                          <div className="text-amber-500 text-xs font-bold">
                            {"★".repeat(rev.rating || 5)}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-roboto">
                          &quot;{rev.comment}&quot;
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: Sticky Booking Ledger Card (4 cols)               */}
          {/* ============================================================== */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 z-20 self-start">
            <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-md flex flex-col gap-3">
              {/* Top Rate */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-poppins">
                    ₹{pricePerPerson.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-500 font-normal"> / {isFullSetup ? "setup" : isPerNight ? "night" : "person"}</span>
                  {isFullSetup && (
                    <span className="block text-[10px] text-emerald-700 font-medium mt-0.5">
                      Flat activity setup • Covers up to {personLimit} participants (no extra charge per person)
                    </span>
                  )}
                  {isPerNight && (
                    <span className="block text-[10px] text-emerald-700 font-medium mt-0.5">
                      Flat night session • Covers up to {personLimit} participants
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 line-through block font-poppins">
                    ₹{originalPricePerPerson.toLocaleString("en-IN")}
                  </span>
                  {savingsPerPerson > 0 && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold font-poppins border border-emerald-200">
                      Save ₹{savingsPerPerson.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              {/* Selected Tier & Slot Box */}
              <div
                onClick={() => handleTabChange("tiers")}
                className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100 hover:bg-rose-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-[9px] uppercase font-bold text-[#ea110d] tracking-wider font-poppins">
                    SELECTED TIER &amp; SLOT
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-poppins truncate max-w-[210px]">
                    {selectedTier?.name} • {selectedSlot?.time}
                  </div>
                </div>
                <span className="text-xs font-bold text-[#ea110d] font-poppins">Change →</span>
              </div>

              {/* Booking Date Selector */}
              <div className="rounded-lg border border-slate-200 p-2 bg-slate-50/50 flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <div className="flex-1 min-w-0">
                  <label className="text-[9px] uppercase font-bold text-slate-400 block">Experience Date</label>
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
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Participants</div>
                      <div className="text-xs font-bold text-slate-800">
                        {adults} Adult{adults > 1 ? "s" : ""}, {children} Child{children > 1 ? "ren" : ""}
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs">{isGuestPickerOpen ? "▲" : "▼"}</span>
                </button>

                {isGuestPickerOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 p-2.5 rounded-lg bg-white border border-slate-200 shadow-xl z-30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Adults</div>
                        <div className="text-[9px] text-slate-400">Age 13+</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-50"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-slate-800 w-4 text-center">{adults}</span>
                        <button
                          type="button"
                          onClick={() => setAdults(adults + 1)}
                          className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Children</div>
                        <div className="text-[9px] text-slate-400">
                          {isFullSetup
                            ? `Included in flat setup (up to ${personLimit} total)`
                            : hasChildPrice && childPrice !== null
                            ? `₹${childPrice.toLocaleString("en-IN")} / child (${childAgeLimit})`
                            : `Default adult rate (${childAgeLimit})`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-50"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-slate-800 w-4 text-center">{children}</span>
                        <button
                          type="button"
                          onClick={() => setChildren(children + 1)}
                          className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-50"
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
                <div className="space-y-1.5">
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-3 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs font-poppins cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Bookings Paused</span>
                  </button>
                  <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/90 text-center font-medium leading-relaxed">
                    This experience is temporarily not accepting reservations. Please check back shortly or reach out to concierge.
                  </p>
                </div>
              ) : isPersonLimitExceeded ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-900 flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <div className="text-[11px]">
                      <span className="font-bold">Participant limit exceeded: </span>
                      <span>This experience accommodates a maximum of {personLimit} participants ({totalParticipants} selected). Please reduce the participant count to continue.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-3 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs font-poppins cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Participant Limit Exceeded (Max {personLimit})</span>
                  </button>
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
                      tierName: selectedTier?.name || "Standard Pass",
                      slotId: selectedSlot?.id || selectedSlotId,
                      slotTime: selectedSlot?.time || "06:00 AM",
                      checkIn: bookingDate,
                      adults: String(adults),
                      children: String(children),
                      price: String(pricePerPerson),
                      childPrice: String(effectiveChildPrice),
                      hasChildPrice: String(hasChildPrice),
                      priceType: priceType,
                      personLimit: String(personLimit),
                      locationType: (exp as any).locationType || "fixed_location",
                      serviceArea: (exp as any).serviceArea || "",
                      discount: String(memberDiscountPercent),
                      cleaningFee: String(includeFee ? feeAmount : 0),
                      gst: String(gstPercent),
                      image: allPhotos[0] || "",
                    });
                    router.push(`/checkout?${queryParams.toString()}`);
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-xs font-poppins shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Reserve Experience</span>
                  <span>→</span>
                </button>
              )}

              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-roboto inline-flex items-center justify-center gap-1">
                  <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Instant Confirmation • {exp.guide?.role || "Verified Activity Host"}</span>
                </span>
              </div>

              {/* Price Breakdown Ledger */}
              <div className="border-t border-slate-100 pt-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="text-[11px] truncate pr-2">
                    {isFullSetup
                      ? `Flat Activity Setup (covers ${totalParticipants} participant${totalParticipants > 1 ? "s" : ""}, up to ${personLimit})`
                      : isPerNight
                      ? `Flat Night Session (covers ${totalParticipants} participant${totalParticipants > 1 ? "s" : ""}, up to ${personLimit})`
                      : hasChildPrice && children > 0
                      ? `₹${pricePerPerson.toLocaleString("en-IN")} × ${adults} adult${adults > 1 ? "s" : ""} + ₹${effectiveChildPrice.toLocaleString("en-IN")} × ${children} child${children > 1 ? "ren" : ""}`
                      : `₹${pricePerPerson.toLocaleString("en-IN")} × ${totalParticipants} participants`}
                  </span>
                  <span className="font-semibold text-slate-900 shrink-0">₹{basePrice.toLocaleString("en-IN")}</span>
                </div>

                {memberDiscountPercent > 0 && discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium text-[11px]">
                    <span>Mahastays Member Discount ({memberDiscountPercent}%)</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {includeFee && feeAmount > 0 && (
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Safety Gear &amp; Forest Fee</span>
                    <span className="font-semibold text-slate-900">₹{feeAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>GST &amp; Safety Cess ({gstPercent}%)</span>
                  <span className="font-semibold text-slate-900">₹{taxesAndGst.toLocaleString("en-IN")}</span>
                </div>

                <div className="border-t border-slate-200/80 pt-1.5 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-xs font-poppins">Total (INR)</span>
                  <span className="font-extrabold text-slate-900 text-lg font-poppins">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Badges */}
              <div className="border-t border-slate-100 pt-2 flex flex-col gap-1 text-[10px] text-slate-500 font-roboto">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>100% Verified Experience with Safe Guarantee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Free Cancellation up to 48 hours before start</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Mobile Booking Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between shadow-2xl">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Price</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-900 font-poppins">
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-slate-500">/ {isFullSetup ? "setup" : isPerNight ? "night" : `${totalParticipants} persons`}</span>
            </div>
          </div>
          {exp.acceptingBookings === false ? (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs font-poppins cursor-not-allowed flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Bookings Paused</span>
            </button>
          ) : isPersonLimitExceeded ? (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs font-poppins cursor-not-allowed"
            >
              Limit Exceeded
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (exp.acceptingBookings === false) return;
                const queryParams = new URLSearchParams({
                  type: "experience",
                  id: String(exp.id || (exp as any).code || experienceId),
                  title: exp.title,
                  tierId: selectedTier?.id || selectedTierId,
                  tierName: selectedTier?.name || "Standard Pass",
                  slotId: selectedSlot?.id || selectedSlotId,
                  slotTime: selectedSlot?.time || "06:00 AM",
                  checkIn: bookingDate,
                  adults: String(adults),
                  children: String(children),
                  price: String(pricePerPerson),
                  priceType: priceType,
                  personLimit: String(personLimit),
                  acceptingBookings: String((exp as any).acceptingBookings !== false),
                  locationType: (exp as any).locationType || "fixed_location",
                  serviceArea: (exp as any).serviceArea || "",
                  discount: String(memberDiscountPercent),
                  cleaningFee: String(includeFee ? feeAmount : 0),
                  gst: String(gstPercent),
                  image: allPhotos[0] || "",
                });
                router.push(`/checkout?${queryParams.toString()}`);
              }}
              className="px-6 py-2.5 rounded-xl bg-[#ea110d] text-white font-bold text-xs font-poppins shadow-md active:scale-95 transition-all"
            >
              Reserve Now
            </button>
          )}
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
      <VideoPlayerModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={(exp as any).videoUrl}
        title={`Action Preview: ${exp.title}`}
      />

      {/* Write Review Modal */}
      {writeReviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-poppins">Write an Adventurer Review</h3>
              <button
                type="button"
                onClick={() => setWriteReviewOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {reviewMsg ? (
              <div className="py-6 text-center space-y-2">
                <div className="text-sm font-bold text-slate-900">{reviewMsg}</div>
              </div>
            ) : (
              <form onSubmit={handlePostReview} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                    placeholder="e.g. Sameer Kulkarni"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ea110d]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">City / Hometown</label>
                  <input
                    type="text"
                    value={newReviewLocation}
                    onChange={(e) => setNewReviewLocation(e.target.value)}
                    placeholder="e.g. Pune, Mumbai"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ea110d]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className={`text-2xl cursor-pointer ${star <= newReviewRating ? "text-amber-400" : "text-slate-200"}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">{newReviewRating} / 5</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Your Review</label>
                  <textarea
                    rows={4}
                    required
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Describe your experience, host assistance, activities, vibe and setup..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ea110d] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="w-full py-3 rounded-xl bg-[#ea110d] text-white font-bold text-xs font-poppins shadow-md hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
                >
                  {reviewSubmitting ? "Submitting..." : "Submit Real Review"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
