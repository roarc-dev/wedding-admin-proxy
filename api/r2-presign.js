/**
 * Cloudflare R2 Presigned URL API
 * 
 * Generates presigned URLs for uploading files to Cloudflare R2 storage.
 * Replaces Supabase Storage uploads while keeping Supabase Auth/DB.
 * 
 * Required Environment Variables:
 * - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT
 * - Optional: R2_PUBLIC_BASE_URL (for custom domain)
 * 
 * Test with curl:
 * 1. POST /api/r2-presign with JSON: { pageId, fileName, contentType }
 * 2. curl -X PUT -H "Content-Type: <type>" --data-binary @file "<uploadUrl>"
 * 
 * Custom Domain:
 * Set R2_PUBLIC_BASE_URL=https://your-domain.com and redeploy
 */

const { PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { createClient } = require('@supabase/supabase-js')
const { r2Client, getPublicUrl, safeFileName } = require('../lib/r2')
const { validateSessionToken } = require('../lib/auth')
const { v4: uuidv4 } = require('uuid')

// Initialize Supabase client for auth validation
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Allowed MIME types
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'image/avif',
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3'
]

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

  try {
    // Validate request body
    const { pageId, fileName, contentType } = req.body
    
    if (!pageId || !fileName || !contentType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: pageId, fileName, contentType'
      })
    }

    // Validate file size if provided
    const fileSize = req.headers['x-file-size']
    if (fileSize && parseInt(fileSize) > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 10MB limit'
      })
    }

    // Validate MIME type
    if (!ALLOWED_MIMES.includes(contentType)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported file type. Allowed: ${ALLOWED_MIMES.join(', ')}`
      })
    }

    // Validate user session (optional for now)
    const authHeader = req.headers.authorization
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const userSession = validateSessionToken(token)
      
      if (!userSession) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        })
      }
    }

    // Generate object key based on content type
    const uuid = uuidv4()
    const safeName = safeFileName(fileName)
    let key

    if (contentType.startsWith('image/')) {
      key = `${pageId}/photos/${uuid}-${safeName}`
    } else if (contentType.startsWith('audio/')) {
      key = `${pageId}/audio/${uuid}-${safeName}`
    } else {
      key = `${pageId}/files/${uuid}-${safeName}`
    }

    // Generate presigned URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(r2Client, command, { 
      expiresIn: 300 // 5 minutes
    })

    // Generate public URL
    const publicUrl = getPublicUrl(key)

    return res.status(200).json({
      success: true,
      uploadUrl,
      key,
      publicUrl
    })

  } catch (error) {
    console.error('R2 presign error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}
