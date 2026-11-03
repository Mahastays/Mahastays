import { prisma } from '../src/lib/prisma';

async function main() {
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mahastays.com', password: 'admin123' }),
  });
  const loginData: any = await loginRes.json();
  const token = loginData.data?.accessToken;
  console.log('Login success, got token:', !!token);

  const vendorRes = await fetch('http://localhost:5000/api/v1/admin/vendors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: 'rohan.retreats@mahastays.com',
      password: 'vendorSecret123',
      businessName: 'Rohan Luxury Valley Retreat',
      displayName: 'Rohan Kulkarni',
      phone: '+91 98200 99887',
      category: 'property_host',
      businessType: 'proprietorship',
    }),
  });
  const vendorData: any = await vendorRes.json();
  console.log('Vendor create result:', JSON.stringify(vendorData, null, 2));

  // Also test vendor login with the new credentials!
  const vendorLoginRes = await fetch('http://localhost:5000/api/v1/auth/vendor/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rohan.retreats@mahastays.com', password: 'vendorSecret123' }),
  });
  const vendorLoginData: any = await vendorLoginRes.json();
  console.log('New vendor login test:', vendorLoginData.success ? 'SUCCESS (Token issued)' : vendorLoginData);
}

main().catch(console.error).finally(() => prisma.$disconnect());
