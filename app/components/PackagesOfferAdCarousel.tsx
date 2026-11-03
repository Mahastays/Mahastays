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

export const PACKAGES_OFFER_SLIDES: PackageOfferSlide[] = [];

interface PackagesOfferAdCarouselProps {
  slides?: PackageOfferSlide[];
  onSelectSlide?: (slide: PackageOfferSlide) => void;
  onAdsLoaded?: (hasAds: boolean) => void;
}

export default function PackagesOfferAdCarousel({
  slides,
  onSelectSlide,
  onAdsLoaded,
}: PackagesOfferAdCarouselProps) {
  const [activeSlides, setActiveSlides] = useState<PackageOfferSlide[]>(slides || []);
  const [isLoading, setIsLoading] = useState(!slides);

  useEffect(() => {
    if (slides && slides.length > 0) {
      setActiveSlides(slides);
      setIsLoading(false);
      onAdsLoaded?.(true);
      return;
    }

    let isMounted = true;
    const fetchPackageAds = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
        const res = await fetch(`${apiBase}/ads/active?placement=packages`);
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
          if (items.length > 0 && isMounted) {
            const dynamicSlides: PackageOfferSlide[] = items.map((a: any) => ({
              id: a.id || a._id,
              badge: a.creative?.badgeText || "Special Package",
              title: a.creative?.headline || a.adName || "Featured Package",
              subtitle: a.creative?.subHeadline || "",
              ctaText: a.creative?.buttonText || "Explore Packages",
              image: a.creative?.imageUrl || "https://images.unsplash.com/photo-1519741497674-611481863552",
              dealPrice: a.creative?.price ? `₹${a.creative.price}` : "₹11,500",
              originalPrice: a.creative?.originalPrice ? `₹${a.creative.originalPrice}` : undefined,
              discountPercent: a.creative?.discountText || undefined,
              discountBadge: a.creative?.discountPercent ? `${a.creative.discountPercent}%` : undefined,
              discountSubtext: "SAVE",
              features: Array.isArray(a.creative?.features) && a.creative.features.length > 0
                ? a.creative.features.map((f: any, i: number) => ({
                    icon: (["bed", "dining", "compass"][i % 3] as any),
                    label: typeof f === "string" ? f : f.label || "Package Inclusion",
                  }))
                : [
                    { icon: "bed", label: "Villa Stay" },
                    { icon: "dining", label: "Meals Included" },
                    { icon: "compass", label: "Sightseeing" },
                  ],
              filterDestination: a.target?.destination || "Mahabaleshwar",
              filterCategory: a.target?.category || "Honeymoon",
            }));
            setActiveSlides(dynamicSlides);
            setIsLoading(false);
            onAdsLoaded?.(true);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch packages ads:", err);
      }
      if (isMounted) {
        setIsLoading(false);
        onAdsLoaded?.(false);
      }
    };

    fetchPackageAds();
    return () => {
      isMounted = false;
    };
  }, [slides, onAdsLoaded]);

  if (isLoading || activeSlides.length === 0) {
    return null;
  }

  // Convert PackageOfferSlide to AdBlendSlide format
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

    let cleanPrice = slide.dealPrice;
    let cleanUnit = "/ package";
    if (slide.dealPrice.includes("/")) {
      const parts = slide.dealPrice.split("/");
      cleanPrice = parts[0].replace(/^From\s*/i, "").trim();
      cleanUnit = `/${parts[1].trim()}`;
    } else {
      cleanPrice = slide.dealPrice.replace(/^From\s*/i, "").trim();
    }

    return {
      id: slide.id,
      badge: slide.badge && slide.badge !== "Sponsored" ? slide.badge : "Special Package",
      title: slide.title.replace(/\n/g, " "),
      subtitle: slide.subtitle,
      features: featureItems,
      ctaText: slide.ctaText,
      price: cleanPrice,
      priceUnit: cleanUnit,
      originalPrice: slide.originalPrice,
      discountBadge: slide.discountBadge,
      discountSubtext: slide.discountSubtext,
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
      const catalogEl = document.getElementById("catalog-section");
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <AdBlendBanner
      slides={mappedSlides}
      onSelectSlide={handleSelect}
      ctaDefaultTargetId="catalog-section"
      id="packages-offer-ad-carousel"
    />
  );
}
