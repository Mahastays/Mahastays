import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Secure Checkout & Reservation Confirmation",
  description:
    "Complete your luxury stay or holiday package booking securely. Instant digital voucher, verified payment processing, and flexible cancellation on Mahastays.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
