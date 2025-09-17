import { createClient } from '@supabase/supabase-js'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  // 캐시 방지 (관리 화면에서 즉시 반영)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 공개 이미지 조회는 인증 건너뛰기 (갤러리용)
  const isPublicImageRequest = req.method === 'GET' && (
    req.query.action === 'getByPageId' || 
    req.query.action === 'getAllPages'
  )

  let validatedUser = null

  if (!isPublicImageRequest) {
    // 관리자 기능은 토큰 검증 필요
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: '인증 토큰이 필요합니다' 
      })
    }

    const token = authHeader.substring(7)
    validatedUser = validateToken(token)
    
    if (!validatedUser) {
      return res.status(401).json({ 
        success: false, 
        error: '유효하지 않은 토큰입니다' 
      })
    }
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetImages(req, res)
      
      case 'POST':
        return await handleImageOperation(req, res)
      
      case 'PUT':
        return await handleUpdateImageOrder(req, res)
      
      case 'DELETE':
        return await handleDeleteImage(req, res)
      
      default:
        return res.status(405).json({ 
          success: false, 
          error: 'Method not allowed' 
        })
    }
  } catch (error) {
    console.error('Images API Error:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}

async function handleGetImages(req, res) {
  const { action, pageId } = req.query

  try {
    if (action === 'getAllPages') {
      // 모든 페이지 목록 조회
      const { data, error } = await supabase
        .from('images')
        .select('page_id')

      if (error) throw error

      const uniquePages = [...new Set(data?.map(item => item.page_id) || [])]
      
      const pagesWithCount = await Promise.all(
        uniquePages.map(async (pageId) => {
          const { data: images } = await supabase
            .from('images')
            .select('id')
            .eq('page_id', pageId)
          
          return { 
            page_id: pageId, 
            image_count: images?.length || 0 
          }
        })
      )

      return res.json({ 
        success: true, 
        data: pagesWithCount 
      })

    } else if (action === 'getByPageId' && pageId) {
      // 특정 페이지의 이미지 목록 조회
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('page_id', pageId)
        .order('display_order', { ascending: true })

      if (error) throw error

      // 즉시 반영을 위해 public_url에 캐시 버스팅 쿼리 추가 (응답 시점 기준)
      const versionTs = Date.now()
      const versioned = (data || []).map((row) => {
        const url = row.public_url || ''
        if (!url) return row
        const sep = url.includes('?') ? '&' : '?'
        return { ...row, public_url: `${url}${sep}v=${versionTs}` }
      })

      return res.json({ 
        success: true, 
        data: versioned 
      })

    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid query parameters' 
      })
    }
  } catch (error) {
    console.error('Get images error:', error)
    return res.status(500).json({ 
      success: false, 
      error: '이미지 조회 중 오류가 발생했습니다' 
    })
  }
}

