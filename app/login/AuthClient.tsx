"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  loginWithEmail,
  loginWithGoogle,
  signupUser,
  clearAuthError,
  clearSuccessMessage,
} from "../../store/authSlice";
import { toast } from "../../components/ui/Toast";

interface CarouselSlide {
  id: string;
  image: string;
  overline: string;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  location: string;
  badge: string;
}

const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: "pristine-hills",
    image: "/mountain-peaks.jpg",
    overline: "PREMIUM STAYS",
    titlePrefix: "Escape to Pristine",
    titleHighlight: "Hills",
    subtitle:
      "Wake up to misty morning clouds, roaring waterfalls, and serene valley-view infinity villas.",
    location: "Arthur's Seat & Kate's Point",
    badge: "Mahabaleshwar & Panchgani",
  },
  {
    id: "scenic-valleys",
    image: "/maha photos/green-hills.jpg",
    overline: "SERENE LAKES & PEAKS",
    titlePrefix: "Discover Scenic",
    titleHighlight: "Valleys",
    subtitle:
      "Glide along tranquil waters, ride horses along pine banks, and catch golden Sahyadri sunsets.",
    location: "Venna Lake & Wilson Point",
    badge: "Mahabaleshwar & Panchgani",
  },
  {
    id: "luxury-estates",
    image: "/hero-resort.jpg",
    overline: "BOUTIQUE LUXURY",
    titlePrefix: "Indulge in Private",
    titleHighlight: "Villas",
    subtitle:
      "Private infinity pools, fragrant strawberry orchards, and bespoke luxury hospitality.",
    location: "Panchgani & Old Mahabaleshwar",
    badge: "Mahabaleshwar & Panchgani",
  },
];

