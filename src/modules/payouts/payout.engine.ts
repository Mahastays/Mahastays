export interface SettlementBooking {
  bookingType: 'stay' | 'package' | 'experience';
  bookingId: string;
  reference: string;
  /** Pre-GST value commission / TDS are charged on (for penalty-only settlements: the retained penalty). */
  taxableAmountInr: number;
  commissionAmountInr: number;
  /** What the vendor side of the booking is worth after commission (stored on the booking when it is settled). */
  vendorShareInr: number;
}

export interface PayoutLineCalc {
  bookingType: 'stay' | 'package' | 'experience';
  bookingId: string;
  reference: string;
  amountInr: number;
  commissionInr: number;
  tdsInr: number;
  vendorShareInr: number;
}

/**
 * Gross = Commission + Vendor Share.
 * Auto TDS and secondary GST cuts removed as requested: vendor receives full share of booking (Customer Paid - Platform Commission).
 */
export function computePayout(bookings: SettlementBooking[], _tdsRatePercent: number = 0) {
  const lines: PayoutLineCalc[] = bookings.map((b) => ({
    bookingType: b.bookingType,
    bookingId: b.bookingId,
    reference: b.reference,
    amountInr: b.vendorShareInr + b.commissionAmountInr, // = what the customer paid for this settlement
    commissionInr: b.commissionAmountInr,
    tdsInr: 0,
    vendorShareInr: b.vendorShareInr,
  }));
  const grossBookingsAmountInr = lines.reduce((s, l) => s + l.amountInr, 0);
  const platformCommissionDeductedInr = lines.reduce((s, l) => s + l.commissionInr, 0);
  const vendorShareTotalInr = lines.reduce((s, l) => s + l.vendorShareInr, 0);
  const tdsDeductedInr = 0;
  return {
    lines,
    grossBookingsAmountInr,
    platformCommissionDeductedInr,
    vendorShareTotalInr,
    tdsDeductedInr,
    netPayableAmountInr: vendorShareTotalInr,
  };
}
