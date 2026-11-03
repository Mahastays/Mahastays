import { z } from 'zod';
import * as v from '../../utils/zod';

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const upper = (schema: z.ZodString) => z.string().trim().toUpperCase().pipe(schema);

const indianPhone = z.string().trim().regex(/^\+?\d{8,15}$/, 'Phone must be 8-15 digits (optionally starting with +)');

export const officeAddressSchema = z.object({
  addressLine1: v.trimmed(3, 200),
  city: v.trimmed(2, 80),
  district: v.optionalTrimmed(80),
  state: v.trimmed(2, 80),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  country: z.string().trim().default('India'),
});

export const vendorProfileFields = {
  displayName: v.trimmed(2, 100),
  displayRole: v.trimmed(2, 100),
  experienceSummary: v.optionalTrimmed(200),
  avatarUrl: v.url.optional(),
  alternatePhone: indianPhone.optional(),
  primaryContactPerson: v.trimmed(2, 100),
  registeredOfficeAddress: officeAddressSchema,
};

export const registerVendorSchema = z.object({
  businessType: z.enum(['individual', 'proprietorship', 'private_limited', 'partnership']),
  category: z.enum(['property_host', 'activity_operator', 'integrated_resort']),
  businessName: v.trimmed(2, 150),
  displayName: v.trimmed(2, 100),
  displayRole: v.trimmed(2, 100),
  experienceSummary: v.optionalTrimmed(200),
  email: v.email,
  phone: indianPhone,
  password: v.password,
  contact: z.object({
    primaryContactPerson: v.trimmed(2, 100),
    alternatePhone: indianPhone.optional(),
    registeredOfficeAddress: officeAddressSchema,
  }),
  compliance: z.object({
    panNumber: upper(z.string().regex(PAN_REGEX, 'Invalid PAN (expected ABCDE1234F)')),
    gstin: upper(z.string().regex(GSTIN_REGEX, 'Invalid GSTIN')).optional(),
    tourismLicenseNumber: v.optionalTrimmed(60),
  }),
});
export type RegisterVendorInput = z.infer<typeof registerVendorSchema>;

export const updateVendorProfileSchema = z
  .object({
    businessName: v.trimmed(2, 150),
    displayName: v.trimmed(2, 100),
    displayRole: v.trimmed(2, 100),
    experienceSummary: v.optionalTrimmed(200),
    avatarUrl: v.url,
    phone: indianPhone,
    contact: z.object({
      primaryContactPerson: v.trimmed(2, 100),
      alternatePhone: indianPhone.optional(),
      registeredOfficeAddress: officeAddressSchema,
    }),
  })
  .partial();
export type UpdateVendorProfileInput = z.infer<typeof updateVendorProfileSchema>;

export const submitKycSchema = z.object({
  panNumber: upper(z.string().regex(PAN_REGEX, 'Invalid PAN (expected ABCDE1234F)')),
  gstin: upper(z.string().regex(GSTIN_REGEX, 'Invalid GSTIN')).optional(),
  tourismLicenseNumber: v.optionalTrimmed(60),
  identityProofUrl: z.string().trim().min(5).max(2048),
  businessProofUrl: z.string().trim().min(5).max(2048),
});
export type SubmitKycInput = z.infer<typeof submitKycSchema>;

export const bankingSchema = z.object({
  accountHolderName: v.trimmed(2, 120),
  accountNumber: z.string().trim().regex(/^\d{6,20}$/, 'Account number must be 6-20 digits'),
  bankName: v.trimmed(2, 100),
  ifscCode: upper(z.string().regex(IFSC_REGEX, 'Invalid IFSC code')),
  branchName: v.optionalTrimmed(100),
  upiId: z.string().trim().regex(/^[\w.-]{2,}@[\w]{2,}$/, 'Invalid UPI id').optional(),
});
export type BankingInput = z.infer<typeof bankingSchema>;
