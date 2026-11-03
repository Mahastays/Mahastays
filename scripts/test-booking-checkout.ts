import crypto from 'node:crypto';

async function testBookingCheckout() {
  const payload = {
    bookingType: 'stay',
    itemId: 'p5002',
    tierOrRoomId: 'room-1',
    tierOrRoomName: 'Valley Panoramic Master Suite',
    startDate: '2026-11-01',
    endDate: '2026-11-03',
    adults: 2,
    children: 1,
    guestName: 'Rajesh Sharma',
    guestEmail: 'rajesh.sharma@example.com',
    guestPhone: '9876543210',
    billingState: 'Maharashtra',
    specialRequests: 'High floor with mountain view please',
    paymentMethod: 'upi',
    pricing: {
      basePrice: 17800,
      memberDiscount: 1424,
      cleaningFee: 445,
      taxes: 2855,
      grandTotal: 19676,
    },
  };

  try {
    console.log('Sending checkout request...');
    const res = await fetch('http://localhost:5000/api/v1/bookings/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json: any = await res.json();
    console.log('Checkout response status:', res.status);
    console.log('Checkout response:', JSON.stringify(json, null, 2));

    if (!res.ok || !json.data?.gatewayOrder) {
      console.log('No gatewayOrder received');
      return;
    }

    const gatewayOrder = json.data.gatewayOrder;
    console.log('\nSimulating Razorpay payment capture...');
    const mockPaymentId = `pay_${Date.now()}`;
    const secret = '4EM0WNYrc2cqld1VnD89llaN'; // Razorpay key secret
    const text = `${gatewayOrder.orderId}|${mockPaymentId}`;
    const signature = crypto.createHmac('sha256', secret).update(text).digest('hex');

    console.log('Simulated payment details:', { orderId: gatewayOrder.orderId, mockPaymentId, signature });

    const verifyRes = await fetch('http://localhost:5000/api/v1/bookings/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: gatewayOrder.orderId,
        paymentId: mockPaymentId,
        signature,
        bookingReference: json.data.bookingReference,
      }),
    });

    const verifyJson: any = await verifyRes.json();
    console.log('Verify response status:', verifyRes.status);
    console.log('Verify response body:', JSON.stringify(verifyJson, null, 2));
  } catch (err) {
    console.error('Error during checkout test:', err);
  }
}

testBookingCheckout();
