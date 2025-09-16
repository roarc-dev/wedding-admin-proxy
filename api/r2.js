/**
 * Unified Cloudflare R2 API Dispatcher
 *
 * Actions:
 * - GET  action=test     → environment and module test (formerly r2-test)
 * - POST action=presign  → presigned upload with validation (formerly r2-presign)
 * - POST action=simple   → simple presigned upload (formerly r2-simple)
 * - POST action=delete   → delete object by key (formerly r2-delete)
 */


// Optional auth (used by presign advanced)
let validateSessionToken = null
try {
  ({ validateSessionToken } = require('../lib/auth'))
} catch (_) {
  // optional
}

// Note: Supabase client is not required here; auth is handled by validateSessionToken if provided

const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-File-Size')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
}

async function handleTest(req, res) {
  try {
    const envVars = {
      R2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
      R2_BUCKET: !!process.env.R2_BUCKET,
      R2_ENDPOINT: !!process.env.R2_ENDPOINT,
      R2_PUBLIC_BASE_URL: !!process.env.R2_PUBLIC_BASE_URL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    }

    const moduleTests = {}
    try { require('@aws-sdk/client-s3'); moduleTests['@aws-sdk/client-s3'] = true } catch { moduleTests['@aws-sdk/client-s3'] = false }
    try { require('@aws-sdk/s3-request-presigner'); moduleTests['@aws-sdk/s3-request-presigner'] = true } catch { moduleTests['@aws-sdk/s3-request-presigner'] = false }
    try { require('uuid'); moduleTests['uuid'] = true } catch { moduleTests['uuid'] = false }
    try { require('../lib/r2'); moduleTests['../lib/r2'] = true } catch { moduleTests['../lib/r2'] = false }
    try { require('../lib/auth'); moduleTests['../lib/auth'] = true } catch { moduleTests['../lib/auth'] = false }

    return res.status(200).json({
      success: true,
      environmentVariables: envVars,
      moduleTests,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('R2 Test error:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}

async function handlePresign(req, res) {
  const { PutObjectCommand } = require('@aws-sdk/client-s3')
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
  const { r2Client, getPublicUrl, safeFileName } = require('../lib/r2')
  const { v4: uuidv4 } = require('uuid')
  const { pageId, fileName, contentType } = req.body || {}
  if (!pageId || !fileName || !contentType) {
    return res.status(400).json({ success: false, error: 'Missing required fields: pageId, fileName, contentType' })
  }

  // Validate file size if provided
  const fileSize = req.headers['x-file-size']
  if (fileSize && parseInt(fileSize, 10) > MAX_FILE_SIZE) {
    return res.status(400).json({ success: false, error: 'File size exceeds 10MB limit' })
  }

  // Validate MIME type
  if (!ALLOWED_MIMES.includes(contentType)) {
    return res.status(400).json({ success: false, error: `Unsupported file type. Allowed: ${ALLOWED_MIMES.join(', ')}` })
  }

  // Optional session validation (backwards compatible)
  const authHeader = req.headers.authorization
  if (authHeader && typeof validateSessionToken === 'function') {
    const token = authHeader.replace('Bearer ', '')
    const userSession = validateSessionToken(token)
    if (!userSession) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' })
    }
  }

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

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 })
  const publicUrl = getPublicUrl(key)
  return res.status(200).json({ success: true, uploadUrl, key, publicUrl })
}

async function handleSimple(req, res) {
  const { PutObjectCommand } = require('@aws-sdk/client-s3')
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
  const { r2Client, getPublicUrl, safeFileName } = require('../lib/r2')
  const { v4: uuidv4 } = require('uuid')
  const { pageId, fileName, contentType, key: providedKey } = req.body || {}
  if (!pageId || !fileName || !contentType) {
    return res.status(400).json({ success: false, error: 'Missing required fields: pageId, fileName, contentType' })
  }

  const timestamp = Date.now()
  const safeName = safeFileName(fileName)
  const key = providedKey || `${pageId}/files/${timestamp}-${safeName}`

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 })
  const publicUrl = getPublicUrl(key)
  return res.status(200).json({ success: true, uploadUrl, key, publicUrl })
}

async function handleDelete(req, res) {
  const { DeleteObjectCommand } = require('@aws-sdk/client-s3')
  const { r2Client } = require('../lib/r2')
  const { key } = req.body || {}
  if (!key) {
    return res.status(400).json({ success: false, error: 'Key is required' })
  }
  const del = new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key })
  await r2Client.send(del)
  return res.status(200).json({ success: true, message: 'File deleted successfully', key })
}

module.exports = async (req, res) => {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const action = String((req.query && req.query.action) || (req.body && req.body.action) || '').toLowerCase()

  try {
    if (req.method === 'GET') {
      // GET only supports test for now
      if (action === 'test') return handleTest(req, res)
      // default to test for GET
      return handleTest(req, res)
    }

    if (req.method === 'POST') {
      if (action === 'presign') return handlePresign(req, res)
      if (action === 'simple') return handleSimple(req, res)
      if (action === 'delete') return handleDelete(req, res)
      // default to simple if unspecified
      return handleSimple(req, res)
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' })
  } catch (error) {
    console.error('[R2] Unified handler error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}


