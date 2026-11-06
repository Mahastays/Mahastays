"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage =
    Boolean(pathname?.startsWith("/login")) ||
    Boolean(pathname?.startsWith("/signup"));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="print:hidden">
        <Navbar />
      </div>
      <div className="flex-1 w-full">{children}</div>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
