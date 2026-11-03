'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  Printer,
  RotateCcw,
  Send,
  Sparkles,
  User,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Edit3,
  X,
  Building,
  HeartHandshake,
  Star,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { addGuestNote, updateGuestProfile } from '../../store/slices/bookingsSlice';
import { GuestProfile, StayBookingItem, AnyBooking } from '../../types';

interface GuestDetailHistoryViewProps {
  id: string;
}

export default function GuestDetailHistoryView({ id }: GuestDetailHistoryViewProps) {
  const router = useRouter();
  const { user, activeViewMode } = useAuth();
  const dispatch = useAppDispatch();
  const guests = useAppSelector((state) => state.bookings.guests);
  const allBookings = useAppSelector((state) => state.bookings.items);

  const isAdmin = activeViewMode === 'admin';

  // Find guest by ID or guestCode
  const guest = useMemo(() => {
    return (
      guests.find((g) => g.id === id || g.guestCode === id || g.guestCode === `#${id}`) ||
      guests[0]
    );
  }, [guests, id]);

  // Find all lifetime bookings for this guest
  const guestBookings = useMemo(() => {
    if (!guest) return [];
    return allBookings.filter(
      (b) =>
        b.userId === guest.id ||
        (b.guestName && b.guestName.toLowerCase() === guest.name.toLowerCase()) ||
        (guest.email && b.guestEmail && b.guestEmail.toLowerCase() === guest.email.toLowerCase())
    );
  }, [allBookings, guest]);

  // Modals & form state
  const [newNoteText, setNewNoteText] = useState('');
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [dietaryInput, setDietaryInput] = useState('');
  const [bedInput, setBedInput] = useState('');
  const [floorInput, setFloorInput] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [specialNotesInput, setSpecialNotesInput] = useState('');

  // Open preferences editor pre-filled
  const handleOpenEditPreferences = () => {
    setDietaryInput(guest?.preferences?.dietary || '');
    setBedInput(guest?.preferences?.bedType || '');
    setFloorInput(guest?.preferences?.floorPreference || '');
    setAllergiesInput(guest?.preferences?.allergies || '');
    setSpecialNotesInput(guest?.preferences?.specialNotes || '');
    setIsEditingPreferences(true);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest) return;
    dispatch(
      updateGuestProfile({
        guestId: guest.id,
        updates: {
          preferences: {
            dietary: dietaryInput,
            bedType: bedInput,
            floorPreference: floorInput,
            allergies: allergiesInput,
            specialNotes: specialNotesInput,
          },
        },
      })
    );
    setIsEditingPreferences(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !guest) return;
    dispatch(
      addGuestNote({
        guestId: guest.id,
        text: newNoteText.trim(),
        authorName: user?.name || (isAdmin ? 'Admin Concierge' : 'Guest Relations'),
        authorRole: isAdmin ? 'Admin' : 'Front Desk',
      })
    );
    setNewNoteText('');
  };

  if (!guest) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
        <User className="w-12 h-12 text-slate-300 stroke-[1.5] mb-3" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Guest Profile Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          No guest profile exists with the specified identification.
        </p>
        <Link
          href="/dashboard/guests"
          className="mt-4 px-4 py-2 bg-[#134E4A] text-white rounded-xl text-xs font-semibold hover:bg-[#0f3d3a] transition-colors"
        >
          Return to Guest Bookings
        </Link>
      </div>
    );
  }

  // Calculate dynamic statistics
  const totalLifetimeSpend = guestBookings.reduce((sum, b) => {
    if (b.type === 'stay') return sum + (b as StayBookingItem).grandTotalInr;
    return sum + ((b as any).totalAmount || 0);
  }, 0);

  const completedStays = guestBookings.filter(
    (b) =>
      b.type === 'stay' &&
      ((b as StayBookingItem).bookingStatus === 'confirmed' ||
        (b as StayBookingItem).bookingStatus === 'checked_in' ||
        (b as StayBookingItem).bookingStatus === 'checked_out')
  ).length;

  const cancelledBookings = guestBookings.filter(
    (b) =>
      (b.type === 'stay' && (b as StayBookingItem).bookingStatus === 'cancelled') ||
      b.bookingStatus === 'cancelled'
  ).length;

  return (
    <div className="space-y-6 pb-16 w-full max-w-[1720px] mx-auto">
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/guests"
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
            title="Back to Bookings"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Guest Profile: {guest.name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#FCE8E8] text-[#F05353] border border-[#FAD0D0]">
                {guest.guestCode}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {guest.nationality} &bull; Member since {guest.memberSince || 'Oct 2024'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenEditPreferences}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Preferences</span>
          </button>

          <a
            href={`mailto:${guest.email}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#134E4A] hover:bg-[#0f3d3a] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-300" />
            <span>Send Email</span>
          </a>
        </div>
      </div>

      {/* ── Guest Hero Banner & KPI Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Guest Identity Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="relative inline-block mb-3">
              <img
                src={guest.avatar}
                alt={guest.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-800 shadow-md"
              />
              {guest.vipStatus && (
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 border-2 border-white dark:border-slate-900 shadow-xs">
                  {guest.vipTier || 'Gold'} VIP
                </span>
              )}
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white">{guest.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-[#F05353]">{guest.guestCode}</span>
              {guest.isVerified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Verified KYC
                </span>
              )}
            </div>

            <div className="mt-5 space-y-2 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{guest.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{guest.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{guest.city || 'Jakarta'}, {guest.nationality}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>{guest.idCardType || 'Passport'}: {guest.idCardNumber || 'IDN-8829-0192'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lifetime KPI Cards (3 Columns) */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Lifetime Spend */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Lifetime Spend
            </span>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-extrabold text-[#134E4A] dark:text-emerald-400">
                ₹{(totalLifetimeSpend || guest.stats?.totalSpent || 42560).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                High Value Guest
              </span>
            </div>
          </div>

          {/* Total Bookings */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Bookings
            </span>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {guestBookings.length || guest.stats?.totalBookings || 3}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Across Stays & Tours
              </span>
            </div>
          </div>

          {/* Completed Stays */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Completed Stays
            </span>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
                {completedStays || guest.stats?.completedStays || 2}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {cancelledBookings || guest.stats?.cancelledBookings || 1} Cancelled / Refund
              </span>
            </div>
          </div>

          {/* Reputation / Rating */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Guest Rating
            </span>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-extrabold text-amber-500 flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>{guest.stats?.averageRating || 4.8}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Exceptional Guest
              </span>
            </div>
          </div>

          {/* Guest Preferences & Special Needs Panel */}
          <div className="col-span-2 sm:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Guest Stay Preferences & Dietary Needs
              </h3>
              <button
                onClick={handleOpenEditPreferences}
                className="text-xs text-[#134E4A] dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Dietary</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                  {guest.preferences?.dietary || 'Vegetarian / Halal options'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Bed Preference</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                  {guest.preferences?.bedType || 'King Size Bed'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Floor / Room</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                  {guest.preferences?.floorPreference || 'Upper Floor Quiet Corner'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Allergies</span>
                <span className="font-semibold text-rose-600 block mt-0.5">
                  {guest.preferences?.allergies || 'None reported'}
                </span>
              </div>
            </div>

            {guest.preferences?.specialNotes && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-900/40">
                <span className="font-bold">Concierge Note: </span>
                {guest.preferences.specialNotes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Chronological Booking History Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Lifetime Booking History ({guestBookings.length} Records)
            </h3>
            <p className="text-xs text-slate-400">
              Chronological log of all hotel stays, tour packages, and experiences booked by this guest
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Reference</th>
                <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Service / Property</th>
                <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Type</th>
                <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Room / Option</th>
                <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Check In</th>
                <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Check Out</th>
                <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Total (INR)</th>
                <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Status</th>
                <th className="py-3 pr-4 pl-2 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-300">
              {guestBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No bookings found for this guest profile.
                  </td>
                </tr>
              ) : (
                guestBookings.map((b) => {
                  const isStay = b.type === 'stay';
                  const stay = isStay ? (b as StayBookingItem) : null;
                  const totalAmt = isStay ? stay?.grandTotalInr : (b as any).totalAmount || 0;
                  const propertyName = isStay ? stay?.propertyName : (b as any).packageName || (b as any).experienceTitle || 'Resort Stay';
                  const roomName = isStay ? stay?.roomName : (b as any).tierName || 'Standard Package';
                  const checkIn = isStay ? stay?.checkInDate : (b as any).startDate || (b as any).date || '2026-11-02';
                  const checkOut = isStay ? stay?.checkOutDate : (b as any).endDate || '2026-11-04';

                  // Status badge logic
                  const isRefund = stay?.paymentStatus === 'refunded';
                  const isPending = stay?.bookingStatus === 'pending' || stay?.paymentStatus === 'processing';
                  const isBooked =
                    stay?.bookingStatus === 'confirmed' ||
                    stay?.bookingStatus === 'checked_in' ||
                    stay?.bookingStatus === 'checked_out';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#F05353]">
                        #{b.bookingReference || 'EMP-00025'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {propertyName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {b.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">{roomName}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-200">
                        {checkIn}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-200">
                        {checkOut}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        ₹{totalAmt?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isRefund && (
                          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#FCE8E8] text-[#F05353] border border-[#FAD0D0]">
                            Refund
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2E6] text-[#F39C12] border border-[#FCE1C3]">
                            Pending
                          </span>
                        )}
                        {isBooked && (
                          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F0] text-[#2ECC71] border border-[#CFF3DE]">
                            Booked
                          </span>
                        )}
                        {!isRefund && !isPending && !isBooked && (
                          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                            Canceled
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 pl-2 text-right">
                        <Link
                          href={`/dashboard/bookings/${b.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-colors shadow-2xs"
                        >
                          <FileText className="w-3 h-3" />
                          <span>View Folio</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Concierge & VIP Guest Notes ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          Concierge & Guest Relations Notes ({guest.notes?.length || 0})
        </h3>

        <div className="space-y-3 mb-6">
          {(guest.notes || []).length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No concierge notes logged yet.</p>
          ) : (
            (guest.notes || []).map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-3.5"
              >
                <div className="w-8 h-8 rounded-full bg-[#134E4A]/10 text-[#134E4A] dark:bg-emerald-500/20 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {n.authorName?.charAt(0) || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {n.authorName}{' '}
                      <span className="font-normal text-[11px] text-slate-400">({n.authorRole})</span>
                    </span>
                    <span className="text-[11px] text-slate-400">{n.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {n.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="flex gap-2">
          <input
            type="text"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Log an internal concierge note for this guest's lifetime profile..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#134E4A]"
          />
          <button
            type="submit"
            disabled={!newNoteText.trim()}
            className="px-5 py-2.5 bg-[#134E4A] hover:bg-[#0f3d3a] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>
        </form>
      </div>

      {/* ── Edit Preferences Modal ── */}
      {isEditingPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Edit Preferences for {guest.name}
              </h3>
              <button
                onClick={() => setIsEditingPreferences(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Dietary Preferences
                </label>
                <input
                  type="text"
                  value={dietaryInput}
                  onChange={(e) => setDietaryInput(e.target.value)}
                  placeholder="e.g. Vegetarian / Halal / Gluten-Free"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Bed Preference
                </label>
                <input
                  type="text"
                  value={bedInput}
                  onChange={(e) => setBedInput(e.target.value)}
                  placeholder="e.g. King Size Bed / Twin Beds"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Floor / Room Preference
                </label>
                <input
                  type="text"
                  value={floorInput}
                  onChange={(e) => setFloorInput(e.target.value)}
                  placeholder="e.g. Upper Floor / Corner Room / Valley View"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Allergies
                </label>
                <input
                  type="text"
                  value={allergiesInput}
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  placeholder="e.g. Dairy / Peanuts / Feathers / None"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Concierge Remarks
                </label>
                <textarea
                  value={specialNotesInput}
                  onChange={(e) => setSpecialNotesInput(e.target.value)}
                  rows={2}
                  placeholder="e.g. Welcomed with fresh fruit basket; frequent traveler..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPreferences(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#134E4A] hover:bg-[#0f3d3a] text-white rounded-xl shadow-xs"
                >
                  Update Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
