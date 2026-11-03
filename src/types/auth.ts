import type { AdminPermissions, SubAdminPermissions } from '@prisma/client';
import type { Role, StaffRole } from '../config/constants';

export interface AuthContext {
  id: string;
  role: Role;
}

export interface StaffContext {
  role: StaffRole;
  id: string;
  fullName: string;
  adminPermissions?: AdminPermissions;
  subAdminPermissions?: SubAdminPermissions;
  supervisorAdminId?: string;
  assignedRegions?: string[];
}

export interface VendorContext {
  id: string;
  status: string;
  isApproved: boolean; // status active + KYC approved
}
