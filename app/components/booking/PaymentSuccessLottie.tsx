"use client";

import React, { useEffect, useRef, useState } from "react";

interface PaymentSuccessLottieProps {
  className?: string;
  size?: number;
  loop?: boolean;
}

export default function PaymentSuccessLottie({
  className = "",
  size = 64,
  loop = false,
}: PaymentSuccessLottieProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let anim: any = null;
    let isMounted = true;

    // Dynamically load lottie-web on client
    import("lottie-web").then((lottieModule) => {
      const lottie = lottieModule.default || lottieModule;
      if (!isMounted || !containerRef.current) return;

      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop,
        autoplay: true,
        path: "/payment-success.json",
      });

      anim.addEventListener("DOMLoaded", () => {
        if (isMounted) setLoaded(true);
      });
    });

    return () => {
      isMounted = false;
      anim?.destroy();
    };
  }, [loop]);

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <div ref={containerRef} className="w-full h-full flex items-center justify-center" />

      {/* Fallback checkmark while lottie loads */}
      {!loaded && (
        <div
          style={{ width: size, height: size }}
          className="absolute inset-0 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-2xl shadow-sm animate-pulse"
        >
          ✓
        </div>
      )}
    </div>
  );
}

