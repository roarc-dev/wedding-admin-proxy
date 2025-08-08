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
        return await handleUpdateSettings(req, res, validatedUser)
      
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
        groom_name_kr: '',
        groom_name_en: '',
        bride_name_kr: '',
        bride_name_en: '',
        wedding_date: null,
        wedding_hour: '14',
        wedding_minute: '00',
        venue_name: '',
        venue_address: '',
        photo_section_image_url: '',
        photo_section_overlay_position: 'bottom',
        photo_section_overlay_color: '#ffffff',
        photo_section_locale: 'en',
        highlight_shape: 'circle',
        highlight_color: '#e0e0e0',
        highlight_text_color: 'black',
        gallery_type: 'thumbnail'
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

async function handleUpdateSettings(req, res, validatedUser) {
  const { settings } = req.body

  if (!settings) {
    return res.status(400).json({
      success: false,
      error: 'settings is required'
    })
  }

  try {
    // 1) 로그인 사용자 기준으로 page_id 결정
    const userId = validatedUser?.userId
    if (!userId) {
      return res.status(401).json({ success: false, error: '인증 사용자 정보를 찾을 수 없습니다' })
    }

    const { data: adminUser, error: adminErr } = await supabase
      .from('admin_users')
      .select('id, page_id')
      .eq('id', userId)
      .single()

    if (adminErr) {
      throw adminErr
    }

    const effectivePageId = adminUser?.page_id
    if (!effectivePageId) {
      return res.status(400).json({ success: false, error: '이 사용자에게 page_id가 부여되지 않았습니다' })
    }

    // 허용된 컬럼만 저장 (알 수 없는 키로 인한 에러 방지)
    const allowedKeys = [
      'groom_name_kr',
      'groom_name_en',
      'bride_name_kr',
      'bride_name_en',
      'wedding_date',
      'wedding_hour',
      'wedding_minute',
      'venue_name',
      'venue_address',
      'photo_section_image_url',
      'photo_section_image_path',
      'photo_section_overlay_position',
      'photo_section_overlay_color',
      'photo_section_locale',
      'highlight_shape',
      'highlight_color',
      'highlight_text_color',
      'gallery_type',
    ]

    let sanitized = Object.fromEntries(
      Object.entries(settings || {}).filter(([key]) => allowedKeys.includes(key))
    )

    // 빈 문자열 날짜는 NULL로 저장 (Postgres date 타입 호환)
    if (Object.prototype.hasOwnProperty.call(sanitized, 'wedding_date')) {
      if (sanitized.wedding_date === '') {
        sanitized.wedding_date = null
      }
    }

    console.log('Saving page settings:', { pageId: effectivePageId, sanitized })

    const { data, error } = await supabase
      .from('page_settings')
      .upsert(
        {
          page_id: effectivePageId,
          ...sanitized,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'page_id' }
      )
      .select()
      .single()

    console.log('Supabase upsert result:', { data, error })

    if (error) throw error

    return res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return res.status(500).json({
      success: false,
      error: '설정 업데이트 중 오류가 발생했습니다',
      message: error && error.message ? error.message : String(error),
      details: error && error.details ? error.details : undefined,
      hint: error && error.hint ? error.hint : undefined,
      code: error && error.code ? error.code : undefined
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