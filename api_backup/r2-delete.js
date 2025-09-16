import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

// R2 S3 클라이언트 설정
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

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

    await s3Client.send(deleteCommand)

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
