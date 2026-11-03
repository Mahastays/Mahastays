import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function testUpload() {
  console.log('Testing Cloudinary upload with:');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing');

  // Small 1x1 red dot test PNG data URI
  const sampleDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  try {
    const res = await cloudinary.uploader.upload(sampleDataUri, {
      folder: 'mahastays/test',
      format: 'webp',
      transformation: [{ quality: 'auto' }],
    });
    console.log('Upload success!');
    console.log('URL:', res.secure_url);
    console.log('Format:', res.format);
    console.log('Bytes:', res.bytes);
  } catch (err) {
    console.error('Upload failed:', err);
  }
}

testUpload();
