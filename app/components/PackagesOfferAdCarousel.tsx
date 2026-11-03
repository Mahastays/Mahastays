"use client";

import { useState, useEffect } from "react";
import AdBlendBanner, { AdBlendSlide, AdFeatureItem } from "./AdBlendBanner";

export interface PackageOfferSlide {
  id: string;
  badge?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  discountBadge?: string;
  discountSubtext?: string;
  image: string;
  packageName?: string;
  location?: string;
  duration?: string;
  features: string | AdFeatureItem[];
  originalPrice?: string;
  dealPrice: string;
  discountPercent?: string;
  thumbnail?: string;
  filterDestination?: string;
  filterCategory?: string;
}

export const PACKAGES_OFFER_SLIDES: PackageOfferSlide[] = [
  {
    id: "pkg1001-offer",
    badge: "Special Package",
    title: "Lakeview Honeymoon Romance",
    subtitle: "Lake-view villa suite, candle-light dinner, private photoshoot and couple spa session.",
    ctaText: "Explore Packages",
    discountBadge: "20%",
    discountSubtext: "SAVE",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552",
    packageName: "Romantic Anniversary Getaway 💑",
    location: "Venna Lake, Mahabaleshwar",
    duration: "3 Days / 2 Nights",
    features: [
      { icon: "bed", label: "Lake-View Suite" },
      { icon: "dining", label: "Candle-Light Dinner" },
      { icon: "compass", label: "Curated Photoshoot" },
    ],
    originalPrice: "₹14,500",
    dealPrice: "₹11,500",
    discountPercent: "20% OFF",
    thumbnail: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486",
    filterDestination: "Mahabaleshwar",
    filterCategory: "Honeymoon",
  },
  {
    id: "pkg1002-offer",
    badge: "Special Package",
    title: "Clifftop Bachelor Bash Takeover",
    subtitle: "Private 4BHK luxury villa takeover with infinity pool, DJ setup, live BBQ & free boating.",
    ctaText: "Explore Packages",
    discountBadge: "25%",
    discountSubtext: "SAVE",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3",
    packageName: "Ultimate Bachelor Bash 🎉",
    location: "Table Land, Panchgani",
    duration: "3 Days / 2 Nights",
    features: [
      { icon: "bed", label: "Private 4BHK Villa" },
      { icon: "dining", label: "Live BBQ & Drinks" },
      { icon: "compass", label: "DJ & Pool Party" },
    ],
    originalPrice: "₹60,000",
    dealPrice: "₹45,000",
    discountPercent: "25% OFF",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    filterDestination: "Panchgani",
    filterCategory: "Luxury",
  },
  {
    id: "pkg1004-offer",
    badge: "Special Package",
    title: "Grand Birthday Celebration Blast",
    subtitle: "Resort party hall with themed balloon decor, 1.5kg customized cake, music & horse riding.",
    ctaText: "Explore Packages",
    discountBadge: "15%",
    discountSubtext: "SAVE",
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d",
    packageName: "Birthday Blast Celebration 🎂",
    location: "Venna Lake, Mahabaleshwar",
    duration: "2 Days / 1 Night",
    features: [
      { icon: "bed", label: "Party Hall & Suites" },
      { icon: "dining", label: "Custom Cake & Buffet" },
      { icon: "compass", label: "Horse Riding & Games" },
    ],
    originalPrice: "₹18,000",
    dealPrice: "₹15,000",
    discountPercent: "15% OFF",
    thumbnail: "https://images.unsplash.com/photo-1513151233558-d860c5398176",
    filterDestination: "Mahabaleshwar",
    filterCategory: "Heritage",
  },
  {
    id: "pkg1003-offer",
    badge: "Special Package",
    title: "Executive Corporate Offsite Retreat",
    subtitle: "AC conference hall, 200Mbps high-speed WiFi, buffet catering, lawn games & team challenges.",
    ctaText: "Explore Packages",
    discountBadge: "18%",
    discountSubtext: "SAVE",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865",
    packageName: "Corporate Offsite & Team Building 🏢",
    location: "Venna Lake Road, Mahabaleshwar",
    duration: "2 Days / 1 Night",
    features: [
      { icon: "bed", label: "Executive Suites" },
      { icon: "dining", label: "Buffet Catering" },
      { icon: "compass", label: "Team Building Games" },
    ],
    originalPrice: "₹72,000",
    dealPrice: "₹60,000",
    discountPercent: "18% OFF",
    thumbnail: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407",
    filterDestination: "Mahabaleshwar",
    filterCategory: "Adventure",
  },
];