async function handleImageOperation(req, res) {
  const { action } = req.body

  try {
    if (action === 'getPresignedUrl') {
      // presigned URL 발급
      const { fileName, pageId } = req.body
      
      if (!fileName || !pageId) {
        return res.status(400).json({
          success: false,
          error: 'fileName과 pageId가 필요합니다'
        })
      }

      // 고유한 파일명 생성
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2)
      const fileExtension = fileName.split('.').pop() || 'jpg'
      const uniqueFileName = `${pageId}/${timestamp}_${randomStr}.${fileExtension}`

      // presigned URL 생성 (60초 유효)
      const { data, error } = await supabase.storage
        .from('images')
        .createSignedUploadUrl(uniqueFileName, 60)

      if (error) throw error

      return res.json({
        success: true,
        signedUrl: data.signedUrl,
        path: uniqueFileName,
        originalName: fileName
      })

    } else if (action === 'saveMeta') {
      // 업로드 후 메타데이터 저장
      const { pageId, fileName, displayOrder, storagePath, fileSize } = req.body
      
      if (!pageId || !fileName || !storagePath) {
        return res.status(400).json({
          success: false,
          error: '필수 파라미터가 누락되었습니다'
        })
      }

      // R2 호환성: storagePath가 이미 완전한 URL인지 확인
      let publicUrl
      let filename

      if (storagePath.startsWith('https://') || storagePath.startsWith('http://')) {
        // R2 방식: storagePath가 이미 완전한 public URL
        publicUrl = storagePath
        try {
          const u = new URL(storagePath)
          // 쿼리스트링을 제거하고 선행 슬래시 제거하여 순수 키만 저장
          filename = u.pathname.replace(/^\/+/, '')
        } catch (e) {
          // URL 파싱 실패 시 도메인 제거 및 쿼리 제거 시도
          const noProto = storagePath.replace(/^https?:\/\//, '')
          const pathOnly = noProto.split('/').slice(1).join('/')
          filename = pathOnly.split('?')[0]
        }
      } else {
        // 기존 Supabase 방식
        const { data: { publicUrl: supabaseUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(storagePath)
        publicUrl = supabaseUrl
        filename = storagePath
      }

      console.log(`saveMeta: pageId=${pageId}, filename=${filename}, publicUrl=${publicUrl}`)

      // 데이터베이스에 메타데이터 저장
      const { data, error } = await supabase
        .from('images')
        .insert({
          page_id: pageId,
          filename: filename,
          original_name: fileName,
          file_size: fileSize || 0,
          mime_type: 'image/jpeg',
          public_url: publicUrl,
          display_order: displayOrder
        })
        .select()

      if (error) throw error

      return res.json({ 
        success: true, 
        data: data[0] 
      })

    } else if (action === 'upload') {
      // 기존 Base64 업로드 (호환성 유지)
      const { pageId, fileData, originalName, fileSize, displayOrder } = req.body

      // Base64 데이터에서 실제 파일 데이터 추출
      const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file data format'
        })
      }

      const mimeType = matches[1]
      const base64Data = matches[2]
      const buffer = Buffer.from(base64Data, 'base64')

      // 파일명 생성
      const fileName = `${pageId}/${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`

      // Supabase 스토리지에 업로드
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, buffer, {
          contentType: mimeType,
          cacheControl: '3600'
        })

      if (uploadError) throw uploadError

      // 공개 URL 생성
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName)

      // 데이터베이스에 메타데이터 저장
      const { data, error } = await supabase
        .from('images')
        .insert({
          page_id: pageId,
          filename: fileName,
          original_name: originalName,
          file_size: fileSize,
          mime_type: mimeType,
          public_url: publicUrl,
          display_order: displayOrder
        })
        .select()

      if (error) throw error

      return res.json({ 
        success: true, 
        data: data[0] 
      })

    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid action' 
      })
    }
  } catch (error) {
    console.error('Image operation error:', error)
    return res.status(500).json({ 
      success: false, 
      error: '이미지 작업 중 오류가 발생했습니다' 
    })
  }
}

