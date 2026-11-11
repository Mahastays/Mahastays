"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { DetailPageSkeleton } from "../../components/Skeletons";
import { VideoPlayerModal } from "../../components/VideoPlayerModal";
import { RoomType, StayDetail } from "../staysData";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPropertyByCode } from "@/store/slices/propertyslice";
import { useWishlistItem } from "@/lib/wishlist";
import { api } from "@/lib/api";

export default function StayBookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const stayId = (params?.id as string) || "p5002";
  const dispatch = useAppDispatch();
  const { selectedProperty, detailLoading } = useAppSelector((state) => state.properties);

  const accommodationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stayId) {
      dispatch(fetchPropertyByCode(stayId));
    }
  }, [dispatch, stayId]);

  // Construct stay purely from live backend database
  const stay: StayDetail | null = useMemo(() => {
    if (!selectedProperty) return null;
    const p = selectedProperty as any;
    const isMatch = Boolean(
      p.id === stayId ||
      p._id === stayId ||
      p.slug === stayId ||
      p.code === stayId
    );
    if (!isMatch) return null;

    const rawImages = (p.images && p.images.length > 0)
      ? p.images.map((img: any) =>
          typeof img === "string"
            ? { url: img, alt: p.name || "", isCover: false }
            : { url: img.url, alt: img.alt || p.name || "", isCover: !!img.isCover }
        )
      : [{ url: "/hero-resort.jpg", alt: p.name || "", isCover: true }];

    const rawRooms: RoomType[] = (p.rooms || []).map((r: any, idx: number) => ({
      roomId: r.roomId || r.id || `r-${idx}`,
      id: r.id || r.roomId || `r-${idx}`,
      roomType: r.roomType || r.name || "Standard Room",
      name: r.name || r.roomType || "Standard Room",
      badge: r.badge,
      tagline: r.tagline || "",
      size: r.size || (r.roomSize ? `${r.roomSize} sq.ft.` : "350 sq.ft."),
      roomSize: r.roomSize || 350,
      bed: r.bed || r.bedType || "King",
      bedType: r.bedType || r.bed || "King",
      maxGuests: r.maxGuests || 2,
      capacity: r.capacity || { adults: r.maxGuests || 2, children: 1 },
      pricePerNight: r.pricePerNight || r.basePrice || p.numericPrice || 5000,
      basePrice: r.basePrice || r.pricePerNight || p.numericPrice || 5000,
      originalPrice: r.originalPrice || Math.round((r.basePrice || p.numericPrice || 5000) * 1.25),
      weekendPrice: r.weekendPrice || r.basePrice || p.numericPrice || 5000,
      holidayPrice: r.holidayPrice || r.basePrice || p.numericPrice || 5000,
      count: r.count || 1,
      image: r.image || r.images?.[0] || rawImages[0]?.url || "/hero-resort.jpg",
      roomImages: r.roomImages || r.images || [r.image || rawImages[0]?.url || "/hero-resort.jpg"],
      amenities: r.amenities || r.roomAmenities || ["Air Conditioning", "Wi-Fi"],
      roomAmenities: r.roomAmenities || r.amenities || ["Air Conditioning", "Wi-Fi"],
    }));

    return {
      _id: p._id || p.id,
      id: p.id || p._id,
      hostId: p.hostId || p.vendorId || "",
      propertyType: p.propertyType || "resort",
      type: p.type || "Resort",
      name: p.name || "Luxury Stay",
      price: p.price || `₹${(p.numericPrice || 5000).toLocaleString("en-IN")}`,
      numericPrice: p.numericPrice || 5000,
      inrPrice: p.inrPrice || p.numericPrice || 5000,
      originalPrice: p.originalPrice || Math.round((p.numericPrice || 5000) * 1.2),
      rating: typeof p.rating === "number" ? p.rating : 0,
      reviewsCount: typeof p.reviewsCount === "number" ? p.reviewsCount : 0,
      description: p.description || "",
      longDescription: p.longDescription || p.description || "",
      location: p.location || "Mahabaleshwar",
      locationId: p.locationId || "",
      city: p.city || "Mahabaleshwar",
      country: p.country || "India",
      tagline: p.tagline || "",
      badge: p.badge || "Verified Stay",
      tags: p.tags || ["Verified", "Luxury"],
      address: p.address || { fullAddress: p.location || "Mahabaleshwar", lat: 17.92, lng: 73.65, mapLink: "" },
      images: rawImages,
      gallery: p.gallery || [],
      videos: p.videos || [],
      videoUrl: p.videoUrl || p.video || (p.videos && p.videos[0]) || "",
      keyAmenities: p.keyAmenities || [],
      idealFor: p.idealFor || "",
      host: p.host || { name: p.hostName || "Verified Host", role: p.hostRole || "Property Manager", experience: p.hostExperience || "Host since 2019", avatar: p.hostAvatar, staysCount: p.hostStaysCount || "64+ Verified Group Stays", confirmationBadge: "Instant Booking Confirmed" },
      hostName: p.hostName || p.host?.name || "Verified Host",
      hostRole: p.hostRole || p.host?.role || "Property Manager",
      hostExperience: p.hostExperience || p.host?.experience || "Host since 2019",
      hostAvatar: p.hostAvatar || p.host?.avatar,
      highlights: p.highlights || [],
      amenities: p.amenities || [],
      policies: p.policies || {
        checkInTime: p.checkInTime || "14:00",
        checkOutTime: p.checkOutTime || "11:00",
        cancellationPolicy: p.cancellationPolicy || "Free cancellation up to 48 hours before check-in.",
        petsAllowed: !!p.petsAllowed,
        smokingAllowed: !!p.smokingAllowed,
        coupleFriendly: p.coupleFriendly !== false,
        maxGuestsPerRoom: p.maxGuestsPerRoom || 4,
      },
      checkInTime: p.checkInTime || p.policies?.checkInTime || "2:00 PM",
      checkOutTime: p.checkOutTime || p.policies?.checkOutTime || "11:00 AM",
      cancellationPolicy: p.cancellationPolicy || p.policies?.cancellationPolicy || "Free cancellation up to 48 hours before check-in.",
      acceptingBookings: p.acceptingBookings !== false,
      petsAllowed: !!(p.petsAllowed || p.policies?.petsAllowed),
      smokingAllowed: !!(p.smokingAllowed || p.policies?.smokingAllowed),
      coupleFriendly: p.coupleFriendly !== false && p.policies?.coupleFriendly !== false,
      maxGuestsPerRoom: p.maxGuestsPerRoom || p.policies?.maxGuestsPerRoom || 4,
      rooms: rawRooms,
      mapCoordinates: p.mapCoordinates || { lat: 17.9237, lng: 73.6586 },
      attractions: p.attractions || [],
      ratingBreakdown: p.ratingBreakdown || [],
      reviews: p.reviews || [],
      curatedPackages: p.curatedPackages || [],
      status: p.status || "active",
      pricingRules: p.pricingRules || (selectedProperty as any)?.pricingRules || null,
      bgColor: p.bgColor,
      gradientOverlay: p.gradientOverlay,
      featured: p.featured,
    };
  }, [selectedProperty, stayId]);

  // Gallery images combined
  const allPhotos = useMemo(() => {
    const list: string[] = [];
    if (stay?.images) {
      stay.images.forEach((img) => {
        if (img.url && !list.includes(img.url)) list.push(img.url);
      });
    }
    if (stay?.gallery) {
      stay.gallery.forEach((url) => {
        if (url && !list.includes(url)) list.push(url);
      });
    }
    if (list.length === 0) list.push("/hero-resort.jpg");
    return list;
  }, [stay]);

  // Interactive UI State - rooms tab open by default
  const [activeDetailTab, setActiveDetailTab] = useState<string>("rooms");
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
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState("2026-10-15");
  const [checkOutDate, setCheckOutDate] = useState("2026-10-18");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);
  const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false);
  const { isSaved: isWishlist, toggle: toggleWishlistAction } = useWishlistItem({
    id: stay?.id || stayId,
    type: "property",
    title: stay?.name || "",
    location: stay?.location || "",
    price: stay?.price || "",
    numericPrice: stay?.numericPrice || stay?.inrPrice || 0,
    image: allPhotos[0] || "/hero-resort.jpg",
    rating: stay?.rating || 0,
    category: stay?.type || "Villa",
    url: `/explore/${stay?.id || stayId}`,
  });
  const [showShareToast, setShowShareToast] = useState(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const [realReviews, setRealReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{ average: number; count: number } | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewLocation, setNewReviewLocation] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");

  const loadStayReviews = async () => {
    try {
      setReviewsLoading(true);
      const targetId = stay?.id || stayId;
      const res = await api.get(`/reviews?targetType=property&targetId=${targetId}`);
      const data = res.data?.data || res.data?.items || res.data || [];
      if (Array.isArray(data)) {
        setRealReviews(data);
      }
      if (res.data?.meta?.summary) {
        setReviewSummary(res.data.meta.summary);
      }
    } catch {
      // offline / not found
    } finally {
      setReviewsLoading(false);
    }
  };

  const realCount = reviewSummary?.count ?? (realReviews.length > 0 ? realReviews.length : (typeof stay?.reviewsCount === "number" ? stay.reviewsCount : 0));
  const realRating = reviewSummary && reviewSummary.count > 0 && reviewSummary.average > 0
    ? reviewSummary.average.toFixed(1)
    : realReviews.length > 0
    ? (realReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / realReviews.length).toFixed(1)
    : (typeof stay?.rating === "number" && stay.rating > 0 ? Number(stay.rating).toFixed(1) : null);

  useEffect(() => {
    if (stay?.id || stayId) {
      loadStayReviews();
    }
  }, [stay?.id, stayId]);

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;
    setReviewSubmitting(true);
    setReviewMsg("");
    try {
      await api.post("/reviews", {
        targetType: "property",
        targetId: stay?.id || stayId,
        author: newReviewAuthor.trim(),
        location: newReviewLocation.trim() || undefined,
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        roomStayed: selectedRoom?.name || "Suite Stay",
      });
      setReviewMsg("Review posted successfully!");
      setTimeout(() => {
        setWriteReviewOpen(false);
        setNewReviewAuthor("");
        setNewReviewLocation("");
        setNewReviewComment("");
        setNewReviewRating(5);
        setReviewMsg("");
        loadStayReviews();
      }, 1000);
    } catch (err: any) {
      setReviewMsg(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Selected Room
  const selectedRoom: RoomType | undefined = useMemo(() => {
    if (!stay?.rooms || stay.rooms.length === 0) return undefined;
    return (
      stay.rooms.find((r) => r.roomId === selectedRoomId || r.id === selectedRoomId) ||
      stay.rooms[0]
    );
  }, [stay?.rooms, selectedRoomId]);

  // Keep selectedRoom valid if rooms change
  useEffect(() => {
    if (stay?.rooms && stay.rooms.length > 0) {
      const exists = stay.rooms.some(
        (r) => r.roomId === selectedRoomId || r.id === selectedRoomId
      );
      if (!exists) {
        setSelectedRoomId(stay.rooms[0].roomId || stay.rooms[0].id);
      }
    }
  }, [stay?.rooms, selectedRoomId]);

  // Pricing calculations
  const roomPricePerNight = selectedRoom?.pricePerNight || stay?.numericPrice || 22000;
  const originalRate = selectedRoom?.originalPrice || stay?.originalPrice || 28000;
  const savingsPerNight = Math.max(0, originalRate - roomPricePerNight);

  // Capacity and guest validation
  const totalGuests = adults + children;
  const roomMaxGuests = selectedRoom?.maxGuests || 2;
  const isRoomExceeded = totalGuests > roomMaxGuests;

  const alternativeRoom = useMemo(() => {
    if (!isRoomExceeded || !stay?.rooms) return undefined;
    return stay.rooms.find(
      (r) =>
        (r.roomId !== selectedRoom?.roomId && r.id !== selectedRoom?.id) &&
        (r.maxGuests || 2) >= totalGuests
    );
  }, [isRoomExceeded, stay?.rooms, selectedRoom, totalGuests]);

  const maxStayCapacity = useMemo(() => {
    if (!stay?.rooms || stay.rooms.length === 0) return 2;
    return Math.max(...stay.rooms.map((r) => r.maxGuests || 2));
  }, [stay?.rooms]);

  const nights = useMemo(() => {
    const d1 = new Date(checkInDate);
    const d2 = new Date(checkOutDate);
    const diff = (d2.getTime() - d1.getTime()) / (1000 * 3600 * 24);
    return isNaN(diff) || diff <= 0 ? 3 : Math.round(diff);
  }, [checkInDate, checkOutDate]);

  // Pricing configuration from DB
  const pricingRules = (stay as any)?.pricingRules;
  const memberDiscountPercent = typeof pricingRules?.memberDiscountPercent === 'number'
    ? pricingRules.memberDiscountPercent
    : (pricingRules?.discountType === 'none' ? 0 : 8);
  const includeCleaningFee = pricingRules
    ? (pricingRules?.includeCleaningFee !== false && (typeof pricingRules?.cleaningFee === 'number' ? pricingRules.cleaningFee > 0 : true))
    : true;
  const cleaningFee = includeCleaningFee
    ? (typeof pricingRules?.cleaningFee === 'number' ? pricingRules.cleaningFee : 445)
    : 0;
  const includeGst = pricingRules ? (pricingRules?.includeGst !== false && pricingRules?.gstPercent !== 0) : true;
  const gstPercent = includeGst
    ? (typeof pricingRules?.gstPercent === 'number' ? pricingRules.gstPercent : 18)
    : 0;
  const gstRate = gstPercent / 100;

  const basePrice = roomPricePerNight * nights;
  const discountAmount = Math.round(basePrice * (memberDiscountPercent / 100));
  const taxesAndGst = Math.round((basePrice - discountAmount + cleaningFee) * gstRate);
  const grandTotal = Math.max(0, basePrice - discountAmount + cleaningFee + taxesAndGst);

  // Tab change handler (switches content in place, no jump scrolling)
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

  if (detailLoading || !stay) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] font-roboto">
        <DetailPageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] font-roboto text-slate-800">
      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-24 pb-16">
        {/* Breadcrumbs & Action Bar */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              <span>Home</span>
            </Link>
            <span>/</span>
            <Link href="/explore" className="hover:text-slate-900 transition-colors">
              Explore Stays
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[180px] sm:max-w-[300px]">
              {stay.name}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: stay.name, url: window.location.href }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  setShowShareToast(true);
                  setTimeout(() => setShowShareToast(false), 2400);
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium font-poppins transition shadow-xs cursor-pointer"
              aria-label="Share property"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
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
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium font-poppins transition shadow-xs cursor-pointer ${
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
          <div className="fixed top-20 right-6 z-50 bg-[#0B0A06] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium font-poppins animate-fade-in flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Property link copied to clipboard!</span>
          </div>
        )}

        {/* Property Header */}
        <div className="mb-3.5 sm:mb-4">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-poppins bg-[#ea110d] text-white tracking-wide">
              {stay.badge || "Boutique Luxury"}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold font-poppins bg-slate-100 text-slate-700">
              {stay.type || "Private Villa"}
            </span>
            {realCount > 0 && realRating ? (
              <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold font-poppins ml-1">
                <span>★</span>
                <span className="text-slate-800">{realRating}</span>
                <span className="text-slate-400 font-normal">
                  ({realCount} {realCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium font-poppins ml-1">
                <span className="text-amber-400">★</span>
                <span className="text-slate-700 font-bold">New</span>
                <span className="text-slate-400 font-normal">(0 reviews)</span>
              </div>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">
            {stay.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea110d" strokeWidth="2.2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{stay.location || `${stay.city || "Panchgani"}, Maharashtra`}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Free cancellation up to 48 hrs</span>
            </span>
          </div>
        </div>

        {/* 5-Photo Mosaic Gallery - Compact Height */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-2.5 mb-4 sm:mb-5 h-auto sm:h-[340px] lg:h-[360px]">
          {/* Main Large Left Hero (7 cols on lg) */}
          <div
            onClick={() => setLightboxOpen(true)}
            className="lg:col-span-7 relative rounded-2xl overflow-hidden bg-slate-200 group cursor-pointer h-[220px] sm:h-[340px] lg:h-full border border-slate-100 shadow-xs"
          >
            <Image
              src={allPhotos[activePhotoIndex] || allPhotos[0]}
              alt={stay.name}
              fill
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

            {/* Left / Right Arrows on Hero */}
            <button
              onClick={handlePrevPhoto}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition z-10 cursor-pointer"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              onClick={handleNextPhoto}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition z-10 cursor-pointer"
              aria-label="Next photo"
            >
              ›
            </button>

            {/* Bottom Badges */}
            <div className="absolute bottom-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium font-poppins">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Featured View</span>
              </span>
            </div>
            <div className="absolute bottom-3 right-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold font-poppins">
                <span>{activePhotoIndex + 1} / {allPhotos.length}</span>
              </span>
            </div>
          </div>

          {/* Right 2x2 Grid (5 cols on lg) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-2 sm:gap-2.5 h-[200px] sm:h-[340px] lg:h-full">
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
                  alt={`${stay.name} preview ${idx + 2}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />

                {/* 4th Thumbnail View All Photos Overlay */}
                {idx === 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxOpen(true);
                    }}
                    className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 hover:bg-white text-slate-900 text-[11px] font-bold font-poppins shadow-md backdrop-blur-sm transition-transform active:scale-95 cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
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

        {/* Two-Column Layout: Left Content & Right Sticky Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start mb-8">
          {/* ============================================================== */}
          {/* LEFT COLUMN: Host Card + Sticky Tabs Bar + Tab Panels (8 cols)  */}
          {/* ============================================================== */}
          <div className="lg:col-span-8 flex flex-col gap-3 sm:gap-3.5">
            {/* Host Card - Compact Single Row UX */}
            <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {stay.host?.avatar || (stay as any).hostAvatar ? (
                  <img
                    src={stay.host?.avatar || (stay as any).hostAvatar}
                    alt={stay.host?.name || "Host Profile"}
                    loading="lazy"
                    decoding="async"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 ring-1.5 ring-rose-100 shadow-2xs"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0B0A06] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center font-poppins shrink-0 shadow-2xs">
                    {stay.host?.name ? stay.host.name[0] : "K"}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-poppins flex items-center gap-1 truncate">
                    <span>Hosted by {stay.host?.name || (stay as any).hostName || "Verified Host"}</span>
                    {((stay.host as any)?.verified !== false) && (
                      <span className="w-3.5 h-3.5 rounded-full bg-[#ea110d] text-white flex items-center justify-center text-[9px] font-bold shrink-0" title="Verified Host">
                        ✓
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-roboto truncate">
                    {stay.host?.role || (stay as any).hostRole || "Property Host"}
                    {stay.host?.experience ? ` • ${stay.host.experience}` : (stay as any).hostExperience ? ` • ${(stay as any).hostExperience}` : ""}
                    {(stay.host as any)?.staysCount ? ` • ${(stay.host as any).staysCount}` : ""}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50/90 border border-red-100 text-[10px] sm:text-xs font-bold text-[#ea110d] font-poppins shrink-0">
                <span className="text-[#ea110d] font-bold">✓</span>
                <span className="hidden sm:inline">{(stay.host as any)?.confirmationBadge || "Instant Booking Confirmed"}</span>
                <span className="sm:hidden">Instant Confirmed</span>
              </div>
            </div>

            {/* Quick Feature Cards Strip (Strictly separate from highlights; only renders if keyAmenities has items) */}
            {Boolean((stay as any).keyAmenities && (stay as any).keyAmenities.length > 0) && (
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className={`grid grid-cols-2 ${(stay as any).keyAmenities.length >= 4 ? 'sm:grid-cols-4' : (stay as any).keyAmenities.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} divide-y sm:divide-y-0 divide-slate-100 sm:divide-x sm:divide-slate-200/80`}>
                  {(stay as any).keyAmenities.map((ka: any, i: number) => {
                    const title = ka.name || ka.title;
                    const desc = ka.desc || ka.description;
                    return (
                      <div
                        key={i}
                        title={desc ? `${title} • ${desc}` : title}
                        className="group flex items-center justify-center sm:justify-start gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                          <Image
                            src="/brand/mahastays-logo-main.png"
                            alt="Mahastays"
                            width={16}
                            height={16}
                            className="w-full h-full object-contain filter grayscale contrast-125 opacity-75 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                          />
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-[#ea110d] transition-colors font-poppins truncate tracking-tight">
                          {title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                  id: "rooms",
                  label: "Rooms & Suites",
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M5 18h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
                  id: "facilities",
                  label: "Facilities",
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  ),
                },
                {
                  id: "rules",
                  label: "House Rules",
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
            {/* TAB 1: Rooms & Suites (Default Open)                            */}
            {/* ============================================================== */}
            {activeDetailTab === "rooms" && (
              <div ref={accommodationRef} id="rooms" className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-poppins">
                      Available Rooms &amp; Suites
                    </h2>
                    <p className="text-[11px] text-slate-500 font-roboto mt-0.5">
                      Select your preferred accommodation type for live transparent price calculation
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 font-poppins">
                    {stay.rooms.length} Options Available
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {stay.rooms.map((room) => {
                    const rId = room.roomId || room.id;
                    const isSelected = selectedRoomId === rId;
                    const rPhotos = (room as any).photos && (room as any).photos.length > 0 ? (room as any).photos : (room as any).images && (room as any).images.length > 0 ? (room as any).images : allPhotos;

                    return (
                      <div
                        key={rId}
                        className={`rounded-xl p-3 sm:p-3.5 transition-all bg-white border ${
                          isSelected
                            ? "border-[#ea110d] ring-2 ring-red-500/20 shadow-md"
                            : "border-slate-100 hover:border-slate-200 shadow-2xs"
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-3.5 items-center">
                          {/* Room Photo */}
                          <div className="md:col-span-4 relative h-32 sm:h-36 rounded-lg overflow-hidden bg-slate-100 group">
                            <Image
                              src={rPhotos[0] || "/hero-resort.jpg"}
                              alt={room.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 320px"
                              loading="lazy"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {room.badge && (
                              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-[#0B0A06]/80 backdrop-blur-sm text-white text-[9px] font-bold font-poppins">
                                {room.badge}
                              </span>
                            )}
                          </div>

                          {/* Room Specs & Details */}
                          <div className="md:col-span-5 flex flex-col justify-between h-full">
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins">
                                  {room.name}
                                </h3>
                              </div>
                              <p className="text-[11px] text-slate-500 font-roboto line-clamp-1 sm:line-clamp-2 mb-2">
                                {room.tagline || (room as any).description}
                              </p>

                              {/* Key Specs Pills */}
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600 mb-2">
                                {room.size && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-[10px] font-medium text-slate-700">
                                    <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                    <span>{room.size}</span>
                                  </span>
                                )}
                                {room.bedType && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-[10px] font-medium text-slate-700">
                                    <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v11m0-4h18m0-7v11M7 10a2 2 0 110-4 2 2 0 010 4zm7 0h5a2 2 0 012 2v2H12v-2a2 2 0 012-2z" />
                                    </svg>
                                    <span>{room.bedType}</span>
                                  </span>
                                )}
                                {(room as any).view && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-[10px] font-medium text-slate-700">
                                    <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{(room as any).view}</span>
                                  </span>
                                )}
                                {room.maxGuests && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-[10px] font-medium text-slate-700">
                                    <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Up to {room.maxGuests} Guests</span>
                                  </span>
                                )}
                              </div>

                              {/* Features with Checkmarks */}
                              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600">
                                {(((room as any).features || (room as any).amenities || [
                                  "Free High-Speed Wi-Fi",
                                  "Breakfast Included",
                                  "Air Conditioning",
                                  "Private Balcony",
                                ]) as string[]).slice(0, 4).map((f: string, fi: number) => (
                                  <span key={fi} className="flex items-center gap-1 truncate">
                                    <span className="text-[#ea110d] font-bold">✓</span>
                                    <span>{f}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Room Pricing & CTA */}
                          <div className="md:col-span-3 flex flex-col md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-2.5 md:pt-0 md:pl-3.5">
                            <div className="md:text-right mb-2">
                              <span className="text-[11px] text-slate-400 line-through block font-medium">
                                ₹{(room.originalPrice || Math.round(room.pricePerNight * 1.25)).toLocaleString("en-IN")}
                              </span>
                              <div className="flex items-baseline md:justify-end gap-1">
                                <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-poppins">
                                  ₹{room.pricePerNight.toLocaleString("en-IN")}
                                </span>
                                <span className="text-[11px] text-slate-500">/ night</span>
                              </div>
                              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                                + ₹{taxesAndGst.toLocaleString("en-IN")} taxes &amp; fees
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedRoomId(rId)}
                              className={`w-full py-2 px-3.5 rounded-lg text-xs font-bold font-poppins transition-all shadow-xs cursor-pointer ${
                                isSelected
                                  ? "bg-[#ea110d] text-white shadow-red-200"
                                  : "bg-white border border-slate-300 text-slate-700 hover:border-slate-800 hover:text-slate-900"
                              }`}
                            >
                              {isSelected ? "Selected Accommodation" : "Select Room"}
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
            {/* TAB 2: About this Resort / Villa                                */}
            {/* ============================================================== */}
            {activeDetailTab === "about" && (
              <div className="flex flex-col gap-3 sm:gap-3.5">
                <div id="about" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-7 flex flex-col justify-between">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins mb-2">
                        About this {stay.type || "Resort & Villa"}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-roboto mb-3.5">
                        {stay.longDescription || stay.description}
                      </p>

                      {/* 4 Info Pills */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="text-[9px] uppercase font-bold text-slate-400">Check-in</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            {stay.policies?.checkInTime || (stay.policies as any)?.checkIn || "2:00 PM"}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="text-[9px] uppercase font-bold text-slate-400">Check-out</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            {stay.policies?.checkOutTime || (stay.policies as any)?.checkOut || "11:00 AM"}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="text-[9px] uppercase font-bold text-slate-400">Property Type</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            {stay.type || "Luxury Resort"}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="text-[9px] uppercase font-bold text-slate-400">Ideal For</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">Family &amp; Groups</div>
                        </div>
                      </div>
                    </div>

                    {/* Video Tour Banner (Right side of card - 5 cols) */}
                    <div
                      onClick={() => setVideoModalOpen(true)}
                      className="md:col-span-5 relative rounded-xl overflow-hidden h-40 sm:h-44 bg-slate-900 group cursor-pointer border border-slate-200"
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
                      <div className="absolute bottom-2.5 right-2.5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-slate-900 text-[11px] font-bold font-poppins shadow-md backdrop-blur-sm group-hover:scale-105 transition-transform">
                          <span className="text-[#ea110d] text-[10px]">▶</span>
                          <span>Watch Video Tour</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Highlights */}
                <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                      Property Highlights
                    </h3>
                  </div>
                  {stay.highlights && stay.highlights.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {stay.highlights.map((item: any, idx: number) => {
                        const title = typeof item === "string" ? item : item.title;
                        const desc = typeof item === "string" ? "" : (item.desc || item.description);
                        return (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                              <svg className="w-3.5 h-3.5 text-[#ea110d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 font-poppins truncate">{title}</div>
                              {desc && (
                                <div className="text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{desc}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No highlights added by the host.</p>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: Facilities & Amenities                                   */}
            {/* ============================================================== */}
            {activeDetailTab === "facilities" && (
              <div id="facilities" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col gap-3.5">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                    What this {stay.type ? (stay.type.charAt(0).toUpperCase() + stay.type.slice(1).toLowerCase()) : "Resort"} Offers
                  </h3>
                  <p className="text-[11px] text-slate-500 font-roboto mt-0.5">
                    All facilities and amenities have been verified by Mahastays quality inspection team.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(((stay as any).facilityCategories && (stay as any).facilityCategories.length > 0)
                    ? (stay as any).facilityCategories
                    : [
                        {
                          category: "Luxury & Recreation",
                          items: ["Private Infinity Heated Pool", "Open-Air Jacuzzi & Sun Deck", "Landscaped Lawn & Gazebo", "Private Balcony with Valley View"],
                        },
                        {
                          category: "Dining & Culinary",
                          items: ["Dedicated In-House Chef", "Gourmet Multi-Cuisine Menu", "Live Barbeque & Bonfire Setup", "Modern Modular Kitchen"],
                        },
                        {
                          category: "Entertainment & Tech",
                          items: ["65\" 4K Smart TVs with OTT", "High-Speed Fiber Wi-Fi (300 Mbps)", "Bluetooth Acoustic Sound System", "Board Games & Cards Corner"],
                        },
                        {
                          category: "Comfort & Utilities",
                          items: ["100% Automatic Power Backup", "Central Air-Conditioning & Heating", "Premium Linens & Memory Foam Mattresses", "Daily Housekeeping & Turn-Down"],
                        },
                        {
                          category: "Safety & Security",
                          items: ["24/7 Gated Security & Caretaker", "Perimeter CCTV Surveillance", "Digital Safe in Master Suites", "First Aid Kit & Doctor on Call"],
                        },
                        {
                          category: "Family & Pet Friendly",
                          items: ["Pet-Friendly Lawn Area", "Baby Cot & High Chair on Request", "Safe Enclosed Villa Grounds", "Custom Kids Meal Preparation"],
                        },
                      ]
                  ).map((cat: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-xs font-bold text-slate-900 font-poppins mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ea110d]" />
                        <span>{cat.category}</span>
                      </div>
                      <ul className="space-y-1 text-[11px] text-slate-600">
                        {(cat.items || []).map((it: string, itIdx: number) => (
                          <li key={itIdx} className="flex items-center gap-1.5">
                            <span className="text-[#ea110d] font-bold text-[10px]">✓</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 4: House Rules & Policies                                  */}
            {/* ============================================================== */}
            {activeDetailTab === "rules" && (
              <div id="rules" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins mb-0.5">
                    House Rules &amp; Policies
                  </h3>
                  <p className="text-[11px] text-slate-500 font-roboto">
                    Important stay guidelines to guarantee a pleasant, respectful experience
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Check-in &amp; Check-out</div>
                      <div className="text-xs text-slate-600 mt-0.5 space-y-0.5">
                        <div>Check-in: <strong>{stay.policies?.checkInTime || (stay as any).checkInTime || "14:00"} onwards</strong></div>
                        <div>Check-out: <strong>By {stay.policies?.checkOutTime || (stay as any).checkOutTime || "11:00"}</strong></div>
                        <div className="text-[10px] text-slate-400">{stay.policies?.earlyCheckInNote || (stay as any).earlyCheckInNote || "Early check-in subject to availability"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Cancellation Policy</div>
                      <div className="text-xs text-emerald-700 font-semibold mt-0.5">Free Cancellation</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {stay.policies?.cancellationPolicy || (stay as any).cancellationPolicy || "Full refund up to 48 hours before check-in. 50% refund thereafter."}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Suitability &amp; Rules</div>
                      {((stay.policies?.suitabilityRules && stay.policies.suitabilityRules.length > 0) || ((stay as any).suitabilityRules && (stay as any).suitabilityRules.length > 0)) ? (
                        <ul className="text-[11px] text-slate-600 mt-0.5 space-y-0.5">
                          {((stay.policies?.suitabilityRules && stay.policies.suitabilityRules.length > 0)
                            ? stay.policies.suitabilityRules
                            : (stay as any).suitabilityRules
                          ).map((rule: string, idx: number) => (
                            <li key={idx}>• {rule}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-0.5 italic">
                          No specific suitability rules added by the host.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Guidelines &amp; Address</div>
                      <ul className="text-[11px] text-slate-600 mt-0.5 space-y-0.5">
                        <li>• Quiet hours: 10:00 PM – 7:00 AM</li>
                        <li>• Government ID required at check-in</li>
                        <li>• {stay.address?.fullAddress || stay.location || "Mahabaleshwar, Maharashtra"}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 5: Location & Map                                           */}
            {/* ============================================================== */}
            {activeDetailTab === "location" && (
              <div id="location" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                      Location &amp; Nearby Attractions
                    </h3>
                    <p className="text-[11px] text-slate-500 font-roboto mt-0.5">
                      {stay.location || "Panchgani & Old Mahabaleshwar, Maharashtra"}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stay.name + " " + (stay.location || "Panchgani"))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-poppins transition"
                  >
                    <span>Open in Maps</span>
                    <span>↗</span>
                  </a>
                </div>

                {/* Live Interactive Map View */}
                <div className="relative rounded-2xl overflow-hidden min-h-[300px] sm:min-h-[360px] bg-slate-100 border border-slate-200 shadow-inner">
                  <iframe
                    title="Property Map Location"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${(
                      (typeof stay.address?.lng === 'number' ? stay.address.lng : 73.8015) - 0.015
                    ).toFixed(5)}%2C${(
                      (typeof stay.address?.lat === 'number' ? stay.address.lat : 17.9242) - 0.011
                    ).toFixed(5)}%2C${(
                      (typeof stay.address?.lng === 'number' ? stay.address.lng : 73.8015) + 0.015
                    ).toFixed(5)}%2C${(
                      (typeof stay.address?.lat === 'number' ? stay.address.lat : 17.9242) + 0.011
                    ).toFixed(5)}&layer=mapnik&marker=${(typeof stay.address?.lat === 'number' ? stay.address.lat : 17.9242).toFixed(5)}%2C${(typeof stay.address?.lng === 'number' ? stay.address.lng : 73.8015).toFixed(5)}`}
                    className="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md text-xs font-bold font-poppins text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{stay.name}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono">
                    GPS: {(typeof stay.address?.lat === 'number' ? stay.address.lat : 17.9242).toFixed(5)}° N, {(typeof stay.address?.lng === 'number' ? stay.address.lng : 73.8015).toFixed(5)}° E
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${typeof stay.address?.lat === 'number' ? stay.address.lat : 17.9242},${typeof stay.address?.lng === 'number' ? stay.address.lng : 73.8015}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-[#ea110d] text-white text-xs font-bold font-poppins shadow-md hover:bg-[#d00f0c] transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Get Directions</span>
                    <span>↗</span>
                  </a>
                </div>

                {/* Nearby Attractions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  {[
                    { name: "Table Land Plateau", distance: "2.4 km • 7 mins drive", desc: "Asia's 2nd largest volcanic plateau" },
                    { name: "Venna Lake & Boating", distance: "4.8 km • 12 mins drive", desc: "Serene boat rides & strawberry stalls" },
                    { name: "Mapro Garden", distance: "6.5 km • 15 mins drive", desc: "Famous fresh strawberry cream & cafe" },
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
            {/* TAB 6: Reviews & Ratings                                       */}
            {/* ============================================================== */}
            {activeDetailTab === "reviews" && (
              <div id="reviews" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col gap-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins flex items-center gap-2">
                      <span>Guest Reviews &amp; Ratings</span>
                      {realCount > 0 && realRating ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                          ★ {realRating} / 5.0
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                          ★ New (No ratings yet)
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-roboto mt-0.5">
                      {realCount > 0
                        ? `Based on ${realCount} verified ${realCount === 1 ? "group or family stay" : "group and family stays"}`
                        : "No verified reviews written for this property yet"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWriteReviewOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ea110d] text-white text-xs font-bold font-poppins hover:bg-red-700 transition shadow-xs self-start cursor-pointer"
                  >
                    <span>Write a Review</span>
                  </button>
                </div>

                {/* Rating Categories Breakdown (Only shown when verified reviews exist) */}
                {realCount > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(stay.ratingBreakdown && stay.ratingBreakdown.length > 0
                      ? stay.ratingBreakdown
                      : [
                          { label: "Cleanliness", score: realRating || "5.0" },
                          { label: "Accuracy", score: realRating || "5.0" },
                          { label: "Communication", score: realRating || "5.0" },
                          { label: "Location", score: realRating || "5.0" },
                          { label: "Check-in", score: realRating || "5.0" },
                          { label: "Value for Money", score: realRating || "5.0" },
                        ]
                    ).map((cat: any, i: number) => {
                      const numScore = parseFloat(cat.score) || 5.0;
                      const pct = Math.min(100, Math.round((numScore / 5) * 100));
                      return (
                        <div key={i} className="flex flex-col gap-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-600 font-medium">{cat.label}</span>
                            <span className="text-slate-900 font-bold">{cat.score}</span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-900 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Review Cards */}
                <div className="space-y-2.5 pt-1">
                  {reviewsLoading ? (
                    <div className="py-4 text-center text-xs text-slate-400">Loading guest reviews from database...</div>
                  ) : realReviews.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1.5">
                      <p className="text-xs text-slate-500 font-medium">No reviews written for this property yet.</p>
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
                            <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center font-poppins">
                              {rev.author ? rev.author[0].toUpperCase() : "G"}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 font-poppins">{rev.author}</div>
                              <div className="text-[10px] text-slate-400 font-roboto">
                                {rev.date || "Recent"} {rev.roomStayed ? `• ${rev.roomStayed}` : ""}
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
            <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-100 shadow-xl flex flex-col gap-2.5">
              {/* Top Rate Header */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-poppins">
                    ₹{roomPricePerNight.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-500 font-normal"> / night</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 line-through block font-poppins">
                    ₹{originalRate.toLocaleString("en-IN")}
                  </span>
                  {savingsPerNight > 0 && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold font-poppins border border-emerald-200">
                      Save ₹{savingsPerNight.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              {/* Selected Accommodation Box (Soft Pink Tint) */}
              <div
                onClick={() => handleTabChange("rooms")}
                className="p-2 sm:p-2.5 rounded-lg bg-rose-50/70 border border-rose-100 hover:bg-rose-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-[9px] uppercase font-bold text-[#ea110d] tracking-wider font-poppins">
                    SELECTED ACCOMMODATION
                  </div>
                  <div className="text-xs sm:text-[13px] font-bold text-slate-900 font-poppins truncate max-w-[200px]">
                    {selectedRoom?.name || "Entire 4BHK Luxury Villa"}
                  </div>
                </div>
                <span className="text-xs font-bold text-[#ea110d] font-poppins">Change →</span>
              </div>

              {/* Date Selectors (2 columns with Calendar Icons) */}
              <div className="grid grid-cols-2 rounded-lg border border-slate-200 divide-x divide-slate-200 overflow-hidden bg-slate-50/50">
                <div className="p-2 flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] uppercase font-bold text-slate-400 block">Check-in</label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-hidden cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-2 flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] uppercase font-bold text-slate-400 block">Check-out</label>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-hidden cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Guests Dropdown Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsGuestPickerOpen(!isGuestPickerOpen)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Guests</div>
                      <div className="text-xs font-bold text-slate-800">
                        {adults} Adults, {children} Child
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs">{isGuestPickerOpen ? "▲" : "▼"}</span>
                </button>

                {isGuestPickerOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 p-2.5 rounded-lg bg-white border border-slate-200 shadow-xl z-30 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Adults</div>
                        <div className="text-[9px] text-slate-400">Age 13+</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-50 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-slate-800 w-4 text-center">{adults}</span>
                        <button
                          type="button"
                          onClick={() => setAdults(adults + 1)}
                          className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-50 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Children</div>
                        <div className="text-[9px] text-slate-400">Ages 2-12</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-50 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-slate-800 w-4 text-center">{children}</span>
                        <button
                          type="button"
                          onClick={() => setChildren(children + 1)}
                          className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-50 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Booking Button */}
              {stay.acceptingBookings === false ? (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs font-poppins cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Bookings Paused</span>
                  </button>
                  <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/90 text-center font-medium leading-relaxed">
                    This stay is temporarily not accepting reservations. Please check back later or contact concierge.
                  </p>
                </div>
              ) : isRoomExceeded ? (
                <div className="space-y-2">
                  {alternativeRoom ? (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                      <div className="flex items-start gap-1.5">
                        <svg className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="text-xs">
                          <span className="font-bold">Room guest limit exceeded: </span>
                          <span>{selectedRoom?.name || 'Selected room'} fits up to {roomMaxGuests} guests ({totalGuests} selected).</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRoomId(alternativeRoom.roomId || alternativeRoom.id)}
                        className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Choose {alternativeRoom.name}</span>
                        <span className="opacity-90 font-normal">({alternativeRoom.maxGuests} max guests)</span>
                        <span>→</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-900 flex items-start gap-1.5">
                      <svg className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <div className="text-xs">
                        <span className="font-bold">Capacity exceeded: </span>
                        <span>Max capacity is {maxStayCapacity} guests. Please reduce guest count.</span>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs font-poppins cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Capacity Exceeded ({totalGuests} Guests)</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const queryParams = new URLSearchParams({
                      type: "stay",
                      id: String(stay.id || (stay as any).code || stayId),
                      title: stay.name,
                      roomId: selectedRoom?.roomId || selectedRoom?.id || selectedRoomId,
                      roomName: selectedRoom?.name || "Valley Master Suite",
                      checkIn: checkInDate,
                      checkOut: checkOutDate,
                      adults: String(adults),
                      children: String(children),
                      nights: String(nights),
                      price: String(roomPricePerNight),
                      discount: String(memberDiscountPercent),
                      cleaningFee: String(includeCleaningFee ? cleaningFee : 0),
                      gst: String(gstPercent),
                      image: allPhotos[0] || "",
                    });
                    router.push(`/checkout?${queryParams.toString()}`);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-xs sm:text-sm font-poppins shadow-md shadow-red-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Reserve &amp; Book Stay</span>
                  <span>→</span>
                </button>
              )}

              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-roboto inline-flex items-center justify-center gap-1">
                  <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Instant confirmation • Verified listing</span>
                </span>
              </div>

              {/* Transparent Price Breakdown Ledger */}
              <div className="border-t border-slate-100 pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>
                    ₹{roomPricePerNight.toLocaleString("en-IN")} × {nights} nights
                  </span>
                  <span className="font-semibold text-slate-900">₹{basePrice.toLocaleString("en-IN")}</span>
                </div>

                {memberDiscountPercent > 0 && discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Mahastays Member Discount ({memberDiscountPercent}%)</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {includeCleaningFee && cleaningFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Cleaning &amp; Sanitization Fee</span>
                    <span className="font-semibold text-slate-900">₹{cleaningFee.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {includeGst && gstPercent > 0 ? (
                  <div className="flex justify-between text-slate-600">
                    <span>Taxes &amp; GST ({gstPercent}%)</span>
                    <span className="font-semibold text-slate-900">₹{taxesAndGst.toLocaleString("en-IN")}</span>
                  </div>
                ) : null}

                <div className="border-t border-slate-200/80 pt-1.5 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-xs font-poppins">Total (INR)</span>
                  <span className="font-extrabold text-slate-900 text-lg font-poppins">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Trust & Guarantee Badges */}
              <div className="border-t border-slate-100 pt-2 flex flex-col gap-1 text-[10px] text-slate-500 font-roboto">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>100% Verified Stay with Safe Guarantee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Free Cancellation up to 48 hours</span>
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
              <span className="text-xs text-slate-500">/ {nights} nights</span>
            </div>
          </div>
          {stay.acceptingBookings === false ? (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs font-poppins cursor-not-allowed flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Bookings Paused</span>
            </button>
          ) : isRoomExceeded ? (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs font-poppins cursor-not-allowed"
            >
              Capacity Exceeded
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (stay.acceptingBookings === false) return;
                const queryParams = new URLSearchParams({
                  type: "stay",
                  id: String(stay.id || (stay as any).code || stayId),
                  title: stay.name,
                  roomId: selectedRoom?.roomId || selectedRoom?.id || selectedRoomId,
                  roomName: selectedRoom?.name || "Valley Master Suite",
                  checkIn: checkInDate,
                  checkOut: checkOutDate,
                  adults: String(adults),
                  children: String(children),
                  nights: String(nights),
                  price: String(roomPricePerNight),
                  acceptingBookings: String((stay as any).acceptingBookings !== false),
                  discount: String(memberDiscountPercent),
                  cleaningFee: String(includeCleaningFee ? cleaningFee : 0),
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
        videoUrl={(stay as any).videoUrl}
        title={`Video Tour: ${stay.name}`}
      />

      {/* Write Review Modal */}
      {writeReviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-poppins">Write a Guest Review</h3>
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
                    placeholder="e.g. Rahul Patil"
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
                    placeholder="Describe your stay, rooms, service, and amenities..."
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
