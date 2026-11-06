import type { Metadata } from "next";
import StayDetailClient from "./StayDetailClient";
import PlaceDetailClient from "./PlaceDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  // 1. Check if it's a famous place
  try {
    const placeRes = await fetch(`${apiUrl}/places/${id}`, { next: { revalidate: 60 } });
    if (placeRes.ok) {
      const placeJson = await placeRes.json();
      const place = placeJson?.data;
      if (place) {
        const title = `${place.name} – ${place.vicinity} | Mahastays Explore`;
        const description = place.shortDescription || `Explore ${place.name} in ${place.vicinity}, Mahabaleshwar.`;
        const img = place.coverImage || place.images?.[0] || "/brand/mahastays-logo-main.png";
        return {
          title,
          description,
          alternates: { canonical: `/explore/${id}` },
          openGraph: { title, description, images: [img] },
          twitter: { card: "summary_large_image", title, description, images: [img] },
        };
      }
    }
  } catch {}

  // 2. Check if it's a stay property (for backward compatibility)
  try {
    const stayRes = await fetch(`${apiUrl}/properties/${id}`, { next: { revalidate: 60 } });
    if (stayRes.ok) {
      const stayJson = await stayRes.json();
      const stay = stayJson?.data;
      if (stay) {
        const title = `${stay.name} – ${stay.location || stay.city || "Mahabaleshwar"}`;
        const description =
          stay.description ||
          `Book ${stay.name} at the best guaranteed direct rate with Mahastays. Verified luxury property with 24/7 on-ground concierge.`;
        const imageUrl =
          typeof stay.images?.[0] === "string"
            ? stay.images[0]
            : stay.images?.[0]?.url || "/hero-resort.jpg";

        return {
          title: `${title} | Mahastays`,
          description,
          alternates: { canonical: `/explore/${id}` },
          openGraph: { title: `${title} | Mahastays`, description, images: [imageUrl] },
          twitter: { card: "summary_large_image", title: `${title} | Mahastays`, description, images: [imageUrl] },
        };
      }
    }
  } catch {}

  return {
    title: "Explore Landmark | Mahastays",
    description: "Explore famous viewpoints, waterfalls, and attractions in Mahabaleshwar.",
  };
}

export default async function ExploreItemPage({ params }: PageProps) {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  // Check if it's a place first
  try {
    const res = await fetch(`${apiUrl}/places/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) {
        return <PlaceDetailClient initialPlace={json.data} slug={id} />;
      }
    }
  } catch {}

  // Fallback to stay detail
  return <StayDetailClient />;
}
