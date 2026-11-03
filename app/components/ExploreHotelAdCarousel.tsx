"use client";

import { useState, useEffect } from "react";
import AdBlendBanner, { AdBlendSlide, AdFeatureItem } from "./AdBlendBanner";

export interface HotelAdSlide {
  id: string;
  categoryTag?: string;
  badge?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  image: string;
  hotelName?: string;
  location?: string;
  price: string;
  priceUnit?: string;
  features: string | AdFeatureItem[];
  thumbnail?: string;
  filterDestination?: string;
  filterAmenity?: string;
}

export const EXPLORE_HOTEL_AD_SLIDES: HotelAdSlide[] = [];

interface ExploreHotelAdCarouselProps {
  slides?: HotelAdSlide[];
  onSelectSlide?: (slide: HotelAdSlide) => void;
  onAdsLoaded?: (hasAds: boolean) => void;
}

export default function ExploreHotelAdCarousel({
  slides,
  onSelectSlide,
  onAdsLoaded,
}: ExploreHotelAdCarouselProps) {
  const [activeSlides, setActiveSlides] = useState<HotelAdSlide[]>(slides || []);
  const [isLoading, setIsLoading] = useState(!slides);

  useEffect(() => {
    if (slides && slides.length > 0) {
      setActiveSlides(slides);
      setIsLoading(false);
      onAdsLoaded?.(true);
      return;
    }

    let isMounted = true;
    const fetchStaysAds = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
        const res = await fetch(`${apiBase}/ads/active?placement=stays`);
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
          if (items.length > 0 && isMounted) {
            const dynamicSlides: HotelAdSlide[] = items.map((a: any) => ({
              id: a.id || a._id,
              badge: a.creative?.badgeText || "Special Offer",
              title: a.creative?.headline || a.adName || "Featured Stay",
              subtitle: a.creative?.subHeadline || "",
              ctaText: a.creative?.buttonText || "Explore Stays",
              image: a.creative?.imageUrl || "https://images.unsplash.com/photo-1540541338287-41700207dee6",
              price: a.creative?.price ? `₹${a.creative.price}` : "₹8,999",
              priceUnit: a.creative?.priceUnit || "/ night",
              features: Array.isArray(a.creative?.features) && a.creative.features.length > 0
                ? a.creative.features.map((f: any, i: number) => ({
                    icon: (["bed", "dining", "compass"][i % 3] as any),
                    label: typeof f === "string" ? f : f.label || "Verified Facility",
                  }))
                : [
                    { icon: "bed", label: "Private Pool" },
                    { icon: "dining", label: "Fine Dining" },
                    { icon: "compass", label: "Curated Experiences" },
                  ],
              filterDestination: a.target?.destination || undefined,
              filterAmenity: a.target?.amenity || undefined,
            }));
            setActiveSlides(dynamicSlides);
            setIsLoading(false);
            onAdsLoaded?.(true);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch stays ads:", err);
      }
      if (isMounted) {
        setIsLoading(false);
        onAdsLoaded?.(false);
      }
    };

    fetchStaysAds();
    return () => {
      isMounted = false;
    };
  }, [slides, onAdsLoaded]);

  if (isLoading || activeSlides.length === 0) {
    return null;
  }

  // Convert HotelAdSlide to AdBlendSlide format
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

    let cleanPrice = slide.price;
    let cleanUnit = slide.priceUnit || "/ night";
    if (slide.price.includes("/")) {
      const parts = slide.price.split("/");
      cleanPrice = parts[0].replace(/^From\s*/i, "").trim();
      cleanUnit = `/${parts[1].trim()}`;
    } else {
      cleanPrice = slide.price.replace(/^From\s*/i, "").trim();
    }

    return {
      id: slide.id,
      badge: slide.badge && slide.badge !== "Sponsored" ? slide.badge : "Featured Collection",
      title: slide.title.replace(/\n/g, " "),
      subtitle: slide.subtitle,
      features: featureItems,
      ctaText: slide.ctaText,
      price: cleanPrice,
      priceUnit: cleanUnit,
      image: slide.image,
      filterDestination: slide.filterDestination,
      filterAmenity: slide.filterAmenity,
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
      id="explore-hotel-ad-carousel"
    />
  );
}
