"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutUser, fetchCurrentUser, updateUserProfile, changeUserPassword } from "@/store/authSlice";
import api from "@/lib/api";
import { toast } from "../../components/ui/Toast";
import { useFavoritesList } from "@/lib/wishlist";
import { FileText, Download, Eye, EyeOff, Lock, KeyRound, ShieldCheck } from "lucide-react";
import BookingInvoiceModal, { BookingInvoiceData } from "../components/booking/BookingInvoiceModal";

interface BookingItem {
  id: string;
  bookingType: "stay" | "package" | "experience";
  bookingReference: string;
  invoiceNumber?: string;
  title: string;
  dates: string;
  guests: string;
  roomOrTierName?: string;
  amount: number;
  status: string;
  paymentStatus: string;
  image?: string;
  createdAt?: string;
  pricing?: any;
}

// Client-side image compression helper
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);

  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(true);
  const [bookingFilter, setBookingFilter] = useState<string>("all");
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<BookingInvoiceData | null>(null);

  // Favorites Hook & Filter
  const { favorites, isLoading: loadingFavorites, remove: removeFavItem } = useFavoritesList();
  const [favoriteFilter, setFavoriteFilter] = useState<string>("all");

  const filteredFavorites = React.useMemo(() => {
    if (favoriteFilter === "all") return favorites;
    return favorites.filter((item) => item.type === favoriteFilter);
  }, [favorites, favoriteFilter]);

  // Settings / Edit Profile Form State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDiet, setEditDiet] = useState("");
  const [editLang, setEditLang] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security / Update Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync edit form with user state
  useEffect(() => {
    if (user) {
      setEditName(user.fullName || "");
      const currentPhone =
        user.phone?.nationalNumber ||
        user.phoneNumber ||
        (typeof user.phone === "string" ? user.phone : "");
      setEditPhone(currentPhone ? String(currentPhone).replace(/\D/g, "").slice(0, 10) : "");
      setEditDiet(user.preferences?.dietaryPreference || "");
      setEditLang(user.preferences?.preferredLanguage || "");
      setAvatarPreview(user.avatarUrl || "");
    }
  }, [user]);

  // Check auth and fetch bookings
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("mahastays_token");
      if (!token && !loading) {
        router.push("/login?redirect=/profile");
        return;
      }
    }

    // Refresh profile from backend
    dispatch(fetchCurrentUser());

    // Fetch user bookings history
    api
      .get("/bookings/user/history")
      .then((res) => {
        const raw = res.data?.data?.items || res.data?.data || [];
        const formatted: BookingItem[] = raw.map((b: any) => {
          const type = b.bookingType || b.type || (b.stay ? "stay" : b.package ? "package" : "experience");
          let title = "Mahastays Reservation";
          let dates = "Upcoming";
          let guests = "1 Guest";
          let image = "/hero-resort.jpg";

          if (type === "stay") {
            title = b.property?.name || b.title || b.propertyName || "Luxury Resort & Spa";
            dates = `${b.checkInDate || b.schedule?.checkInDate || "Check-in"} – ${b.checkOutDate || b.schedule?.checkOutDate || "Check-out"}`;
            guests = `${b.adults || b.guests?.adults || 2} Adults, ${b.roomQuantity || b.roomsCount || b.room?.quantity || 1} Room`;
            image = b.property?.images?.[0]?.url || b.image || image;
          } else if (type === "package") {
            title = b.package?.title || b.title || b.packageTitle || "Curated Getaway Package";
            dates = `${b.startDate || "Start Date"}${b.endDate ? ` – ${b.endDate}` : ""}`;
            guests = `${b.totalTravelers || b.travelers?.totalTravelers || b.totalGuests || b.adults || 2} Travelers`;
            image = b.package?.thumbnail || b.package?.images?.[0] || b.image || image;
          } else {
            title = b.experience?.title || b.title || b.experienceTitle || "Guided Experience";
            dates = `${b.activityDate || "Scheduled Date"}${b.slotTime || b.selectedSlot?.time ? ` (${b.slotTime || b.selectedSlot?.time})` : ""}`;
            guests = `${b.totalParticipants || b.participants?.totalParticipants || b.participantsCount || b.adults || 1} Participants`;
            image = b.experience?.image || b.image || image;
          }

          const roomOrTierName =
            b.roomName ||
            b.room?.roomName ||
            b.tierName ||
            b.tier?.tierName ||
            b.selectedTier?.name ||
            undefined;

          const rawAmount =
            b.grandTotalInr ??
            b.pricing?.grandTotalInr ??
            b.pricing?.grandTotal ??
            b.totalAmountInr ??
            b.amountInr ??
            b.amount ??
            b.payment?.amountInr ??
            (b.pricing?.roomPricePerNight && (b.nights || b.schedule?.nights)
              ? b.pricing.roomPricePerNight * (b.nights || b.schedule?.nights)
              : 0);

          const amount = Number(rawAmount) || 0;

          return {
            id: b.id,
            bookingType: type,
            bookingReference: b.bookingReference || `MS-${b.id?.slice(-6)?.toUpperCase()}`,
            invoiceNumber: b.invoiceNumber,
            title,
            dates,
            guests,
            roomOrTierName,
            amount,
            status: b.bookingStatus || "confirmed",
            paymentStatus: b.paymentStatus || "captured",
            image,
            createdAt: b.createdAt,
            pricing: b.pricing,
          };
        });
        setBookings(formatted);
      })
      .catch(() => {
        setBookings([]);
      })
      .finally(() => {
        setLoadingBookings(false);
      });
  }, [dispatch, router, loading]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.info("Member ID copied to clipboard");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPEG, PNG, WebP)", "Invalid File");
      return;
    }
    try {
      const compressed = await compressImage(file);
      setAvatarPreview(compressed);
      toast.info("Image selected! Click 'Save Profile Changes' to persist.");
    } catch {
      toast.error("Failed to process image.", "Image Error");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.warning("Full legal name cannot be empty.", "Name Required");
      return;
    }

    setIsSaving(true);
    try {
      const cleanDigits = editPhone.replace(/\D/g, "").slice(0, 10);
      const payload: any = {
        fullName: editName.trim(),
        avatarUrl: avatarPreview || null,
      };

      if (cleanDigits) {
        payload.phone = {
          countryCode: "+91",
          nationalNumber: cleanDigits,
        };
      }

      if (editDiet || editLang) {
        payload.preferences = {
          ...(editDiet ? { dietaryPreference: editDiet } : {}),
          ...(editLang ? { preferredLanguage: editLang } : {}),
          currency: "INR",
        };
      }

      await dispatch(updateUserProfile(payload)).unwrap();
      toast.success("Your profile details and avatar have been saved successfully!", "Changes Saved");
      setActiveTab("overview");
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "Failed to update profile", "Update Error");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.warning("Please enter a new password.", "Missing Password");
      return;
    }
    if (newPassword.length < 8) {
      toast.warning("New password must be at least 8 characters long.", "Password Too Short");
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      toast.warning("New password must contain both letters and numbers.", "Weak Password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.", "Password Mismatch");
      return;
    }

    setIsChangingPassword(true);
    try {
      await dispatch(
        changeUserPassword({
          currentPassword,
          newPassword,
        })
      ).unwrap();
      toast.success("Your password has been updated successfully!", "Password Changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = typeof err === "string" ? err : err?.message || "Failed to update password.";
      toast.error(msg, "Password Update Failed");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "all") return true;
    return b.bookingType === bookingFilter;
  });

  const memberTier = (user?.membership?.tier || user?.membershipTier || "Gold").toUpperCase();
  const isEmailVerified = Boolean(user?.isEmailVerified ?? user?.verification?.isEmailVerified);
  const isPhoneVerified = Boolean(user?.isPhoneVerified ?? user?.phone?.isVerified ?? user?.verification?.isPhoneVerified);

  // Extract phone ONLY if stored in DB
  const rawPhone =
    user?.phone?.nationalNumber ||
    user?.phoneNumber ||
    (typeof (user?.phone as any) === "string" && !(user?.phone as any).includes("Object") ? (user?.phone as any) : null);
  const formattedPhone = rawPhone
    ? `${user?.phone?.countryCode || "+91"} ${String(rawPhone).replace(/\D/g, "").slice(0, 10)}`
    : null;

  // Language & currency strictly from DB, else vacant
  const langMap: Record<string, string> = {
    en: "English (EN)",
    hi: "Hindi (HI)",
    mr: "Marathi (MR)",
  };
  const storedLangCode = user?.preferences?.preferredLanguage;
  const preferredLangDisplay = storedLangCode ? langMap[storedLangCode] || storedLangCode.toUpperCase() : null;
  const storedCurrency = user?.preferences?.currency ? `${user.preferences.currency} (₹)` : null;
  const langCurrencyDisplay =
    preferredLangDisplay && storedCurrency
      ? `${preferredLangDisplay} · ${storedCurrency}`
      : preferredLangDisplay || storedCurrency || null;

  // Dietary preference strictly from DB, else vacant
  const dietMap: Record<string, string> = {
    veg: "Pure Vegetarian",
    "non-veg": "Non-Vegetarian",
    jain: "Jain Friendly",
    vegan: "Vegan",
  };
  const storedDietCode = user?.preferences?.dietaryPreference;
  const dietaryPrefDisplay = storedDietCode ? dietMap[storedDietCode] || storedDietCode : null;

  // Registered date
  const registeredDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen =- flex flex-col font-roboto">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-32 lg:pt-34 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* ══════════════════════════════════════════════════════════════ */}
        {/* HERO BANNER: Warm Sunset Mountain Landscape matching image   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div
          className="relative rounded-[28px] overflow-hidden shadow-xl mb-8 p-6 sm:p-8 text-white border border-rose-950/20"
          style={{
            background:
              "linear-gradient(135deg, rgba(30, 12, 14, 0.92) 0%, rgba(55, 18, 22, 0.85) 35%, rgba(130, 38, 28, 0.78) 70%, rgba(185, 58, 22, 0.72) 100%), url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80') center/cover no-repeat",
          }}
        >
          {/* Subtle Mountain Landscape Silhouette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Avatar + Details */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Rounded Square Avatar */}
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-[#ea110d] text-white flex items-center justify-center font-extrabold text-3xl sm:text-4xl shadow-lg shrink-0 overflow-hidden border-2 border-white/20">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-poppins select-none">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}
                  </span>
                )}
              </div>

              {/* User Identity Info */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-poppins">
                    {user?.fullName || "Abhishek Kumar"}
                  </h1>
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#fffaea] text-[#966000] shadow-xs flex items-center gap-1.5 font-poppins">
                    <svg className="w-3.5 h-3.5 fill-current text-amber-500" viewBox="0 0 24 24">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                    </svg>
                    <span>{memberTier === "STANDARD" ? "Gold" : memberTier} Member</span>
                  </span>
                </div>

                {/* Contact row: Email & Phone (Only if in DB) */}
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-white/90 font-medium">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-white/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{user?.email || "meaviishek@gmail.com"}</span>
                  </span>
                  {formattedPhone && (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-white/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{formattedPhone}</span>
                    </span>
                  )}
                </div>

                {/* Member ID with Copy */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(user?.userCode || "USR-10005")}
                    className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition cursor-pointer font-medium"
                    title="Click to copy Member ID"
                  >
                    <span>Member ID: {user?.userCode || "USR-10005"}</span>
                    <span className="text-white/70 hover:text-white flex items-center">
                      {copiedCode ? (
                        <span className="text-emerald-300 font-bold">✓ Copied</span>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Floating Member Benefits Card */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 flex items-start gap-3.5 max-w-sm shadow-md">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/30 text-amber-300 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                </svg>
              </div>
              <div className="space-y-0.5 flex-1">
                <span className="text-[11px] text-white/80 block leading-tight font-medium">
                  Your member benefits
                </span>
                <span className="text-sm font-bold text-white block font-poppins leading-snug">
                  8% off on every booking
                </span>
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("club")}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg border border-white/20 transition cursor-pointer"
                  >
                    <span>View Benefits →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TABS NAVIGATION                                              */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-4 sm:gap-8 border-b border-slate-200 mb-8 overflow-x-auto pb-1 scrollbar-none font-poppins text-sm font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-3 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === "overview"
                ? "text-[#ea110d] border-b-2 border-[#ea110d]"
                : "text-slate-600 hover:text-slate-900 border-b-2 border-transparent"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Overview &amp; Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`pb-3 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === "bookings"
                ? "text-[#ea110d] border-b-2 border-[#ea110d]"
                : "text-slate-600 hover:text-slate-900 border-b-2 border-transparent"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-10 0h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
            </svg>
            <span>My Bookings</span>
            {bookings.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 text-[#ea110d] font-bold">
                {bookings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("favorites")}
            className={`pb-3 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === "favorites"
                ? "text-[#ea110d] border-b-2 border-[#ea110d]"
                : "text-slate-600 hover:text-slate-900 border-b-2 border-transparent"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>Saved Favorites</span>
            {favorites.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 text-[#ea110d] font-bold">
                {favorites.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("club")}
            className={`pb-3 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === "club"
                ? "text-[#ea110d] border-b-2 border-[#ea110d]"
                : "text-slate-600 hover:text-slate-900 border-b-2 border-transparent"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span>Membership Privileges</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`pb-3 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === "settings"
                ? "text-[#ea110d] border-b-2 border-[#ea110d]"
                : "text-slate-600 hover:text-slate-900 border-b-2 border-transparent"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings &amp; Edit Profile</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 1: OVERVIEW & PROFILE (Matching image)                     */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Personal Information Card */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                {/* Header with Edit Button */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-poppins">
                      Personal Information
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Your identity and verified contact channels on Mahastays.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#ea110d] text-xs font-bold font-poppins transition cursor-pointer shadow-2xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>Edit Profile</span>
                  </button>
                </div>

                {/* 2-Column Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-xs">
                  {/* Full Legal Name */}
                  <div className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-poppins">
                        Full Legal Name
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5 font-poppins">
                        {user?.fullName || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-poppins">
                        Email Address
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold text-slate-900">
                          {user?.email || "—"}
                        </span>
                        {isEmailVerified && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Phone Number - Only shown if stored in DB */}
                  <div className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-poppins">
                        Phone Number
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold text-slate-900">
                          {formattedPhone || "—"}
                        </span>
                        {formattedPhone && isPhoneVerified && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preferred Language & Currency - Only shown if stored in DB */}
                  <div className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    </svg>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-poppins">
                        Preferred Language &amp; Currency
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {langCurrencyDisplay || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Dietary Preferences - Only shown if stored in DB */}
                  <div className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v5a2 2 0 002 2h3zm0 0v7" />
                    </svg>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-poppins">
                        Dietary Preferences
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {dietaryPrefDisplay || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Account Registered */}
                  <div className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-poppins">
                        Account Registered
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {registeredDate || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Club GOLD Tier Card */}
              <div className="lg:col-span-4 rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-rose-50/70 via-white to-rose-100/35 border border-rose-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-5">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-[#ea110d] flex items-center justify-center shadow-2xs mb-3">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 font-poppins">
                    Club {memberTier === "STANDARD" ? "GOLD" : memberTier} Tier
                  </h3>
                  <span className="text-xs font-bold text-[#ea110d] block mt-0.5 font-poppins">
                    Privilege Membership Active
                  </span>

                  <ul className="space-y-2.5 mt-4 text-xs text-slate-700 font-medium">
                    <li className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-[#ea110d] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Guaranteed 8% discount on every stay and package</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-[#ea110d] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Priority early check-in &amp; late check-out</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-[#ea110d] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Complimentary sunrise trek or boating ticket</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-[#ea110d] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Dedicated 24x7 WhatsApp concierge helpline</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/explore"
                  className="w-full py-3 px-4 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-xs text-center shadow-[0_4px_16px_rgba(234,17,13,0.3)] hover:shadow-[0_6px_20px_rgba(234,17,13,0.4)] transition cursor-pointer font-poppins block"
                >
                  Use My 8% Discount Now →
                </Link>
              </div>
            </div>

            {/* Bottom Row: 2 Cards (Shortcuts & Concierge) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Ready for your next hill-station getaway? */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-poppins">
                    Ready for your next hill-station getaway?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Browse verified lakeside pool resorts, heritage villas, and sunrise mountain treks.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  <Link
                    href="/explore"
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-rose-50/60 border border-slate-200/80 hover:border-rose-200 text-slate-800 hover:text-[#ea110d] transition text-center flex items-center justify-center gap-2 font-bold text-xs font-poppins group"
                  >
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-[#ea110d] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Explore Stays</span>
                  </Link>

                  <Link
                    href="/packages"
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-rose-50/60 border border-slate-200/80 hover:border-rose-200 text-slate-800 hover:text-[#ea110d] transition text-center flex items-center justify-center gap-2 font-bold text-xs font-poppins group"
                  >
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-[#ea110d] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>View Packages</span>
                  </Link>

                  <Link
                    href="/experiences"
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-rose-50/60 border border-slate-200/80 hover:border-rose-200 text-slate-800 hover:text-[#ea110d] transition text-center flex items-center justify-center gap-2 font-bold text-xs font-poppins group"
                  >
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-[#ea110d] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18L14 7l-4 6-3-4-4 11z" />
                    </svg>
                    <span>Experiences</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setActiveTab("favorites")}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-rose-50/60 border border-slate-200/80 hover:border-rose-200 text-slate-800 hover:text-[#ea110d] transition text-center flex items-center justify-center gap-2 font-bold text-xs font-poppins group cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-[#ea110d] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Saved ({favorites.length})</span>
                  </button>
                </div>
              </div>

              {/* Customer Concierge & Care */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-rose-600 font-bold text-base mb-1">
                    <svg className="w-5 h-5 text-[#ea110d] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a9 9 0 0118 0v6M3 18a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5zm18 0a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h1v5z" />
                    </svg>
                    <h3 className="text-base font-bold text-slate-900 font-poppins">
                      Customer Concierge &amp; Care
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Have an inquiry regarding an upcoming booking or itinerary change? Our guest desk is available 24x7.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Concierge Helpline</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://wa.me/919405419021"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-extrabold text-emerald-600 hover:underline font-poppins"
                    >
                      WA: +91 94054 19021
                    </a>
                    <span className="text-slate-300">·</span>
                    <a
                      href="tel:+917741002157"
                      className="text-xs font-extrabold text-[#ea110d] hover:underline font-poppins"
                    >
                      Call: +91 7741002157
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 4: SETTINGS & EDIT PROFILE                                */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#ea110d] block font-poppins">
                  Account Management
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-poppins">
                  Edit Profile &amp; Preferences
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Profile Avatar Upload / Preview */}
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-[#ea110d] text-white flex items-center justify-center font-black text-3xl shrink-0 overflow-hidden shadow-md">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{editName ? editName.charAt(0).toUpperCase() : "A"}</span>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h4 className="text-xs font-bold text-slate-800 font-poppins">
                    Profile Photo
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Upload an avatar picture. Supports PNG, JPG or WebP (auto-compressed).
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold font-poppins shadow-xs transition cursor-pointer"
                    >
                      Choose Photo
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => setAvatarPreview("")}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#ea110d] text-xs font-bold font-poppins transition cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Legal Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Abhishek Kumar"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#ea110d] bg-slate-50/40"
                />
              </div>

              {/* Mobile Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                  Mobile Number (Optional)
                </label>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50/40 focus-within:border-[#ea110d]">
                  <span className="px-3 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 border-r border-slate-200">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setEditPhone(digits);
                    }}
                    placeholder="98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none bg-transparent"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Leave blank if you do not wish to store a phone number.
                </span>
              </div>

              {/* Dietary Preferences */}
              <div>
                <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                  Dietary Preferences
                </label>
                <select
                  value={editDiet}
                  onChange={(e) => setEditDiet(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#ea110d] bg-slate-50/40 cursor-pointer"
                >
                  <option value="">— Not specified / Leave vacant —</option>
                  <option value="veg">Pure Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                  <option value="jain">Jain Friendly</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>

              {/* Preferred Language */}
              <div>
                <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                  Preferred Language
                </label>
                <select
                  value={editLang}
                  onChange={(e) => setEditLang(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#ea110d] bg-slate-50/40 cursor-pointer"
                >
                  <option value="">— Not specified / Leave vacant —</option>
                  <option value="en">English (EN)</option>
                  <option value="hi">Hindi (HI)</option>
                  <option value="mr">Marathi (MR)</option>
                </select>
              </div>

              {/* Save & Cancel Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#ea110d] hover:bg-[#d00f0c] text-white font-bold text-xs font-poppins shadow-md shadow-red-500/20 disabled:opacity-60 transition cursor-pointer"
                >
                  {isSaving ? "Saving Changes..." : "Save Profile Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* Security & Password Update Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="mb-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#ea110d] block font-poppins">
                  Security &amp; Authentication
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-poppins">
                  Update Password
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-roboto">
                  Ensure your account stays secure by using a strong password with at least 8 characters including letters and numbers.
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#ea110d] flex items-center justify-center shrink-0">
                <KeyRound size={20} />
              </div>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                  Current Password
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/40 focus-within:bg-white focus-within:border-[#ea110d] transition">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full px-4 py-2.5 text-xs font-medium text-slate-900 bg-transparent focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Leave blank if you signed in using Google and never set a password.
                </span>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                  New Password *
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/40 focus-within:bg-white focus-within:border-[#ea110d] transition">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 8 characters)"
                    className="w-full px-4 py-2.5 text-xs font-medium text-slate-900 bg-transparent focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password requirements */}
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <ShieldCheck size={14} className="text-[#ea110d]" />
                    <span>Password requirements:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 pt-0.5">
                    <span className={newPassword.length >= 8 ? "text-emerald-700 font-bold" : "text-slate-400"}>
                      {newPassword.length >= 8 ? "✓" : "○"} At least 8 characters
                    </span>
                    <span className={/[A-Za-z]/.test(newPassword) ? "text-emerald-700 font-bold" : "text-slate-400"}>
                      {/[A-Za-z]/.test(newPassword) ? "✓" : "○"} Contains a letter
                    </span>
                    <span className={/\d/.test(newPassword) ? "text-emerald-700 font-bold" : "text-slate-400"}>
                      {/\d/.test(newPassword) ? "✓" : "○"} Contains a number
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 font-poppins mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/40 focus-within:bg-white focus-within:border-[#ea110d] transition">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-2.5 text-xs font-medium text-slate-900 bg-transparent focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <span className="text-[11px] text-red-600 font-medium mt-1 block">
                    Passwords do not match.
                  </span>
                )}
              </div>

              {/* Update Password Button */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword || !newPassword || newPassword !== confirmPassword}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs font-poppins shadow-md disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 2: MY BOOKINGS                                            */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setBookingFilter("all")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                  bookingFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                All Bookings ({bookings.length})
              </button>
              <button
                type="button"
                onClick={() => setBookingFilter("stay")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                  bookingFilter === "stay"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Stays &amp; Villas
              </button>
              <button
                type="button"
                onClick={() => setBookingFilter("package")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                  bookingFilter === "package"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Holiday Packages
              </button>
              <button
                type="button"
                onClick={() => setBookingFilter("experience")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                  bookingFilter === "experience"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Experiences
              </button>
            </div>

            {/* Bookings List or Empty State */}
            {loadingBookings ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                <div className="w-8 h-8 border-3 border-[#ea110d] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Loading your reservations from Mahastays…</p>
              </div>
            ) : filteredBookings.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 relative">
                        <img
                          src={b.image || "/hero-resort.jpg"}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {b.bookingType.toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            Ref: {b.bookingReference}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                          {b.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {b.dates} · {b.guests}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div>
                        <span className="text-lg sm:text-xl font-extrabold text-slate-900 block md:text-right font-poppins">
                          ₹{b.amount.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 capitalize block md:text-right">
                          ● {b.status} ({b.paymentStatus})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {b.paymentStatus === "paid" && b.status !== "cancelled" ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedInvoiceBooking({
                                  id: b.id,
                                  bookingReference: b.bookingReference,
                                  bookingType: b.bookingType,
                                  invoiceNumber: b.invoiceNumber,
                                  title: b.title,
                                  dates: b.dates,
                                  guests: b.guests,
                                  roomOrTierName: b.roomOrTierName,
                                  amount: b.amount,
                                  paymentStatus: b.paymentStatus,
                                  bookingStatus: b.status,
                                  createdAt: b.createdAt,
                                  pricing: b.pricing,
                                  guestName: user?.fullName,
                                  guestEmail: user?.email,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:border-slate-800 hover:text-slate-900 transition shadow-2xs cursor-pointer"
                              title="View Official GST Tax Invoice"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#ea110d]" />
                              <span>Tax Invoice</span>
                            </button>

                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/bookings/invoice/ref/${b.bookingReference}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#ea110d] bg-rose-50 border border-rose-200 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
                              title="Download PDF Invoice"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </a>
                          </>
                        ) : b.status === "cancelled" ? (
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200">
                            Cancelled • No Invoice
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200">
                            Pay at Property • Invoice on Payment
                          </span>
                        )}

                        <Link
                          href={`/checkout/success?ref=${b.bookingReference}`}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-[#ea110d] text-white transition shadow-xs cursor-pointer"
                        >
                          Voucher →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-50 text-[#ea110d] flex items-center justify-center mx-auto shadow-inner">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-10 0h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-poppins">
                  No reservations yet
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                  You haven&apos;t booked any stays or experiences yet. Explore our curated Mahabaleshwar catalog with lakefront pool villas, Arthur Seat treks, and romantic couple packages!
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/explore"
                    className="px-6 py-2.5 rounded-full bg-[#ea110d] hover:bg-[#d00f0c] text-white font-semibold text-xs shadow-md transition"
                  >
                    Browse Stays &amp; Villas
                  </Link>
                  <Link
                    href="/packages"
                    className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition"
                  >
                    View All-Inclusive Packages
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB: SAVED FAVORITES                                          */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "favorites" && (
          <div className="space-y-6">
            {/* Header & Filter Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-poppins tracking-tight flex items-center gap-2">
                  <span>Saved Favorites &amp; Stays</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-[#ea110d] border border-rose-200">
                    {favorites.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your bookmarked luxury villas, resort suites, and hilltop experiences in Maharashtra.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-poppins text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFavoriteFilter("all")}
                  className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                    favoriteFilter === "all"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  All ({favorites.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFavoriteFilter("property")}
                  className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                    favoriteFilter === "property"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Stays ({favorites.filter((f) => f.type === "property").length})
                </button>
                <button
                  type="button"
                  onClick={() => setFavoriteFilter("package")}
                  className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                    favoriteFilter === "package"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Packages ({favorites.filter((f) => f.type === "package").length})
                </button>
                <button
                  type="button"
                  onClick={() => setFavoriteFilter("experience")}
                  className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                    favoriteFilter === "experience"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Experiences ({favorites.filter((f) => f.type === "experience").length})
                </button>
              </div>
            </div>

            {/* Favorites List or Empty State */}
            {loadingFavorites ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                <div className="w-8 h-8 border-3 border-[#ea110d] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-medium">Loading your saved favorites...</p>
              </div>
            ) : filteredFavorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFavorites.map((fav) => (
                  <article
                    key={`${fav.type}-${fav.id}`}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 flex flex-col group"
                  >
                    {/* Image Area */}
                    <div className="relative w-full h-48 overflow-hidden bg-slate-100">
                      <img
                        src={fav.image || "/hero-resort.jpg"}
                        alt={fav.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Top Gradient */}
                      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none" />

                      {/* Type Badge */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-black/60 backdrop-blur-md text-white border border-white/20">
                        {fav.type === "property" ? (fav.category || "Villa") : fav.type === "package" ? "Package" : "Experience"}
                      </span>

                      {/* Remove Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeFavItem(fav.id, fav.type);
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#ea110d] flex items-center justify-center shadow-md transition-all hover:scale-110 cursor-pointer"
                        title="Remove from favorites"
                        aria-label={`Remove ${fav.title} from favorites`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#ea110d" stroke="#ea110d" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>

                      {/* Rating Badge */}
                      {fav.rating && (
                        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-bold text-slate-900 shadow-sm flex items-center gap-1">
                          <svg className="w-3 h-3 text-amber-500 fill-amber-500" viewBox="0 0 24 24">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          <span>{fav.rating}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Location */}
                        {fav.location && (
                          <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1 truncate">
                            <svg className="w-3 h-3 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{fav.location}</span>
                          </p>
                        )}

                        {/* Title */}
                        <Link
                          href={fav.url || `/explore/${fav.id}`}
                          className="font-bold text-slate-900 text-sm hover:text-[#ea110d] transition-colors line-clamp-2 font-poppins"
                        >
                          {fav.title}
                        </Link>
                      </div>

                      {/* Price and CTA */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Starting from
                          </span>
                          <span className="text-base font-extrabold text-slate-900 tracking-tight font-poppins">
                            {fav.price || "₹12,000"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={fav.url || `/explore/${fav.id}`}
                            className="px-3.5 py-1.5 rounded-full bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs font-bold font-poppins transition shadow-sm hover:shadow"
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200 shadow-sm max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-[#ea110d] flex items-center justify-center mx-auto mb-4 border border-rose-100">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                  No saved favorites yet
                </h3>
                <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                  Browse handpicked luxury villas, infinity-pool resorts, and guided packages across Mahabaleshwar and Panchgani. Click the bookmark or heart icon on any stay to save it here.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/explore"
                    className="px-5 py-2.5 rounded-full bg-[#ea110d] hover:bg-[#d00f0c] text-white text-xs font-bold font-poppins transition shadow-sm"
                  >
                    Explore Stays &amp; Villas →
                  </Link>
                  <Link
                    href="/packages"
                    className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-poppins transition"
                  >
                    View Packages
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB 3: MEMBERSHIP PRIVILEGES                                 */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {activeTab === "club" && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 font-poppins">
                Exclusive Guest Program
              </span>
              <h2 className="text-2xl font-bold text-slate-900 font-poppins mt-1">
                Mahastays Club Membership Benefits
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                As a valued member, your account is enrolled in the Mahastays Club privilege tier, unlocking guaranteed perks across all partner resorts and activity providers in Maharashtra.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-slate-900 font-poppins">
                  Instant 8% Discount
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automatically applied at checkout on all properties and stay packages with no coupon code required.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-slate-900 font-poppins">
                  Early Check-In &amp; Late Check-Out
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enjoy flexible timing up to 2 hours early or late, subject to property room availability.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-[#ea110d] flex items-center justify-center shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-slate-900 font-poppins">
                  Strawberry Farm Welcome Basket
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Receive a complimentary organic strawberry &amp; chocolate basket upon check-in at partner villas.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-slate-900 font-poppins">
                  Free Activity Upgrade
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Complimentary Venna Lake sunset boating tickets included with selected luxury packages.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-slate-900 font-poppins">
                  Zero Cancellation Fee Protection
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Free cancellations extended up to 48 hours prior to check-in with 100% wallet credit refund.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-slate-900 font-poppins">
                  Priority WhatsApp Concierge
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Direct WhatsApp access to our local Western Maharashtra operational hosts and guides.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Official Booking Invoice Modal */}
      <BookingInvoiceModal
        isOpen={Boolean(selectedInvoiceBooking)}
        onClose={() => setSelectedInvoiceBooking(null)}
        booking={selectedInvoiceBooking}
      />

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#ea110d] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