async function handleUpdateImageOrder(req, res) {
  const { imageId, newOrder, action, pageId, imageOrders } = req.body

  console.log('UpdateImageOrder 요청:', { 
    action, 
    pageId, 
    imageOrders: imageOrders ? imageOrders.length : 'undefined', 
    imageId, 
    newOrder,
    bodyKeys: Object.keys(req.body)
  })

  // 새로운 bulk update 액션 처리
  if (action === "updateAllOrders") {
    console.log('Bulk update 액션 처리 시작')
    
    if (!pageId || !imageOrders || !Array.isArray(imageOrders)) {
      console.error('Bulk update 유효성 검사 실패:', { 
        pageId: !!pageId, 
        imageOrders: !!imageOrders, 
        isArray: Array.isArray(imageOrders),
        imageOrdersType: typeof imageOrders
      })
      return res.status(400).json({ 
        success: false, 
        error: 'pageId와 imageOrders 배열이 필요합니다' 
      })
    }

    if (imageOrders.length === 0) {
      console.error('imageOrders 배열이 비어있습니다')
      return res.status(400).json({ 
        success: false, 
        error: 'imageOrders 배열이 비어있습니다' 
      })
    }

    // imageOrders 배열 유효성 검사
    for (const item of imageOrders) {
      if (!item.id || typeof item.order !== 'number') {
        console.error('잘못된 imageOrder 항목:', item)
        return res.status(400).json({ 
          success: false, 
          error: '모든 imageOrder 항목에는 id와 order가 필요합니다' 
        })
      }
    }

    try {
      console.log('Supabase update 데이터 준비:', imageOrders.map(({ id, order }) => ({
        id,
        display_order: order
      })))

      // upsert 대신 개별 update 사용 (page_id 제약조건 때문에)
      const updatePromises = imageOrders.map(async ({ id, order }) => {
        const { data, error } = await supabase
          .from('images')
          .update({ display_order: order })
          .eq('id', id)
          .eq('page_id', pageId) // 안전을 위해 page_id도 확인
        
        return { id, order, data, error }
      })

      const results = await Promise.all(updatePromises)
      const errors = results.filter(result => result.error)
      
      if (errors.length > 0) {
        console.error('일부 업데이트 실패:', errors)
        throw new Error(`${errors.length}개 이미지 업데이트 실패`)
      }

      console.log('Bulk update 성공:', results.length, '개 이미지 업데이트 완료')
      return res.json({ 
        success: true, 
        message: `${results.length}개 이미지 순서가 업데이트되었습니다` 
      })
    } catch (error) {
      console.error('Bulk update image order error:', error)
      return res.status(500).json({ 
        success: false, 
        error: `이미지 순서 업데이트 중 오류가 발생했습니다: ${error.message || error}` 
      })
    }
  }

  // 기존 단일 업데이트 처리
  if (!imageId || newOrder === undefined) {
    return res.status(400).json({ 
      success: false, 
      error: 'imageId와 newOrder가 필요합니다' 
    })
  }

  try {
    const { error } = await supabase
      .from('images')
      .update({ display_order: newOrder })
      .eq('id', imageId)

    if (error) throw error

    return res.json({ 
      success: true, 
      message: '이미지 순서가 업데이트되었습니다' 
    })

  } catch (error) {
    console.error('Update image order error:', error)
    return res.status(500).json({ 
      success: false, 
      error: '이미지 순서 업데이트 중 오류가 발생했습니다' 
    })
  }
}

async function handleDeleteImage(req, res) {
  const { imageId, fileName, storageOnly } = req.body

  if (!fileName) {
    return res.status(400).json({ 
      success: false, 
      error: 'fileName이 필요합니다' 
    })
  }

  try {
    // 스토리지에서 파일 삭제 (R2 키 패턴 우선 확인)
    // fileName이 URL이거나 쿼리를 포함하는 경우를 안전하게 처리
    let keyToDelete = fileName || ''
    if (/^https?:\/\//.test(keyToDelete)) {
      try {
        const u = new URL(keyToDelete)
        keyToDelete = u.pathname.replace(/^\/+/, '')
      } catch {
        // URL 파싱 실패 시 도메인 제거 후 사용
        const noProto = keyToDelete.replace(/^https?:\/\//, '')
        keyToDelete = noProto.split('/').slice(1).join('/')
      }
    }
    // 쿼리스트링 제거 및 선행 슬래시 제거
    keyToDelete = keyToDelete.split('?')[0].replace(/^\/+/, '')

    const isR2Key = /\/(files|photos|audio|images)\//.test(keyToDelete)

    if (isR2Key) {
      try {
        const r2 = new S3Client({
          region: 'auto',
          endpoint: process.env.R2_ENDPOINT,
          forcePathStyle: true,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          },
        })
        await r2.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: keyToDelete,
        }))
      } catch (r2Err) {
        console.warn('R2 delete warning:', r2Err)
      }
    } else {
      // Supabase Storage 삭제
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove([fileName])
      if (storageError) {
        console.warn('Storage delete warning:', storageError)
      }
    }

    // storageOnly가 true이면 스토리지에서만 삭제하고 DB는 건드리지 않음
    if (!storageOnly && imageId) {
      // 데이터베이스에서 레코드 삭제
      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId)
      
      if (dbError) throw dbError
    }

    return res.json({ 
      success: true, 
      message: storageOnly ? '스토리지에서 이미지가 삭제되었습니다' : '이미지가 삭제되었습니다',
      deleted: fileName
    })

  } catch (error) {
    console.error('Delete image error:', error)
    return res.status(500).json({ 
      success: false, 
      error: '이미지 삭제 중 오류가 발생했습니다' 
    })
  }
}

function validateToken(token) {
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
