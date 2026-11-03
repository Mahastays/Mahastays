'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { loadSavedAuth } from './slices/authSlice';
import { fetchProperties } from './slices/propertiesSlice';
import { fetchPackages } from './slices/packagesSlice';
import { fetchExperiences } from './slices/experiencesSlice';
import { fetchBookings } from './slices/bookingsSlice';
import { fetchAds } from './slices/adsSlice';
import { fetchVendors } from './slices/vendorsSlice';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Rehydrate auth state on mount
    store.dispatch(loadSavedAuth());

    // Purge any stale client mock data from previous sessions
    if (typeof window !== 'undefined') {
      const dummyMarkers = ['prop_01', '0006789', 'pkg_01', 'exp_01', 'ad_01'];
      ['mahastays_db_properties', 'mahastays_db_packages', 'mahastays_db_experiences', 'mahastays_db_bookings', 'mahastays_db_guests', 'mahastays_db_ads', 'mahastays_db_vendors'].forEach((key) => {
        const val = localStorage.getItem(key);
        if (val && dummyMarkers.some((m) => val.includes(m))) {
          localStorage.removeItem(key);
        }
      });
    }

    // Initialize store slices from cache/api
    store.dispatch(fetchProperties());
    store.dispatch(fetchPackages());
    store.dispatch(fetchExperiences());
    store.dispatch(fetchBookings());
    store.dispatch(fetchAds());
    store.dispatch(fetchVendors());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}

export default StoreProvider;