function AuthPageContent({
  initialMode = "login",
}: {
  initialMode?: "login" | "signup";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/explore";

  const dispatch = useAppDispatch();
  const {
    loading,
    error: reduxError,
    successMessage: reduxSuccess,
    isAuthenticated,
  } = useAppSelector((state) => state.auth);

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Feedback states
  const [localFeedback, setLocalFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Auto advance carousel every 6s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Redirect immediately if authenticated or token exists
  useEffect(() => {
    const hasToken =
      typeof window !== "undefined" &&
      !!localStorage.getItem("mahastays_token");
    if (isAuthenticated || hasToken) {
      router.replace(redirectUrl || "/profile");
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handleSwitchMode = (newMode: "login" | "signup") => {
    setMode(newMode);
    setLocalFeedback(null);
    dispatch(clearAuthError());
    dispatch(clearSuccessMessage());
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length
    );
  };

  // Submit Login
  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalFeedback(null);
    dispatch(clearAuthError());

    if (!loginEmail.trim()) {
      const msg = "Please enter your email address.";
      setLocalFeedback({ type: "error", message: msg });
      toast.warning(msg, "Missing Email");
      return;
    }
    if (!loginPassword) {
      const msg = "Please enter your password.";
      setLocalFeedback({ type: "error", message: msg });
      toast.warning(msg, "Missing Password");
      return;
    }

    try {
      const response = await dispatch(
        loginWithEmail({
          email: loginEmail,
          password: loginPassword,
        })
      ).unwrap();

      const userName = response?.user?.fullName || "Back";
      const successMsg = `Welcome back, ${userName}! Redirecting...`;
      setLocalFeedback({
        type: "success",
        message: successMsg,
      });
      toast.success(successMsg, "Login Successful");
      setTimeout(() => {
        router.replace(redirectUrl || "/profile");
      }, 500);
    } catch (err: any) {
      const errorMsg =
        typeof err === "string"
          ? err
          : err?.message || "Invalid email or password.";
      setLocalFeedback({
        type: "error",
        message: errorMsg,
      });
      toast.error(errorMsg, "Login Failed");
    }
  };

  // Submit Sign Up
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalFeedback(null);
    dispatch(clearAuthError());

    // Client-side validation with explicit warnings
    if (!signupFullName.trim() || signupFullName.trim().length < 2) {
      const msg = "Please enter your full name (at least 2 characters).";
      setLocalFeedback({ type: "error", message: msg });
      toast.warning(msg, "Invalid Full Name");
      return;
    }

    if (!signupEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.trim())) {
      const msg = "Please enter a valid email address.";
      setLocalFeedback({ type: "error", message: msg });
      toast.warning(msg, "Invalid Email");
      return;
    }

    if (signupPassword.length < 8) {
      const msg = "Password must be at least 8 characters long.";
      setLocalFeedback({ type: "error", message: msg });
      toast.warning(msg, "Password Too Short");
      return;
    }

    if (!/[A-Za-z]/.test(signupPassword)) {
      const msg = "Password must contain at least one letter (A-Z or a-z).";
      setLocalFeedback({ type: "error", message: msg });
      toast.warning(msg, "Missing Letter");
      return;
    }

    if (!/\d/.test(signupPassword)) {
      const msg = "Password must contain at least one number (0-9).";
      setLocalFeedback({ type: "error", message: msg });
      toast.warning(msg, "Missing Number");
      return;
    }

    try {
      const response = await dispatch(
        signupUser({
          fullName: signupFullName,
          email: signupEmail,
          password: signupPassword,
        })
      ).unwrap();

      const userName = response?.user?.fullName || "there";
      const successMsg = `Welcome ${userName}! Account created successfully. Redirecting...`;
      setLocalFeedback({
        type: "success",
        message: successMsg,
      });
      toast.success(successMsg, "Account Created");
      setTimeout(() => {
        router.replace(redirectUrl || "/profile");
      }, 500);
    } catch (err: any) {
      const errorMsg =
        typeof err === "string"
          ? err
          : err?.message || "Registration failed. Please check inputs.";
      setLocalFeedback({
        type: "error",
        message: errorMsg,
      });
      toast.error(errorMsg, "Registration Failed");
    }
  };

  // Handle Google OAuth
  const handleGoogleSuccess = async (credential: string) => {
    setLocalFeedback(null);
    dispatch(clearAuthError());

    try {
      const response = await dispatch(
        loginWithGoogle({ credential })
      ).unwrap();
      const userName = response?.user?.fullName || "there";
      const successMsg = `Welcome ${userName}! Google sign-in verified. Redirecting...`;
      setLocalFeedback({
        type: "success",
        message: successMsg,
      });
      toast.success(successMsg, "Google Sign-In");
      setTimeout(() => {
        router.replace(redirectUrl || "/profile");
      }, 500);
    } catch (err: any) {
      const errorMsg =
        typeof err === "string"
          ? err
          : err?.message || "Google sign-in failed.";
      setLocalFeedback({
        type: "error",
        message: errorMsg,
      });
      toast.error(errorMsg, "Sign-In Failed");
    }
  };

  // Handle Forgot Password
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      await fetch(`${apiUrl}/auth/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, role: "user" }),
      });
      setForgotSent(true);
    } catch {
      setForgotSent(true);
    } finally {
      setForgotLoading(false);
    }
  };

  const activeSlide = CAROUSEL_SLIDES[currentSlide];
  const activeError =
    localFeedback?.type === "error" ? localFeedback.message : reduxError;
  const activeSuccess =
    localFeedback?.type === "success" ? localFeedback.message : reduxSuccess;

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-10 h-10 border-3 border-[#ea110d] border-t-transparent rounded-full animate-spin" />
          <h2 className="text-base font-bold text-slate-800 font-poppins">Already Logged In</h2>
          <p className="text-xs text-slate-500 font-medium">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white text-neutral-900 font-sans selection:bg-red-600 selection:text-white lg:h-screen lg:overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* LEFT HALF: 50% Visual Hero Panel (Hidden on small screens < lg)    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex relative lg:w-1/2 lg:h-full lg:min-h-screen flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 text-white overflow-hidden bg-neutral-950 shrink-0">
        {/* Dynamic Landscape Background with Crossfade */}
        {CAROUSEL_SLIDES.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.location}
                className="w-full h-full object-cover scale-105 transition-transform duration-[8000ms] ease-out"
              />
            </div>
          );
        })}

        {/* Ambient Dark Gradients & Atmospheric Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/65 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Top-Left Atmospheric Red Glow Arc */}
        <div className="absolute -top-32 -left-20 w-[440px] h-[440px] rounded-full border border-red-600/35 opacity-70 pointer-events-none blur-[0.5px]" />
        <div className="absolute -top-16 -left-10 w-[320px] h-[320px] rounded-full bg-red-600/20 blur-3xl pointer-events-none" />

        {/* 1. Header Row (Real Logo + Location Badge) */}
        <div className="relative z-20 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-3 group"
            aria-label="Mahastays Home"
          >
            <Image
              src="/brand/mahastays-logo-main.png"
              alt="Mahastays Icon"
              width={44}
              height={44}
              style={{ width: "auto", height: "38px" }}
              className="object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <Image
              src="/brand/mahastays-logo-text.png"
              alt="Mahastays"
              width={160}
              height={38}
              style={{ width: "auto", height: "32px" }}
              className="object-contain brightness-0 invert"
              priority
            />
          </Link>

          {/* Mahabaleshwar & Panchgani Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs font-medium text-white/90 shadow-sm">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>Mahabaleshwar & Panchgani</span>
          </div>
        </div>

        {/* 2. Middle Content (Hero Title, Subtitle, Location) */}
        <div className="relative z-20 py-8 lg:py-0 my-auto max-w-xl">
          {/* Overline */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-white/70 uppercase">
              {activeSlide.overline}
            </span>
            <span className="w-12 h-[1px] bg-white/25"></span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[52px] font-black tracking-tight leading-[1.08] text-white font-poppins">
            {activeSlide.titlePrefix}{" "}
            <span className="text-red-500 font-extrabold block sm:inline">
              {activeSlide.titleHighlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-white/80 font-normal leading-relaxed max-w-md mt-4 font-roboto">
            {activeSlide.subtitle}
          </p>

          {/* Location Badge */}
          <div className="mt-5 flex items-center gap-2 text-xs sm:text-sm text-white/90 font-medium">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{activeSlide.location}</span>
          </div>

          {/* Carousel Controls (Indicators, Counter, Arrow Buttons) */}
          <div className="mt-8 flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              {/* Segmented Pill Bars */}
              <div className="flex items-center gap-1.5">
                {CAROUSEL_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentSlide
                        ? "w-7 bg-red-600"
                        : "w-3.5 bg-white/30 hover:bg-white/50"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Counter */}
              <span className="text-xs font-semibold text-white/70 tracking-widest font-mono">
                {String(currentSlide + 1).padStart(2, "0")} /{" "}
                {String(CAROUSEL_SLIDES.length).padStart(2, "0")}
              </span>
            </div>

            {/* Circular Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevSlide}
                className="w-9 h-9 rounded-full border border-white/20 bg-black/30 hover:bg-white/15 text-white flex items-center justify-center transition cursor-pointer active:scale-95"
                aria-label="Previous slide"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="w-9 h-9 rounded-full border border-white/20 bg-black/30 hover:bg-white/15 text-white flex items-center justify-center transition cursor-pointer active:scale-95"
                aria-label="Next slide"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Bottom Glassmorphic Feature Card (3 Badges) */}
        <div className="relative z-20 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md p-4 sm:p-5 grid grid-cols-3 gap-3 sm:gap-4 mt-6">
          {/* Feature 1 */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-bold text-white block leading-tight">Handpicked</span>
              <span className="text-[11px] text-white/70 block leading-tight">Stays</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center gap-2.5 sm:gap-3 border-x border-white/10 px-2 sm:px-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-bold text-white block leading-tight">Scenic</span>
              <span className="text-[11px] text-white/70 block leading-tight">Locations</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-bold text-white block leading-tight">Verified</span>
              <span className="text-[11px] text-white/70 block leading-tight">Properties</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* RIGHT HALF: 50% Clean White Form Canvas with Topographic Accent     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 min-h-screen lg:h-full lg:min-h-screen bg-white flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 relative overflow-y-auto">
        {/* Subtle Topographic Contour Lines SVG Watermark */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40 overflow-hidden"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 600 800"
        >
          <g fill="none" stroke="rgba(234, 17, 13, 0.06)" strokeWidth="1.2">
            <path d="M50,0 C120,150 40,300 180,450 C320,600 240,750 350,800" />
            <path d="M100,0 C170,160 90,320 230,470 C370,620 290,770 400,800" />
            <path d="M150,0 C220,170 140,340 280,490 C420,640 340,790 450,800" />
            <path d="M400,0 C320,120 480,260 360,400 C240,540 420,680 300,800" />
            <path d="M460,0 C380,130 540,270 420,410 C300,550 480,690 360,800" />
            <path d="M520,0 C440,140 600,280 480,420 C360,560 540,700 420,800" />
          </g>
        </svg>

        {/* Top Header Row (Back to Explore link) */}
        <div className="relative z-10 flex items-center justify-between w-full pb-4">
          {/* Mobile-only compact real logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <Image
              src="/brand/mahastays-logo-main.png"
              alt="Mahastays Icon"
              width={34}
              height={34}
              style={{ width: "auto", height: "30px" }}
              className="object-contain"
              priority
            />
            <Image
              src="/brand/mahastays-logo-text.png"
              alt="Mahastays"
              width={120}
              height={30}
              style={{ width: "auto", height: "24px" }}
              className="object-contain"
              priority
            />
          </Link>

          <Link
            href="/explore"
            className="text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 transition flex items-center gap-2 ml-auto group"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:-translate-x-0.5"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to explore</span>
          </Link>
        </div>

        {/* Center Container: Main Form Body */}
        <div className="w-full max-w-[440px] mx-auto my-auto py-6 sm:py-8 relative z-10">
          {/* Header Texts */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-red-600 tracking-[0.25em] uppercase font-poppins">
                {mode === "signup" ? "JOIN MAHASTAYS" : "WELCOME BACK"}
              </span>
              <span className="w-5 h-[1.5px] bg-red-600 opacity-60 inline-block"></span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight font-poppins">
              {mode === "signup" ? "Create your account" : "Log in to your account"}
            </h2>

            <p className="text-xs sm:text-sm text-neutral-500 font-normal leading-relaxed mt-1.5 font-roboto">
              {mode === "signup"
                ? "Join Mahastays to book exclusive resorts, villas, and curated experiences."
                : "Continue to access your bookings, manage stays and explore new destinations."}
            </p>
          </div>

          {/* Feedback Messages */}
          {activeSuccess && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600 shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{activeSuccess}</span>
            </div>
          )}

          {activeError && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 shadow-xs">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-600 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{activeError}</span>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* LOGIN FORM (Direct Email & Password - Tabs Removed)          */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {mode === "login" && (
            <form onSubmit={handleEmailLoginSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5 font-roboto">
                  Email Address
                </label>
                <div className="relative flex items-center rounded-xl border border-neutral-200 bg-neutral-50/60 hover:border-neutral-300 focus-within:border-red-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-100 transition px-3.5 py-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-neutral-400 mr-2.5 shrink-0"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="yourname@example.com"
                    required
                    className="w-full bg-transparent text-xs sm:text-sm font-normal text-neutral-900 placeholder-neutral-400 outline-none"
                    id="login-email-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-800 font-roboto">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center rounded-xl border border-neutral-200 bg-neutral-50/60 hover:border-neutral-300 focus-within:border-red-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-100 transition px-3.5 py-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-neutral-400 mr-2.5 shrink-0"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-transparent text-xs sm:text-sm font-normal text-neutral-900 placeholder-neutral-400 outline-none pr-7"
                    id="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 accent-red-600 cursor-pointer"
                />
                <label
                  htmlFor="remember"
                  className="text-xs font-normal text-neutral-600 cursor-pointer select-none font-roboto"
                >
                  Remember this device for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm sm:text-base shadow-lg shadow-red-600/25 hover:shadow-red-600/35 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 font-poppins"
                  id="login-submit-btn"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    <>
                      <span>Log In</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SIGN UP FORM (Direct Email & Password Registration)          */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {mode === "signup" && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5 font-roboto">
                  Full Name
                </label>
                <div className="relative flex items-center rounded-xl border border-neutral-200 bg-neutral-50/60 hover:border-neutral-300 focus-within:border-red-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-100 transition px-3.5 py-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-neutral-400 mr-2.5 shrink-0"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    placeholder="e.g. Aryan Sharma"
                    required
                    className="w-full bg-transparent text-xs sm:text-sm font-normal text-neutral-900 placeholder-neutral-400 outline-none"
                    id="signup-name-input"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5 font-roboto">
                  Email Address
                </label>
                <div className="relative flex items-center rounded-xl border border-neutral-200 bg-neutral-50/60 hover:border-neutral-300 focus-within:border-red-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-100 transition px-3.5 py-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-neutral-400 mr-2.5 shrink-0"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="aryan@example.com"
                    required
                    className="w-full bg-transparent text-xs sm:text-sm font-normal text-neutral-900 placeholder-neutral-400 outline-none"
                    id="signup-email-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 mb-1.5 font-roboto">
                  Password
                </label>
                <div className="relative flex items-center rounded-xl border border-neutral-200 bg-neutral-50/60 hover:border-neutral-300 focus-within:border-red-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-100 transition px-3.5 py-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-neutral-400 mr-2.5 shrink-0"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="w-full bg-transparent text-xs sm:text-sm font-normal text-neutral-900 placeholder-neutral-400 outline-none pr-7"
                    id="signup-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password Strength / Requirement Guidance */}
                <div className="mt-2 p-2 rounded-lg bg-neutral-50 border border-neutral-200/80 text-[11px] text-neutral-600 font-roboto space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-700">
                    <span className="text-amber-500">ℹ</span>
                    <span>Password requirements:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10.5px]">
                    <span className={signupPassword.length >= 8 ? "text-emerald-700 font-bold" : "text-neutral-500"}>
                      {signupPassword.length >= 8 ? "✓" : "○"} At least 8 characters
                    </span>
                    <span className={/[A-Za-z]/.test(signupPassword) ? "text-emerald-700 font-bold" : "text-neutral-500"}>
                      {/[A-Za-z]/.test(signupPassword) ? "✓" : "○"} Contains a letter
                    </span>
                    <span className={/\d/.test(signupPassword) ? "text-emerald-700 font-bold" : "text-neutral-500"}>
                      {/\d/.test(signupPassword) ? "✓" : "○"} Contains a number
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm sm:text-base shadow-lg shadow-red-600/25 hover:shadow-red-600/35 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 font-poppins"
                  id="signup-submit-btn"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Divider "Or Continue With" */}
          <div className="relative flex items-center justify-center my-6 w-full">
            <div className="border-t border-neutral-200 flex-1" />
            <span className="bg-white px-3.5 text-[11px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-wider font-poppins whitespace-nowrap shrink-0">
              Or continue with
            </span>
            <div className="border-t border-neutral-200 flex-1" />
          </div>

          {/* Google Sign-in Button */}
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  handleGoogleSuccess(credentialResponse.credential);
                }
              }}
              onError={() => {
                setLocalFeedback({
                  type: "error",
                  message: "Google sign-in was cancelled or encountered an error.",
                });
              }}
              theme="outline"
              size="large"
              shape="pill"
              width="100%"
              text={mode === "signup" ? "signup_with" : "signin_with"}
            />
          </div>

          {/* Switch Mode (Login <-> Signup) Footer */}
          <div className="text-center pt-5 text-xs text-neutral-600 font-normal font-roboto">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode("login")}
                  className="font-bold text-red-600 hover:underline cursor-pointer ml-1"
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode("signup")}
                  className="font-bold text-red-600 hover:underline cursor-pointer ml-1"
                >
                  Sign up
                </button>
              </>
            )}
          </div>

          {/* Terms of Service Disclaimer */}
          <p className="text-[11px] text-neutral-400 text-center leading-relaxed pt-6 font-roboto">
            By continuing, I agree to Mahastays{" "}
            <Link href="#" className="underline hover:text-neutral-600">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline hover:text-neutral-600">
              Terms of Service
            </Link>
            .
          </p>
        </div>

        {/* Footer spacer for clean balance */}
        <div className="hidden lg:block h-2" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Forgot Password Modal                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-neutral-900 font-poppins">
                Reset your password
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotSent(false);
                }}
                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {forgotSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-neutral-800 mb-1">
                  Check your inbox
                </h4>
                <p className="text-xs text-neutral-500 mb-5">
                  If an account exists for {forgotEmail}, we&apos;ve sent a password reset link.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSent(false);
                  }}
                  className="px-5 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-neutral-600">
                  Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="yourname@example.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="px-4 py-2 rounded-full text-xs font-medium text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-60"
                  >
                    {forgotLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuthPage({
  initialMode = "login",
}: {
  initialMode?: "login" | "signup";
}) {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-white flex items-center justify-center" />}>
      <AuthPageContent initialMode={initialMode} />
    </Suspense>
  );
}

