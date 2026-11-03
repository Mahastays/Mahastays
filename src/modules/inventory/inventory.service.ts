import type { Prisma, Room, ExperienceSlot } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { addDays, eachDayInclusive, eachNight, weekdayKey } from '../../utils/dates';
import {
  computeCalendar,
  computeRoomAvailability,
  type BlockedRange,
  type BookedRange,
  type RoomAvailability,
} from './availability.engine';

/** Bookings that currently occupy inventory: everything except cancelled, and pending ones whose payment hold lapsed. */
export const occupyingStayBookings = (now = new Date()): Prisma.StayBookingWhereInput => ({
  bookingStatus: { not: 'cancelled' },
  OR: [{ bookingStatus: { not: 'pending' } }, { holdExpiresAt: { gt: now } }],
});

export interface StayOccupancy {
  bookings: Map<string, BookedRange[]>; // key: `${propertyId}:${roomId}`
  blocks: Map<string, BlockedRange[]>; // key: `${propertyId}:${roomId}` (whole-property blocks are copied to every room)
}

const key = (propertyId: string, roomId: string) => `${propertyId}:${roomId}`;

/** One round-trip pair for many properties (used by search with dates). */
export async function loadStayOccupancy(
  properties: { id: string; rooms: Pick<Room, 'roomId'>[] }[],
  checkIn: string,
  checkOut: string,
): Promise<StayOccupancy> {
  const ids = properties.map((p) => p.id);
  const lastNight = addDays(checkOut, -1);
  const [bookingRows, blockRows] = await Promise.all([
    prisma.stayBooking.findMany({
      where: { propertyId: { in: ids }, checkInDate: { lt: checkOut }, checkOutDate: { gt: checkIn }, ...occupyingStayBookings() },
      select: { propertyId: true, roomId: true, checkInDate: true, checkOutDate: true, roomQuantity: true },
    }),
    prisma.inventoryBlock.findMany({
      where: { targetType: 'property', targetId: { in: ids }, fromDate: { lte: lastNight }, toDate: { gte: checkIn } },
    }),
  ]);

  const bookings = new Map<string, BookedRange[]>();
  for (const b of bookingRows) {
    const k = key(b.propertyId, b.roomId);
    bookings.set(k, [...(bookings.get(k) ?? []), { checkInDate: b.checkInDate, checkOutDate: b.checkOutDate, quantity: b.roomQuantity }]);
  }

  const blocks = new Map<string, BlockedRange[]>();
  const push = (k: string, r: BlockedRange) => blocks.set(k, [...(blocks.get(k) ?? []), r]);
  for (const b of blockRows) {
    const range = { fromDate: b.fromDate, toDate: b.toDate, units: b.units ?? null };
    if (b.subId) push(key(b.targetId, b.subId), range);
    else {
      const property = properties.find((p) => p.id === b.targetId);
      for (const room of property?.rooms ?? []) push(key(b.targetId, room.roomId), range);
    }
  }
  return { bookings, blocks };
}

export function availabilityFor(occupancy: StayOccupancy, propertyId: string, room: Pick<Room, 'roomId' | 'count'>, nights: string[]): RoomAvailability {
  const k = key(propertyId, room.roomId);
  return computeRoomAvailability(room.count, nights, occupancy.bookings.get(k) ?? [], occupancy.blocks.get(k) ?? []);
}

/** Authoritative, fresh availability for ONE room (called inside the reservation lock). */
export async function getRoomAvailability(
  property: { id: string; rooms: Room[] },
  roomId: string,
  checkIn: string,
  checkOut: string,
): Promise<RoomAvailability> {
  const room = property.rooms.find((r) => r.roomId === roomId);
  if (!room) throw ApiError.notFound('Room');
  const occupancy = await loadStayOccupancy([property], checkIn, checkOut);
  return availabilityFor(occupancy, property.id, room, eachNight(checkIn, checkOut));
}

/* ───────────────────────── vendor: blocks & calendar ───────────────────────── */

