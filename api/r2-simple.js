/**
 * Simple R2 Presigned URL API - Minimal version for testing
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

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

function getPublicUrl(key) {
  // 임시 해결책: Custom Domain DNS 문제로 인해 R2 직접 엔드포인트 사용
  const base = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}`
  return `${base}/${key}`
}

function safeFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9._-]/g, '-')
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

  try {
    const { pageId, fileName, contentType } = req.body

    if (!pageId || !fileName || !contentType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: pageId, fileName, contentType'
      })
    }

    // Generate object key
    const timestamp = Date.now()
    const safeName = safeFileName(fileName)
    const key = `${pageId}/files/${timestamp}-${safeName}`

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
    console.error('R2 simple error:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
