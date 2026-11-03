"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { loadSavedAuth, fetchCurrentUser } from "./authSlice";
import { fetchProperties } from "./slices/propertyslice";
import { fetchPackages } from "./slices/packageslice";
import { fetchExperiences } from "./slices/experienceslice";
import { GoogleOAuthProvider } from "@react-oauth/google";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(loadSavedAuth());
    store.dispatch(fetchProperties());
    store.dispatch(fetchPackages());
    store.dispatch(fetchExperiences());
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("mahastays_token");
      if (token) {
        store.dispatch(fetchCurrentUser());
      }
    }
  }, []);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "1064107150409-3u62eq8n8spld2nuvoe00r3t7ev9j52u.apps.googleusercontent.com";

  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId={googleClientId}>
        {children}
      </GoogleOAuthProvider>
    </Provider>
  );
}
