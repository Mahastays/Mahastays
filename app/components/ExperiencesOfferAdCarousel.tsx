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

export const EXPERIENCES_OFFER_SLIDES: ExperienceOfferSlide[] = [
  {
    id: "act1006-paragliding",
    badge: "Curated Experience",
    title: "Tandem Paragliding Over Krishna Valley",
    titlePrefix: "Soar Over",
    titleHighlight: "Krishna Valley",
    subtitle: "Tandem paragliding at 450m elevation with certified master pilots and 4K GoPro footage.",
    ctaText: "Explore Experiences",
    image: "https://images.unsplash.com/photo-1504276048855-f58379e20788",
    activityName: "Tandem Paragliding — Panchgani",
    location: "Table Land, Panchgani",
    features: [
      { icon: "bed", label: "450m Elevation" },
      { icon: "dining", label: "Refreshments Included" },
      { icon: "compass", label: "4K GoPro Footage" },
    ],
    price: "₹2,500",
    priceUnit: "/ flight",
    thumbnail: "https://images.unsplash.com/photo-1504276048855-f58379e20788",
    filterCategory: "adventure",
    filterDestination: "Panchgani",
  },
  {
    id: "act1001-trek",
    badge: "Curated Experience",
    title: "Sunrise Mountain Trek to Arthur's Seat",
    titlePrefix: "Watch Sunrise from",
    titleHighlight: "Arthur's Seat",
    subtitle: "Guided 4km morning trail overlooking Savitri valley with hot summit chai and local snacks.",
    ctaText: "Explore Experiences",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306",
    activityName: "Sunrise Trek to Arthur Seat",
    location: "Old Mahabaleshwar",
    features: [
      { icon: "bed", label: "4km Guided Trail" },
      { icon: "dining", label: "Summit Chai & Snacks" },
      { icon: "compass", label: "Valley Views" },
    ],
    price: "₹350",
    priceUnit: "/ person",
    thumbnail: "https://images.unsplash.com/photo-1551632811-561732d1e306",
    filterCategory: "adventure",
    filterDestination: "Mahabaleshwar",
  },
  {
    id: "act1005-boating",
    badge: "Curated Experience",
    title: "Serene Boat Cruise at Venna Lake",
    titlePrefix: "Paddle Across",
    titleHighlight: "Venna Lake",
    subtitle: "Private row & paddle boat rides surrounded by misty strawberry hills and calm waters.",
    ctaText: "Explore Experiences",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
    activityName: "Boating at Venna Lake",
    location: "Venna Lake, Mahabaleshwar",
    features: [
      { icon: "bed", label: "Private Row Boat" },
      { icon: "dining", label: "Strawberry Treat" },
      { icon: "compass", label: "Sunset Waters" },
    ],
    price: "₹250",
    priceUnit: "/ person",
    thumbnail: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
    filterCategory: "leisure",
    filterDestination: "Mahabaleshwar",
  },
  {
    id: "act1007-karting",
    badge: "Curated Experience",
    title: "High-Speed Go-Karting Championship",
    titlePrefix: "Race Around the",
    titleHighlight: "800m Asphalt Track",
    subtitle: "Banked high-speed curves with 200cc Honda engines, computerized lap times & full gear.",
    ctaText: "Explore Experiences",
    image: "https://images.unsplash.com/photo-1567789884554-0b844b597180",
    activityName: "Go-Karting Track — Panchgani",
    location: "Panchgani Highway",
    features: [
      { icon: "bed", label: "800m Asphalt Track" },
      { icon: "dining", label: "Trackside Cafe" },
      { icon: "compass", label: "200cc Honda Karts" },
    ],
    price: "₹600",
    priceUnit: "/ driver",
    thumbnail: "https://images.unsplash.com/photo-1567789884554-0b844b597180",
    filterCategory: "entertainment",
    filterDestination: "Panchgani",
  },
];

interface ExperiencesOfferAdCarouselProps {
  slides?: ExperienceOfferSlide[];
  onSelectSlide?: (slide: ExperienceOfferSlide) => void;
}

export default function ExperiencesOfferAdCarousel({
  slides = EXPERIENCES_OFFER_SLIDES,
  onSelectSlide,
}: ExperiencesOfferAdCarouselProps) {
  const [activeSlides, setActiveSlides] = useState<ExperienceOfferSlide[]>(slides);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mahastays_db_ads");
        if (stored) {
          const parsed = JSON.parse(stored);
          const expAds = parsed.filter(
            (a: any) =>
              (a.placement === "experiences" ||
                a.target?.targetType === "activity" ||
                a.target?.ctaLink?.includes("/experiences")) &&
              a.isActive &&
              a.approvedByAdmin
          );
          if (expAds.length > 0) {
            const dynamicSlides: ExperienceOfferSlide[] = expAds.map((a: any) => ({
              id: a.id,
              badge: a.creative?.badgeText || "Curated Experience",
              title: a.creative?.headline || a.adName,
              subtitle: a.creative?.subHeadline || "",
              ctaText: a.creative?.buttonText || "Explore Experiences",
              image: a.creative?.imageUrl || "https://images.unsplash.com/photo-1504276048855-f58379e20788",
              price: a.creative?.price ? `₹${a.creative.price}` : "₹2,500",
              priceUnit: a.creative?.priceUnit || "/ flight",
              features: Array.isArray(a.creative?.features) && a.creative.features.length > 0
                ? a.creative.features.map((f: any, i: number) => ({
                    icon: (["bed", "dining", "compass"][i % 3] as any),
                    label: typeof f === "string" ? f : f.label,
                  }))
                : [
                    { icon: "bed", label: "450m Elevation" },
                    { icon: "dining", label: "Refreshments Included" },
                    { icon: "compass", label: "4K GoPro Footage" },
                  ],
              filterCategory: "adventure",
              filterDestination: "Panchgani",
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

    const titleText =
      slide.title ||
      `${slide.titlePrefix ? slide.titlePrefix + " " : ""}${slide.titleHighlight || ""}`.trim();

    // Clean price string
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
      title: titleText,
      subtitle: slide.subtitle,
      features: featureItems,
      ctaText: slide.ctaText,
      price: cleanPrice,
      priceUnit: cleanUnit,
      image: slide.image,
      filterCategory: slide.filterCategory,
      filterDestination: slide.filterDestination,
      rawSlide: slide,
    };
  });

  const handleSelect = (blendSlide: AdBlendSlide) => {
    if (onSelectSlide && blendSlide.rawSlide) {
      onSelectSlide(blendSlide.rawSlide);
    } else {
      const catalogEl = document.getElementById("experiences-catalog");
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <AdBlendBanner
      slides={mappedSlides}
      onSelectSlide={handleSelect}
      ctaDefaultTargetId="experiences-catalog"
      id="experiences-offer-ad-carousel"
    />
  );
}