export async function addStayBlock(
  actor: { id: string; role: 'vendor' | 'admin' | 'super_admin' | 'sub_admin' },
  propertyId: string,
  input: { roomId?: string; fromDate: string; toDate: string; units?: number | null; reason?: string },
) {
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, rooms: true } });
  if (!property) throw ApiError.notFound('Property');
  if (input.roomId && !property.rooms.some((r) => r.roomId === input.roomId)) throw ApiError.notFound('Room');
  return prisma.inventoryBlock.create({
    data: {
      targetType: 'property',
      targetId: propertyId,
      subId: input.roomId,
      fromDate: input.fromDate,
      toDate: input.toDate,
      units: input.units ?? undefined,
      reason: input.reason,
      createdById: actor.id,
      createdByRole: actor.role,
    },
  });
}

export async function addExperienceBlock(
  actor: { id: string; role: 'vendor' | 'admin' | 'super_admin' | 'sub_admin' },
  experienceId: string,
  input: { slotId?: string; fromDate: string; toDate: string; reason?: string },
) {
  const exp = await prisma.experience.findUnique({ where: { id: experienceId }, select: { id: true, slots: true } });
  if (!exp) throw ApiError.notFound('Experience');
  if (input.slotId && !exp.slots.some((s) => s.slotId === input.slotId)) throw ApiError.notFound('Slot');
  return prisma.inventoryBlock.create({
    data: {
      targetType: 'experience',
      targetId: experienceId,
      subId: input.slotId,
      fromDate: input.fromDate,
      toDate: input.toDate,
      reason: input.reason,
      createdById: actor.id,
      createdByRole: actor.role,
    },
  });
}

export const listBlocks = (targetType: 'property' | 'experience', targetId: string) =>
  prisma.inventoryBlock.findMany({ where: { targetType, targetId }, orderBy: { fromDate: 'asc' } });

export async function removeBlock(targetType: 'property' | 'experience', targetId: string, blockId: string) {
  const res = await prisma.inventoryBlock.deleteMany({ where: { id: blockId, targetType, targetId } });
  if (res.count === 0) throw ApiError.notFound('Block');
}

/** Day-by-day calendar for every room of a property (vendor dashboard). */
export async function propertyCalendar(propertyId: string, from: string, to: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, rooms: true } });
  if (!property) throw ApiError.notFound('Property');
  const days = eachDayInclusive(from, to);
  const checkOut = addDays(to, 1);
  const occupancy = await loadStayOccupancy([property], from, checkOut);
  return property.rooms.map((room) => {
    const k = key(property.id, room.roomId);
    return {
      roomId: room.roomId,
      name: room.name,
      totalUnits: room.count,
      days: computeCalendar(room.count, from, to, occupancy.bookings.get(k) ?? [], occupancy.blocks.get(k) ?? []),
      range: { from, to, count: days.length },
    };
  });
}

/* ───────────────────────── experiences: slot availability ───────────────────────── */

export interface SlotAvailability {
  slotId: string;
  time: string;
  label: string;
  capacity: number;
  booked: number;
  blocked: boolean;
  availableSpots: number;
  price: number | null;
}

export async function experienceSlotAvailability(
  experience: { id: string; slots: ExperienceSlot[]; schedule: { daysAvailable: string[] } },
  date: string,
): Promise<SlotAvailability[]> {
  const days = experience.schedule.daysAvailable;
  const dayOk = days.length === 0 || days.includes('all') || days.includes(weekdayKey(date));
  const now = new Date();

  const [rows, blocks] = await Promise.all([
    prisma.experienceBooking.findMany({
      where: {
        experienceId: experience.id,
        activityDate: date,
        bookingStatus: { not: 'cancelled' },
        OR: [{ bookingStatus: { not: 'pending' } }, { holdExpiresAt: { gt: now } }],
      },
      select: { slotId: true, totalParticipants: true },
    }),
    prisma.inventoryBlock.findMany({
      where: { targetType: 'experience', targetId: experience.id, fromDate: { lte: date }, toDate: { gte: date } },
      select: { subId: true },
    }),
  ]);

  const wholeDayBlocked = blocks.some((b) => !b.subId);
  return experience.slots.map((slot) => {
    const booked = rows.filter((r) => r.slotId === slot.slotId).reduce((s, r) => s + r.totalParticipants, 0);
    const blocked = !dayOk || wholeDayBlocked || blocks.some((b) => b.subId === slot.slotId);
    return {
      slotId: slot.slotId,
      time: slot.time,
      label: slot.label,
      capacity: slot.capacity,
      booked,
      blocked,
      availableSpots: blocked ? 0 : Math.max(0, slot.capacity - booked),
      price: slot.price ?? null,
    };
  });
}
