async function testDirectUpload() {
  const sampleDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  try {
    const res = await fetch('http://localhost:5000/api/v1/uploads/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: sampleDataUri,
        purpose: 'listing_media',
      }),
    });

    const json = await res.json();
    console.log('HTTP status:', res.status);
    console.log('Response body:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testDirectUpload();
