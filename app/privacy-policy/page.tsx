import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Review the privacy policy for Mahastays Hospitality. Learn how we safeguard your personal information, payment credentials, and booking data.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-roboto antialiased">
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-34 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-[#ea110d] bg-red-50 px-3.5 py-1.5 rounded-full inline-block mb-3 font-poppins">
              Legal &amp; Privacy
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-poppins">
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Last updated: October 2026 · Compliant with Digital Personal Data Protection Act (DPDPA)
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                1. Overview &amp; Scope
              </h2>
              <p>
                Mahastays Inc. (&ldquo;Mahastays&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the Mahastays website, booking platform, and concierge services. We respect your privacy and are committed to protecting personal information collected through our platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                2. Information We Collect
              </h2>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
                <li><strong>Identity &amp; Contact:</strong> Full legal name, email address, mobile phone number, and member identification.</li>
                <li><strong>Reservation Information:</strong> Property preferences, check-in/out dates, guest counts, and special culinary or accessibility requests.</li>
                <li><strong>Transactional Data:</strong> Payment order references, billing history, and vouchers (credit card numbers are processed via Razorpay and never stored on our servers).</li>
                <li><strong>Technical &amp; Log Data:</strong> Device browser, IP address, and cookie tokens used to preserve login authentication and preferences.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                3. How We Use Your Information
              </h2>
              <p>
                We use collected information solely to fulfill hotel and villa reservations, dispatch instant WhatsApp and email booking vouchers, coordinate with on-ground villa caretakers, and send crucial itinerary updates.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                4. Data Protection &amp; Security
              </h2>
              <p>
                All data transmission between your browser and Mahastays servers is protected using 256-bit TLS/SSL encryption. Payment sessions are hosted by PCI-DSS Level 1 certified gateways.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-poppins">
                5. Your Privacy Rights
              </h2>
              <p>
                You may request access to, correction of, or deletion of your personal account data at any time by contacting our Data Protection Officer at <a href="mailto:privacy@mahastays.com" className="text-[#ea110d] font-bold hover:underline">privacy@mahastays.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
