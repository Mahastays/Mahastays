import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mahastays.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/profile",
          "/checkout",
          "/cookie-settings",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

