'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Star,
  XCircle,
  Timer,
  Users,
  Compass,
  Trash2,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ExperienceItem } from '../../types';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';

interface ExperiencesViewProps {
  onOpenCreateModal: () => void;
  onOpenRejectModal: (kind: 'experience', id: string, name: string) => void;
}

export default function ExperiencesView({
  onOpenCreateModal,
  onOpenRejectModal,
}: ExperiencesViewProps) {
  const { user, activeViewMode } = useAuth();
  const { experiences, vendors, approveExperience, deleteExperience, toggleExperienceBooking } = useData();
  const [filter, setFilter] = useState<'all' | 'active' | 'pending_approval' | 'rejected'>('all');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('all');
  const [experienceToDelete, setExperienceToDelete] = useState<ExperienceItem | null>(null);

  const isAdmin = activeViewMode === 'admin';
  const currentVendorId = user?.vendorId || (user?.role === 'vendor' ? user?.id : undefined);

  const roleFiltered = experiences.filter((exp) => {
    if (!isAdmin) {
      if (currentVendorId && exp.vendorId !== currentVendorId) return false;
    } else {
      if (selectedVendorFilter !== 'all' && exp.vendorId !== selectedVendorFilter) return false;
    }
    if (filter === 'all') return true;
    return exp.status === filter;
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
          <span>Add Mountain Experience</span>
        </button>
      </div>

      {/* Grid of Experiences */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {roleFiltered.map((exp) => {
          const isPending = exp.status === 'pending_approval';
          const isApproved = exp.status === 'active';
          const isRejected = exp.status === 'rejected';

          return (
            <div
              key={exp.id}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-rose-200 transition group"
            >
              <div>
                <Link href={`/dashboard/experiences/${exp.id}`} className="block relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={exp.image}
                    alt={exp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 uppercase tracking-wider backdrop-blur-md">
                      {exp.category}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white backdrop-blur-md ${
                        exp.difficulty === 'Easy'
                          ? 'bg-emerald-600/90'
                          : exp.difficulty === 'Moderate'
                          ? 'bg-amber-600/90'
                          : 'bg-rose-600/90'
                      }`}
                    >
                      {exp.difficulty}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    {isApproved && (
                      <>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          Live
                        </span>
                        {exp.acceptingBookings === false ? (
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
                    <Link href={`/dashboard/experiences/${exp.id}`}>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 transition">
                        {exp.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {exp.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-slate-400" />
                        {exp.duration}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {exp.description}
                  </p>

                  {/* Slots info */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Daily Time Slots
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {exp.slots.map((s) => (
                        <span
                          key={s.slotId}
                          className="text-[10px] bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                        >
                          {s.time} (Max {s.capacity})
                        </span>
                      ))}
                    </div>
                  </div>

                  {exp.rejectionReason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 text-xs text-rose-700">
                      <span className="font-bold">Admin Feedback: </span>
                      {exp.rejectionReason}
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
                      ₹{exp.numericPrice.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/experiences/${exp.id}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 transition flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      View & Edit
                    </Link>

                    {isAdmin && isPending ? (
                      <>
                        <button
                          onClick={() => onOpenRejectModal('experience', exp.id, exp.title)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => approveExperience(exp.id, user?.id)}
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
                            const next = exp.acceptingBookings === false ? true : false;
                            toggleExperienceBooking(exp.id, next);
                          }}
                          title={exp.acceptingBookings === false ? "Click to resume accepting bookings" : "Click to stop taking bookings"}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1 cursor-pointer ${
                            exp.acceptingBookings === false
                              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {exp.acceptingBookings === false ? "Resume Bookings" : "Pause Bookings"}
                        </button>
                        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                          Guide: {exp.guide?.name?.split(' ')[0] || 'Naturalist'}
                        </span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setExperienceToDelete(exp)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete Experience"
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
        isOpen={Boolean(experienceToDelete)}
        onClose={() => setExperienceToDelete(null)}
        onConfirm={() => {
          if (experienceToDelete) {
            deleteExperience(experienceToDelete.id);
            setExperienceToDelete(null);
          }
        }}
        title="Delete Experience Activity?"
        itemName={experienceToDelete?.title}
        itemType="experience"
        message={
          <p>
            Are you sure you want to permanently delete experience{' '}
            <strong className="text-slate-800 dark:text-slate-200">{experienceToDelete?.title}</strong>? All associated departure slots, timeline steps, and media will be permanently removed from the catalog.
          </p>
        }
      />
    </div>
  );
}
