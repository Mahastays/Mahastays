"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { DetailPageSkeleton } from "../../components/Skeletons";
import { VideoPlayerModal } from "../../components/VideoPlayerModal";
import { PackageDetail, PackageTier } from "../packagesData";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPackageByCode } from "@/store/slices/packageslice";
import { useWishlistItem } from "@/lib/wishlist";
import { api } from "@/lib/api";

export default function PackageDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = (params?.id as string) || "pkg1001";
  const dispatch = useAppDispatch();
  const { selectedPackage, detailLoading } = useAppSelector((state) => state.packages);

  const tiersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (packageId) {
      dispatch(fetchPackageByCode(packageId));
    }
  }, [dispatch, packageId]);

  // Construct package purely from live backend database
  const pkg: PackageDetail | null = useMemo(() => {
    if (!selectedPackage) return null;
    const p = selectedPackage as any;
    const isMatch = Boolean(
      p.id === packageId ||
      p._id === packageId ||
      p.slug === packageId ||
      p.code === packageId
    );
    if (!isMatch) return null;

    const rawImages = (p.images && p.images.length > 0)
      ? p.images.map((img: any) => typeof img === "string" ? img : img.url || "/hero-resort.jpg")
      : [p.thumbnail || "/hero-resort.jpg"];

    const rawTiers: PackageTier[] = (p.tiers && p.tiers.length > 0)
      ? p.tiers.map((t: any, idx: number) => ({
          id: t.id || t.tierId || `tier-${idx + 1}`,
          name: t.name || `Tier ${idx + 1}`,
          badge: t.badge,
          tagline: t.tagline || "",
          hotelType: t.hotelType || "Luxury Room",
          pricePerPerson: t.pricePerPerson || p.numericPrice || 12000,
          originalPrice: t.originalPrice || Math.round((t.pricePerPerson || p.numericPrice || 12000) * 1.25),
          features: t.features || ["Accommodation Included", "Breakfast & Dinner", "Sightseeing"],
        }))
      : [
          {
            id: "tier-1",
            name: "Standard Experience",
            tagline: "Curated package with all core amenities",
            hotelType: "Luxury Suite",
            pricePerPerson: p.numericPrice || 12000,
            originalPrice: Math.round((p.numericPrice || 12000) * 1.25),
            features: ["Deluxe Room Stay", "Breakfast & Dinner", "Sightseeing Excursions"],
          },
        ];

    return {
      _id: p._id || p.id,
      id: p.id || p._id,
      hostId: p.hostId || p.vendorId || "",
      propertyId: p.propertyId || "",
      packageType: p.packageType || "couple",
      category: p.category || "Holiday",
      title: p.title || p.name || "Curated Package",
      name: p.name || p.title || "Curated Package",
      badge: p.badge || "Verified Package",
      rating: p.rating || (p.ratingScore ? `${p.ratingScore}/5 ★` : "4.9/5 ★"),
      ratingScore: p.ratingScore || 4.9,
      reviewsCount: p.reviewsCount || 0,
      duration: p.duration || `${p.durationDays || 3} Days / ${p.durationNights || 2} Nights`,
      durationDays: p.durationDays || 3,
      durationNights: p.durationNights || 2,
      location: p.location || "Mahabaleshwar, Maharashtra",
      locationId: p.locationId || "",
      city: p.city || "Mahabaleshwar",
      country: p.country || "India",
      price: p.price || `From ₹${(p.numericPrice || 12000).toLocaleString("en-IN")}`,
      numericPrice: p.numericPrice || 12000,
      originalPrice: p.originalPrice || Math.round((p.numericPrice || 12000) * 1.25),
      shortDesc: p.shortDesc || "",
      description: p.description || p.shortDesc || "",
      overview: p.overview || p.shortDesc || "",
      fullDesc: p.fullDesc || p.overview || p.shortDesc || "",
      thumbnail: p.thumbnail || rawImages[0] || "/hero-resort.jpg",
      images: rawImages,
      gallery: p.gallery || rawImages,
      videoUrl: p.videoUrl || p.video || (p.videos && p.videos[0]) || "",
      host: p.host || {
        name: p.vendorName || "Vikramaditya & Concierge Team",
        role: "Holiday Specialist & Concierge",
        experience: "5 Years hosting",
        staysCount: "1,200+ Verified Guests",
        verified: true,
        confirmationBadge: "Instant Booking Confirmed",
      },
      keyHighlights: p.keyHighlights || [],
      hostProperty: p.hostProperty || { propertyId: p.propertyId || "", propertyName: "Mahastays Partner Estate", propertyType: "Resort", location: p.location || "Mahabaleshwar" },
      freeActivities: p.freeActivities || [],
      highlights: p.highlights || [],
      inclusions: p.inclusions || [],
      rawInclusions: p.rawInclusions,
      exclusions: p.exclusions || [],
      itinerary: p.itinerary || [],
      tiers: rawTiers,
      pricing: p.pricing || { basePrice: p.numericPrice || 12000, pricePerPerson: p.numericPrice || 12000, weekendSurcharge: 0, minGuests: 1, maxGuests: 10 },
      durationDetails: p.durationDetails,
      reviews: p.reviews || [],
      cancellationPolicy: p.cancellationPolicy || "Free cancellation up to 48 hours before check-in.",
      status: p.status || "active",
      totalBookings: p.totalBookings || 0,
      featured: p.featured,
      acceptingBookings: p.acceptingBookings !== false,
      pricingRules: p.pricingRules || (selectedPackage as any)?.pricingRules || null,
    };
  }, [selectedPackage, packageId]);

  // Combined gallery
  const allPhotos = useMemo(() => {
    const list: string[] = [];
    if (pkg?.images) {
      pkg.images.forEach((img: any) => {
        const u = typeof img === "string" ? img : img?.url;
        if (u && !list.includes(u)) list.push(u);
      });
    }
    if (pkg?.gallery) {
      pkg.gallery.forEach((url) => {
        if (url && !list.includes(url)) list.push(url);
      });
    }
    if (list.length === 0) list.push("/hero-resort.jpg");
    return list;
  }, [pkg]);

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
  const [startDate, setStartDate] = useState("2026-10-15");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false);
  const { isSaved: isWishlist, toggle: toggleWishlistAction } = useWishlistItem({
    id: pkg?.id || packageId,
    type: "package",
    title: pkg?.title || "",
    location: pkg?.location || `${pkg?.city || "Mahabaleshwar"}, Maharashtra`,
    price: pkg?.price || "",
    numericPrice: pkg?.numericPrice || 0,
    image: allPhotos[0] || "/hero-resort.jpg",
    rating: pkg?.rating || "4.9/5 ★",
    category: pkg?.category || "Curated Package",
    url: `/packages/${pkg?.id || packageId}`,
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

  const loadPackageReviews = async () => {
    try {
      setReviewsLoading(true);
      const targetId = pkg?.id || packageId;
      const res = await api.get(`/reviews?targetType=package&targetId=${targetId}`);
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

  useEffect(() => {
    if (pkg?.id || packageId) {
      loadPackageReviews();
    }
  }, [pkg?.id, packageId]);

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;
    setReviewSubmitting(true);
    setReviewMsg("");
    try {
      await api.post("/reviews", {
        targetType: "package",
        targetId: pkg?.id || packageId,
        author: newReviewAuthor.trim(),
        location: newReviewLocation.trim() || undefined,
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        tierTravelled: selectedTier?.name || "Curated Tour Tier",
      });
      setReviewMsg("Review posted successfully!");
      setTimeout(() => {
        setWriteReviewOpen(false);
        setNewReviewAuthor("");
        setNewReviewLocation("");
        setNewReviewComment("");
        setNewReviewRating(5);
        setReviewMsg("");
        loadPackageReviews();
      }, 1000);
    } catch (err: any) {
      setReviewMsg(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  // Selected Tier
  const selectedTier: PackageTier | undefined = useMemo(() => {
    if (!pkg?.tiers || pkg.tiers.length === 0) return undefined;
    return pkg.tiers.find((t) => t.id === selectedTierId) || pkg.tiers[0];
  }, [pkg?.tiers, selectedTierId]);

  useEffect(() => {
    if (pkg?.tiers && pkg.tiers.length > 0) {
      const exists = pkg.tiers.some((t) => t.id === selectedTierId);
      if (!exists) {
        setSelectedTierId(pkg.tiers[0].id);
      }
    }
  }, [pkg?.tiers, selectedTierId]);

  // Calculations
  const pricePerPerson = selectedTier?.pricePerPerson || pkg?.numericPrice || 14999;
  const originalPricePerPerson = selectedTier?.originalPrice || pkg?.originalPrice || 19999;
  const savingsPerPerson = Math.max(0, originalPricePerPerson - pricePerPerson);

  const pricingRules = (pkg as any)?.pricingRules;
  const memberDiscountPercent = typeof pricingRules?.memberDiscountPercent === 'number'
    ? pricingRules.memberDiscountPercent
    : 8;
  const includeFee = pricingRules?.includeCleaningFee !== false && !!pricingRules?.cleaningFee;
  const feeAmount = includeFee ? (pricingRules?.cleaningFee || 0) : 0;
  const gstPercent = typeof pricingRules?.gstPercent === 'number'
    ? pricingRules.gstPercent
    : (pricingRules?.includeGst === false ? 0 : 18);
  const gstRate = gstPercent / 100;

  const totalGuests = adults + children;
  const basePrice = pricePerPerson * totalGuests;
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

  if (detailLoading || !pkg) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] font-roboto">
        <DetailPageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] font-roboto text-slate-800">
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
            <Link href="/packages" className="hover:text-slate-900 transition-colors">
              Holiday Packages
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-[320px]">
              {pkg.title}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: pkg.title, url: window.location.href }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  setShowShareToast(true);
                  setTimeout(() => setShowShareToast(false), 2400);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium font-poppins transition shadow-sm"
              aria-label="Share package"
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
            <span>Package link copied to clipboard!</span>
          </div>
        )}

        {/* Package Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold font-poppins bg-[#ea110d] text-white tracking-wide">
              {pkg.badge || "Curated Journey"}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold font-poppins bg-slate-100 text-slate-700">
              {typeof pkg.duration === "string" ? pkg.duration : `${pkg.durationDays || 3} Days / ${pkg.durationNights || 2} Nights`}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold font-poppins bg-slate-100 text-slate-700">
              {pkg.category || "Luxury Holiday"}
            </span>
            <div className="flex items-center gap-1 text-xs text-amber-500 font-bold font-poppins ml-1">
              <span>★</span>
              <span className="text-slate-800">{pkg.rating || 4.92}</span>
              <span className="text-slate-400 font-normal">({pkg.reviewsCount || 94} traveler reviews)</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight font-poppins">
            {pkg.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs sm:text-sm text-slate-600">
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea110d" strokeWidth="2.2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{pkg.city || "Panchgani & Mahabaleshwar"}, Maharashtra</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>100% Guaranteed Departures</span>
            </span>
          </div>
        </div>

        {/* 5-Photo Mosaic Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-8 h-auto sm:h-[460px] lg:h-[500px]">
          {/* Main Large Left Hero (7 cols on lg) */}
          <div
            onClick={() => setLightboxOpen(true)}
            className="lg:col-span-7 relative rounded-[28px] overflow-hidden bg-slate-200 group cursor-pointer h-[260px] sm:h-[460px] lg:h-full border border-slate-100 shadow-sm"
          >
            <Image
              src={allPhotos[activePhotoIndex] || allPhotos[0]}
              alt={pkg.title}
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
                <span>Featured Experience View</span>
              </span>
            </div>
            <div className="absolute bottom-4 right-4 z-10">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold font-poppins">
                <span>{activePhotoIndex + 1} / {allPhotos.length}</span>
              </span>
            </div>
          </div>

          {/* Right 2x2 Grid (5 cols on lg) */}
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
                  alt={`${pkg.title} preview ${idx + 2}`}
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
            {/* Host Card */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {(pkg as any).host?.avatar || (pkg as any).vendor?.avatarUrl ? (
                  <img
                    src={(pkg as any).host?.avatar || (pkg as any).vendor?.avatarUrl}
                    alt={(pkg as any).host?.name || "Host Profile"}
                    loading="lazy"
                    decoding="async"
                    className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-rose-100 shadow-sm"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#0B0A06] text-white font-extrabold text-base flex items-center justify-center font-poppins shrink-0 shadow-sm">
                    {((pkg as any).host?.name || pkg.hostProperty?.propertyName || "V")[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins flex items-center gap-1.5">
                    <span>Hosted by {(pkg as any).host?.name || pkg.hostProperty?.propertyName || "Vikramaditya & Concierge Team"}</span>
                    {((pkg as any).host?.verified !== false) && (
                      <span className="w-4 h-4 rounded-full bg-[#ea110d] text-white flex items-center justify-center text-[10px] font-bold shrink-0" title="Verified Tour Operator">
                        ✓
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-roboto">
                    {(pkg as any).host?.role || "Holiday Specialist & Concierge"} • {(pkg as any).host?.experience || "5 Years hosting"} • {(pkg as any).host?.staysCount || "1,200+ Verified Guests"}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50/80 border border-red-100 text-xs font-bold text-[#ea110d] font-poppins shrink-0">
                <span className="text-[#ea110d] font-bold">✓</span>
                <span>{(pkg as any).host?.confirmationBadge || "Instant Booking Confirmed"}</span>
              </div>
            </div>

            {/* Quick Highlights Strip (Clean 1-line strip with Mahastays logo bullet & dividers) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-slate-100 sm:divide-x sm:divide-slate-200/80">
                {(((pkg as any).keyHighlights && (pkg as any).keyHighlights.length > 0)
                  ? (pkg as any).keyHighlights.map((ka: any) => ({
                      title: ka.name || ka.title,
                      desc: ka.desc || ka.description,
                    }))
                  : [
                      { title: "4-Star Resort Stay", desc: "Hilltop valley view rooms" },
                      { title: "All Meals & Decor", desc: "Candlelight dinner setup" },
                      { title: "Dedicated Chauffeur", desc: "AC sedan sightseeing" },
                      { title: "Venna Lake Boating", desc: "Free activity pass" },
                    ]
                ).map((h: any, i: number) => (
                  <div
                    key={i}
                    title={h.desc ? `${h.title} • ${h.desc}` : h.title}
                    className="group flex items-center justify-center sm:justify-start gap-2.5 px-3.5 sm:px-5 py-3 sm:py-3.5 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="relative w-5 h-5 sm:w-5.5 sm:h-5.5 shrink-0 flex items-center justify-center">
                      <Image
                        src="/brand/mahastays-logo-main.png"
                        alt="Mahastays"
                        width={22}
                        height={22}
                        className="w-full h-full object-contain filter grayscale contrast-125 opacity-75 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                      />
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-[#ea110d] transition-colors font-poppins truncate tracking-tight">
                      {h.title}
                    </span>
                  </div>
                ))}
              </div>
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
                  label: "Package Tiers",
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
                  id: "facilities",
                  label: "Inclusions",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ),
                },
                {
                  id: "itinerary",
                  label: "Itinerary",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
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
            {/* TAB 1: Package Tiers (Default Open)                            */}
            {/* ============================================================== */}
            {(activeDetailTab === "tiers" || activeDetailTab === "all") && (
              <div ref={tiersRef} id="tiers" className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-poppins">
                      Available Package Tiers
                    </h2>
                    <p className="text-xs text-slate-500 font-roboto mt-0.5">
                      Choose between Comfort, Premium Luxury, or All-Inclusive VIP packages
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-poppins">
                    {pkg.tiers.length} Tiers Available
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {pkg.tiers.map((tier) => {
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
                                "4-Star Luxury Villa Stay",
                                "All Gourmet Meals Included",
                                "AC SUV Sightseeing Transfers",
                                "Dedicated Trip Manager",
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
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: About this Package                                      */}
            {/* ============================================================== */}
            {(activeDetailTab === "about" || activeDetailTab === "all") && (
              <div className="flex flex-col gap-4 sm:gap-5">
                <div id="about" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 flex flex-col justify-between">
                      <h3 className="text-xl font-bold text-slate-900 font-poppins mb-3">
                        About this Package
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-roboto mb-5">
                        {pkg.fullDesc || pkg.overview}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            {pkg.durationDays || 3}D / {pkg.durationNights || 2}N
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Destinations</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            Panchgani &amp; Mahabaleshwar
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Package Type</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            {pkg.category || "Luxury Holiday"}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Ideal For</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">Families &amp; Couples</div>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => setVideoModalOpen(true)}
                      className="md:col-span-5 relative rounded-2xl overflow-hidden h-48 sm:h-52 bg-slate-900 group cursor-pointer border border-slate-200"
                    >
                      <Image
                        src={allPhotos[1] || allPhotos[0]}
                        alt="Video Tour Preview"
                        fill
                        sizes="(max-width: 768px) 100vw, 420px"
                        loading="lazy"
                        className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      <div className="absolute bottom-3 right-3">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-bold font-poppins shadow-lg backdrop-blur-sm group-hover:scale-105 transition-transform">
                          <span className="text-[#ea110d] text-xs">▶</span>
                          <span>Watch Tour Preview</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Highlights */}
                <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 font-poppins">
                      Trip Highlights &amp; Key Experiences
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleTabChange("facilities")}
                      className="text-xs font-bold text-[#ea110d] hover:underline font-poppins"
                    >
                      View all inclusions →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(pkg.highlights || [
                      "Private Valley View Pool Villa",
                      "Organic Strawberry Farm Walk",
                      "Sunset Boating at Venna Lake",
                      "Exclusive High-Tea at Table Land",
                      "Fort Pratapgad Guided Tour",
                      "Bonfire with Live BBQ Dinner",
                      "Private AC SUV Transfers",
                      "Complimentary Drone Photoshoot",
                    ]).map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 font-poppins">{item}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: Inclusions & What this Package Offers                    */}
            {/* ============================================================== */}
            {(activeDetailTab === "facilities" || activeDetailTab === "all") && (
              <div id="facilities" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-poppins">
                    What this Package Offers
                  </h3>
                  <p className="text-xs text-slate-500 font-roboto mt-0.5">
                    Carefully curated inclusions to guarantee a hassle-free, luxury holiday experience
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Inclusions */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-poppins mb-3 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                      <span>Included in this Package</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-700 font-roboto">
                      {[
                        "2 Nights Luxury Villa Stay with Private Heated Pool",
                        "All Gourmet Meals (2 Breakfasts, 2 Lunches, 2 Dinners + Live BBQ)",
                        "Private Chauffeur-driven AC SUV for Sightseeing & Transfers",
                        "VIP Entry Tickets to Mapro Garden, Venna Lake & Table Land",
                        "Dedicated English & Hindi Speaking Tour Manager",
                        "Complimentary Mineral Water & Refreshments in Vehicle",
                        "All Tolls, Parking & Driver Allowances Included",
                      ].map((inc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold text-xs mt-0.5">✓</span>
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Exclusions */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins mb-3 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-400 text-white flex items-center justify-center text-[10px]">✕</span>
                      <span>Not Included (Exclusions)</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 font-roboto">
                      {[
                        "Airfare or Train Tickets to Pune / Mumbai Airport",
                        "Personal Expenses (Souvenirs, Alcoholic Beverages)",
                        "Horse Riding / Paragliding at Table Land (Paid directly)",
                        "Travel Insurance (Available as add-on during checkout)",
                      ].map((exc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-slate-400 font-bold text-xs mt-0.5">✕</span>
                          <span>{exc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 4: Day-by-Day Journey Itinerary                            */}
            {/* ============================================================== */}
            {(activeDetailTab === "itinerary" || activeDetailTab === "all") && (
              <div id="itinerary" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 font-poppins">
                      Day-by-Day Tour Itinerary
                    </h3>
                    <p className="text-xs text-slate-500 font-roboto mt-0.5">
                      Every hour designed for scenic discovery, relaxed comfort, and authentic tastes
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#ea110d] font-poppins">
                    {pkg.itinerary?.length || 3} Days Detailed Plan
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  {(pkg.itinerary || [
                    {
                      day: 1,
                      title: "Arrival in Panchgani, Scenic Villa Check-in & Table Land Sunset",
                      description: "Private SUV pickup from Pune/Mumbai. Arrive at Sunset Ridge Villa, enjoy a royal welcome drink, followed by an evening horse ride and sunset tea at Table Land.",
                      meals: "Lunch & Live Bonfire BBQ Dinner",
                      stay: "Sunset Ridge Luxury Villa (Private Pool)",
                    },
                    {
                      day: 2,
                      title: "Venna Lake Boating, Mapro Strawberry Orchards & Old Mahabaleshwar",
                      description: "Morning boat ride in the mist at Venna Lake. Private guided tour of Mapro Strawberry Orchards with fresh cream tasting. Afternoon visit to Panchganga Temple and Arthur's Seat.",
                      meals: "Gourmet Breakfast, Farmhouse Lunch & Dinner",
                      stay: "Sunset Ridge Luxury Villa (Private Pool)",
                    },
                    {
                      day: 3,
                      title: "Fort Pratapgad Heritage Trek & Comfortable Return Transfer",
                      description: "Early morning scenic drive to the historic Fort Pratapgad. Relive Shivaji Maharaj history with our resident historian, followed by traditional Maharashtrian lunch and departure.",
                      meals: "Breakfast & Traditional Maharashtrian Lunch",
                      stay: "Tour concludes with warm memories",
                    },
                  ]).map((item) => {
                    const isExpanded = expandedDay === item.day;
                    return (
                      <div
                        key={item.day}
                        className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50/50 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedDay(isExpanded ? null : item.day)}
                          className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[#0B0A06] text-white flex items-center justify-center text-xs font-bold font-poppins shrink-0">
                              D{item.day}
                            </span>
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-slate-900 font-poppins">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Meals: {item.meals} • Stay: {item.stay}
                              </div>
                            </div>
                          </div>
                          <span className="text-slate-400 font-bold text-xs shrink-0">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 pt-1 border-t border-slate-200/50 text-xs text-slate-600 leading-relaxed font-roboto">
                            <p>{(item as any).description || (item.activities || []).join(" • ")}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 5: Policies & Rules                                        */}
            {/* ============================================================== */}
            {(activeDetailTab === "rules" || activeDetailTab === "all") && (
              <div id="rules" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-poppins mb-1">
                    Package Policies &amp; Rules
                  </h3>
                  <p className="text-xs text-slate-500 font-roboto">
                    Transparent cancellation terms and essential travel instructions
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
                      <div className="text-xs text-emerald-700 font-semibold mt-1">100% Refund Guarantee</div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Cancel up to 7 days before tour departure for full refund. 50% refund up to 48 hours.
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">What to Pack</div>
                      <ul className="text-xs text-slate-600 mt-1 space-y-0.5">
                        <li>• Light woolens / jackets for cool evenings</li>
                        <li>• Comfortable walking shoes for plateau walks</li>
                        <li>• Valid government photo ID for all travelers</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Transportation &amp; Pickup</div>
                      <ul className="text-xs text-slate-600 mt-1 space-y-0.5">
                        <li>• Door-to-door private AC SUV pickup included</li>
                        <li>• Pickup available from Pune, Mumbai or Satara</li>
                        <li>• Experienced hill driver with verified credentials</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Safety &amp; Health</div>
                      <ul className="text-xs text-slate-600 mt-1 space-y-0.5">
                        <li>• 24/7 on-tour emergency medical coordination</li>
                        <li>• First-aid certified trip leader with every group</li>
                        <li>• Sanitized luxury vehicles &amp; villas</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 6: Location & Destination Area                             */}
            {/* ============================================================== */}
            {(activeDetailTab === "location" || activeDetailTab === "all") && (
              <div id="location" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 font-poppins">
                      Destination &amp; Sightseeing Map
                    </h3>
                    <p className="text-xs text-slate-500 font-roboto mt-0.5">
                      {pkg.city || "Panchgani & Mahabaleshwar"}, Maharashtra
                    </p>
                  </div>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Panchgani+Mahabaleshwar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-poppins transition"
                  >
                    <span>Open in Maps</span>
                    <span>↗</span>
                  </a>
                </div>

                <div className="relative rounded-2xl overflow-hidden min-h-[300px] sm:min-h-[360px] bg-slate-100 border border-slate-200 shadow-inner">
                  <iframe
                    title="Package Destination Map"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=73.65000%2C17.90000%2C73.82000%2C17.96000&layer=mapnik&marker=17.92420%2C73.80150"
                    className="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md text-xs font-bold font-poppins text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{pkg.title}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono">
                    Panchgani &amp; Mahabaleshwar Circuit
                  </div>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Panchgani+Mahabaleshwar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-[#ea110d] text-white text-xs font-bold font-poppins shadow-md hover:bg-[#d00f0c] transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open in Maps</span>
                    <span>↗</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  {[
                    { name: "Table Land", distance: "Included on Day 1", desc: "Panoramic sunset high-tea" },
                    { name: "Venna Lake & Boating", distance: "Included on Day 2", desc: "VIP morning boat cruise" },
                    { name: "Mapro Strawberry Garden", distance: "Included on Day 2", desc: "Private farm walk & tasting" },
                  ].map((att, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-xs font-bold text-slate-900 font-poppins">{att.name}</div>
                      <div className="text-[11px] font-semibold text-[#ea110d] mt-0.5">{att.distance}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{att.desc}</div>
                    </div>
                  ))}
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
                      <span>Traveler Reviews &amp; Ratings</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                        ★ {pkg.rating || 4.92} / 5.0
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-roboto mt-0.5">
                      Based on {pkg.reviewsCount || 94} verified holiday package bookings
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

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Itinerary & Pacing", score: "5.0" },
                    { label: "Accommodation Quality", score: "4.9" },
                    { label: "Food & Dining", score: "4.9" },
                    { label: "Chauffeur & Vehicle", score: "4.9" },
                    { label: "Guide Support", score: "5.0" },
                    { label: "Value for Money", score: "4.8" },
                  ].map((cat, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 font-medium">{cat.label}</span>
                        <span className="text-slate-900 font-bold">{cat.score}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-900 rounded-full w-[98%]" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-2">
                  {reviewsLoading ? (
                    <div className="py-6 text-center text-xs text-slate-400">Loading package reviews from database...</div>
                  ) : realReviews.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
                      <p className="text-xs text-slate-500 font-medium">No reviews written for this tour package yet.</p>
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
                      <div key={rev.id || i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center font-poppins">
                              {rev.author ? rev.author[0].toUpperCase() : "G"}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 font-poppins">{rev.author}</div>
                              <div className="text-[10px] text-slate-400 font-roboto">
                                {rev.date || "Recent"} {rev.tierTravelled ? `• ${rev.tierTravelled}` : ""}
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

              {/* Selected Tier Box */}
              <div
                onClick={() => handleTabChange("tiers")}
                className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 hover:bg-rose-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#ea110d] tracking-wider font-poppins">
                    SELECTED PACKAGE TIER
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 font-poppins truncate max-w-[210px]">
                    {selectedTier?.name || "All-Inclusive VIP Suite"}
                  </div>
                </div>
                <span className="text-xs font-bold text-[#ea110d] font-poppins">Change →</span>
              </div>

              {/* Start Date Selector */}
              <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/50 flex items-start gap-2">
                <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Tour Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-hidden cursor-pointer"
                  />
                </div>
              </div>

              {/* Guests Dropdown Selector */}
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
                      <div className="text-[10px] uppercase font-bold text-slate-400">Travelers</div>
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
                        <div className="text-[10px] text-slate-400">Ages 2-12</div>
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
              {pkg.acceptingBookings === false ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-sm font-poppins cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Bookings Paused</span>
                  </button>
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/90 text-center font-medium leading-relaxed">
                    This holiday package is temporarily not accepting reservations. Please check back shortly or reach out to concierge.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const queryParams = new URLSearchParams({
                      type: "package",
                      id: String(pkg.id || (pkg as any).code || packageId),
                      title: pkg.title,
                      tierId: selectedTier?.id || selectedTierId,
                      tierName: selectedTier?.name || "All-Inclusive VIP Suite",
                      checkIn: startDate,
                      adults: String(adults),
                      children: String(children),
                      price: String(pricePerPerson),
                      discount: String(memberDiscountPercent),
                      cleaningFee: String(includeFee ? feeAmount : 0),
                      gst: String(gstPercent),
                      image: allPhotos[0] || "",
                    });
                    router.push(`/checkout?${queryParams.toString()}`);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-sm font-poppins shadow-lg shadow-red-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <span>Reserve &amp; Book Package</span>
                  <span>→</span>
                </button>
              )}

              <div className="text-center">
                <span className="text-[11px] text-slate-500 font-roboto inline-flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Instant Confirmation • 100% Guaranteed Departure</span>
                </span>
              </div>

              {/* Price Breakdown Ledger */}
              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>
                    ₹{pricePerPerson.toLocaleString("en-IN")} × {totalGuests} travelers
                  </span>
                  <span className="font-semibold text-slate-900">₹{basePrice.toLocaleString("en-IN")}</span>
                </div>

                {memberDiscountPercent > 0 && discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Mahastays Member Discount ({memberDiscountPercent}%)</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {includeFee && feeAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Concierge &amp; Service Fee</span>
                    <span className="font-semibold text-slate-900">₹{feeAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>GST &amp; Tourism Taxes ({gstPercent}%)</span>
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
                  <span>100% Verified Package with Safe Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Free Cancellation up to 7 days before tour</span>
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
              <span className="text-xs text-slate-500">/ {totalGuests} travelers</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const queryParams = new URLSearchParams({
                type: "package",
                id: String(pkg.id || (pkg as any).code || packageId),
                title: pkg.title,
                tierId: selectedTier?.id || selectedTierId,
                tierName: selectedTier?.name || "All-Inclusive VIP Suite",
                checkIn: startDate,
                adults: String(adults),
                children: String(children),
                price: String(pricePerPerson),
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
        videoUrl={(pkg as any).videoUrl}
        title={`Tour Preview: ${pkg.title}`}
      />

      {/* Write Review Modal */}
      {writeReviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-poppins">Write a Traveler Review</h3>
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
                    placeholder="e.g. Anand Joshi"
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
                    placeholder="Describe your tour experience, pacing, chauffeur, and stays..."
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
