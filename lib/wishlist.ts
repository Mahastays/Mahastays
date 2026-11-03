"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/Toast";
import { api } from "./api";

export type WishlistTargetType = "property" | "package" | "experience";

export interface WishlistItem {
  id: string;
  type: WishlistTargetType;
  title: string;
  location?: string;
  price?: string;
  numericPrice?: number;
  image: string;
  rating?: string | number;
  category?: string;
  url?: string;
  savedAt: string;
}

const STORAGE_KEY = "mahastays_favorites";
const EVENT_NAME = "mahastays:wishlist_changed";

/** Check if current visitor has an active authenticated session */
export function isUserLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("mahastays_token");
  const user = localStorage.getItem("mahastays_user");
  return Boolean(token && user);
}

/** Get all saved items from localStorage cache */
export function getStoredFavorites(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Check if an individual item is saved */
export function isItemSaved(id: string, type?: WishlistTargetType): boolean {
  const all = getStoredFavorites();
  return all.some((item) => item.id === id && (!type || item.type === type));
}

/** Save updated favorites list and notify all subscribers */
function persistFavorites(items: WishlistItem[], changedItem?: { id: string; type: WishlistTargetType; isSaved: boolean }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: changedItem || { count: items.length },
      })
    );
  } catch (err) {
    console.warn("Failed to persist favorites:", err);
  }
}

/**
 * Toggle favorite status.
 * If user is not logged in, prevents saving and triggers a warning toast to log in.
 */
export async function toggleFavorite(
  item: {
    id: string;
    type: WishlistTargetType;
    title: string;
    location?: string;
    price?: string;
    numericPrice?: number;
    image?: string;
    rating?: string | number;
    category?: string;
    url?: string;
  }
): Promise<{ success: boolean; isSaved: boolean; reason?: string }> {
  // 1. Guard: Check if user is logged in
  if (!isUserLoggedIn()) {
    toast.warning(
      "Please log in or sign up to save this stay to your favorites and access it in your profile.",
      "Sign In Required"
    );
    return { success: false, isSaved: false, reason: "unauthenticated" };
  }

  // 2. Read existing list
  const current = getStoredFavorites();
  const exists = current.some((fav) => fav.id === item.id && fav.type === item.type);

  if (exists) {
    // Remove from favorites
    const updated = current.filter((fav) => !(fav.id === item.id && fav.type === item.type));
    persistFavorites(updated, { id: item.id, type: item.type, isSaved: false });
    toast.info(`Removed "${item.title}" from your saved favorites.`, "Removed from Favorites");

    // Attempt backend sync
    api.post("/wishlist/toggle", { targetType: item.type, targetId: item.id }).catch(() => {
      // Offline or mock item fallback, preserved locally
    });

    return { success: true, isSaved: false };
  } else {
    // Add to favorites
    const defaultUrl =
      item.url ||
      (item.type === "property"
        ? `/explore/${item.id}`
        : item.type === "package"
        ? `/packages/${item.id}`
        : `/experiences/${item.id}`);

    const newItem: WishlistItem = {
      id: item.id,
      type: item.type,
      title: item.title,
      location: item.location || "Mahabaleshwar, Maharashtra",
      price: item.price || "₹12,500",
      numericPrice: item.numericPrice,
      image: item.image || "/hero-resort.jpg",
      rating: item.rating || "4.9",
      category: item.category || (item.type === "property" ? "Luxury Villa" : item.type === "package" ? "Curated Package" : "Experience"),
      url: defaultUrl,
      savedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...current.filter((fav) => !(fav.id === item.id && fav.type === item.type))];
    persistFavorites(updated, { id: item.id, type: item.type, isSaved: true });
    toast.success(`"${item.title}" has been saved to your profile favorites.`, "Saved to Favorites");

    // Attempt backend sync
    api.post("/wishlist/toggle", { targetType: item.type, targetId: item.id }).catch(() => {
      // Offline or mock item fallback, preserved locally
    });

    return { success: true, isSaved: true };
  }
}

/** Remove single item directly by id and type */
export function removeFavorite(id: string, type: WishlistTargetType) {
  const current = getStoredFavorites();
  const target = current.find((item) => item.id === id && item.type === type);
  const updated = current.filter((item) => !(item.id === id && item.type === type));
  persistFavorites(updated, { id, type, isSaved: false });

  if (target) {
    toast.info(`Removed "${target.title}" from your favorites.`, "Favorites Updated");
  }

  if (isUserLoggedIn()) {
    api.post("/wishlist/toggle", { targetType: type, targetId: id }).catch(() => {});
  }
}

