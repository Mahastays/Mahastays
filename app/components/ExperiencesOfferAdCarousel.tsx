"use client";

import { useState, useEffect } from "react";
import AdBlendBanner, { AdBlendSlide, AdFeatureItem } from "./AdBlendBanner";

export interface ExperienceOfferSlide {
  id: string;
  badge?: string;
  titlePrefix?: string;
  titleHighlight?: string;
  title?: string;
  subtitle: string;
  ctaText: string;
  image: string;
  activityName?: string;
  location?: string;
  features: string | AdFeatureItem[];
  price: string;
  priceUnit?: string;
  thumbnail?: string;
  filterCategory?: string;
  filterDestination?: string;
}

export const EXPERIENCES_OFFER_SLIDES: ExperienceOfferSlide[] = [];

interface ExperiencesOfferAdCarouselProps {
  slides?: ExperienceOfferSlide[];
  onSelectSlide?: (slide: ExperienceOfferSlide) => void;
  onAdsLoaded?: (hasAds: boolean) => void;
}

export default function ExperiencesOfferAdCarousel({
  slides,
  onSelectSlide,
  onAdsLoaded,
}: ExperiencesOfferAdCarouselProps) {
  const [activeSlides, setActiveSlides] = useState<ExperienceOfferSlide[]>(slides || []);
  const [isLoading, setIsLoading] = useState(!slides);

  useEffect(() => {
    if (slides && slides.length > 0) {
      setActiveSlides(slides);
      setIsLoading(false);
      onAdsLoaded?.(true);
      return;
    }

    let isMounted = true;
    const fetchExperiencesAds = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
        const res = await fetch(`${apiBase}/ads/active?placement=experiences`);
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
          if (items.length > 0 && isMounted) {
            const dynamicSlides: ExperienceOfferSlide[] = items.map((a: any) => ({
              id: a.id || a._id,
              badge: a.creative?.badgeText || "Curated Experience",
              title: a.creative?.headline || a.adName || "Featured Adventure",
              subtitle: a.creative?.subHeadline || "",
              ctaText: a.creative?.buttonText || "Explore Experiences",
              image: a.creative?.imageUrl || "https://images.unsplash.com/photo-1504276048855-f58379e20788",
              price: a.creative?.price ? `₹${a.creative.price}` : "₹1,500",
              priceUnit: a.creative?.priceUnit || "/ person",
              features: Array.isArray(a.creative?.features) && a.creative.features.length > 0
                ? a.creative.features.map((f: any, i: number) => ({
                    icon: (["bed", "dining", "compass"][i % 3] as any),
                    label: typeof f === "string" ? f : f.label || "Adventure Highlight",
                  }))
                : [
                    { icon: "bed", label: "Certified Guide" },
                    { icon: "dining", label: "Refreshments Included" },
                    { icon: "compass", label: "Scenic Trail" },
                  ],
              filterCategory: a.target?.category || "adventure",
              filterDestination: a.target?.destination || "Panchgani",
            }));
            setActiveSlides(dynamicSlides);
            setIsLoading(false);
            onAdsLoaded?.(true);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch experiences ads:", err);
      }
      if (isMounted) {
        setIsLoading(false);
        onAdsLoaded?.(false);
      }
    };

    fetchExperiencesAds();
    return () => {
      isMounted = false;
    };
  }, [slides, onAdsLoaded]);

  if (isLoading || activeSlides.length === 0) {
    return null;
  }

  // Convert ExperienceOfferSlide to AdBlendSlide format
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
    let cleanUnit = slide.priceUnit || "/ person";
    if (slide.price.includes("/")) {
      const parts = slide.price.split("/");
      cleanPrice = parts[0].replace(/^From\s*/i, "").trim();
      cleanUnit = `/${parts[1].trim()}`;
    } else {
      cleanPrice = slide.price.replace(/^From\s*/i, "").trim();
    }

    return {
      id: slide.id,
      badge: slide.badge && slide.badge !== "Sponsored" ? slide.badge : "Curated Experience",
      title: (slide.title || "Curated Experience").replace(/\n/g, " "),
      subtitle: slide.subtitle,
      features: featureItems,
      ctaText: slide.ctaText,
      price: cleanPrice,
      priceUnit: cleanUnit,
      image: slide.image,
      filterDestination: slide.filterDestination,
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
      id="experiences-offer-ad-carousel"
    />
  );
}
