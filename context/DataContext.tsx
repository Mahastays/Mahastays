'use client';

import React, { createContext, useContext, useEffect } from 'react';
import {
  PropertyItem,
  PackageItem,
  ExperienceItem,
  StayBookingItem,
  PackageBookingItem,
  ExperienceBookingItem,
  AdCampaignItem,
  VendorItem,
  BookingChargeItem,
} from '../types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useAuth } from './AuthContext';
import {
  fetchProperties,
  approvePropertyAsync,
  rejectPropertyAsync,
  createPropertyAsync,
  updatePropertyAsync,
  deletePropertyAsync,
  togglePropertyBookingAsync,
  setPropertiesList,
} from '../store/slices/propertiesSlice';
import {
  fetchPackages,
  approvePackageAsync,
  rejectPackageAsync,
  createPackageAsync,
  updatePackageAsync,
  deletePackageAsync,
  togglePackageBookingAsync,
  setPackagesList,
} from '../store/slices/packagesSlice';
import {
  fetchExperiences,
  approveExperienceAsync,
  rejectExperienceAsync,
  createExperienceAsync,
  updateExperienceAsync,
  deleteExperienceAsync,
  toggleExperienceBookingAsync,
  setExperiencesList,
} from '../store/slices/experiencesSlice';
import {
  fetchBookings,
  deleteBookingAsync,
  updateBookingStatusAsync,
  toggleChargeSelected as toggleChargeSelectedAction,
  addBookingCharge as addBookingChargeAction,
  addBookingNote as addBookingNoteAction,
  setSelectedBooking as setSelectedBookingAction,
} from '../store/slices/bookingsSlice';
import { fetchAdminUsers } from '../store/slices/usersSlice';
import {
  fetchAds,
  createAdCampaignAsync,
  updateAdCampaignAsync,
  approveAdCampaignAsync,
  toggleAdCampaignAsync,
  deleteAdCampaignAsync,
  setAdsList,
} from '../store/slices/adsSlice';
import {
  fetchVendors,
  createVendorAsync,
  verifyVendorKYCAsync,
  verifyVendorBankAsync,
  updateVendorProfileAsync,
  setVendorsList,
} from '../store/slices/vendorsSlice';

interface DataContextType {
  properties: PropertyItem[];
  packages: PackageItem[];
  experiences: ExperienceItem[];
  bookings: (StayBookingItem | PackageBookingItem | ExperienceBookingItem)[];
  ads: AdCampaignItem[];
  vendors: VendorItem[];
  selectedBooking: StayBookingItem | null;
  setSelectedBooking: (booking: StayBookingItem | null) => void;

  // Property actions
  approveProperty: (id: string, adminId?: string) => void;
  rejectProperty: (id: string, reason: string) => void;
  createProperty: (prop: Partial<PropertyItem>) => PropertyItem;
  updateProperty: (prop: PropertyItem) => void;
  deleteProperty: (id: string) => void;
  togglePropertyBooking: (id: string, acceptingBookings: boolean) => void;

  // Package actions
  approvePackage: (id: string, adminId?: string) => void;
  rejectPackage: (id: string, reason: string) => void;
  createPackage: (pkg: Partial<PackageItem>) => PackageItem;
  updatePackage: (pkg: PackageItem) => void;
  deletePackage: (id: string) => void;
  togglePackageBooking: (id: string, acceptingBookings: boolean) => void;

  // Experience actions
  approveExperience: (id: string, adminId?: string) => void;
  rejectExperience: (id: string, reason: string) => void;
  createExperience: (exp: Partial<ExperienceItem>) => ExperienceItem;
  updateExperience: (exp: ExperienceItem) => void;
  deleteExperience: (id: string) => void;
  toggleExperienceBooking: (id: string, acceptingBookings: boolean) => void;

  // Ad campaign actions
  createAdCampaign: (
    ad: Partial<AdCampaignItem>,
    role: 'admin' | 'vendor',
    userId: string,
    userName: string
  ) => AdCampaignItem;
  updateAdCampaign: (id: string, updates: Partial<AdCampaignItem>) => void;
  approveAdCampaign: (id: string, adminId?: string) => void;
  toggleAdCampaign: (id: string, active: boolean) => void;
  deleteAdCampaign: (id: string) => void;

  // Booking actions
  updateBookingStatus: (id: string, status: any) => void;
  deleteBooking: (id: string) => void;
  toggleChargeSelected: (bookingId: string, chargeId: string) => void;
  addBookingCharge: (bookingId: string, charge: Omit<BookingChargeItem, 'id' | 'date'>) => void;
  addBookingNote: (
    bookingId: string,
    text: string,
    authorName: string,
    authorRole: 'Admin' | 'Vendor' | 'Staff',
    avatar: string
  ) => void;

