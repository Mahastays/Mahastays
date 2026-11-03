"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { DetailPageSkeleton } from "../../components/Skeletons";
import { getStayDetail, RoomType, StayDetail } from "../staysData";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPropertyByCode } from "@/store/slices/propertyslice";
import { useWishlistItem } from "@/lib/wishlist";

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

  const localStay = useMemo(() => getStayDetail(stayId), [stayId]);

  // Merge store data seamlessly with local rich fallback
  const stay: StayDetail = useMemo(() => {
    const isMatch = Boolean(
      selectedProperty &&
        (selectedProperty.id === stayId ||
          selectedProperty._id === stayId ||
          (selectedProperty as any).slug === stayId ||
          (selectedProperty as any).code === stayId)
    );
    if (isMatch && selectedProperty) {
      return {
        ...localStay,
        name: selectedProperty.name || localStay.name,
        price: selectedProperty.price || localStay.price,
        numericPrice: selectedProperty.numericPrice || localStay.numericPrice,
        inrPrice: selectedProperty.inrPrice || localStay.inrPrice,
        originalPrice: selectedProperty.originalPrice || localStay.originalPrice,
        description: selectedProperty.description || localStay.description,
        longDescription: selectedProperty.longDescription || localStay.longDescription,
        location: selectedProperty.location || localStay.location,
        city: selectedProperty.city || localStay.city,
        country: selectedProperty.country || localStay.country,
        images:
          selectedProperty.images && selectedProperty.images.length > 0
            ? selectedProperty.images.map((img) =>
                typeof img === "string"
                  ? { url: img, alt: "", isCover: false }
                  : { url: img.url, alt: img.alt || "", isCover: !!img.isCover }
              )
            : localStay.images,
        gallery:
          selectedProperty.gallery && selectedProperty.gallery.length > 0
            ? selectedProperty.gallery
            : localStay.gallery,
        rooms:
          selectedProperty.rooms && selectedProperty.rooms.length > 0
            ? (selectedProperty.rooms as unknown as RoomType[])
            : localStay.rooms,
        amenities:
          selectedProperty.amenities && selectedProperty.amenities.length > 0
            ? (selectedProperty.amenities as StayDetail["amenities"])
            : localStay.amenities,
        highlights:
          selectedProperty.highlights && selectedProperty.highlights.length > 0
            ? (selectedProperty.highlights as StayDetail["highlights"])
            : localStay.highlights,
        policies: (selectedProperty.policies as StayDetail["policies"]) || localStay.policies,
        attractions:
          selectedProperty.attractions && selectedProperty.attractions.length > 0
            ? (selectedProperty.attractions as StayDetail["attractions"])
            : localStay.attractions,
        ratingBreakdown:
          selectedProperty.ratingBreakdown && selectedProperty.ratingBreakdown.length > 0
            ? (selectedProperty.ratingBreakdown as StayDetail["ratingBreakdown"])
            : localStay.ratingBreakdown,
        host: (selectedProperty.host as StayDetail["host"]) || localStay.host,
        acceptingBookings: (selectedProperty as any)?.acceptingBookings !== undefined ? (selectedProperty as any).acceptingBookings : localStay.acceptingBookings !== false,
      };
    }
    return localStay;
  }, [localStay, selectedProperty, stayId]);

  // Gallery images combined
  const allPhotos = useMemo(() => {
    const list: string[] = [];
    if (stay.images) {
      stay.images.forEach((img) => {
        if (img.url && !list.includes(img.url)) list.push(img.url);
      });
    }
    if (stay.gallery) {
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
  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
    return stay.rooms[0]?.roomId || stay.rooms[0]?.id || "r5002-1";
  });
  const [checkInDate, setCheckInDate] = useState("2026-10-15");
  const [checkOutDate, setCheckOutDate] = useState("2026-10-18");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);
  const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false);
  const { isSaved: isWishlist, toggle: toggleWishlistAction } = useWishlistItem({
    id: stay.id,
    type: "property",
    title: stay.name,
    location: stay.location,
    price: stay.price,
    numericPrice: stay.numericPrice || stay.inrPrice,
    image: allPhotos[0] || "/hero-resort.jpg",
    rating: stay.rating,
    category: stay.type || "Villa",
    url: `/explore/${stay.id}`,
  });
  const [showShareToast, setShowShareToast] = useState(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);

  // Selected Room
  const selectedRoom: RoomType = useMemo(() => {
    return (
      stay.rooms.find((r) => r.roomId === selectedRoomId || r.id === selectedRoomId) ||
      stay.rooms[0]
    );
  }, [stay.rooms, selectedRoomId]);

  // Keep selectedRoom valid if rooms change
  useEffect(() => {
    if (stay.rooms && stay.rooms.length > 0) {
      const exists = stay.rooms.some(
        (r) => r.roomId === selectedRoomId || r.id === selectedRoomId
      );
      if (!exists) {
        setSelectedRoomId(stay.rooms[0].roomId || stay.rooms[0].id);
      }
    }
  }, [stay.rooms, selectedRoomId]);

  // Pricing calculations
  const roomPricePerNight = selectedRoom?.pricePerNight || stay.numericPrice || 22000;
  const originalRate = selectedRoom?.originalPrice || stay.originalPrice || 28000;
  const savingsPerNight = Math.max(0, originalRate - roomPricePerNight);

  const nights = useMemo(() => {
    const d1 = new Date(checkInDate);
    const d2 = new Date(checkOutDate);
    const diff = (d2.getTime() - d1.getTime()) / (1000 * 3600 * 24);
    return isNaN(diff) || diff <= 0 ? 3 : Math.round(diff);
  }, [checkInDate, checkOutDate]);

  const basePrice = roomPricePerNight * nights;
  const discountAmount = Math.round(basePrice * 0.08);
  const cleaningFee = 445;
  const gstRate = 0.18;
  const taxesAndGst = Math.round((basePrice - discountAmount + cleaningFee) * gstRate);
  const grandTotal = basePrice - discountAmount + cleaningFee + taxesAndGst;

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

  if (detailLoading && (!selectedProperty || (selectedProperty.id !== stayId && selectedProperty._id !== stayId))) {
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
            <Link href="/explore" className="hover:text-slate-900 transition-colors">
              Explore Stays
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-[320px]">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium font-poppins transition shadow-sm"
              aria-label="Share property"
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
            <span>Property link copied to clipboard!</span>
          </div>
        )}

        {/* Property Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold font-poppins bg-[#ea110d] text-white tracking-wide">
              {stay.badge || "Boutique Luxury"}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold font-poppins bg-slate-100 text-slate-700">
              {stay.type || "Private Villa"}
            </span>
            <div className="flex items-center gap-1 text-xs text-amber-500 font-bold font-poppins ml-1">
              <span>★</span>
              <span className="text-slate-800">{stay.rating || 4.96}</span>
              <span className="text-slate-400 font-normal">({stay.reviewsCount || 128} verified reviews)</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight font-poppins">
            {stay.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs sm:text-sm text-slate-600">
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea110d" strokeWidth="2.2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{stay.location || `${stay.city || "Panchgani"}, Maharashtra`}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Free cancellation up to 48 hrs</span>
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

            {/* Bottom Badges */}
            <div className="absolute bottom-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium font-poppins">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Featured View</span>
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

        {/* Two-Column Layout: Left Content & Right Sticky Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start mb-12">
          {/* ============================================================== */}
          {/* LEFT COLUMN: Host Card + Sticky Tabs Bar + Tab Panels (8 cols)  */}
          {/* ============================================================== */}
          <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-5">
            {/* Host Card */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#0B0A06] text-white font-extrabold text-base flex items-center justify-center font-poppins shrink-0 shadow-sm">
                  {stay.host?.name ? stay.host.name[0] : "K"}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-poppins flex items-center gap-1.5">
                    <span>Hosted by {stay.host?.name || "Kunal & Caretaker Ramesh"}</span>
                    <span className="w-4 h-4 rounded-full bg-[#ea110d] text-white flex items-center justify-center text-[10px] font-bold shrink-0" title="Verified Host">
                      ✓
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-roboto">
                    {stay.host?.role || "Property Owner & Manager"} • Host since 2019 • 64+ Verified Group Stays
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50/80 border border-red-100 text-xs font-bold text-[#ea110d] font-poppins shrink-0">
                <span className="text-[#ea110d] font-bold">✓</span>
                <span>Instant Booking Confirmed</span>
              </div>
            </div>

            {/* Quick 4 Highlights Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  title: "Infinity Pool Deck",
                  desc: "Heated pool with valley view",
                  icon: (
                    <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 13c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0M2 18c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0M4 7h4m-2-3v6m10-3h4m-2-3v6" />
                    </svg>
                  ),
                },
                {
                  title: "Private Chef",
                  desc: "On-demand dining & BBQ",
                  icon: (
                    <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v7a2 2 0 002 2h0a2 2 0 002-2V3M8 3v18M18 3v18M15 3h6v4a3 3 0 01-3 3h0a3 3 0 01-3-3V3z" />
                    </svg>
                  ),
                },
                {
                  title: "Butler Service",
                  desc: "Personalised assistance",
                  icon: (
                    <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v2m-6 9h12a1 1 0 001-1 7 7 0 00-14 0 1 1 0 001 1zm-2 3h16a1 1 0 010 2H4a1 1 0 010-2z" />
                    </svg>
                  ),
                },
                {
                  title: "High-Speed Wi-Fi",
                  desc: "Stay connected 250 Mbps",
                  icon: (
                    <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.393 9.393c5.857-5.857 15.355-5.857 21.213 0" />
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
                  id: "rooms",
                  label: "Rooms & Suites",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M5 18h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
                  label: "Facilities",
                  icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  ),
                },
                {
                  id: "rules",
                  label: "House Rules",
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
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
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
            {/* TAB 1: Rooms & Suites (Default Open)                            */}
            {/* ============================================================== */}
            {(activeDetailTab === "rooms" || activeDetailTab === "all") && (
              <div ref={accommodationRef} id="rooms" className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-poppins">
                      Available Rooms &amp; Suites
                    </h2>
                    <p className="text-xs text-slate-500 font-roboto mt-0.5">
                      Select your preferred accommodation type for live transparent price calculation
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-poppins">
                    {stay.rooms.length} Options Available
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {stay.rooms.map((room) => {
                    const rId = room.roomId || room.id;
                    const isSelected = selectedRoomId === rId;
                    const rPhotos = (room as any).photos && (room as any).photos.length > 0 ? (room as any).photos : (room as any).images && (room as any).images.length > 0 ? (room as any).images : allPhotos;

                    return (
                      <div
                        key={rId}
                        className={`rounded-2xl p-4 sm:p-5 transition-all bg-white border ${
                          isSelected
                            ? "border-[#ea110d] ring-2 ring-red-500/20 shadow-md"
                            : "border-slate-100 hover:border-slate-200 shadow-sm"
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Room Photo */}
                          <div className="md:col-span-4 relative h-44 sm:h-48 rounded-xl overflow-hidden bg-slate-100 group">
                            <Image
                              src={rPhotos[0] || "/hero-resort.jpg"}
                              alt={room.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 320px"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {room.badge && (
                              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#0B0A06]/80 backdrop-blur-sm text-white text-[10px] font-bold font-poppins">
                                {room.badge}
                              </span>
                            )}
                          </div>

                          {/* Room Specs & Details */}
                          <div className="md:col-span-5 flex flex-col justify-between h-full">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                                  {room.name}
                                </h3>
                              </div>
                              <p className="text-xs text-slate-500 font-roboto line-clamp-2 mb-3">
                                {room.tagline || (room as any).description}
                              </p>

                              {/* Key Specs Pills */}
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-3">
                                {room.size && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700">
                                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                    <span>{room.size}</span>
                                  </span>
                                )}
                                {room.bedType && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700">
                                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v11m0-4h18m0-7v11M7 10a2 2 0 110-4 2 2 0 010 4zm7 0h5a2 2 0 012 2v2H12v-2a2 2 0 012-2z" />
                                    </svg>
                                    <span>{room.bedType}</span>
                                  </span>
                                )}
                                {(room as any).view && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700">
                                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{(room as any).view}</span>
                                  </span>
                                )}
                                {room.maxGuests && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700">
                                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Up to {room.maxGuests} Guests</span>
                                  </span>
                                )}
                              </div>

                              {/* Features with Checkmarks */}
                              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
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
                          <div className="md:col-span-3 flex flex-col md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                            <div className="md:text-right mb-3">
                              <span className="text-xs text-slate-400 line-through block font-medium">
                                ₹{(room.originalPrice || Math.round(room.pricePerNight * 1.25)).toLocaleString("en-IN")}
                              </span>
                              <div className="flex items-baseline md:justify-end gap-1">
                                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-poppins">
                                  ₹{room.pricePerNight.toLocaleString("en-IN")}
                                </span>
                                <span className="text-xs text-slate-500">/ night</span>
                              </div>
                              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                                + ₹{taxesAndGst.toLocaleString("en-IN")} taxes &amp; fees
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedRoomId(rId)}
                              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold font-poppins transition-all shadow-sm ${
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
            {(activeDetailTab === "about" || activeDetailTab === "all") && (
              <div className="flex flex-col gap-4 sm:gap-5">
                <div id="about" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 flex flex-col justify-between">
                      <h3 className="text-xl font-bold text-slate-900 font-poppins mb-3">
                        About this {stay.type || "Resort & Villa"}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-roboto mb-5">
                        {stay.longDescription || stay.description}
                      </p>

                      {/* 4 Info Pills */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Check-in</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            {stay.policies?.checkInTime || (stay.policies as any)?.checkIn || "2:00 PM"}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Check-out</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            {stay.policies?.checkOutTime || (stay.policies as any)?.checkOut || "11:00 AM"}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Property Type</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            {stay.type || "Luxury Resort"}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Ideal For</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">Family &amp; Groups</div>
                        </div>
                      </div>
                    </div>

                    {/* Video Tour Banner (Right side of card - 5 cols) */}
                    <div
                      onClick={() => setVideoModalOpen(true)}
                      className="md:col-span-5 relative rounded-2xl overflow-hidden h-48 sm:h-52 bg-slate-900 group cursor-pointer border border-slate-200"
                    >
                      <Image
                        src={allPhotos[1] || allPhotos[0]}
                        alt="Video Tour Preview"
                        fill
                        sizes="(max-width: 768px) 100vw, 420px"
                        className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      <div className="absolute bottom-3 right-3">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-bold font-poppins shadow-lg backdrop-blur-sm group-hover:scale-105 transition-transform">
                          <span className="text-[#ea110d] text-xs">▶</span>
                          <span>Watch Video Tour</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Highlights & Key Features */}
                <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 font-poppins">
                      Highlights &amp; Key Features
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleTabChange("facilities")}
                      className="text-xs font-bold text-[#ea110d] hover:underline font-poppins"
                    >
                      View all facilities →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(stay.highlights || [
                      { title: "Infinity Pool Deck", description: "Heated pool with valley view", icon: "pool" },
                      { title: "Private Chef", description: "On-demand dining & barbecue", icon: "chef" },
                      { title: "Butler Service", description: "Personalised assistance", icon: "bell" },
                      { title: "High-Speed Wi-Fi", description: "Stay connected 250 Mbps", icon: "wifi" },
                      { title: "Billiards Room", description: "Indoor entertainment", icon: "game" },
                      { title: "BBQ Grill", description: "Outdoor sunset dining", icon: "fire" },
                      { title: "Smart TV", description: "Streaming access & Netflix", icon: "tv" },
                      { title: "Private Parking", description: "On-site secure parking", icon: "car" },
                    ]).map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 font-poppins">{item.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc || (item as any).description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: Facilities & Amenities                                   */}
            {/* ============================================================== */}
            {(activeDetailTab === "facilities" || activeDetailTab === "all") && (
              <div id="facilities" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-poppins">
                    What this Resort Offers
                  </h3>
                  <p className="text-xs text-slate-500 font-roboto mt-0.5">
                    Premium amenities and resort services curated for uninterrupted comfort
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    {
                      category: "Luxury & Recreation",
                      items: ["Private Infinity Pool (Heated)", "Jacuzzi & Sun Deck", "Private Lawns & Orchard Walk", "Bonfire Pit with Seating"],
                    },
                    {
                      category: "Dining & Culinary",
                      items: ["Private Chef on Demand", "Open-air Barbecue Station", "Complimentary Gourmet Breakfast", "24/7 Tea & Coffee Station"],
                    },
                    {
                      category: "Entertainment & Tech",
                      items: ["High-Speed Wi-Fi (250 Mbps)", "Cinema Projector & Smart TVs", "Billiards & Table Tennis", "Board Games & Books Library"],
                    },
                    {
                      category: "Comfort & Utilities",
                      items: ["100% Power Backup (Inverter & Gen)", "Central Air Conditioning", "Hot Water 24/7 (Solar + Geyser)", "Daily Housekeeping Service"],
                    },
                    {
                      category: "Safety & Security",
                      items: ["24/7 Resident Caretaker", "CCTV in Outdoor Common Areas", "First Aid & Doctor on Call", "Gated Compound & Private Parking"],
                    },
                    {
                      category: "Family & Pet Friendly",
                      items: ["Kids Play Area & High Chair", "Pet-friendly Outdoor Gardens", "Baby Crib on Request", "Elderly-accessible Ground Floor Suites"],
                    },
                  ].map((cat, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-xs font-bold text-slate-900 font-poppins mb-2.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ea110d]" />
                        <span>{cat.category}</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {cat.items.map((it, itIdx) => (
                          <li key={itIdx} className="flex items-center gap-2">
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
            {(activeDetailTab === "rules" || activeDetailTab === "all") && (
              <div id="rules" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-poppins mb-1">
                    House Rules &amp; Policies
                  </h3>
                  <p className="text-xs text-slate-500 font-roboto">
                    Important stay guidelines to guarantee a pleasant, respectful experience
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Check-in &amp; Check-out</div>
                      <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                        <div>Check-in: <strong>1:00 PM onwards</strong></div>
                        <div>Check-out: <strong>By 10:00 AM</strong></div>
                        <div className="text-[11px] text-slate-400">Early check-in subject to availability</div>
                      </div>
                    </div>
                  </div>

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
                        Full refund up to 48 hours before check-in. 50% refund thereafter.
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Suitability &amp; Rules</div>
                      <ul className="text-xs text-slate-600 mt-1 space-y-0.5">
                        <li>• Pets allowed (on request)</li>
                        <li>• Smoking in outdoor garden areas only</li>
                        <li>• Group &amp; bachelor friendly</li>
                        <li>• Max 12 guests per estate</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-poppins">Guidelines &amp; Address</div>
                      <ul className="text-xs text-slate-600 mt-1 space-y-0.5">
                        <li>• Quiet hours: 10:00 PM – 7:00 AM</li>
                        <li>• Government ID required at check-in</li>
                        <li>• Plot 12, Venna Lake Road, Panchgani</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 5: Location & Map                                           */}
            {/* ============================================================== */}
            {(activeDetailTab === "location" || activeDetailTab === "all") && (
              <div id="location" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 font-poppins">
                      Location &amp; Nearby Attractions
                    </h3>
                    <p className="text-xs text-slate-500 font-roboto mt-0.5">
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

                {/* Map Preview Banner */}
                <div className="relative rounded-2xl overflow-hidden h-56 sm:h-64 bg-slate-100 border border-slate-200">
                  <Image
                    src="/panchgani.jpg"
                    alt="Map Location View"
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
                      {stay.name}
                    </div>
                  </div>
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
            {(activeDetailTab === "reviews" || activeDetailTab === "all") && (
              <div id="reviews" className="bg-white rounded-[26px] p-6 sm:p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 font-poppins flex items-center gap-2">
                      <span>Guest Reviews &amp; Ratings</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                        ★ {stay.rating || 4.96} / 5.0
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-roboto mt-0.5">
                      Based on {stay.reviewsCount || 128} verified group and family stays
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

                {/* Rating Categories Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Cleanliness", score: "4.9" },
                    { label: "Accuracy", score: "5.0" },
                    { label: "Communication", score: "4.9" },
                    { label: "Location", score: "4.8" },
                    { label: "Check-in", score: "5.0" },
                    { label: "Value for Money", score: "4.9" },
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

                {/* Review Cards */}
                <div className="space-y-4 pt-2">
                  {[
                    {
                      name: "Abhishek Kulkarni",
                      date: "September 2026",
                      rating: 5,
                      room: "Entire 4BHK Villa",
                      comment:
                        "Exceeded all expectations! The private infinity pool overlooking the valley is sensational. Caretaker Ramesh arranged delicious Maharashtrian barbecue dinners. Absolutely booking again.",
                    },
                    {
                      name: "Pooja & Rohan Sharma",
                      date: "August 2026",
                      rating: 5,
                      room: "Panoramic Sunset Suite",
                      comment:
                        "The cleanest and most aesthetic property in Panchgani. High-speed Wi-Fi allowed smooth remote work during the day, followed by starry bonfire nights.",
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
                            <div className="text-[10px] text-slate-400 font-roboto">{rev.date} • {rev.room}</div>
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
              {/* Top Rate Header */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-poppins">
                    ₹{roomPricePerNight.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-500 font-normal"> / night</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 line-through block font-poppins">
                    ₹{originalRate.toLocaleString("en-IN")}
                  </span>
                  {savingsPerNight > 0 && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold font-poppins border border-emerald-200">
                      Save ₹{savingsPerNight.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              {/* Selected Accommodation Box (Soft Pink Tint) */}
              <div
                onClick={() => handleTabChange("rooms")}
                className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 hover:bg-rose-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#ea110d] tracking-wider font-poppins">
                    SELECTED ACCOMMODATION
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 font-poppins truncate max-w-[210px]">
                    {selectedRoom?.name || "Entire 4BHK Luxury Villa"}
                  </div>
                </div>
                <span className="text-xs font-bold text-[#ea110d] font-poppins">Change →</span>
              </div>

              {/* Date Selectors (2 columns with Calendar Icons) */}
              <div className="grid grid-cols-2 rounded-xl border border-slate-200 divide-x divide-slate-200 overflow-hidden bg-slate-50/50">
                <div className="p-2.5 flex items-start gap-2">
                  <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Check-in</label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-hidden cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-2.5 flex items-start gap-2">
                  <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Check-out</label>
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Guests</div>
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
              {stay.acceptingBookings === false ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-sm font-poppins cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Bookings Paused</span>
                  </button>
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/90 text-center font-medium leading-relaxed">
                    This stay is temporarily not accepting reservations. Please check back later or contact our 24/7 concierge desk.
                  </p>
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
                      image: allPhotos[0] || "",
                    });
                    router.push(`/checkout?${queryParams.toString()}`);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-sm font-poppins shadow-lg shadow-red-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <span>Reserve &amp; Book Stay</span>
                  <span>→</span>
                </button>
              )}

              <div className="text-center">
                <span className="text-[11px] text-slate-500 font-roboto inline-flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>You won&apos;t be charged yet • Instant confirmation</span>
                </span>
              </div>

              {/* Transparent Price Breakdown Ledger */}
              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>
                    ₹{roomPricePerNight.toLocaleString("en-IN")} × {nights} nights
                  </span>
                  <span className="font-semibold text-slate-900">₹{basePrice.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Mahastays Member Discount (8%)</span>
                  <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Cleaning &amp; Sanitization Fee</span>
                  <span className="font-semibold text-slate-900">₹{cleaningFee.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Taxes &amp; GST (18%)</span>
                  <span className="font-semibold text-slate-900">₹{taxesAndGst.toLocaleString("en-IN")}</span>
                </div>

                <div className="border-t border-slate-200/80 pt-2 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm font-poppins">Total (INR)</span>
                  <span className="font-extrabold text-slate-900 text-xl font-poppins">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Trust & Guarantee Badges */}
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-[11px] text-slate-500 font-roboto">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>100% Verified Stay with Safe Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Free Cancellation up to 48 hours before check-in</span>
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
              <span className="text-sm font-bold font-poppins">Video Tour: {stay.name}</span>
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
                alt="Video Tour"
                fill
                className="object-cover opacity-60"
              />
              <div className="relative z-10 text-center text-white px-4">
                <div className="w-16 h-16 rounded-full bg-[#ea110d] text-white flex items-center justify-center text-2xl mx-auto shadow-2xl mb-2">
                  ▶
                </div>
                <div className="text-sm font-bold font-poppins">Curated 4K Drone &amp; Villa Walkthrough</div>
                <div className="text-xs text-slate-300 mt-1">Available exclusively to confirmed guests upon reservation</div>
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
              <h3 className="text-lg font-bold text-slate-900 font-poppins">Write a Guest Review</h3>
              <button
                onClick={() => setWriteReviewOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Share your genuine feedback for {stay.name} to help other travelers.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Patil"
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
                  placeholder="Write your experience with rooms, pool, host and amenities..."
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
