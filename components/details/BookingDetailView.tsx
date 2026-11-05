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
  RotateCw,
  Send,
  Sparkles,
  User,
  Utensils,
  Wine,
  Shirt,
  Bed,
  Check,
  X,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BookingInvoiceModal from '../modals/BookingInvoiceModal';
import { useAppSelector, useAppDispatch } from '../../store';
import {
  fetchBookings,
  updateBookingStatusAsync,
  updatePaymentStatusAsync,
  toggleChargeSelected,
  addBookingCharge,
  addBookingNote,
} from '../../store/slices/bookingsSlice';
import { StayBookingItem, StayBookingStatus, PaymentStatus } from '../../types';

interface BookingDetailViewProps {
  id: string;
}

export default function BookingDetailView({ id }: BookingDetailViewProps) {
  const router = useRouter();
  const { user, activeViewMode } = useAuth();
  const dispatch = useAppDispatch();
  const bookings = useAppSelector((state) => state.bookings.items);
  const guests = useAppSelector((state) => state.bookings.guests);

  const isAdmin = activeViewMode === 'admin';

  // Find the current booking
  const booking = useMemo(() => {
    return (
      (bookings.find((b) => b.id === id) as StayBookingItem) ||
      (bookings.find((b) => b.type === 'stay') as StayBookingItem)
    );
  }, [bookings, id]);

  // Find the associated guest profile if available
  const guestProfile = useMemo(() => {
    if (!booking) return null;
    return guests.find((g) => g.id === booking.userId || g.name === booking.guestName) || null;
  }, [guests, booking]);

  // Form states
  const [noteText, setNoteText] = useState('');
  const [isAddingCharge, setIsAddingCharge] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [chargeCategory, setChargeCategory] = useState<'Restaurant' | 'Bar' | 'Spa' | 'Laundry' | 'Room'>('Restaurant');
  const [chargeTitle, setChargeTitle] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshBooking = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchBookings()).unwrap();
    } catch (err) {
      console.error('Refresh booking error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
        <FileText className="w-12 h-12 text-slate-300 stroke-[1.5] mb-3" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Booking Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          The requested booking ID could not be loaded or may have been removed.
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

  // Calculate dynamic totals based on selected charges
  const selectedChargesSum = (booking.charges || [])
    .filter((c) => c.selected !== false)
    .reduce((sum, c) => sum + c.amount, 0);

  const roomSubtotal = (booking.roomPricePerNight || 0) * (booking.nights || 1);
  const cleaningFee = booking.cleaningFee || 0;
  const memberDiscount = booking.memberDiscount || 0;
  const subtotalWithCharges = roomSubtotal + cleaningFee + selectedChargesSum - memberDiscount;
  const gstTax = Math.round(subtotalWithCharges * 0.18);
  const dynamicGrandTotal = subtotalWithCharges + gstTax;

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    dispatch(
      addBookingNote({
        bookingId: booking.id,
        text: noteText.trim(),
        authorName: user?.name || (isAdmin ? 'Admin Concierge' : 'Front Desk Lead'),
        authorRole: isAdmin ? 'Admin' : 'Vendor',
        avatar: user?.avatar || '',
      })
    );
    setNoteText('');
  };

  const handleAddChargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeTitle.trim() || !chargeAmount) return;
    dispatch(
      addBookingCharge({
        bookingId: booking.id,
        charge: {
          category: chargeCategory,
          title: chargeTitle.trim(),
          amount: parseFloat(chargeAmount) || 0,
        },
      })
    );
    setChargeTitle('');
    setChargeAmount('');
    setIsAddingCharge(false);
  };

  const handleToggleCharge = (chargeId: string) => {
    dispatch(
      toggleChargeSelected({
        bookingId: booking.id,
        chargeId,
      })
    );
  };

  const handleStatusChange = (newStatus: StayBookingStatus) => {
    dispatch(updateBookingStatusAsync({ id: booking.id, status: newStatus }));
  };

  const handlePaymentStatusChange = (newStatus: PaymentStatus) => {
    dispatch(updatePaymentStatusAsync({ id: booking.id, status: newStatus }));
  };

  const guestCode = booking.bookingReference?.startsWith('#')
    ? booking.bookingReference
    : `#${booking.bookingReference || 'EMP-00025'}`;

  return (
    <div className="space-y-6 pb-16 w-full max-w-[1720px] mx-auto">
      {/* ── Breadcrumb & Top Bar ── */}
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
                Booking Folio {guestCode}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Hotel Stay
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Booked on {new Date(booking.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &bull; Property: {booking.propertyName}
            </p>
          </div>
        </div>

        {/* Action Buttons: Status Selectors & Print */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Booking Status Select */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Status:</span>
            <select
              value={booking.bookingStatus}
              onChange={(e) => handleStatusChange(e.target.value as StayBookingStatus)}
              className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer capitalize"
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="checked_in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Select */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Payment:</span>
            <select
              value={booking.paymentStatus}
              onChange={(e) => handlePaymentStatusChange(e.target.value as PaymentStatus)}
              className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer capitalize"
            >
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Dedicated Refresh Button */}
          <button
            type="button"
            onClick={handleRefreshBooking}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh Booking from Database"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#ea110d]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Official Tax Invoice Button (View & Download) */}
          {booking.paymentStatus === 'paid' && booking.bookingStatus !== 'cancelled' ? (
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              title="View & Download Official GST Tax Invoice"
            >
              <FileText className="w-3.5 h-3.5 text-[#ea110d]" />
              <span>Tax Invoice</span>
            </button>
          ) : booking.bookingStatus === 'cancelled' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-semibold">
              Cancelled • No Invoice
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              Unpaid • Invoice on Payment
            </span>
          )}

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
            title="Print Folio"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Top Summary Grid: Guest Card & Room Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guest Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Primary Guest
              </span>
              {booking.vipStatus && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  VIP Guest
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {booking.guestAvatar ? (
                <img
                  src={booking.guestAvatar}
                  alt={booking.guestName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-800 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm">
                  {booking.guestName ? booking.guestName[0].toUpperCase() : 'G'}
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {booking.guestName}
                </h3>
                <p className="text-xs font-semibold text-[#F05353]">{guestCode}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {booking.nationality || 'Guest'}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {booking.guestPhone
                    ? `+91 ${booking.guestPhone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10)}`
                    : ((booking as any).customer?.phone || (booking as any).phone || 'Not provided')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{booking.guestEmail || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>ID Card: {booking.idCardNumber || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Link to Full Guest Lifetime History */}
          <Link
            href={booking.userId ? `/dashboard/guests/${booking.userId}` : '/dashboard/guests'}
            className="mt-5 w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#134E4A] dark:text-emerald-400 flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            <User className="w-3.5 h-3.5" />
            <span>View Full Guest Profile & Lifetime History &rarr;</span>
          </Link>
        </div>

        {/* Room / Stay Overview Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Room & Stay Information
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {booking.nights} Nights Stay
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            {booking.roomImage ? (
              <img
                src={booking.roomImage}
                alt={booking.roomName}
                className="w-full sm:w-48 h-32 rounded-xl object-cover border border-slate-100 dark:border-slate-800"
              />
            ) : (
              <div className="w-full sm:w-48 h-32 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-semibold">
                No room image
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {booking.propertyName}
                </h4>
              </div>
              <p className="text-xs font-bold text-[#134E4A] dark:text-emerald-400">
                {booking.roomName} ({booking.bedType || 'King Bed'})
              </p>
              <p className="text-xs text-slate-500">
                Occupancy: {booking.adults} Adults {booking.children > 0 ? `, ${booking.children} Children` : ''} &bull; Vendor: {booking.vendorName}
              </p>

              {/* Room Feature tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(booking.features || ['Valley View', 'Balcony', 'Breakfast Included']).map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stay Dates Box */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Check In</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">
                {booking.checkInDate}
              </span>
              <span className="text-[11px] text-slate-400">{booking.checkInTime || '9:46 PM'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Check Out</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">
                {booking.checkOutDate}
              </span>
              <span className="text-[11px] text-slate-400">{booking.checkOutTime || '6:12 PM'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Nightly Rate</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">
                ₹{booking.roomPricePerNight?.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-emerald-600">Free Cancellation</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Special Requests Banner ── */}
      {booking.specialRequests && (
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-900 dark:text-amber-200">
              Guest's Special Requests & Remarks:
            </span>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed font-medium">
              {booking.specialRequests}
            </p>
          </div>
        </div>
      )}

      {/* ── Interactive Billing & Charges Ledger ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charges Ledger Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Stay Charges & Incidentals Ledger
              </h3>
              <p className="text-xs text-slate-400">
                Select items to include in final checkout folio invoice
              </p>
            </div>
            <button
              onClick={() => setIsAddingCharge(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#134E4A] hover:bg-[#0f3d3a] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Service Charge</span>
            </button>
          </div>

          {/* Charges List */}
          <div className="space-y-2">
            {/* Standard Room Base Rate Item */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                  ✓
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Room Rate ({booking.nights} Nights × ₹{booking.roomPricePerNight?.toLocaleString('en-IN')})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Category: Room Accommodation
                  </span>
                </div>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">
                ₹{roomSubtotal.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Individual On-site Incidentals */}
            {(booking.charges || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No extra incidentals or restaurant/spa charges recorded yet.
              </p>
            ) : (
              booking.charges.map((charge) => {
                const isSelected = charge.selected !== false;
                return (
                  <div
                    key={charge.id}
                    onClick={() => handleToggleCharge(charge.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs'
                        : 'bg-slate-50/50 dark:bg-slate-800/20 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-[#134E4A] focus:ring-[#134E4A] cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {charge.title}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {charge.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{charge.date}</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{charge.amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Invoice Summary Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Folio Billing Summary
            </h3>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Room Charges:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ₹{roomSubtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Selected Incidentals:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ₹{selectedChargesSum.toLocaleString('en-IN')}
                </span>
              </div>

              {memberDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>VIP Member Discount:</span>
                  <span>- ₹{memberDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>GST Tax (18%):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ₹{gstTax.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Grand Total (INR):
                </span>
                <span className="text-lg font-extrabold text-[#134E4A] dark:text-emerald-400">
                  ₹{dynamicGrandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment badge */}
            <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Payment Status:</span>
              <span
                className={`font-bold capitalize px-2.5 py-0.5 rounded-full text-[11px] ${
                  booking.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : booking.paymentStatus === 'refunded'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {booking.paymentStatus}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={() => window.print()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#134E4A] hover:bg-[#0f3d3a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download & Print PDF Folio</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Internal Staff Notes & Timeline ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          Staff Activity & Concierge Notes ({booking.notes?.length || 0})
        </h3>

        {/* Existing Notes */}
        <div className="space-y-3 mb-6">
          {(booking.notes || []).length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No notes added to this booking yet.</p>
          ) : (
            booking.notes.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-3.5"
              >
                {n.avatar ? (
                  <img
                    src={n.avatar}
                    alt={n.authorName}
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs shrink-0 mt-0.5">
                    {n.authorName ? n.authorName[0].toUpperCase() : 'U'}
                  </div>
                )}
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

        {/* Post Note Form */}
        <form onSubmit={handlePostNote} className="flex gap-2">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type an internal note regarding this stay..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#134E4A]"
          />
          <button
            type="submit"
            disabled={!noteText.trim()}
            className="px-5 py-2.5 bg-[#134E4A] hover:bg-[#0f3d3a] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>
        </form>
      </div>

      {/* ── Add Charge Modal ── */}
      {isAddingCharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Room Service or Incidental Charge
              </h3>
              <button
                onClick={() => setIsAddingCharge(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleAddChargeSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Category
                </label>
                <select
                  value={chargeCategory}
                  onChange={(e) => setChargeCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="Restaurant">Restaurant / Dining</option>
                  <option value="Bar">Bar & Beverages</option>
                  <option value="Spa">Spa & Wellness</option>
                  <option value="Laundry">Laundry Service</option>
                  <option value="Room">Room Minibar & Incidentals</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Description / Item Title
                </label>
                <input
                  type="text"
                  value={chargeTitle}
                  onChange={(e) => setChargeTitle(e.target.value)}
                  placeholder="e.g. Candlelight Wine Dinner №4401"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Amount in INR (₹)
                </label>
                <input
                  type="number"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  required
                  min="1"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCharge(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#134E4A] hover:bg-[#0f3d3a] text-white rounded-xl shadow-xs"
                >
                  Save Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official GST Tax Invoice Modal */}
      <BookingInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        booking={booking}
      />
    </div>
  );
}
