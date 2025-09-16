/**
 * Unified Cloudflare R2 API
 * Handles all R2 operations: presign, simple, delete, test
 * 
 * Endpoints:
 * - POST /api/r2?action=simple - Simple presigned URL generation
 * - POST /api/r2?action=presign - Full presigned URL with validation
 * - POST /api/r2?action=delete - Delete file from R2
 * - GET /api/r2?action=test - Test environment variables
 * 
 * Required Environment Variables:
 * - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT
 * - Optional: R2_PUBLIC_BASE_URL (for custom domain)
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

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

// Initialize Supabase client for auth validation
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Utility functions
function getPublicUrl(key) {
  // Custom Domain 사용: cdn.roarc.kr
  const base = process.env.R2_PUBLIC_BASE_URL || `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`
  return `${base}/${key}`
}

function safeFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9._-]/g, '-')
}

function validateSessionToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    
    // 토큰 만료 확인
    if (Date.now() > decoded.expires) {
      return null
    }
    
    // 추가 검증 로직 (필요시)
    if (!decoded.userId || !decoded.username) {
      return null
    }
    
    return decoded
  } catch (error) {
    console.error('Token validation error:', error)
    return null
  }
}

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

// Action handlers
async function handleSimple(req, res) {
  try {
    const { pageId, fileName, contentType, key } = req.body

    if (!pageId || !fileName || !contentType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: pageId, fileName, contentType'
      })
    }

    // Generate object key
    const finalKey = key || `${pageId}/files/${Date.now()}-${safeFileName(fileName)}`

    // Generate presigned URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: finalKey,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(r2Client, command, { 
      expiresIn: 300 // 5 minutes
    })

    // Generate public URL
    const publicUrl = getPublicUrl(finalKey)

    return res.status(200).json({
      success: true,
      uploadUrl,
      key: finalKey,
      publicUrl
    })

  } catch (error) {
    console.error('R2 simple error:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

async function handlePresign(req, res) {
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

async function handleDelete(req, res) {
  try {
    const { key } = req.body

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Key is required'
      })
    }

    console.log(`[R2-DELETE] 파일 삭제 요청: ${key}`)

    // R2에서 파일 삭제
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    })

    await r2Client.send(deleteCommand)

    console.log(`[R2-DELETE] 파일 삭제 완료: ${key}`)

    return res.json({
      success: true,
      message: 'File deleted successfully',
      key: key
    })

  } catch (error) {
    console.error('[R2-DELETE] 파일 삭제 실패:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      message: error.message
    })
  }
}

async function handleTest(req, res) {
  try {
    // Check environment variables
    const envVars = {
      R2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
      R2_BUCKET: !!process.env.R2_BUCKET,
      R2_ENDPOINT: !!process.env.R2_ENDPOINT,
      R2_PUBLIC_BASE_URL: !!process.env.R2_PUBLIC_BASE_URL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY
    }

    // Test if we can import required modules
    let moduleTests = {}
    try {
      require('@aws-sdk/client-s3')
      moduleTests['@aws-sdk/client-s3'] = true
    } catch (e) {
      moduleTests['@aws-sdk/client-s3'] = false
    }

    try {
      require('@aws-sdk/s3-request-presigner')
      moduleTests['@aws-sdk/s3-request-presigner'] = true
    } catch (e) {
      moduleTests['@aws-sdk/s3-request-presigner'] = false
    }

    try {
      require('uuid')
      moduleTests['uuid'] = true
    } catch (e) {
      moduleTests['uuid'] = false
    }

    return res.status(200).json({
      success: true,
      environmentVariables: envVars,
      moduleTests: moduleTests,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('R2 Test error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}

// Main handler
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-File-Size')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Get action from query parameter or body
  const action = req.query.action || req.body?.action

  if (!action) {
    return res.status(400).json({
      success: false,
      error: 'Action parameter is required. Use: simple, presign, delete, test'
    })
  }

  // Route to appropriate handler
  switch (action) {
    case 'simple':
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' })
      }
      return handleSimple(req, res)

    case 'presign':
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' })
      }
      return handlePresign(req, res)

    case 'delete':
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' })
      }
      return handleDelete(req, res)

    case 'test':
      if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' })
      }
      return handleTest(req, res)

    default:
      return res.status(400).json({
        success: false,
        error: `Unknown action: ${action}. Use: simple, presign, delete, test`
      })
  }
}
