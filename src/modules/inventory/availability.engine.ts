import { eachDayInclusive, eachNight } from '../../utils/dates';

export interface BookedRange {
  checkInDate: string;
  checkOutDate: string; // exclusive
  quantity: number;
}

export interface BlockedRange {
  fromDate: string; // inclusive
  toDate: string; // inclusive
  units: number | null; // null = every unit of the room
}

export interface RoomAvailability {
  totalUnits: number;
  availableUnits: number; // min over all requested nights
  perNight: { date: string; booked: number; blocked: number; available: number }[];
}

/**
 * Per-night occupancy. Availability for a stay is the MINIMUM free units over its nights — summing
 * overlapping bookings would wrongly reject e.g. nights 1–2 booked by A and nights 3–4 booked by B.
 */
export function computeRoomAvailability(
  totalUnits: number,
  nights: string[],
  bookings: BookedRange[],
  blocks: BlockedRange[],
): RoomAvailability {
  const perNight = nights.map((date) => {
    const booked = bookings
      .filter((b) => b.checkInDate <= date && date < b.checkOutDate)
      .reduce((sum, b) => sum + b.quantity, 0);
    const blockedRaw = blocks
      .filter((b) => b.fromDate <= date && date <= b.toDate)
      .reduce((sum, b) => sum + (b.units === null ? totalUnits : b.units), 0);
    const blocked = Math.min(totalUnits, blockedRaw);
    return { date, booked, blocked, available: Math.max(0, totalUnits - booked - blocked) };
  });
  return {
    totalUnits,
    availableUnits: perNight.length ? Math.min(...perNight.map((n) => n.available)) : totalUnits,
    perNight,
  };
}

export function stayNights(checkIn: string, checkOut: string): string[] {
  return eachNight(checkIn, checkOut);
}

/** Calendar view helper: availability for each day in [from, to] for one room. */
export function computeCalendar(totalUnits: number, from: string, to: string, bookings: BookedRange[], blocks: BlockedRange[]) {
  return computeRoomAvailability(totalUnits, eachDayInclusive(from, to), bookings, blocks).perNight;
}
