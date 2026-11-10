'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Star,
  XCircle,
  Calendar,
  Layers,
  Sparkles,
  Trash2,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PackageItem } from '../../types';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';
import DashboardSkeleton from '../common/DashboardSkeleton';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPackages } from '../../store/slices/packagesSlice';
import { fetchVendors } from '../../store/slices/vendorsSlice';

interface PackagesViewProps {
  onOpenCreateModal: () => void;
  onOpenRejectModal: (kind: 'package', id: string, name: string) => void;
}

export default function PackagesView({ onOpenCreateModal, onOpenRejectModal }: PackagesViewProps) {
  const dispatch = useAppDispatch();
  const { user, activeViewMode } = useAuth();
  const { packages, vendors, approvePackage, deletePackage, togglePackageBooking } = useData();
  const { loading } = useAppSelector((state) => state.packages);

  const [filter, setFilter] = useState<'all' | 'active' | 'pending_approval' | 'rejected'>('all');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('all');
  const [packageToDelete, setPackageToDelete] = useState<PackageItem | null>(null);

  const isAdmin = activeViewMode === 'admin';
  const currentVendorId = user?.vendorId || (user?.role === 'vendor' ? user?.id : undefined);

  // Fetch when Packages view mounts
  useEffect(() => {
    dispatch(fetchPackages());
    dispatch(fetchVendors());
  }, [dispatch]);

  const roleFiltered = packages.filter((pkg) => {
    if (!isAdmin) {
      if (currentVendorId) {
        const match =
          pkg.vendorId === currentVendorId ||
          pkg.vendorId === user?.vendorCode ||
          (user?.id && pkg.vendorId === user.id) ||
          (pkg as any).hostId === currentVendorId;
        if (!match) return false;
      }
    } else {
      if (selectedVendorFilter !== 'all' && pkg.vendorId !== selectedVendorFilter) return false;
    }
    if (filter === 'all') return true;
    return pkg.status === filter;
  });

  if (loading && packages.length === 0) {
    return <DashboardSkeleton type="cards" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
            {(['all', 'active', 'pending_approval', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-lg capitalize transition flex items-center gap-1.5 ${
                  filter === status
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <span>{status.replace('_', ' ')}</span>
                {status === 'pending_approval' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            ))}
          </div>

          {/* Admin Vendor Filter Dropdown */}
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Partner:</span>
              <select
                value={selectedVendorFilter}
                onChange={(e) => setSelectedVendorFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value="all">All Vendors ({vendors.length})</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.businessName} ({v.displayName})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Tour Package</span>
        </button>
      </div>

      {/* Grid of Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {roleFiltered.map((pkg) => {
          const isPending = pkg.status === 'pending_approval';
          const isApproved = pkg.status === 'active';
          const isRejected = pkg.status === 'rejected';

          return (
            <div
              key={pkg.id}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-rose-200 transition group"
            >
              <div>
                <Link href={`/dashboard/packages/${pkg.id}`} className="block relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pkg.thumbnail}
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 uppercase tracking-wider backdrop-blur-md">
                      {pkg.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-600/90 text-white backdrop-blur-md">
                      {pkg.durationDays}D / {pkg.durationNights}N
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    {isApproved && (
                      <>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          Live
                        </span>
                        {pkg.acceptingBookings === false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs">
                            Bookings Paused
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700/80 text-white shadow-xs">
                            Bookings Open
                          </span>
                        )}
                      </>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-xs animate-pulse">
                        <Clock className="w-3 h-3" />
                        Pending Approval
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-xs">
                        <XCircle className="w-3 h-3" />
                        Rejected
                      </span>
                    )}
                  </div>
                </Link>

                <div className="p-5 space-y-3">
                  <div>
                    <Link href={`/dashboard/packages/${pkg.id}`}>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 transition">
                        {pkg.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{pkg.location}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {pkg.shortDesc}
                  </p>

                  {/* Inclusions summary */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Key Inclusions
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {pkg.inclusions.slice(0, 3).map((inc, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300 font-medium"
                        >
                          ✓ {inc.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  {pkg.rejectionReason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 text-xs text-rose-700">
                      <span className="font-bold">Admin Feedback: </span>
                      {pkg.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="p-5 pt-0">
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Price per person</div>
                    <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      ₹{pkg.numericPrice.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/packages/${pkg.id}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 transition flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      View & Edit
                    </Link>

                    {isAdmin && isPending ? (
                      <>
                        <button
                          onClick={() => onOpenRejectModal('package', pkg.id, pkg.title)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => approvePackage(pkg.id, user?.id)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const next = pkg.acceptingBookings === false ? true : false;
                            togglePackageBooking(pkg.id, next);
                          }}
                          title={pkg.acceptingBookings === false ? "Click to resume accepting bookings" : "Click to stop taking bookings"}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1 cursor-pointer ${
                            pkg.acceptingBookings === false
                              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {pkg.acceptingBookings === false ? "Resume Bookings" : "Pause Bookings"}
                        </button>
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          {pkg.tiers.length} Tiers
                        </span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setPackageToDelete(pkg)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete Package"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(packageToDelete)}
        onClose={() => setPackageToDelete(null)}
        onConfirm={() => {
          if (packageToDelete) {
            deletePackage(packageToDelete.id);
            setPackageToDelete(null);
          }
        }}
        title="Delete Tour Package?"
        itemName={packageToDelete?.title}
        itemType="tour package"
        message={
          <p>
            Are you sure you want to permanently delete package{' '}
            <strong className="text-slate-800 dark:text-slate-200">{packageToDelete?.title}</strong>? All associated itinerary days, tiers, and media will be permanently removed from the catalog.
          </p>
        }
      />
    </div>
  );
}
