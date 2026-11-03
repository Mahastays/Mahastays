import { RazorpayGateway } from '../src/services/payment/razorpay.gateway';

async function testRazorpay() {
  console.log('Testing Razorpay Gateway with test keys...');
  const rzp = new RazorpayGateway();
  console.log('Public key:', rzp.publicKey);

  try {
    const order = await rzp.createOrder({
      amountInr: 2500,
      receipt: `TEST-${Date.now()}`,
      notes: { test: 'true' },
    });
    console.log('SUCCESS! Created Razorpay Order:', order);
  } catch (err: any) {
    console.error('FAILED to create order:', err);
  }
}

testRazorpay();
