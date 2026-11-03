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

export const EXPLORE_HOTEL_AD_SLIDES: HotelAdSlide[] = [
  {
    id: "p5001-lakeview",
    badge: "Featured Collection",
    categoryTag: "LAKEVIEW RESORT & SPA",
    title: "Lakeview Luxury Villas",
    subtitle: "Private pools, stunning views and curated experiences",
    ctaText: "Explore Stays",
    image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1920&q=85",
    hotelName: "Lakeview Luxury Villas & Suites",
    location: "Venna Lake, Mahabaleshwar",
    price: "₹8,999",
    priceUnit: "/ night",
    features: [
      { icon: "bed", label: "Private Pool" },
      { icon: "dining", label: "Fine Dining" },
      { icon: "compass", label: "Curated Experiences" },
    ],
    thumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    filterDestination: "Mahabaleshwar",
    filterAmenity: "pool",
  },
  {
    id: "p5002-sunset",
    badge: "Featured Collection",
    categoryTag: "CLIFFTOP VILLA TAKEOVER",
    title: "Sunset Ridge Clifftop Villa",
    subtitle: "Standalone 4BHK villa with infinity pool, panoramic valley views & private chef.",
    ctaText: "Explore Villas",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
    hotelName: "Sunset Ridge Private Villa",
    location: "Table Land, Panchgani",
    price: "₹18,500",
    priceUnit: "/ night",
    features: [
      { icon: "bed", label: "Infinity Pool" },
      { icon: "dining", label: "Private Chef & BBQ" },
      { icon: "compass", label: "Valley Views" },
    ],
    thumbnail: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
    filterDestination: "Panchgani",
    filterAmenity: "pool",
  },
  {
    id: "p5003-heritage",
    badge: "Featured Collection",
    categoryTag: "ESTATE BUNGALOW & SPA",
    title: "Strawberry Valley Heritage Estate",
    subtitle: "Colonial style resort surrounded by pine forests, heated Jacuzzi and bonfire nights.",
    ctaText: "Explore Estate",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    hotelName: "Strawberry Valley Heritage Resort",
    location: "Old Mahabaleshwar",
    price: "₹6,499",
    priceUnit: "/ night",
    features: [
      { icon: "bed", label: "Jacuzzi Suite" },
      { icon: "dining", label: "Buffet Breakfast" },
      { icon: "compass", label: "Forest Trails" },
    ],
    thumbnail: "https://images.unsplash.com/photo-1582719508461-905c673771fd",
    filterDestination: "Mahabaleshwar",
    filterAmenity: "breakfast included",
  },
];

interface ExploreHotelAdCarouselProps {
  slides?: HotelAdSlide[];
  onSelectSlide?: (slide: HotelAdSlide) => void;
}

export default function ExploreHotelAdCarousel({
  slides = EXPLORE_HOTEL_AD_SLIDES,
  onSelectSlide,
}: ExploreHotelAdCarouselProps) {
  const [activeSlides, setActiveSlides] = useState<HotelAdSlide[]>(slides);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mahastays_db_ads");
        if (stored) {
          const parsed = JSON.parse(stored);
          const staysAds = parsed.filter(
            (a: any) =>
              (a.placement === "stays" ||
                a.placement === "search_results" ||
                a.target?.targetType === "property" ||
                a.target?.ctaLink?.includes("/explore")) &&
              a.isActive &&
              a.approvedByAdmin
          );
          if (staysAds.length > 0) {
            const dynamicSlides: HotelAdSlide[] = staysAds.map((a: any) => ({
              id: a.id,
              badge: a.creative?.badgeText || "Featured Collection",
              title: a.creative?.headline || a.adName,
              subtitle: a.creative?.subHeadline || "",
              ctaText: a.creative?.buttonText || "Explore Stays",
              image: a.creative?.imageUrl || "https://images.unsplash.com/photo-1540541338287-41700207dee6",
              price: a.creative?.price ? `₹${a.creative.price}` : "₹8,999",
              priceUnit: a.creative?.priceUnit || "/ night",
              features: Array.isArray(a.creative?.features) && a.creative.features.length > 0
                ? a.creative.features.map((f: any, i: number) => ({
                    icon: (["bed", "dining", "compass"][i % 3] as any),
                    label: typeof f === "string" ? f : f.label,
                  }))
                : [
                    { icon: "bed", label: "Private Pool" },
                    { icon: "dining", label: "Fine Dining" },
                    { icon: "compass", label: "Curated Experiences" },
                  ],
              filterDestination: "Mahabaleshwar",
              filterAmenity: "pool",
            }));
            setActiveSlides([...dynamicSlides, ...slides]);
            return;
          }
        }
      } catch {}
    }
    setActiveSlides(slides);
  }, [slides]);

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

    // Clean price string for the large display
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