  // Vendor KYC & Creation
  createVendor: (data: {
    email: string;
    password: string;
    businessName?: string;
    displayName?: string;
    phone?: string;
    category?: 'property_host' | 'activity_operator' | 'integrated_resort';
    businessType?: 'individual' | 'proprietorship' | 'private_limited' | 'partnership';
  }) => Promise<VendorItem>;
  verifyVendorKYC: (vendorId: string, approve: boolean) => void;
  verifyVendorBank: (vendorId: string, verified: boolean) => void;
  updateVendorProfile: (vendorId: string, data: any) => Promise<any>;

  // Refresh & reset
  refreshData: () => Promise<void>;
  resetDataToDefaults: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, activeViewMode } = useAuth();

  // Redux Selectors
  const properties = useAppSelector((state) => state.properties.items);
  const packages = useAppSelector((state) => state.packages.items);
  const experiences = useAppSelector((state) => state.experiences.items);
  const bookings = useAppSelector((state) => state.bookings.items);
  const selectedBooking = useAppSelector((state) => state.bookings.selectedBooking);
  const ads = useAppSelector((state) => state.ads.items);
  const vendors = useAppSelector((state) => state.vendors.items);

  // Synchronize live data from backend MongoDB whenever user logs in or role switches
  useEffect(() => {
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

    dispatch(fetchProperties());
    dispatch(fetchPackages());
    dispatch(fetchExperiences());
    dispatch(fetchBookings());
    if (activeViewMode === 'admin') {
      dispatch(fetchVendors());
      dispatch(fetchAds());
    }
  }, [dispatch, isAuthenticated, activeViewMode, user?.id]);

  // ── Property Actions via Redux ──
  const approveProperty = (id: string, adminId?: string) => {
    dispatch(approvePropertyAsync({ id, adminId }));
  };

  const rejectProperty = (id: string, reason: string) => {
    dispatch(rejectPropertyAsync({ id, reason }));
  };

  const createProperty = (prop: Partial<PropertyItem>): PropertyItem => {
    dispatch(createPropertyAsync(prop));
    return prop as PropertyItem;
  };

  const updateProperty = (prop: PropertyItem) => {
    dispatch(updatePropertyAsync(prop));
  };

  const deleteProperty = (id: string) => {
    dispatch(deletePropertyAsync(id));
  };

  const togglePropertyBooking = (id: string, acceptingBookings: boolean) => {
    dispatch(togglePropertyBookingAsync({ id, acceptingBookings }));
  };

  // ── Package Actions via Redux ──
  const approvePackage = (id: string, adminId?: string) => {
    dispatch(approvePackageAsync({ id, adminId }));
  };

  const rejectPackage = (id: string, reason: string) => {
    dispatch(rejectPackageAsync({ id, reason }));
  };

  const createPackage = (pkg: Partial<PackageItem>): PackageItem => {
    dispatch(createPackageAsync(pkg));
    return pkg as PackageItem;
  };

  const updatePackage = (pkg: PackageItem) => {
    dispatch(updatePackageAsync(pkg));
  };

  const deletePackage = (id: string) => {
    dispatch(deletePackageAsync(id));
  };

  const togglePackageBooking = (id: string, acceptingBookings: boolean) => {
    dispatch(togglePackageBookingAsync({ id, acceptingBookings }));
  };

  // ── Experience Actions via Redux ──
  const approveExperience = (id: string, adminId?: string) => {
    dispatch(approveExperienceAsync({ id, adminId }));
  };

  const rejectExperience = (id: string, reason: string) => {
    dispatch(rejectExperienceAsync({ id, reason }));
  };

  const createExperience = (exp: Partial<ExperienceItem>): ExperienceItem => {
    dispatch(createExperienceAsync(exp));
    return exp as ExperienceItem;
  };

  const updateExperience = (exp: ExperienceItem) => {
    dispatch(updateExperienceAsync(exp));
  };

  const deleteExperience = (id: string) => {
    dispatch(deleteExperienceAsync(id));
  };

  const toggleExperienceBooking = (id: string, acceptingBookings: boolean) => {
    dispatch(toggleExperienceBookingAsync({ id, acceptingBookings }));
  };

  // ── Ad Campaign Actions via Redux ──
  const createAdCampaign = (
    ad: Partial<AdCampaignItem>,
    role: 'admin' | 'vendor',
    userId: string,
    userName: string
  ): AdCampaignItem => {
    dispatch(createAdCampaignAsync({ ad, role, userId, userName }));
    return ad as AdCampaignItem;
  };

  const updateAdCampaign = (id: string, updates: Partial<AdCampaignItem>) => {
    dispatch(updateAdCampaignAsync({ id, updates }));
  };

  const approveAdCampaign = (id: string, adminId?: string) => {
    dispatch(approveAdCampaignAsync({ id, adminId }));
  };

  const toggleAdCampaign = (id: string, active: boolean) => {
    dispatch(toggleAdCampaignAsync({ id, active }));
  };

  const deleteAdCampaign = (id: string) => {
    dispatch(deleteAdCampaignAsync(id));
  };

  // ── Booking Actions via Redux ──
  const updateBookingStatus = (id: string, status: any) => {
    dispatch(updateBookingStatusAsync({ id, status }));
  };

  const toggleChargeSelected = (bookingId: string, chargeId: string) => {
    dispatch(toggleChargeSelectedAction({ bookingId, chargeId }));
  };

  const addBookingCharge = (
    bookingId: string,
    charge: Omit<BookingChargeItem, 'id' | 'date'>
  ) => {
    dispatch(addBookingChargeAction({ bookingId, charge }));
  };

  const addBookingNote = (
    bookingId: string,
    text: string,
    authorName: string,
    authorRole: 'Admin' | 'Vendor' | 'Staff',
    avatar: string
  ) => {
    dispatch(addBookingNoteAction({ bookingId, text, authorName, authorRole, avatar }));
  };

  const setSelectedBooking = (booking: StayBookingItem | null) => {
    dispatch(setSelectedBookingAction(booking));
  };

  const deleteBooking = (id: string) => {
    dispatch(deleteBookingAsync(id));
  };

  const refreshData = async () => {
    await Promise.allSettled([
      dispatch(fetchProperties()),
      dispatch(fetchPackages()),
      dispatch(fetchExperiences()),
      dispatch(fetchBookings()),
      ...(activeViewMode === 'admin'
        ? [
            dispatch(fetchVendors()),
            dispatch(fetchAds()),
            dispatch(fetchAdminUsers({ page: 1, limit: 15 })),
          ]
        : []),
    ]);
  };

  // ── Vendor Actions via Redux ──
  const createVendor = async (data: {
    email: string;
    password: string;
    businessName?: string;
    displayName?: string;
    phone?: string;
    category?: 'property_host' | 'activity_operator' | 'integrated_resort';
    businessType?: 'individual' | 'proprietorship' | 'private_limited' | 'partnership';
  }) => {
    const action = await dispatch(createVendorAsync(data));
    if (createVendorAsync.fulfilled.match(action)) {
      return action.payload as VendorItem;
    } else {
      throw new Error((action.payload as string) || 'Failed to create vendor partner');
    }
  };

  const verifyVendorKYC = (vendorId: string, approve: boolean) => {
    dispatch(verifyVendorKYCAsync({ vendorId, approve }));
  };

  const verifyVendorBank = (vendorId: string, verified: boolean) => {
    dispatch(verifyVendorBankAsync({ vendorId, verified }));
  };

  const updateVendorProfile = async (vendorId: string, data: any) => {
    const action = await dispatch(updateVendorProfileAsync({ vendorId, data }));
    if (updateVendorProfileAsync.fulfilled.match(action)) {
      return action.payload.updatedItem;
    }
    throw new Error('Failed to update vendor partner');
  };

  // Refresh live data from backend
  const resetDataToDefaults = () => {
    if (typeof window !== 'undefined') {
      ['mahastays_db_properties', 'mahastays_db_packages', 'mahastays_db_experiences', 'mahastays_db_bookings', 'mahastays_db_guests', 'mahastays_db_ads', 'mahastays_db_vendors'].forEach((k) => {
        localStorage.removeItem(k);
      });
    }
    dispatch(fetchProperties());
    dispatch(fetchPackages());
    dispatch(fetchExperiences());
    dispatch(fetchBookings());
    dispatch(fetchVendors());
    dispatch(fetchAds());
  };

  return (
    <DataContext.Provider
      value={{
        properties,
        packages,
        experiences,
        bookings,
        ads,
        vendors,
        selectedBooking,
        setSelectedBooking,
        approveProperty,
        rejectProperty,
        createProperty,
        updateProperty,
        deleteProperty,
        togglePropertyBooking,
        approvePackage,
        rejectPackage,
        createPackage,
        updatePackage,
        deletePackage,
        togglePackageBooking,
        approveExperience,
        rejectExperience,
        createExperience,
        updateExperience,
        deleteExperience,
        toggleExperienceBooking,
        createAdCampaign,
        updateAdCampaign,
        approveAdCampaign,
        toggleAdCampaign,
        deleteAdCampaign,
        updateBookingStatus,
        deleteBooking,
        toggleChargeSelected,
        addBookingCharge,
        addBookingNote,
        createVendor,
        verifyVendorKYC,
        verifyVendorBank,
        updateVendorProfile,
        refreshData,
        resetDataToDefaults,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within a DataProvider');
  }
  return ctx;
}
