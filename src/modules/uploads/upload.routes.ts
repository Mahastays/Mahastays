import { Router } from 'express';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate, optionalAuth } from '../../middlewares/authenticate';
import { createUploadTicket, UPLOAD_PURPOSES } from '../../services/storage.service';
import { ok } from '../../utils/apiResponse';
import { bodyOf } from '../../utils/zod';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';

export const uploadRouter = Router();

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const signSchema = z.object({ purpose: z.enum(UPLOAD_PURPOSES), contentType: z.string().trim().min(3).max(100) });

/**
 * Step 1 of a direct-to-storage upload: the browser gets a short-lived signed URL / signature and uploads the
 * file straight to S3 or Cloudinary (big photos & videos never pass through this API).
 */
uploadRouter.post('/sign', authenticate, async (req, res) => {
  const { purpose, contentType } = signSchema.parse(bodyOf(req));
  ok(res, await createUploadTicket({ purpose, contentType, actor: { id: req.auth!.id, role: req.auth!.role } }));
});

const directUploadSchema = z.object({
  image: z.string().min(10, 'Image data or URL is required'),
  purpose: z.string().optional().default('listing_media'),
  folder: z.string().optional(),
});

/**
 * Direct image upload with auto compression and WebP conversion via Cloudinary.
 * Used by Admin and Vendors for listing photos, banners, and thumbnails.
 */
uploadRouter.post('/direct', optionalAuth, async (req, res) => {
  const b = directUploadSchema.parse(bodyOf(req));

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new ApiError(500, 'CONFIG_ERROR', 'Cloudinary storage is not configured properly on the server');
  }

  const targetFolder = b.folder || `${env.CLOUDINARY_FOLDER || 'mahastays'}/${b.purpose}`;

  // Tailored transformations based on upload purpose
  const transformations: any[] = [
    { quality: 'auto:good' },
    { fetch_format: 'webp' },
  ];

  if (b.purpose === 'hero_slide' || b.purpose === 'hero_banner') {
    transformations.unshift({ width: 1920, crop: 'limit' });
  }

  try {
    const result = await cloudinary.uploader.upload(b.image, {
      folder: targetFolder,
      format: 'webp',
      transformation: transformations,
      resource_type: 'image',
    });

    ok(res, {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
    });
  } catch (err: any) {
    throw ApiError.badRequest(`Cloudinary upload failed: ${err.message || 'Unknown error'}`);
  }
});
