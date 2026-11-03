/**
 * `Math.round(amount * (percent / 100))` — deliberately the same expression shape as the
 * frontend ledger (`Math.round(base * 0.08)`), so server and UI agree to the rupee.
 */
export const pct = (amount: number, percent: number): number => Math.round(amount * (percent / 100));

export const formatInr = (amount: number): string => `₹${Math.round(amount).toLocaleString('en-IN')}`;

export const toPaise = (amountInr: number): number => Math.round(amountInr * 100);
