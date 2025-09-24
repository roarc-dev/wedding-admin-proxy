/**
 * Unified Cloudflare R2 API
 * Handles all R2 operations: presign, simple, delete, test, finalize
 * 
 * Endpoints:
 * - POST /api/r2?action=simple   - Simple presigned URL generation
 * - POST /api/r2?action=presign  - Full presigned URL with validation
 * - POST /api/r2?action=delete   - Delete file from R2
 * - GET  /api/r2?action=test     - Test environment variables
 * - GET|POST /api/r2?action=finalize  - Return ETag and versioned public URL for a key
 * 
 * Required Environment Variables:
 * - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT
 * - Optional: R2_PUBLIC_BASE_URL (for custom domain)
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { createClient } = require('@supabase/supabase-js')
// UUID 생성 함수 (ESM 호환성 문제 해결)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
  const baseRaw = process.env.R2_PUBLIC_BASE_URL || `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`
  const base = String(baseRaw).replace(/\/$/, '')
  return `${base}/${key}`
}

function buildVersionedUrl(key, etag) {
  const v = (etag || '').replace(/"/g, '') || String(Date.now())
  return `${getPublicUrl(key)}?v=${encodeURIComponent(v)}`
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
  'image/svg+xml',
  'image/gif',
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'font/woff2',
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
    // Framer 컴포넌트 파일들은 더 짧은 캐시로 설정하여 변경사항을 빠르게 반영
    const isFramerComponent = finalKey.includes('framer/components/') && (contentType === 'application/javascript' || contentType === 'text/javascript')
    const cacheControl = isFramerComponent 
      ? 'public, max-age=300, must-revalidate' // 5분 캐시, 재검증 필수
      : 'public, max-age=31536000, immutable'  // 1년 캐시, 불변 파일
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: finalKey,
      ContentType: contentType,
      CacheControl: cacheControl,
    })

    const uploadUrl = await getSignedUrl(r2Client, command, { 
      expiresIn: 300 // 5 minutes
    })

    // Generate public URL (no ETag until PUT happens). Client will fetch ETag after PUT.
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
    const uuid = generateUUID()
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
    // Framer 컴포넌트 파일들은 더 짧은 캐시로 설정하여 변경사항을 빠르게 반영
    const isFramerComponent = key.includes('framer/components/') && (contentType === 'application/javascript' || contentType === 'text/javascript')
    const cacheControl = isFramerComponent 
      ? 'public, max-age=300, must-revalidate' // 5분 캐시, 재검증 필수
      : 'public, max-age=31536000, immutable'  // 1년 캐시, 불변 파일
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
      CacheControl: cacheControl,
    })

    const uploadUrl = await getSignedUrl(r2Client, command, { 
      expiresIn: 300 // 5 minutes
    })

    // Generate public URL (no ETag yet). Client will append ?v=etag after upload.
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

    // UUID는 내장 함수로 대체했으므로 테스트에서 제외
    moduleTests['uuid'] = 'replaced with built-in function'

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

async function handleFinalize(req, res) {
  try {
    const key = req.method === 'GET' ? req.query.key : req.body?.key
    if (!key) {
      return res.status(400).json({ success: false, error: 'Key is required' })
    }

    const head = await r2Client.send(new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    }))

    const etag = (head.ETag || '').replace(/"/g, '') || null
    const contentType = head.ContentType || null
    const publicUrl = getPublicUrl(key)
    const versionedUrl = buildVersionedUrl(key, etag)

    return res.status(200).json({
      success: true,
      key,
      etag,
      contentType,
      publicUrl,
      versionedUrl,
    })
  } catch (error) {
    console.error('R2 finalize error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to finalize (HEAD object)',
      message: error.message,
    })
  }
}

// Main handler
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-File-Size, If-None-Match, ETag')
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

    case 'finalize':
      if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' })
      }
      return handleFinalize(req, res)

    default:
      return res.status(400).json({
        success: false,
        error: `Unknown action: ${action}. Use: simple, presign, delete, test`
      })
  }
}
