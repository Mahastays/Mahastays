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
import { toast } from '../components/ui/Toast';
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
  approveProperty: (id: string, adminId?: string) => Promise<void>;
  rejectProperty: (id: string, reason: string) => Promise<void>;
  createProperty: (prop: Partial<PropertyItem>) => PropertyItem;
  updateProperty: (prop: PropertyItem) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  togglePropertyBooking: (id: string, acceptingBookings: boolean) => Promise<void>;

  // Package actions
  approvePackage: (id: string, adminId?: string) => Promise<void>;
  rejectPackage: (id: string, reason: string) => Promise<void>;
  createPackage: (pkg: Partial<PackageItem>) => PackageItem;
  updatePackage: (pkg: PackageItem) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;
  togglePackageBooking: (id: string, acceptingBookings: boolean) => Promise<void>;

  // Experience actions
  approveExperience: (id: string, adminId?: string) => Promise<void>;
  rejectExperience: (id: string, reason: string) => Promise<void>;
  createExperience: (exp: Partial<ExperienceItem>) => ExperienceItem;
  updateExperience: (exp: ExperienceItem) => Promise<void>;
  deleteExperience: (id: string) => Promise<void>;
  toggleExperienceBooking: (id: string, acceptingBookings: boolean) => Promise<void>;

  // Ad campaign actions
  createAdCampaign: (
    ad: Partial<AdCampaignItem>,
    role: 'admin' | 'vendor',
    userId: string,
    userName: string
  ) => AdCampaignItem;
  updateAdCampaign: (id: string, updates: Partial<AdCampaignItem>) => Promise<void>;
  approveAdCampaign: (id: string, adminId?: string) => Promise<void>;
  toggleAdCampaign: (id: string, active: boolean) => Promise<void>;
  deleteAdCampaign: (id: string) => Promise<void>;

  // Booking actions
  updateBookingStatus: (id: string, status: any) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
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
  verifyVendorKYC: (vendorId: string, approve: boolean, reason?: string) => Promise<void>;
  verifyVendorBank: (vendorId: string, verified: boolean) => Promise<void>;
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
      const dummyMarkers = [
        'prop_01',
        '0006789',
        'pkg_01',
        'exp_01',
        'ad_01',
        'ABCDE1234F',
        '27ABCDE1234F1Z5',
        'MTDC/2026/089',
        'photo-1507003211169-0a1dd7228f2d',
        'vnd_resort_01',
      ];
      ['mahastays_db_properties', 'mahastays_db_packages', 'mahastays_db_experiences', 'mahastays_db_bookings', 'mahastays_db_guests', 'mahastays_db_ads', 'mahastays_db_vendors'].forEach((key) => {
        const val = localStorage.getItem(key);
        if (val && dummyMarkers.some((m) => val.includes(m))) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [dispatch, isAuthenticated, activeViewMode, user?.id]);

  // ── Property Actions via Redux ──
  const approveProperty = async (id: string, adminId?: string) => {
    try {
      const res = await dispatch(approvePropertyAsync({ id, adminId }));
      if (approvePropertyAsync.fulfilled.match(res)) {
        toast.success('Property stay approved & live on catalog!', 'Listing Approved');
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to approve property');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve property');
    }
  };

  const rejectProperty = async (id: string, reason: string) => {
    try {
      const res = await dispatch(rejectPropertyAsync({ id, reason }));
      if (rejectPropertyAsync.fulfilled.match(res)) {
        toast.success('Property listing rejected with feedback note.', 'Listing Rejected');
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to reject property');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject property');
    }
  };

  const createProperty = (prop: Partial<PropertyItem>): PropertyItem => {
    dispatch(createPropertyAsync(prop))
      .unwrap()
      .then(() => toast.success('New property stay created successfully!', 'Property Created'))
      .catch((err: any) => toast.error(err?.message || (typeof err === 'string' ? err : 'Failed to create property')));
    return prop as PropertyItem;
  };

  const updateProperty = async (prop: PropertyItem) => {
    try {
      const res = await dispatch(updatePropertyAsync(prop));
      if (updatePropertyAsync.fulfilled.match(res)) {
        toast.success(`Property "${prop.name}" updated successfully!`, 'Property Saved');
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to update property');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update property');
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      const res = await dispatch(deletePropertyAsync(id));
      if (deletePropertyAsync.fulfilled.match(res)) {
        toast.success('Property removed from catalog.', 'Property Deleted');
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to delete property');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete property');
    }
  };

  const togglePropertyBooking = async (id: string, acceptingBookings: boolean) => {
    try {
      const res = await dispatch(togglePropertyBookingAsync({ id, acceptingBookings }));
      if (togglePropertyBookingAsync.fulfilled.match(res)) {
        toast.success(
          acceptingBookings ? 'Property is now accepting bookings.' : 'Property bookings paused.',
          'Booking Status'
        );
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to update booking status');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update booking status');
    }
  };

  // ── Package Actions via Redux ──
  const approvePackage = async (id: string, adminId?: string) => {
    try {
      const res = await dispatch(approvePackageAsync({ id, adminId }));
      if (approvePackageAsync.fulfilled.match(res)) {
        toast.success('Holiday package approved & published live!', 'Package Approved');
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to approve package');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve package');
    }
  };

  const rejectPackage = async (id: string, reason: string) => {
    try {
      const res = await dispatch(rejectPackageAsync({ id, reason }));
      if (rejectPackageAsync.fulfilled.match(res)) {
        toast.success('Package submission rejected with feedback note.', 'Package Rejected');
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to reject package');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject package');
    }
  };

  const createPackage = (pkg: Partial<PackageItem>): PackageItem => {
    dispatch(createPackageAsync(pkg))
      .unwrap()
      .then(() => toast.success('New holiday package created successfully!', 'Package Created'))
      .catch((err: any) => toast.error(err?.message || (typeof err === 'string' ? err : 'Failed to create package')));
    return pkg as PackageItem;
  };

  const updatePackage = async (pkg: PackageItem) => {
    try {
      const res = await dispatch(updatePackageAsync(pkg));
      if (updatePackageAsync.fulfilled.match(res)) {
        toast.success(`Package "${pkg.title}" updated successfully!`, 'Package Saved');
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to update package');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update package');
    }
  };

  const deletePackage = async (id: string) => {
    try {
      const res = await dispatch(deletePackageAsync(id));
      if (deletePackageAsync.fulfilled.match(res)) {
        toast.success('Package deleted successfully.', 'Package Deleted');
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to delete package');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete package');
    }
  };

  const togglePackageBooking = async (id: string, acceptingBookings: boolean) => {
    try {
      const res = await dispatch(togglePackageBookingAsync({ id, acceptingBookings }));
      if (togglePackageBookingAsync.fulfilled.match(res)) {
        toast.success(
          acceptingBookings ? 'Package is now accepting bookings.' : 'Package bookings paused.',
          'Booking Status'
        );
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to update booking status');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update booking status');
    }
  };

  // ── Experience Actions via Redux ──
  const approveExperience = async (id: string, adminId?: string) => {
    try {
      const res = await dispatch(approveExperienceAsync({ id, adminId }));
      if (approveExperienceAsync.fulfilled.match(res)) {
        toast.success('Experience approved & published live!', 'Experience Approved');
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to approve experience');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve experience');
    }
  };

  const rejectExperience = async (id: string, reason: string) => {
    try {
      const res = await dispatch(rejectExperienceAsync({ id, reason }));
      if (rejectExperienceAsync.fulfilled.match(res)) {
        toast.success('Experience submission rejected with feedback note.', 'Experience Rejected');
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to reject experience');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject experience');
    }
  };

  const createExperience = (exp: Partial<ExperienceItem>): ExperienceItem => {
    dispatch(createExperienceAsync(exp))
      .unwrap()
      .then(() => toast.success('New outdoor experience / activity created!', 'Experience Created'))
      .catch((err: any) => toast.error(err?.message || (typeof err === 'string' ? err : 'Failed to create experience')));
    return exp as ExperienceItem;
  };

  const updateExperience = async (exp: ExperienceItem) => {
    try {
      const res = await dispatch(updateExperienceAsync(exp));
      if (updateExperienceAsync.fulfilled.match(res)) {
        toast.success(`Experience "${exp.title}" updated successfully!`, 'Experience Saved');
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to update experience');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update experience');
    }
  };

  const deleteExperience = async (id: string) => {
    try {
      const res = await dispatch(deleteExperienceAsync(id));
      if (deleteExperienceAsync.fulfilled.match(res)) {
        toast.success('Experience deleted successfully.', 'Experience Deleted');
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to delete experience');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete experience');
    }
  };

  const toggleExperienceBooking = async (id: string, acceptingBookings: boolean) => {
    try {
      const res = await dispatch(toggleExperienceBookingAsync({ id, acceptingBookings }));
      if (toggleExperienceBookingAsync.fulfilled.match(res)) {
        toast.success(
          acceptingBookings ? 'Experience is now accepting bookings.' : 'Experience bookings paused.',
          'Booking Status'
        );
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to update booking status');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update booking status');
    }
  };

  // ── Ad Campaign Actions via Redux ──
  const createAdCampaign = (
    ad: Partial<AdCampaignItem>,
    role: 'admin' | 'vendor',
    userId: string,
    userName: string
  ): AdCampaignItem => {
    dispatch(createAdCampaignAsync({ ad, role, userId, userName }))
      .unwrap()
      .then(() => toast.success('Sponsored ad campaign created successfully!', 'Campaign Created'))
      .catch((err: any) => toast.error(err?.message || 'Failed to create ad campaign'));
    return ad as AdCampaignItem;
  };

  const updateAdCampaign = async (id: string, updates: Partial<AdCampaignItem>) => {
    try {
      await dispatch(updateAdCampaignAsync({ id, updates })).unwrap();
      toast.success('Campaign settings updated!', 'Ad Updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update ad campaign');
    }
  };

  const approveAdCampaign = async (id: string, adminId?: string) => {
    try {
      await dispatch(approveAdCampaignAsync({ id, adminId })).unwrap();
      toast.success('Ad campaign approved and activated live!', 'Ad Approved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve ad campaign');
    }
  };

  const toggleAdCampaign = async (id: string, active: boolean) => {
    try {
      await dispatch(toggleAdCampaignAsync({ id, active })).unwrap();
      toast.success(active ? 'Ad campaign activated.' : 'Ad campaign paused.', 'Ad Campaign Status');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to toggle ad campaign');
    }
  };

  const deleteAdCampaign = async (id: string) => {
    try {
      await dispatch(deleteAdCampaignAsync(id)).unwrap();
      toast.success('Ad campaign deleted.', 'Ad Removed');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete ad campaign');
    }
  };

  // ── Booking Actions via Redux ──
  const updateBookingStatus = async (id: string, status: any) => {
    try {
      const res = await dispatch(updateBookingStatusAsync({ id, status }));
      if (updateBookingStatusAsync.fulfilled.match(res)) {
        toast.success(`Booking status updated to "${status}".`, 'Booking Updated');
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to update booking status');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update booking status');
    }
  };

  const toggleChargeSelected = (bookingId: string, chargeId: string) => {
    dispatch(toggleChargeSelectedAction({ bookingId, chargeId }));
  };

  const addBookingCharge = (
    bookingId: string,
    charge: Omit<BookingChargeItem, 'id' | 'date'>
  ) => {
    dispatch(addBookingChargeAction({ bookingId, charge }));
    toast.success(`Added charge: ${charge.title} (₹${charge.amount})`, 'Charge Added');
  };

  const addBookingNote = (
    bookingId: string,
    text: string,
    authorName: string,
    authorRole: 'Admin' | 'Vendor' | 'Staff',
    avatar: string
  ) => {
    dispatch(addBookingNoteAction({ bookingId, text, authorName, authorRole, avatar }));
    toast.success('Internal guest note recorded.', 'Note Saved');
  };

  const setSelectedBooking = (booking: StayBookingItem | null) => {
    dispatch(setSelectedBookingAction(booking));
  };

  const deleteBooking = async (id: string) => {
    try {
      const res = await dispatch(deleteBookingAsync(id));
      if (deleteBookingAsync.fulfilled.match(res)) {
        toast.success('Booking record deleted.', 'Booking Removed');
      } else {
        toast.error((res.payload as string) || res.error?.message || 'Failed to delete booking');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete booking');
    }
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
    try {
      const action = await dispatch(createVendorAsync(data));
      if (createVendorAsync.fulfilled.match(action)) {
        toast.success(`Vendor partner "${data.businessName || data.displayName}" created!`, 'Vendor Created');
        return action.payload as VendorItem;
      } else {
        const msg = (action.payload as string) || 'Failed to create vendor partner';
        toast.error(msg, 'Vendor Creation Failed');
        throw new Error(msg);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create vendor partner', 'Vendor Creation Failed');
      throw err;
    }
  };

  const verifyVendorKYC = async (vendorId: string, approve: boolean, reason?: string) => {
    try {
      const action = await dispatch(verifyVendorKYCAsync({ vendorId, approve, reason }));
      if (verifyVendorKYCAsync.fulfilled.match(action)) {
        toast.success(
          approve ? 'Vendor KYC & account verified and activated!' : 'Vendor KYC marked as rejected.',
          approve ? 'KYC Approved' : 'KYC Rejected'
        );
      } else {
        const msg = (action.payload as string) || action.error?.message || 'Failed to update vendor KYC';
        toast.error(msg, 'KYC Verification Failed');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error processing vendor KYC', 'KYC Error');
    }
  };

  const verifyVendorBank = async (vendorId: string, verified: boolean) => {
    try {
      const action = await dispatch(verifyVendorBankAsync({ vendorId, verified }));
      if (verifyVendorBankAsync.fulfilled.match(action)) {
        toast.success(
          verified ? 'Vendor bank account marked as verified!' : 'Vendor bank account marked as unverified.',
          'Banking Status'
        );
      } else {
        const msg = (action.payload as string) || 'Failed to update bank status';
        toast.error(msg, 'Banking Error');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error updating bank verification');
    }
  };

  const updateVendorProfile = async (vendorId: string, data: any) => {
    try {
      const action = await dispatch(updateVendorProfileAsync({ vendorId, data }));
      if (updateVendorProfileAsync.fulfilled.match(action)) {
        toast.success('Vendor partner profile & legal records saved successfully!', 'Vendor Saved');
        return action.payload.updatedItem;
      }
      const msg = (action.payload as string) || 'Failed to update vendor partner';
      toast.error(msg, 'Save Failed');
      throw new Error(msg);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update vendor partner', 'Save Failed');
      throw err;
    }
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
