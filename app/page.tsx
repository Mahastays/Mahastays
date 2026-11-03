import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import PopularHotels from "./components/PopularHotels";

import ExperienceShowcaseBanner from "./components/ExperienceShowcaseBanner";
import PackageSection from "./components/PackageSection";
import ActivitiesExperiences from "./components/ActivitiesExperiences";
import MahabaleshwarMapSection from "./components/MahabaleshwarMapSection";
import WhyChooseUsSection from "./components/WhyChooseUsSection";

import Footer from "./components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mahastays – Luxury Resorts, Premium Villas & Boutique Hotels in Mahabaleshwar",
  description:
    "Discover and book handpicked luxury resorts, private pool villas, scenic cottages, curated stay packages, and unforgettable adventures in Mahabaleshwar, Panchgani, and Maharashtra with Mahastays.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen w-full bg-slate-50 antialiased font-roboto">
      <Navbar />
      <Hero />
      <PopularHotels />

      <ExperienceShowcaseBanner />
      <PackageSection />
      <ActivitiesExperiences />
      <MahabaleshwarMapSection />
      <WhyChooseUsSection />

      <Footer />
    </main>
  );
}
