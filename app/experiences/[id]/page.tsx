import type { Metadata } from "next";
import ExperienceDetailClient from "./ExperienceDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const res = await fetch(`${apiUrl}/experiences/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      const exp = json?.data;
      if (exp) {
        const title = `${exp.title || exp.name} – ${exp.city || "Mahabaleshwar"}`;
        const description =
          exp.description ||
          exp.overview ||
          `Experience ${exp.title || exp.name} in Mahabaleshwar. Book verified slots, guided tours, and adventures with Mahastays concierge.`;
        const imageUrl = exp.gallery?.[0] || exp.image || "/hero-resort.jpg";

        return {
          title: `${title} | Mahastays`,
          description,
          alternates: {
            canonical: `/experiences/${id}`,
          },
          openGraph: {
            title: `${title} | Mahastays`,
            description,
            images: [imageUrl],
          },
          twitter: {
            card: "summary_large_image",
            title: `${title} | Mahastays`,
            description,
            images: [imageUrl],
          },
        };
      }
    }
  } catch (err) {}

  return {
    title: "Hill-Station Experience Details | Mahastays",
    description: "Discover curated activities and adventures in Mahabaleshwar with Mahastays.",
  };
}

export default async function ExperienceDetailsPage({ params }: PageProps) {
  return <ExperienceDetailClient />;
}
