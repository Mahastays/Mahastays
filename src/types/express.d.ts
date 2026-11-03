import type { AuthContext, StaffContext, VendorContext } from './auth';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
      staff?: StaffContext;
      vendor?: VendorContext;
      requestId?: string;
    }
  }
}

export {};
