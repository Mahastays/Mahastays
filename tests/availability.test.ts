import { describe, expect, it } from 'vitest';
import { computeRoomAvailability } from '../src/modules/inventory/availability.engine';
import { eachNight } from '../src/utils/dates';

describe('room availability', () => {
  const nights = eachNight('2026-10-15', '2026-10-19'); // 4 nights: 15,16,17,18

  it('is the minimum free units across the nights, not the sum of overlapping bookings', () => {
    const bookings = [
      { checkInDate: '2026-10-15', checkOutDate: '2026-10-17', quantity: 1 }, // nights 15,16
      { checkInDate: '2026-10-17', checkOutDate: '2026-10-19', quantity: 1 }, // nights 17,18
    ];
    const r = computeRoomAvailability(1, nights, bookings, []);
    expect(r.perNight.map((n) => n.available)).toEqual([0, 0, 0, 0]);
    // With 2 units, one booking at a time → one unit stays free every night
    expect(computeRoomAvailability(2, nights, bookings, []).availableUnits).toBe(1);
  });

  it('check-out day is free for the next guest', () => {
    const r = computeRoomAvailability(1, ['2026-10-17'], [{ checkInDate: '2026-10-15', checkOutDate: '2026-10-17', quantity: 1 }], []);
    expect(r.availableUnits).toBe(1);
  });

  it('applies vendor blocks (partial and full)', () => {
    const blocks = [{ fromDate: '2026-10-16', toDate: '2026-10-16', units: 2 }];
    const r = computeRoomAvailability(5, nights, [], blocks);
    expect(r.perNight.map((n) => n.available)).toEqual([5, 3, 5, 5]);
    expect(r.availableUnits).toBe(3);
    const full = computeRoomAvailability(5, nights, [], [{ fromDate: '2026-10-18', toDate: '2026-10-20', units: null }]);
    expect(full.availableUnits).toBe(0);
  });

  it('never goes negative when blocks and bookings exceed capacity', () => {
    const r = computeRoomAvailability(1, ['2026-10-16'], [{ checkInDate: '2026-10-16', checkOutDate: '2026-10-17', quantity: 3 }], [{ fromDate: '2026-10-16', toDate: '2026-10-16', units: null }]);
    expect(r.availableUnits).toBe(0);
  });
});
