'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BedDouble,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Plus,
  ShieldAlert,
  Sparkles,
  Star,
  XCircle,
  Building2,
  Eye,
  Trash2,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PropertyItem } from '../../types';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';

interface PropertiesViewProps {
  onOpenCreateModal: () => void;
  onOpenRejectModal: (kind: 'property', id: string, name: string) => void;
}

export default function PropertiesView({
  onOpenCreateModal,
  onOpenRejectModal,
}: PropertiesViewProps) {
  const { user, activeViewMode } = useAuth();
  const { properties, vendors, approveProperty, deleteProperty, togglePropertyBooking } = useData();
  const [filter, setFilter] = useState<'all' | 'active' | 'pending_approval' | 'rejected'>('all');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('all');
  const [selectedProperty, setSelectedProperty] = useState<PropertyItem | null>(null);
  const [propToDelete, setPropToDelete] = useState<PropertyItem | null>(null);

  const isAdmin = activeViewMode === 'admin';
  const currentVendorId = user?.vendorId || (user?.role === 'vendor' ? user?.id : undefined);

  // Filter properties: vendors only see their own properties; admin sees all or filtered by vendor
  const roleFiltered = properties.filter((p) => {
    if (!isAdmin) {
      if (currentVendorId && p.vendorId !== currentVendorId) return false;
    } else {
      if (selectedVendorFilter !== 'all' && p.vendorId !== selectedVendorFilter) return false;
    }
    if (filter === 'all') return true;
    return p.status === filter;
  });

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
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Partner:</span>
              </span>
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

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* Grid of Properties */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {roleFiltered.map((prop) => {
          const isPending = prop.status === 'pending_approval';
          const isApproved = prop.status === 'active';
          const isRejected = prop.status === 'rejected';

          return (
            <div
              key={prop.id}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-rose-200 transition group"
            >
              <div>
                {/* Image Banner with Badges */}
                <Link href={`/dashboard/hotels/${prop.id}`} className="block relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prop.images[0]}
                    alt={prop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {/* Property type badge */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-slate-200 uppercase tracking-wider shadow-xs">
                      {prop.propertyType}
                    </span>
                    {prop.badge && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-600/90 text-white backdrop-blur-md shadow-xs">
                        {prop.badge}
                      </span>
                    )}
                  </div>

                  {/* Status Pill on top right */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    {isApproved && (
                      <>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          Active (Live)
                        </span>
                        {prop.acceptingBookings === false ? (
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

                {/* Content details */}
                <div className="p-5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <Link href={`/dashboard/hotels/${prop.id}`}>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 transition">
                          {prop.name}
                        </h3>
                      </Link>
                      {prop.rating > 0 && (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{prop.rating}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{prop.location}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {prop.description}
                  </p>

                  {/* Rooms & Vendor info */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                      {prop.rooms.length} Room Types
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Host: {prop.vendorName.split(' ')[0]}
                    </span>
                  </div>

                  {/* Rejection Notice if any */}
                  {prop.rejectionReason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
                      <span className="font-bold">Admin Feedback: </span>
                      {prop.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="p-5 pt-0">
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Starting from</div>
                    <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      ₹{prop.numericPrice.toLocaleString()}{' '}
                      <span className="text-[11px] font-normal text-slate-400">/ night</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/hotels/${prop.id}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 transition flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      View & Edit
                    </Link>

                    {isAdmin && isPending ? (
                      <>
                        <button
                          onClick={() => onOpenRejectModal('property', prop.id, prop.name)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 transition"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => approveProperty(prop.id, user?.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => setPropToDelete(prop)}
                          title="Delete Property"
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const next = prop.acceptingBookings === false ? true : false;
                            togglePropertyBooking(prop.id, next);
                          }}
                          title={prop.acceptingBookings === false ? "Click to resume accepting bookings" : "Click to stop taking bookings"}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1 cursor-pointer ${
                            prop.acceptingBookings === false
                              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {prop.acceptingBookings === false ? "Resume Bookings" : "Pause Bookings"}
                        </button>
                        <button
                          onClick={() => setSelectedProperty(prop)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
                        >
                          Rooms
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setPropToDelete(prop)}
                            title="Delete Property"
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
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

      {/* Property Room Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedProperty.name}
                </h3>
                <p className="text-xs text-slate-400">{selectedProperty.location}</p>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Available Rooms & Inventory
              </div>

              {selectedProperty.rooms.map((room) => (
                <div
                  key={room.roomId}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={room.images[0] || selectedProperty.images[0]}
                      alt={room.name}
                      className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {room.name}
                      </h4>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Max: {room.maxGuests} Guests • {room.count} units available
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {room.amenities.map((a, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      ₹{room.basePrice.toLocaleString()} / night
                    </div>
                    {room.originalPrice && (
                      <div className="text-xs text-slate-400 line-through">
                        ₹{room.originalPrice.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedProperty(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Property Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(propToDelete)}
        onClose={() => setPropToDelete(null)}
        onConfirm={() => {
          if (propToDelete) {
            deleteProperty(propToDelete.id);
            setPropToDelete(null);
          }
        }}
        title="Delete Property Listing?"
        itemName={propToDelete?.name}
        message={
          <p>
            Are you sure you want to permanently delete{' '}
            <strong className="text-slate-800 dark:text-slate-200">{propToDelete?.name}</strong>?
            This will remove the property and its associated rooms from the platform catalog.
          </p>
        }
        confirmButtonText="Delete Property"
      />
    </div>
  );
}