interface PackagesOfferAdCarouselProps {
  slides?: PackageOfferSlide[];
  onSelectSlide?: (slide: PackageOfferSlide) => void;
}

export default function PackagesOfferAdCarousel({
  slides = PACKAGES_OFFER_SLIDES,
  onSelectSlide,
}: PackagesOfferAdCarouselProps) {
  const [activeSlides, setActiveSlides] = useState<PackageOfferSlide[]>(slides);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mahastays_db_ads");
        if (stored) {
          const parsed = JSON.parse(stored);
          const pkgAds = parsed.filter(
            (a: any) =>
              (a.placement === "packages" ||
                a.target?.targetType === "package" ||
                a.target?.ctaLink?.includes("/packages")) &&
              a.isActive &&
              a.approvedByAdmin
          );
          if (pkgAds.length > 0) {
            const dynamicSlides: PackageOfferSlide[] = pkgAds.map((a: any) => ({
              id: a.id,
              badge: a.creative?.badgeText || "Special Package",
              title: a.creative?.headline || a.adName,
              subtitle: a.creative?.subHeadline || "",
              ctaText: a.creative?.buttonText || "Explore Packages",
              image: a.creative?.imageUrl || "https://images.unsplash.com/photo-1519741497674-611481863552",
              dealPrice: a.creative?.price ? `₹${a.creative.price}` : "₹11,500",
              duration: a.creative?.priceUnit ? a.creative.priceUnit.replace(/^\//, "").trim() : "3 Days / 2 Nights",
              features: Array.isArray(a.creative?.features) && a.creative.features.length > 0
                ? a.creative.features.map((f: any, i: number) => ({
                    icon: (["bed", "dining", "compass"][i % 3] as any),
                    label: typeof f === "string" ? f : f.label,
                  }))
                : [
                    { icon: "bed", label: "Lake-View Suite" },
                    { icon: "dining", label: "Candle-Light Dinner" },
                    { icon: "compass", label: "Curated Photoshoot" },
                  ],
              filterDestination: "Mahabaleshwar",
              filterCategory: "Honeymoon",
            }));
            setActiveSlides([...dynamicSlides, ...slides]);
            return;
          }
        }
      } catch {}
    }
    setActiveSlides(slides);
  }, [slides]);

  const mappedSlides: AdBlendSlide[] = activeSlides.map((slide) => {
    let featureItems: AdFeatureItem[] = [];
    if (Array.isArray(slide.features)) {
      featureItems = slide.features;
    } else if (typeof slide.features === "string") {
      const parts = slide.features.split("•").map((s) => s.trim());
      const icons: ("bed" | "dining" | "compass")[] = ["bed", "dining", "compass"];
      featureItems = parts.slice(0, 3).map((text, idx) => ({
        icon: icons[idx] || "compass",
        label: text,
      }));
    }

    return {
      id: slide.id,
      badge: slide.badge && slide.badge !== "Sponsored" ? slide.badge : "Special Package",
      title: slide.title.replace(/\n/g, " "),
      subtitle: slide.subtitle,
      features: featureItems,
      ctaText: slide.ctaText,
      price: slide.dealPrice || "₹9,999",
      priceUnit: slide.duration ? `/ ${slide.duration.split("/")[0]?.trim() || "pkg"}` : "/ package",
      image: slide.image,
      filterDestination: slide.filterDestination,
      filterCategory: slide.filterCategory,
      rawSlide: slide,
    };
  });

  const handleSelect = (blendSlide: AdBlendSlide) => {
    if (onSelectSlide && blendSlide.rawSlide) {
      onSelectSlide(blendSlide.rawSlide);
    } else {
      const catalogEl = document.getElementById("packages-catalog");
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <AdBlendBanner
      slides={mappedSlides}
      onSelectSlide={handleSelect}
      ctaDefaultTargetId="packages-catalog"
      id="packages-offer-ad-carousel"
    />
  );
}
