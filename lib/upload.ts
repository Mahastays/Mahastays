import api from './api';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

/**
 * Uploads an image file to the backend Cloudinary endpoint, which
 * automatically compresses and converts it to optimized WebP format.
 */
export async function uploadImageToCloudinary(
  file: File,
  purpose: 'listing_media' | 'avatar' | 'ad_creative' | 'hero_slide' | string = 'hero_slide'
): Promise<UploadResult> {
  // Convert File to base64 Data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  const res = await api.post('/uploads/direct', {
    image: dataUrl,
    purpose,
  });

  if (res.data?.data) {
    return res.data.data;
  }
  return res.data;
}