/** Hook to bind an item's favorite state reactively */
export function useWishlistItem(item?: {
  id: string;
  type: WishlistTargetType;
  title: string;
  location?: string;
  price?: string;
  numericPrice?: number;
  image?: string;
  rating?: string | number;
  category?: string;
  url?: string;
}) {
  const [isSaved, setIsSaved] = useState<boolean>(() => {
    if (!item?.id) return false;
    return isItemSaved(item.id, item.type);
  });

  useEffect(() => {
    if (!item?.id) return;
    setIsSaved(isItemSaved(item.id, item.type));

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.id === item.id && custom.detail?.type === item.type) {
        setIsSaved(custom.detail.isSaved);
      } else {
        setIsSaved(isItemSaved(item.id, item.type));
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [item?.id, item?.type]);

  const toggle = useCallback(async () => {
    if (!item) return false;
    const res = await toggleFavorite(item);
    return res.isSaved;
  }, [item]);

  return { isSaved, toggle };
}

/** Hook to retrieve and subscribe to all favorites (for Profile page) */
export function useFavoritesList() {
  const [favorites, setFavorites] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(() => {
    const list = getStoredFavorites();
    setFavorites(list);
  }, []);

  useEffect(() => {
    refresh();
    setIsLoading(false);

    // Initial sync with server if logged in
    if (isUserLoggedIn()) {
      api
        .get("/wishlist")
        .then((res) => {
          const data = res.data?.data || res.data;
          const items = data?.items;
          if (items) {
            const serverFavorites: WishlistItem[] = [];

            (items.properties || []).forEach((p: any) => {
              serverFavorites.push({
                id: p.id || p._id,
                type: "property",
                title: p.title || p.name,
                location: `${p.city || "Mahabaleshwar"}, ${p.state || "Maharashtra"}`,
                price: p.priceFrom ? `₹${Number(p.priceFrom).toLocaleString("en-IN")}` : "₹12,000",
                numericPrice: p.priceFrom,
                image: p.heroImage || p.coverImage || "/hero-resort.jpg",
                rating: p.ratingAvg || "4.9",
                category: p.propertyType || "Villa",
                url: `/explore/${p.id || p._id}`,
                savedAt: new Date().toISOString(),
              });
            });

            (items.packages || []).forEach((pkg: any) => {
              serverFavorites.push({
                id: pkg.id || pkg._id,
                type: "package",
                title: pkg.title || pkg.name,
                location: `${pkg.destination || pkg.city || "Mahabaleshwar"}`,
                price: pkg.priceInr ? `₹${Number(pkg.priceInr).toLocaleString("en-IN")}` : "₹18,000",
                numericPrice: pkg.priceInr,
                image: pkg.heroImage || pkg.images?.[0] || "/hero-resort.jpg",
                rating: pkg.rating || "4.8",
                category: "Curated Package",
                url: `/packages/${pkg.id || pkg._id}`,
                savedAt: new Date().toISOString(),
              });
            });

            (items.experiences || []).forEach((exp: any) => {
              serverFavorites.push({
                id: exp.id || exp._id,
                type: "experience",
                title: exp.title || exp.name,
                location: exp.location || "Mahabaleshwar",
                price: exp.priceInr ? `₹${Number(exp.priceInr).toLocaleString("en-IN")}` : "₹2,500",
                numericPrice: exp.priceInr,
                image: exp.heroImage || exp.images?.[0] || "/hero-resort.jpg",
                rating: exp.rating || "4.9",
                category: exp.category || "Experience",
                url: `/experiences/${exp.id || exp._id}`,
                savedAt: new Date().toISOString(),
              });
            });

            if (serverFavorites.length > 0) {
              const local = getStoredFavorites();
              // Merge local and server without duplicates
              const mergedMap = new Map<string, WishlistItem>();
              serverFavorites.forEach((item) => mergedMap.set(`${item.type}:${item.id}`, item));
              local.forEach((item) => mergedMap.set(`${item.type}:${item.id}`, item));
              const merged = Array.from(mergedMap.values());
              persistFavorites(merged);
              setFavorites(merged);
            }
          }
        })
        .catch(() => {
          // Ignore network errors or unauthenticated API responses
        });
    }

    const handleUpdate = () => {
      refresh();
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  return {
    favorites,
    isLoading,
    count: favorites.length,
    remove: removeFavorite,
    refresh,
  };
}

