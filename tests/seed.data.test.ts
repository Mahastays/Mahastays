import { describe, expect, it } from 'vitest';
import { createExperienceSchema } from '../src/modules/experiences/experience.schemas';
import { createPackageSchema } from '../src/modules/packages/package.schemas';
import { createPropertySchema } from '../src/modules/properties/property.schemas';
import { registerVendorSchema } from '../src/modules/vendors/vendor.schemas';
import { buildPackages, experiencesData, hillViewProperty } from '../prisma/seed.data';

const OID = (n: number) => String(n).padStart(24, 'a');

describe('spec sample data validates against the API schemas', () => {
  it('property: HillView Luxury Resort & Spa', () => {
    const p = createPropertySchema.parse(hillViewProperty);
    expect(p.rooms).toHaveLength(3);
    expect(p.rooms[0]).toMatchObject({ roomId: 'r501', basePrice: 5500, originalPrice: 7500, weekendPrice: 7500, holidayPrice: 9000, count: 10 });
    expect(p.policies?.checkInTime).toBe('14:00');
  });

  it('experiences: trek (adult + child tiers, two slots), games, boating', () => {
    for (const data of Object.values(experiencesData)) expect(() => createExperienceSchema.parse(data)).not.toThrow();
    const trek = createExperienceSchema.parse(experiencesData.trek);
    expect(trek.tiers.map((t) => t.tierId)).toEqual(['adult-trek', 'child-trek']);
    expect(trek.slots.map((s) => s.slotId)).toEqual(['slot-sunrise', 'slot-morning']);
    expect(trek.category).toBe('Trekking');
  });

  it('packages: anniversary getaway and bachelor party', () => {
    const packages = buildPackages({ propertyId: OID(1), gamesExperienceId: OID(2), boatingExperienceId: OID(3) });
    expect(packages).toHaveLength(2);
    for (const p of packages) expect(() => createPackageSchema.parse(p)).not.toThrow();
    const anniversary = createPackageSchema.parse(packages[0]);
    expect(anniversary.tiers[0]).toMatchObject({ tierId: 'couple-standard', pricePerPerson: 11500, originalPrice: 15500 });
    expect(anniversary.pricing).toMatchObject({ minGuests: 2, maxGuests: 2, weekendSurcharge: 2500 });
  });

  it('rejects the mistakes real clients make', () => {
    expect(() => createPropertySchema.parse({ ...hillViewProperty, rooms: [] })).toThrow();
    expect(() => createPropertySchema.parse({ ...hillViewProperty, rooms: [hillViewProperty.rooms[0], hillViewProperty.rooms[0]] })).toThrow(); // duplicate roomId
    expect(() => createPropertySchema.parse({ ...hillViewProperty, address: { ...hillViewProperty.address, lat: 123 } })).toThrow();
    const [pkg] = buildPackages({ propertyId: OID(1), gamesExperienceId: OID(2), boatingExperienceId: OID(3) });
    expect(() => createPackageSchema.parse({ ...pkg, durationNights: 3 })).toThrow(); // nights must be < days
    expect(() => createPackageSchema.parse({ ...pkg, itinerary: [{ day: 9, title: 'x' }] })).toThrow(); // day beyond duration
    expect(() => createPackageSchema.parse({ ...pkg, propertyId: 'p5001' })).toThrow(); // must be an ObjectId
  });

  it('vendor registration enforces Indian PAN / GSTIN formats', () => {
    const base = {
      businessType: 'private_limited', category: 'property_host', businessName: 'HillView Hospitality Pvt Ltd', displayName: 'Vikramaditya & Team', displayRole: 'GM',
      email: 'host@hillview.local', phone: '+919822000000', password: 'Strong#123',
      contact: { primaryContactPerson: 'Vikramaditya', registeredOfficeAddress: { addressLine1: 'Plot 12, Venna Lake Road', city: 'Mahabaleshwar', state: 'Maharashtra', pincode: '412806' } },
      compliance: { panNumber: 'abcde1234f', gstin: '27ABCDE1234F1Z5' },
    };
    expect(registerVendorSchema.parse(base).compliance.panNumber).toBe('ABCDE1234F'); // normalised to upper-case
    expect(() => registerVendorSchema.parse({ ...base, compliance: { panNumber: 'ABCDE12345' } })).toThrow();
    expect(() => registerVendorSchema.parse({ ...base, compliance: { panNumber: 'ABCDE1234F', gstin: '27ABCDE1234F1X5' } })).toThrow();
    expect(() => registerVendorSchema.parse({ ...base, password: 'alllowercase' })).toThrow();
  });
});
