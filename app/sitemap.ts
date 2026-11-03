import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mahastays.com";
  const now = new Date();

  const routes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/explore", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/packages", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/experiences", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/why-mahastays", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/best-rate-guarantee", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/concierge-services", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/guest-reviews", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/booking-info", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/faqs", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/terms-and-conditions", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/returns-and-refunds", priority: 0.5, changeFrequency: "yearly" as const },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}

