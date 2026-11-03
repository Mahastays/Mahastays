import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms of service, user agreement, reservation policies, guest conduct code, and property liability guidelines for Mahastays bookings.",
  alternates: {
    canonical: "/terms-and-conditions",
  },
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-roboto antialiased">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-34 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-[#ea110d] bg-red-50 px-3.5 py-1.5 rounded-full inline-block mb-3 font-poppins">
              User Agreement
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-poppins">
              Terms &amp; Conditions
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Please read these booking and platform terms carefully prior to completing any reservation.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing Mahastays or booking any stay, villa, package, or experience, you agree to be legally bound by these Terms and Conditions and our Privacy Policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                2. Guest Age &amp; Identification Requirements
              </h2>
              <p>
                The primary guest making the reservation must be at least 18 years of age. Valid government photo identification (Aadhaar, Passport, or Driver&apos;s License) is mandatory for every guest occupying the premises.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                3. Property Rules &amp; Security Deposits
              </h2>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
                <li>Guests must abide by house rules regarding quiet hours, pool operating guidelines, and smoking restrictions.</li>
                <li>Certain luxury villas may collect a refundable security deposit at check-in, which is fully returned upon check-out post inspection.</li>
                <li>Any intentional damage to property structure, furniture, or electronic appliances will be charged directly to the primary guest.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                4. Pricing &amp; Payment Confirmation
              </h2>
              <p>
                Prices shown on Mahastays are quoted in Indian Rupees (INR) and include all applicable taxes unless otherwise noted. A reservation is officially confirmed only upon successful payment authorization.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                5. Governing Law &amp; Jurisdiction
              </h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Maharashtra, India.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
