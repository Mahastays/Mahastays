import crypto from 'node:crypto';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import type { Role } from '../config/constants';
import { ApiError } from '../utils/ApiError';
import { randomToken } from '../utils/crypto';

export const UPLOAD_PURPOSES = ['listing_media', 'kyc_document', 'avatar', 'review_photo', 'ad_creative'] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const RULES: Record<UploadPurpose, { types: string[]; maxBytes: number; roles: Role[] }> = {
  listing_media: { types: [...IMAGE_TYPES, 'video/mp4'], maxBytes: 200 * 1024 * 1024, roles: ['vendor', 'admin', 'super_admin'] },
  kyc_document: { types: [...IMAGE_TYPES, 'application/pdf'], maxBytes: 10 * 1024 * 1024, roles: ['vendor'] },
  avatar: { types: IMAGE_TYPES, maxBytes: 5 * 1024 * 1024, roles: ['user', 'vendor', 'admin', 'super_admin', 'sub_admin'] },
  review_photo: { types: IMAGE_TYPES, maxBytes: 10 * 1024 * 1024, roles: ['user'] },
  ad_creative: { types: IMAGE_TYPES, maxBytes: 10 * 1024 * 1024, roles: ['vendor', 'admin', 'super_admin'] },
};

const EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'video/mp4': '.mp4',
  'application/pdf': '.pdf',
};

export interface UploadTicket {
  provider: 'cloudinary' | 's3';
  method: 'POST' | 'PUT';
  uploadUrl: string;
  /** Cloudinary: multipart form fields to send along with the file. */
  fields?: Record<string, string>;
  /** S3: headers that must be sent with the PUT. */
  headers?: Record<string, string>;
  /** Where the asset will be available (private purposes return a storage reference instead of a public URL). */
  fileUrl: string;
  key?: string;
  expiresInSeconds: number;
  maxBytes: number;
  allowedContentTypes: string[];
}

let s3: S3Client | null = null;
const getS3 = (): S3Client => {
  if (!s3) {
    s3 = new S3Client({
      region: env.AWS_REGION,
      credentials:
        env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
          ? { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY }
          : undefined, // falls back to the default AWS credential chain (IAM role)
    });
  }
  return s3;
};

const isPrivate = (purpose: UploadPurpose) => purpose === 'kyc_document';

export async function createUploadTicket(input: {
  purpose: UploadPurpose;
  contentType: string;
  actor: { id: string; role: Role };
}): Promise<UploadTicket> {
  const rule = RULES[input.purpose];
  if (!rule.roles.includes(input.actor.role)) throw ApiError.forbidden('You cannot upload this kind of file');
  if (!rule.types.includes(input.contentType)) {
    throw ApiError.badRequest(`Unsupported content type for ${input.purpose}`, { allowed: rule.types }, 'UNSUPPORTED_MEDIA_TYPE');
  }
  const base = { expiresInSeconds: 300, maxBytes: rule.maxBytes, allowedContentTypes: rule.types };

  if (env.STORAGE_PROVIDER === 'cloudinary') {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const folder = `${env.CLOUDINARY_FOLDER}/${input.purpose}/${input.actor.id}`;
    const params: Record<string, string> = { folder, timestamp };
    if (isPrivate(input.purpose)) params.type = 'authenticated';
    const toSign = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    const signature = crypto.createHash('sha1').update(toSign + env.CLOUDINARY_API_SECRET).digest('hex');
    const resource = input.contentType.startsWith('video/') ? 'video' : input.contentType === 'application/pdf' ? 'raw' : 'image';
    return {
      ...base,
      provider: 'cloudinary',
      method: 'POST',
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resource}/upload`,
      fields: { ...params, api_key: env.CLOUDINARY_API_KEY as string, signature },
      fileUrl: `cloudinary://${folder}`, // the upload response contains the final secure_url — store that
    };
  }

  if (env.STORAGE_PROVIDER === 's3') {
    const key = `${input.purpose}/${input.actor.role}/${input.actor.id}/${Date.now()}-${randomToken(6)}${EXT[input.contentType] ?? ''}`;
    const command = new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, ContentType: input.contentType });
    const uploadUrl = await getSignedUrl(getS3(), command, { expiresIn: base.expiresInSeconds });
    const publicBase = env.S3_PUBLIC_BASE_URL?.replace(/\/$/, '');
    return {
      ...base,
      provider: 's3',
      method: 'PUT',
      uploadUrl,
      headers: { 'Content-Type': input.contentType },
      key,
      fileUrl: isPrivate(input.purpose) || !publicBase ? `s3://${env.S3_BUCKET}/${key}` : `${publicBase}/${key}`,
    };
  }

  throw ApiError.notImplemented('File storage is not configured (set STORAGE_PROVIDER=cloudinary|s3)');
}

/** Turns a private `s3://bucket/key` reference (KYC documents) into a short-lived signed GET URL. */
export async function resolveDocumentUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const match = /^s3:\/\/([^/]+)\/(.+)$/.exec(url);
  if (!match || env.STORAGE_PROVIDER !== 's3') return url;
  return getSignedUrl(getS3(), new GetObjectCommand({ Bucket: match[1], Key: match[2] }), { expiresIn: 600 });
}
