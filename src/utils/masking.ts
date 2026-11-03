export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  return `${user.slice(0, 2)}***@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return phone.replace(/\d(?=\d{4})/g, '*');
}

export function last4(value: string): string {
  return value.slice(-4);
}
