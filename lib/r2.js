/**
 * Cloudflare R2 Storage Configuration
 * 
 * Required Environment Variables:
 * - R2_ACCOUNT_ID: Your Cloudflare account ID
 * - R2_ACCESS_KEY_ID: R2 API token access key
 * - R2_SECRET_ACCESS_KEY: R2 API token secret key
 * - R2_BUCKET: R2 bucket name
 * - R2_ENDPOINT: R2 endpoint URL (https://<account-id>.r2.cloudflarestorage.com)
 * - R2_PUBLIC_BASE_URL: (Optional) Custom domain for public URLs
 * 
 * Test with curl:
 * 1. Get presigned URL from /api/r2/presign
 * 2. curl -X PUT -H "Content-Type: image/jpeg" --data-binary @image.jpg "<presigned-url>"
 * 
 * Custom Domain Setup:
 * 1. Set up custom domain in Cloudflare R2 dashboard
 * 2. Set R2_PUBLIC_BASE_URL=https://your-domain.com
 * 3. Redeploy application
 */

const { S3Client } = require('@aws-sdk/client-s3')

// Configure S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

/**
 * Generate public URL for R2 object
 * @param {string} key - Object key in R2
 * @returns {string} Public URL
 */
function getPublicUrl(key) {
  // 임시 해결책: Custom Domain DNS 문제로 인해 R2 직접 엔드포인트 사용
  // TODO: cdn.roarc.kr DNS 설정 완료 후 원복
  const base = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`
  return `${base}/${key}`
}

/**
 * Sanitize filename for safe storage
 * @param {string} name - Original filename
 * @returns {string} Safe filename
 */
function safeFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9._-]/g, '-')
}

module.exports = {
  r2Client,
  getPublicUrl,
  safeFileName,
}
