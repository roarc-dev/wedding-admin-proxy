import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 공개 조회는 인증 건너뛰기
  const isPublicRequest = req.method === 'GET'

  let validatedUser = null

  if (!isPublicRequest) {
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
        return await handleGetSettings(req, res)
      
      case 'POST':
      case 'PUT':
        return await handleUpdateSettings(req, res)
      
      default:
        return res.status(405).json({ 
          success: false, 
          error: 'Method not allowed' 
        })
    }
  } catch (error) {
    console.error('Page Settings API Error:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}

async function handleGetSettings(req, res) {
  const { pageId } = req.query

  if (!pageId) {
    return res.status(400).json({
      success: false,
      error: 'pageId is required'
    })
  }

  try {
    const { data, error } = await supabase
      .from('page_settings')
      .select('*')
      .eq('page_id', pageId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // 레코드가 없으면 기본값으로 생성
    if (!data) {
      const defaultSettings = {
        page_id: pageId,
        groom_name: '',
        bride_name: '',
        wedding_location: '',
        photo_section_display_datetime: '',
        photo_section_location: '',
        photo_section_overlay_position: 'bottom',
        photo_section_overlay_color: '#ffffff',
        event_name: '',
        event_details: '',
        map_place_name: ''
      }

      const { data: newData, error: insertError } = await supabase
        .from('page_settings')
        .insert(defaultSettings)
        .select()
        .single()

      if (insertError) throw insertError

      return res.json({
        success: true,
        data: newData
      })
    }

    return res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return res.status(500).json({
      success: false,
      error: '설정 조회 중 오류가 발생했습니다'
    })
  }
}

async function handleUpdateSettings(req, res) {
  const { pageId, settings } = req.body

  if (!pageId || !settings) {
    return res.status(400).json({
      success: false,
      error: 'pageId and settings are required'
    })
  }

  try {
    const { data, error } = await supabase
      .from('page_settings')
      .upsert({
        page_id: pageId,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return res.status(500).json({
      success: false,
      error: '설정 업데이트 중 오류가 발생했습니다'
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