"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadSavedAuth, fetchCurrentUser, logoutUser } from "@/store/authSlice";
import api from "@/lib/api";
import NavSearch from "./NavSearch";

export default function Navbar() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("Home");
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const pathname = usePathname();

  const [hasToken, setHasToken] = useState(false);

  // Fetch / sync user data from backend if token exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("mahastays_token");
      setHasToken(!!token);
      if (token && (!user || !isAuthenticated)) {
        dispatch(loadSavedAuth());
        dispatch(fetchCurrentUser());
      }
    }
  }, [dispatch, user, isAuthenticated]);

  // Fetch unread notifications count
  useEffect(() => {
    if (isAuthenticated || hasToken) {
      api
        .get("/notifications/unread-count")
        .then((res) => {
          const count = res.data?.data?.unread ?? 0;
          setUnreadCount(typeof count === "number" ? count : 0);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, hasToken]);

  const openNotificationDrawer = () => {
    setShowNotificationDrawer(true);
    setLoadingNotifications(true);
    api
      .get("/notifications?limit=25")
      .then((res) => {
        const list = res.data?.data || [];
        setNotifications(list);
        const count = res.data?.meta?.unread ?? list.filter((n: any) => !n.readAt).length;
        setUnreadCount(count);
      })
      .catch(() => {
        setNotifications([]);
      })
      .finally(() => {
        setLoadingNotifications(false);
      });
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {}
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          setIsScrolled((prev) => {
            if (!prev && currentY > 35) return true;
            if (prev && currentY < 15) return false;
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: (
        <svg className="w-[18px] h-[18px] sm:w-[15px] sm:h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      name: "Explore",
      href: "/explore",
      icon: (
        <svg className="w-[18px] h-[18px] sm:w-[15px] sm:h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      name: "Packages",
      href: "/packages",
      icon: (
        <svg className="w-[18px] h-[18px] sm:w-[15px] sm:h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      name: "Experiences",
      href: "/experiences",
      icon: (
        <svg className="w-[18px] h-[18px] sm:w-[15px] sm:h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
  ];

  const isHomePage = pathname === "/";

  return (
    <>
      {/* ─── Top Main Navigation Bar ────────────────────────────── */}
      <header
        className={`fixed left-0 right-0 z-50 transition-[top,padding] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform ${
          isScrolled
            ? "top-2 sm:top-3.5 px-3 sm:px-6"
            : "top-0 px-0"
        }`}
      >
        <nav
          className={`mx-auto transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex items-center justify-between gap-3 sm:gap-5 lg:gap-6 ${
            isScrolled
              ? "w-[96%] sm:w-[94%] xl:w-[92%] max-w-[1440px] px-4 sm:px-7 lg:px-8 py-2 sm:py-2.5 rounded-full bg-white/95 backdrop-blur-md border border-white/60 shadow-[0_12px_30px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.04)]"
              : isHomePage
              ? "w-full max-w-[100%] px-4 sm:px-8 lg:px-12 py-3.5 sm:py-5 rounded-none bg-transparent border-b border-transparent shadow-none"
              : "w-full max-w-[100%] px-4 sm:px-8 lg:px-12 py-3 sm:py-4 rounded-none bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_15px_rgba(0,0,0,0.03)]"
          }`}
        >
          {/* Brand Logo: Icon & Text styled responsively for all devices */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group" aria-label="Mahastays Home">
            <Image
              src="/brand/mahastays-logo-main.png"
              alt="Mahastays Icon"
              width={48}
              height={48}
              style={{ width: "auto" }}
              className={`w-auto object-contain transition-all duration-500 group-hover:scale-105 ${
                isScrolled ? "h-7 sm:h-8" : "h-8 sm:h-10"
              }`}
              priority
            />
            <Image
              src="/brand/mahastays-logo-text.png"
              alt="Mahastays"
              width={180}
              height={42}
              style={{ width: "auto" }}
              className={`w-auto object-contain transition-all duration-500 ${
                isScrolled ? "h-6 sm:h-7" : "h-7 sm:h-9"
              }`}
              priority
            />
          </Link>

          {/* Desktop Nav Links (Hidden on mobile/small screens; rendered at bottom navbar on small screens) */}
          <ul className="hidden md:flex items-center gap-1.5 list-none">
            {navItems.map((item) => {
              const currentPath = pathname || "/";
              const isActive =
                (item.href === "/" && currentPath === "/") ||
                (item.href === "/explore" &&
                  (currentPath === "/explore" ||
                    currentPath.startsWith("/explore/") ||
                    currentPath === "/stay" ||
                    currentPath.startsWith("/stay/"))) ||
                (item.href === "/packages" &&
                  (currentPath === "/packages" ||
                    currentPath.startsWith("/packages/"))) ||
                (item.href === "/experiences" &&
                  (currentPath === "/experiences" ||
                    currentPath.startsWith("/experiences/")));

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setActiveTab(item.name)}
                    className={`inline-flex items-center gap-2 px-3.5 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold rounded-full transition-all duration-300 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-primary text-white shadow-[0_2px_10px_rgba(234,17,13,0.35)]"
                        : isScrolled
                        ? "text-slate-600 hover:text-primary hover:bg-primary-light"
                        : "text-slate-800 hover:text-primary hover:bg-white/50 backdrop-blur-sm"
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center transition-transform duration-200 ${isActive ? "opacity-100" : "opacity-80 group-hover:scale-110"}`}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Top Right: Search (Desktop only) + Profile / Login CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Search Across Location, Villa, Experience, Packages */}
            <NavSearch isScrolled={isScrolled} isHomePage={isHomePage} />

            {/* Top Right: Profile / Login on all screens */}
            {isAuthenticated || hasToken ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Notification Bell with Badge */}
                <button
                  type="button"
                  onClick={openNotificationDrawer}
                  className="relative p-1.5 sm:p-2 text-slate-700 hover:text-[#ea110d] transition-colors rounded-full hover:bg-slate-100/70 cursor-pointer"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <svg className="w-5 h-5 text-slate-700 hover:text-[#ea110d] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#ea110d] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                </button>

                {/* Thin Vertical Separator */}
                <div className="w-[1.5px] h-5 bg-slate-300 mx-0.5" />

                {/* Pill Profile Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserDropdown((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 pl-1.5 pr-2.5 sm:pr-3.5 bg-white/95 hover:bg-white text-slate-800 rounded-full border border-slate-200/90 shadow-sm hover:shadow-md transition-all whitespace-nowrap cursor-pointer"
                    id="navbar-profile-btn"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#ea110d] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName || "User Avatar"} className="w-full h-full object-cover" />
                      ) : (
                        <span>{user?.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}</span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[85px] sm:max-w-[120px] font-poppins">
                      {user?.fullName?.split(" ")[0] || "Abhishek"}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${showUserDropdown ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-xs font-semibold text-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="font-bold text-slate-900 truncate font-poppins">{user?.fullName || "Abhishek"}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                      </div>
                      <Link
                        href="/profile?tab=overview"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 hover:text-[#ea110d] transition group"
                      >
                        <svg className="w-4 h-4 text-slate-500 group-hover:text-[#ea110d] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Overview &amp; Profile</span>
                      </Link>
                      <Link
                        href="/profile?tab=bookings"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 hover:text-[#ea110d] transition group"
                      >
                        <svg className="w-4 h-4 text-slate-500 group-hover:text-[#ea110d] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-10 0h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
                        </svg>
                        <span>My Bookings</span>
                      </Link>
                      <Link
                        href="/profile?tab=settings"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 hover:text-[#ea110d] transition group"
                      >
                        <svg className="w-4 h-4 text-slate-500 group-hover:text-[#ea110d] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Settings &amp; Edit Profile</span>
                      </Link>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          dispatch(logoutUser());
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 hover:bg-red-50 text-[#ea110d] transition cursor-pointer group"
                      >
                        <svg className="w-4 h-4 text-rose-600 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3.5 sm:px-6 bg-gradient-to-r from-[#f70200] to-[#d40806] text-white text-xs sm:text-sm font-semibold rounded-full shadow-[0_3px_12px_rgba(234,17,13,0.35)] hover:-translate-y-0.5 hover:shadow-[0_5px_18px_rgba(234,17,13,0.45)] active:translate-y-0 transition-all whitespace-nowrap cursor-pointer"
                id="navbar-login-btn"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Login</span>
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* ─── Mobile Bottom Navigation Bar (Phone & Small Screens) ─── */}
      {!pathname?.startsWith("/checkout") && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-2 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))]"
          aria-label="Mobile Navigation"
        >
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {navItems.map((item) => {
              const currentPath = pathname || "/";
              const isActive =
                (item.href === "/" && currentPath === "/") ||
                (item.href === "/explore" &&
                  (currentPath === "/explore" ||
                    currentPath.startsWith("/explore/") ||
                    currentPath === "/stay" ||
                    currentPath.startsWith("/stay/"))) ||
                (item.href === "/packages" &&
                  (currentPath === "/packages" ||
                    currentPath.startsWith("/packages/"))) ||
                (item.href === "/experiences" &&
                  (currentPath === "/experiences" ||
                    currentPath.startsWith("/experiences/")));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setActiveTab(item.name)}
                  className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 select-none ${
                    isActive
                      ? "text-[#ea110d]"
                      : "text-slate-500 hover:text-slate-900 active:scale-95"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                      isActive
                        ? "bg-red-50 text-[#ea110d] scale-110"
                        : "text-slate-500"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={`text-[11px] leading-tight transition-all duration-200 mt-0.5 ${
                      isActive ? "font-bold text-[#ea110d]" : "font-medium text-slate-500"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ─── Notification Drawer (Slides In from Right Side) ─── */}
      {showNotificationDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowNotificationDrawer(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-16">
            <div className="w-screen max-w-sm sm:max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
              {/* Header */}
              <div className="px-5 py-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-50 text-[#ea110d] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-poppins">Notifications</h3>
                    <p className="text-[11px] text-slate-400">
                      {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}` : "All caught up"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-semibold text-[#ea110d] hover:text-red-700 hover:underline px-2 py-1 rounded-md transition cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNotificationDrawer(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                    aria-label="Close notifications"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Notification List Body */}
              <div data-lenis-prevent className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3">
                {loadingNotifications ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-[#ea110d] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">Loading notifications...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((n) => {
                    const isUnread = !n.readAt;
                    return (
                      <div
                        key={n.id}
                        onClick={() => isUnread && handleMarkOneRead(n.id)}
                        className={`p-3.5 rounded-2xl border transition text-left cursor-pointer relative flex items-start gap-3 ${
                          isUnread
                            ? "bg-rose-50/40 border-rose-100 hover:bg-rose-50/70"
                            : "bg-white border-slate-100 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            n.type?.includes("BOOKING")
                              ? "bg-rose-100 text-[#ea110d]"
                              : n.type?.includes("PAYMENT")
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {n.type?.includes("BOOKING") ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-10 0h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
                            </svg>
                          ) : n.type?.includes("PAYMENT") ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>

                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 truncate font-poppins">{n.title || "Update"}</h4>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-[#ea110d] shrink-0" title="Unread" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed break-words">{n.body || n.message}</p>
                          <span className="text-[10px] text-slate-400 block pt-0.5">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Recently"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 font-poppins">No notifications yet</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Stay updates, payment confirmations, and booking alerts will appear right here.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-center">
                <Link
                  href="/profile?tab=bookings"
                  onClick={() => setShowNotificationDrawer(false)}
                  className="text-xs font-bold text-[#ea110d] hover:underline"
                >
                  View My Bookings &amp; Trips →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
